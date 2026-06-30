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
    text: '字帖',
    link: '/copybook/hanzi',
  },
  {
    text: '练习册',
    link: '/workbook/pinyin',
  },
  {
    text: '单词',
    link: '/english',
  },
  {
    text: '历史朝代',
    link: '/history/dynasty',
  },
] as NavBarItem[]
