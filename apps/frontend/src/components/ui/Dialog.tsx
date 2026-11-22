import {
  cloneElement,
  createContext,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react'
import type { ReactElement, ReactNode } from 'react'

interface DialogTriggerProps {
  onClick?: () => void
  'aria-haspopup'?: 'dialog'
  'aria-expanded'?: boolean
}

interface DialogContextValue {
  open: boolean
  close: () => void
}

const DialogContext = createContext<DialogContextValue | null>(null)

export function useDialog() {
  const context = useContext(DialogContext)

  if (context === null) {
    throw new Error('useDialog must be used inside a <Dialog>')
  }

  return context
}

interface DialogProps {
  trigger: ReactElement<DialogTriggerProps>
  title: string
  description?: ReactNode
  children: ReactNode
  size?: 'default' | 'wide'
  className?: string
}

export function Dialog({
  trigger,
  title,
  description,
  children,
  size = 'default',
  className = '',
}: DialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [open, setOpen] = useState(false)
  const titleId = useId()
  const descriptionId = useId()

  const width =
    size === 'wide'
      ? 'w-[min(44rem,calc(100vw-2rem))]'
      : 'w-[min(30rem,calc(100vw-2rem))]'

  useEffect(() => {
    const dialog = dialogRef.current

    if (dialog === null) return

    const handleClose = () => setOpen(false)
    dialog.addEventListener('close', handleClose)

    return () => dialog.removeEventListener('close', handleClose)
  }, [])

  function openDialog() {
    dialogRef.current?.showModal()
    setOpen(true)
  }

  function close() {
    dialogRef.current?.close()
    setOpen(false)
  }

  const triggerElement = cloneElement(trigger, {
    onClick: openDialog,
    'aria-haspopup': 'dialog',
    'aria-expanded': open,
  })

  return (
    <>
      {triggerElement}
      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        onClick={(event) => {
          if (event.target === dialogRef.current) {
            close()
          }
        }}
        className={`m-auto max-h-[calc(100dvh-2rem)] ${width} overflow-y-auto rounded-2xl bg-(--surface-strong) p-0 text-(--sea-ink) shadow-2xl backdrop:bg-black/50 backdrop:backdrop-blur-sm ${className}`}
      >
        <div className="relative p-5">
          <h2 id={titleId} className="text-xl font-extrabold">
            {title}
          </h2>
          {description && (
            <p
              id={descriptionId}
              className="mt-1 pr-8 text-sm text-(--sea-ink-soft)"
            >
              {description}
            </p>
          )}

          <DialogContext.Provider value={{ open, close }}>
            {children}
          </DialogContext.Provider>

          <button
            type="button"
            onClick={close}
            aria-label="Close dialog"
            className="absolute top-3 right-3 rounded-full px-2 py-1 text-lg leading-none text-(--sea-ink-soft) hover:bg-(--chip-bg) hover:text-(--sea-ink) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--lagoon-deep)"
          >
            ✕
          </button>
        </div>
      </dialog>
    </>
  )
}
