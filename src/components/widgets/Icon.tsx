import { Icon as IconifyIcon } from '@iconify/react'

interface Props {
  icon: string
  class?: string
}

export default function Icon({ icon, class: className }: Props) {
  return <IconifyIcon icon={icon} className={className} />
}
