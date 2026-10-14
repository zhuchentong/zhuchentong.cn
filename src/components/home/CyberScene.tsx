import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js'

/** 磷光绿主色 */
const NEON_GREEN = '#00ff41'

/**
 * 生成 Matrix 数字雨字符图集（4×4 格 canvas 纹理）
 */
function createCharAtlas(): HTMLCanvasElement {
  const chars = ['0', '1', 'ｱ', 'ｲ', 'ｳ', 'ｴ', 'ｵ', 'ｶ', 'ｷ', 'ｸ', 'ｹ', 'ｺ', 'ﬂ', '7', '9', '5']
  const cell = 64
  const canvas = document.createElement('canvas')
  canvas.width = cell * 4
  canvas.height = cell * 4
  const ctx = canvas.getContext('2d')
  if (!ctx)
    return canvas

  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.font = `bold ${cell * 0.62}px monospace`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.shadowColor = NEON_GREEN
  ctx.shadowBlur = cell * 0.22
  ctx.fillStyle = '#a8ffc2'

  chars.forEach((ch, i) => {
    const x = (i % 4) * cell + cell / 2
    const y = Math.floor(i / 4) * cell + cell / 2 + 2
    ctx.fillText(ch, x, y)
  })
  return canvas
}

/**
 * 终端骇客风格全屏 3D 背景（主页专用）
 *
 * 场景构成：磷光绿线框网格地面 + Matrix 数字雨（InstancedMesh）+ 绿色地平线天幕 + UnrealBloom 辉光。
 * 交互：指针视差相机（触屏设备退化为自动漂浮）。
 * 降级：WebGL 不可用时不挂载 canvas（露出底层静态渐变）；
 *       prefers-reduced-motion 时仅静态渲染一帧。
 */
export default function CyberScene() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container)
      return

    // 创建 renderer，失败则放弃挂载，露出静态渐变降级背景
    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        powerPreference: 'high-performance',
      })
    }
    catch {
      return
    }

    const width = window.innerWidth
    const height = window.innerHeight
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const touchOnly = window.matchMedia('(hover: none)').matches
    const isMobile = window.innerWidth < 768

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(width, height)
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.1
    container.appendChild(renderer.domElement)

    // ---------- 场景与相机 ----------
    const scene = new THREE.Scene()
    scene.background = new THREE.Color('#020604')

    const camera = new THREE.PerspectiveCamera(62, width / height, 0.1, 400)
    const CAM_BASE_Y = 1.7
    camera.position.set(0, CAM_BASE_Y, 10)

    // ---------- 磷光绿线框网格地面 ----------
    const gridUniforms = {
      uTime: { value: 0 },
      uBase: { value: new THREE.Color('#020604') },
      uLine: { value: new THREE.Color(NEON_GREEN) },
      uPulse: { value: new THREE.Color('#baffc9') },
    }

    const gridMaterial = new THREE.ShaderMaterial({
      uniforms: gridUniforms,
      vertexShader: /* glsl */ `
        varying vec3 vWorld;

        void main() {
          vec4 world = modelMatrix * vec4(position, 1.0);
          vWorld = world.xyz;
          gl_Position = projectionMatrix * viewMatrix * world;
        }
      `,
      fragmentShader: /* glsl */ `
        uniform float uTime;
        uniform vec3 uBase;
        uniform vec3 uLine;
        uniform vec3 uPulse;
        varying vec3 vWorld;

        // 基于 fwidth 的抗锯齿网格线：返回 0~1 线宽强度
        float gridLine(vec2 coord, float scale) {
          vec2 c = coord * scale;
          vec2 g = abs(fract(c - 0.5) - 0.5) / fwidth(c);
          return 1.0 - min(min(g.x, g.y), 1.0);
        }

        void main() {
          vec2 coord = vWorld.xz;
          float minor = gridLine(coord, 0.5) * 0.5;
          float major = gridLine(coord, 0.1);
          float line = max(minor, major);

          // 沿 -z 方向流动的绿色扫描波
          float pulse = pow(0.5 + 0.5 * sin(vWorld.z * 0.35 + uTime * 2.4), 6.0);
          float pulseLine = line * pulse * smoothstep(6.0, 40.0, -vWorld.z);

          // 近处渐隐，避免相机脚下网格过亮
          float nearFade = smoothstep(1.5, 9.0, distance(vWorld.xz, vec2(0.0, 10.0)));
          line *= nearFade;

          vec3 color = uBase + uLine * line + uPulse * pulseLine;

          // 手动距离雾，把远处网格融进地平线辉光
          float fogAmount = 1.0 - exp(-distance(vWorld, cameraPosition) * 0.02);
          color = mix(color, uLine * 0.045 + uBase, fogAmount);

          gl_FragColor = vec4(color, 1.0);
        }
      `,
    })

    const grid = new THREE.Mesh(new THREE.PlaneGeometry(320, 320), gridMaterial)
    grid.rotation.x = -Math.PI / 2
    grid.position.z = -70
    scene.add(grid)

    // ---------- 天幕：绿色地平线辉光 + 缓慢滚动的数据带 ----------
    const skyUniforms = { uTime: { value: 0 } }

    const skyMaterial = new THREE.ShaderMaterial({
      uniforms: skyUniforms,
      depthWrite: false,
      vertexShader: /* glsl */ `
        varying vec3 vWorld;

        void main() {
          vec4 world = modelMatrix * vec4(position, 1.0);
          vWorld = world.xyz;
          gl_Position = projectionMatrix * viewMatrix * world;
        }
      `,
      fragmentShader: /* glsl */ `
        uniform float uTime;
        varying vec3 vWorld;

        void main() {
          float h = clamp(vWorld.y / 120.0, 0.0, 1.0);

          // 夜空：地平线绿色辉光 → 近黑绿夜色
          vec3 horizon = vec3(0.016, 0.13, 0.05);
          vec3 night = vec3(0.003, 0.011, 0.005);
          vec3 color = mix(horizon, night, pow(h, 0.5));

          // 地平线上方的「数据带」：缓慢滚动的微亮横线，终端扫描纹理感
          float band = pow(0.5 + 0.5 * sin(vWorld.y * 1.4 - uTime * 0.7), 24.0);
          band *= smoothstep(0.4, 0.0, h) * 0.14;
          color += vec3(0.0, 0.62, 0.22) * band;

          gl_FragColor = vec4(color, 1.0);
        }
      `,
    })

    const sky = new THREE.Mesh(new THREE.PlaneGeometry(560, 160), skyMaterial)
    sky.position.set(0, 62, -160)
    scene.add(sky)

    // ---------- Matrix 数字雨（InstancedMesh 字符平面） ----------
    const atlasCanvas = createCharAtlas()
    const atlasTexture = new THREE.CanvasTexture(atlasCanvas)
    atlasTexture.colorSpace = THREE.SRGBColorSpace
    atlasTexture.minFilter = THREE.LinearFilter
    atlasTexture.generateMipmaps = false

    const rainCount = isMobile ? 250 : 420
    const RAIN_HEIGHT = 34

    const rainGeo = new THREE.PlaneGeometry(0.8, 1.15)

    const uvOffsets = new Float32Array(rainCount * 2)
    const rainSpeeds = new Float32Array(rainCount)
    const brightness = new Float32Array(rainCount)
    for (let i = 0; i < rainCount; i++) {
      uvOffsets[i * 2] = Math.floor(Math.random() * 4) * 0.25
      uvOffsets[i * 2 + 1] = Math.floor(Math.random() * 4) * 0.25
      rainSpeeds[i] = THREE.MathUtils.randFloat(2.2, 8.5)
      brightness[i] = THREE.MathUtils.randFloat(0.3, 0.9)
    }
    rainGeo.setAttribute('aUvOff', new THREE.InstancedBufferAttribute(uvOffsets, 2))
    rainGeo.setAttribute('aSpeed', new THREE.InstancedBufferAttribute(rainSpeeds, 1))
    rainGeo.setAttribute('aBright', new THREE.InstancedBufferAttribute(brightness, 1))

    const rainUniforms = {
      uTime: { value: 0 },
      uMap: { value: atlasTexture },
    }

    const rainMaterial = new THREE.ShaderMaterial({
      uniforms: rainUniforms,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      vertexShader: /* glsl */ `
        attribute vec2 aUvOff;
        attribute float aSpeed;
        attribute float aBright;
        uniform float uTime;
        varying vec2 vUv;
        varying vec2 vUvOff;
        varying float vBright;
        varying float vFade;

        void main() {
          vUv = uv;
          vUvOff = aUvOff;
          vBright = aBright;

          // 实例静态位置来自 instanceMatrix；下落动画在 shader 内循环
          vec4 world = modelMatrix * instanceMatrix * vec4(position, 1.0);
          float y = mod(world.y + uTime * aSpeed, ${RAIN_HEIGHT}.0);
          world.y = y;
          vFade = smoothstep(0.0, 4.5, y);

          vec4 mv = viewMatrix * world;
          gl_Position = projectionMatrix * mv;
        }
      `,
      fragmentShader: /* glsl */ `
        uniform sampler2D uMap;
        varying vec2 vUv;
        varying vec2 vUvOff;
        varying float vBright;
        varying float vFade;

        void main() {
          vec2 uv = vUvOff + vUv * 0.25;
          vec4 tex = texture2D(uMap, uv);
          float level = 0.4 + 0.6 * vBright;
          gl_FragColor = vec4(tex.rgb * level, tex.a * vFade * 0.55);
        }
      `,
    })

    const rain = new THREE.InstancedMesh(rainGeo, rainMaterial, rainCount)
    const mat4 = new THREE.Matrix4()
    for (let i = 0; i < rainCount; i++) {
      mat4.setPosition(
        THREE.MathUtils.randFloat(-42, 42),
        THREE.MathUtils.randFloat(0, RAIN_HEIGHT),
        THREE.MathUtils.randFloat(-85, -6),
      )
      rain.setMatrixAt(i, mat4)
    }
    rain.instanceMatrix.needsUpdate = true
    rain.frustumCulled = false
    scene.add(rain)

    // ---------- 粒子光尘（绿色系） ----------
    const particleCount = isMobile ? 300 : 700
    const positions = new Float32Array(particleCount * 3)
    const colors = new Float32Array(particleCount * 3)
    const scales = new Float32Array(particleCount)
    const speeds = new Float32Array(particleCount)
    const softGreen = new THREE.Color('#baffc9')
    const paleGreen = new THREE.Color('#e9ffee')

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = THREE.MathUtils.randFloat(-60, 60)
      positions[i * 3 + 1] = THREE.MathUtils.randFloat(0, 30)
      positions[i * 3 + 2] = THREE.MathUtils.randFloat(-130, 14)
      const c = Math.random() < 0.72 ? softGreen : paleGreen
      colors[i * 3] = c.r
      colors[i * 3 + 1] = c.g
      colors[i * 3 + 2] = c.b
      scales[i] = THREE.MathUtils.randFloat(0.5, 1.6)
      speeds[i] = THREE.MathUtils.randFloat(0.4, 1.4)
    }

    const particleGeometry = new THREE.BufferGeometry()
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    particleGeometry.setAttribute('aColor', new THREE.BufferAttribute(colors, 3))
    particleGeometry.setAttribute('aScale', new THREE.BufferAttribute(scales, 1))
    particleGeometry.setAttribute('aSpeed', new THREE.BufferAttribute(speeds, 1))

    const particleUniforms = { uTime: { value: 0 } }
    const particleMaterial = new THREE.ShaderMaterial({
      uniforms: particleUniforms,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexShader: /* glsl */ `
        attribute vec3 aColor;
        attribute float aScale;
        attribute float aSpeed;
        uniform float uTime;
        varying vec3 vColor;

        void main() {
          vColor = aColor;
          vec3 p = position;
          // 循环上升 + 水平正弦漂移
          p.y = mod(p.y + uTime * aSpeed, 30.0);
          p.x += sin(uTime * 0.35 + p.z * 0.5) * 0.8;

          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_PointSize = aScale * 90.0 / -mv.z;
          gl_Position = projectionMatrix * mv;
        }
      `,
      fragmentShader: /* glsl */ `
        varying vec3 vColor;

        void main() {
          float d = length(gl_PointCoord - 0.5);
          float alpha = smoothstep(0.5, 0.05, d);
          gl_FragColor = vec4(vColor, alpha * 0.7);
        }
      `,
    })

    const particles = new THREE.Points(particleGeometry, particleMaterial)
    particles.frustumCulled = false
    scene.add(particles)

    // ---------- 后处理：UnrealBloom 辉光（磷光绿） ----------
    const composer = new EffectComposer(renderer)
    composer.addPass(new RenderPass(scene, camera))
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(width, height),
      0.85, // strength
      0.55, // radius
      0.25, // threshold：只让磷光高光发光
    )
    composer.addPass(bloomPass)

    // ---------- 指针视差 / 触屏自动漂浮 ----------
    const target = new THREE.Vector2(0, 0)
    const current = new THREE.Vector2(0, 0)

    function onPointerMove(e: PointerEvent) {
      target.set(e.clientX / width - 0.5, e.clientY / height - 0.5)
    }

    function onResize() {
      const w = window.innerWidth
      const h = window.innerHeight
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
      composer.setSize(w, h)

      // 静态模式下 resize 后重渲一帧
      if (reducedMotion)
        composer.render()
    }

    window.addEventListener('pointermove', onPointerMove, { passive: true })
    window.addEventListener('resize', onResize)

    // ---------- 渲染循环 ----------
    let last = performance.now()
    let elapsed = 0
    let rafId = 0
    let running = false

    function tick() {
      const now = performance.now()
      const dt = Math.min((now - last) / 1000, 0.1)
      last = now
      elapsed += dt

      // 指针缓动（帧率无关），触屏设备改为缓慢自动漂浮
      if (touchOnly) {
        target.set(Math.sin(elapsed * 0.14) * 0.3, Math.sin(elapsed * 0.1) * 0.18)
      }
      const ease = 1 - Math.exp(-dt * 3.2)
      current.lerp(target, ease)

      camera.position.x = current.x * 2.4
      camera.position.y = CAM_BASE_Y - current.y * 1.0
      camera.lookAt(0, 2.6, -40)

      gridUniforms.uTime.value = elapsed
      skyUniforms.uTime.value = elapsed
      rainUniforms.uTime.value = elapsed
      particleUniforms.uTime.value = elapsed

      composer.render()
      rafId = requestAnimationFrame(tick)
    }

    // 页面不可见时暂停渲染，回到前台恢复
    function onVisibility() {
      if (reducedMotion)
        return
      if (document.hidden) {
        cancelAnimationFrame(rafId)
        running = false
      }
      else if (!running) {
        last = performance.now()
        running = true
        rafId = requestAnimationFrame(tick)
      }
    }
    document.addEventListener('visibilitychange', onVisibility)

    if (reducedMotion) {
      // 静态渲染一帧：以固定时刻呈现完整场景构图
      gridUniforms.uTime.value = 12
      skyUniforms.uTime.value = 12
      rainUniforms.uTime.value = 12
      particleUniforms.uTime.value = 12
      camera.lookAt(0, 2.6, -40)
      composer.render()
    }
    else {
      running = true
      rafId = requestAnimationFrame(tick)
    }

    // ---------- 清理 ----------
    return () => {
      cancelAnimationFrame(rafId)
      running = false
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('resize', onResize)
      document.removeEventListener('visibilitychange', onVisibility)
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh || obj instanceof THREE.Points) {
          obj.geometry.dispose()
          const material = obj.material
          if (Array.isArray(material))
            material.forEach(m => m.dispose())
          else
            material.dispose()
        }
      })
      rain.dispose()
      atlasTexture.dispose()
      composer.dispose()
      renderer.dispose()
      renderer.domElement.remove()
    }
  }, [])

  return <div ref={containerRef} className="cyber-scene" aria-hidden="true" />
}
