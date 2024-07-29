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
    text: '资讯',
    link: '/',
  },
  {
    text: '产品',
    links: [{
      text: '产品1',
      link: '/products/1',
    }, {
      text: '产品2',
      link: '/products/2',
    }],
  },
] as NavBarItem[]
