interface NavBarItem {
  text: string
  link?: string
  children?: NavBarItem[]
}

export const NavBarLinks = [
  {
    text: '首页',
    link: '/',
  },
  {
    text: '关于',
    link: '/about',
  },
  {
    text: 'Demo',
    children: [{
      text: '图标',
      link: '/demo/icon',
    }, {
      text: '组件',
      link: '/demo/component',
    }],
  },
] as NavBarItem[]
