/**
 * 主页交互：终端打字机 Hero、卡片 3D tilt、单卡 3D 翻转轮播。
 * 由 src/pages/index.astro 的 <script> 引入执行。
 */

const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches

document.documentElement.classList.add('js')

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

/** 逐字打字：文本插入光标之前，不破坏行内光标元素 */
async function typeText(el: HTMLElement, text: string) {
  const node = document.createTextNode('')
  el.prepend(node)
  for (const ch of text) {
    node.data += ch
    await sleep(38 + Math.random() * 46)
  }
}

// ---------- Hero 打字机 ----------
function initTyper() {
  const targets = Array.from(document.querySelectorAll<HTMLElement>('.type-target'))
  if (targets.length === 0)
    return

  if (REDUCED) {
    // 减少动态：直接显示全部文本
    document.documentElement.classList.remove('js')
    for (const el of targets)
      el.textContent = el.dataset.type ?? ''
    return
  }

  const caret = document.querySelector<HTMLElement>('.caret')

  async function run() {
    for (const el of targets) {
      if (caret)
        el.appendChild(caret)
      el.classList.add('typed-on')
      await typeText(el, el.dataset.type ?? '')
      await sleep(180)
    }
    // 打字完成后光标停在轮播控制条上继续闪烁
    const viewerIndicator = document.querySelector('.viewer-controls')
    if (caret && viewerIndicator)
      viewerIndicator.appendChild(caret)
  }
  run()
}

// ---------- 卡片 3D tilt（指针与相机同源联动） ----------
function initTilt() {
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches
  if (!finePointer || REDUCED)
    return

  const root = document.documentElement
  const cards = Array.from(document.querySelectorAll<HTMLElement>('[data-tilt]'))
  if (cards.length === 0)
    return

  const states = cards.map(el => ({
    el,
    rx: 0,
    ry: 0,
    lift: 0,
    targetRx: 0,
    targetRy: 0,
    targetLift: 0,
  }))
  let mx = 0
  let my = 0
  let px = 0
  let py = 0
  let hovered: HTMLElement | null = null

  function onPointerMove(e: PointerEvent) {
    mx = e.clientX / window.innerWidth - 0.5
    my = e.clientY / window.innerHeight - 0.5
    // 指针在悬停卡片内的局部偏移（-0.5 ~ 0.5），用于增强倾斜
    if (hovered) {
      const rect = hovered.getBoundingClientRect()
      hovered.dataset.lx = String((e.clientX - rect.left) / rect.width - 0.5)
      hovered.dataset.ly = String((e.clientY - rect.top) / rect.height - 0.5)
    }
  }

  function frame() {
    px += (mx - px) * 0.09
    py += (my - py) * 0.09

    // 共享给其他图层（与相机视差同源）
    root.style.setProperty('--mx', px.toFixed(4))
    root.style.setProperty('--my', py.toFixed(4))

    for (const s of states) {
      // 翻转动画期间跳过，避免 inline transform 干扰动画
      if (s.el.classList.contains('flipping'))
        continue
      const isHover = s.el === hovered
      const lx = isHover ? Number(s.el.dataset.lx ?? 0) : 0
      const ly = isHover ? Number(s.el.dataset.ly ?? 0) : 0
      // 全局联动微倾（与相机同向）+ 悬停局部增强
      s.targetRx = -py * 2.4 - ly * 8
      s.targetRy = px * 3 + lx * 10
      s.targetLift = isHover ? -6 : 0
      s.rx += (s.targetRx - s.rx) * 0.12
      s.ry += (s.targetRy - s.ry) * 0.12
      s.lift += (s.targetLift - s.lift) * 0.12
      s.el.style.transform
        = `translate3d(0, ${s.lift.toFixed(2)}px, 0) rotateX(${s.rx.toFixed(3)}deg) rotateY(${s.ry.toFixed(3)}deg)`
    }
    requestAnimationFrame(frame)
  }

  document.addEventListener('pointermove', onPointerMove, { passive: true })
  for (const el of cards) {
    el.addEventListener('pointerenter', () => (hovered = el))
    el.addEventListener('pointerleave', () => {
      if (hovered === el)
        hovered = null
    })
  }
  requestAnimationFrame(frame)
}

// ---------- 入场 power-on 清理 ----------
/** power-on 播完后摘除类：避免后续 flip 切换时 animation-name 变回 power-on 触发动画重启（卡片先隐形再重播点亮） */
function initPowerOnCleanup() {
  for (const el of Array.from(document.querySelectorAll<HTMLElement>('.power-on'))) {
    const onEnd = (e: AnimationEvent) => {
      if (e.animationName !== 'power-on')
        return
      el.classList.remove('power-on')
      el.removeEventListener('animationend', onEnd)
    }
    el.addEventListener('animationend', onEnd)
  }
}

// ---------- 单卡 3D 翻转轮播 ----------
function initViewer() {
  const viewer = document.querySelector<HTMLElement>('.card-viewer')
  const cards = Array.from(document.querySelectorAll<HTMLElement>('[data-card]'))
  if (!viewer || cards.length < 2)
    return

  viewer.classList.add('viewer-on')
  cards[0].classList.add('is-active')

  const indicator = document.querySelector<HTMLElement>('#viewer-cur')
  const btnPrev = viewer.querySelector<HTMLButtonElement>('[data-prev]')
  const btnNext = viewer.querySelector<HTMLButtonElement>('[data-next]')
  let cur = 0
  let busy = false

  function activate(next: number) {
    cur = next
    cards.forEach((el, i) => {
      const active = i === next
      el.classList.toggle('is-active', active)
      el.setAttribute('aria-hidden', active ? 'false' : 'true')
      if (active)
        el.removeAttribute('tabindex')
      else
        el.setAttribute('tabindex', '-1')
    })
    if (indicator)
      indicator.textContent = `0${next + 1}`
  }

  function show(next: number, dir: number) {
    const target = (next + cards.length) % cards.length
    if (busy || target === cur)
      return

    if (REDUCED) {
      activate(target)
      return
    }

    busy = true
    const from = cards[cur]
    const to = cards[target]
    if (indicator)
      indicator.textContent = `0${target + 1}`

    // 第一段：当前卡绕 Y 轴转到侧立（0.18s，forwards 保持姿态）
    from.classList.add('flipping', dir > 0 ? 'flip-out-left' : 'flip-out-right')

    window.setTimeout(() => {
      // 侧立换手：旧卡隐藏复位，新卡从侧立翻回正面
      from.classList.remove('flipping', 'flip-out-left', 'flip-out-right')
      activate(target)
      to.classList.add('flipping', dir > 0 ? 'flip-in-right' : 'flip-in-left')
    }, 180)

    // 第二段结束：新卡转正，恢复 tilt
    window.setTimeout(() => {
      to.classList.remove('flipping', 'flip-in-right', 'flip-in-left')
      busy = false
    }, 400)
  }

  const goPrev = () => show(cur - 1, -1)
  const goNext = () => show(cur + 1, 1)
  btnPrev?.addEventListener('click', goPrev)
  btnNext?.addEventListener('click', goNext)

  // 键盘方向键切换
  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft')
      goPrev()
    else if (e.key === 'ArrowRight')
      goNext()
  })

  // 自动轮播：悬停 / 聚焦时暂停
  if (!REDUCED) {
    let timer = 0
    const play = () => {
      window.clearInterval(timer)
      timer = window.setInterval(goNext, 6000)
    }
    const pause = () => window.clearInterval(timer)
    play()
    viewer.addEventListener('pointerenter', pause)
    viewer.addEventListener('pointerleave', play)
    viewer.addEventListener('focusin', pause)
    viewer.addEventListener('focusout', play)
  }
}

initTyper()
initTilt()
initPowerOnCleanup()
initViewer()
