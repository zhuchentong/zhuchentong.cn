import { SlidersHorizontal, X } from 'lucide-react'
import { useState } from 'react'
import ControlPanel from './ControlPanel'

export default function PanelDrawer() {
  const [open, setOpen] = useState(false)

  return (
    <>
      {open && (
        <div
          className="md:hidden fixed inset-0 z-30 bg-black/30"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={`fixed md:relative z-40 md:z-auto inset-y-0 left-0 w-[300px] p-4 border-r border-gray-200 overflow-y-auto bg-background transition-transform duration-200 ease-in-out ${open ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
          }`}
      >
        <button
          className="md:hidden absolute top-3 right-3 text-gray-400 hover:text-gray-600"
          onClick={() => setOpen(false)}
        >
          <X className="size-5" />
        </button>
        <ControlPanel />
      </aside>

      <button
        className="md:hidden fixed left-4 bottom-6 z-50 flex items-center justify-center size-10 rounded-full bg-background border shadow-md print:hidden"
        onClick={() => setOpen(true)}
      >
        <SlidersHorizontal className="size-5" />
      </button>
    </>
  )
}
