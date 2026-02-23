import { useEffect } from 'react'
import { X } from 'lucide-react'

let openSheetCount = 0
let originalBodyOverflow = ''
let originalBodyPaddingRight = ''

const lockBodyScroll = () => {
  if (typeof document === 'undefined') return

  if (openSheetCount === 0) {
    originalBodyOverflow = document.body.style.overflow
    originalBodyPaddingRight = document.body.style.paddingRight

    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth

    document.body.style.overflow = 'hidden'
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`
    }
  }

  openSheetCount += 1
}

const unlockBodyScroll = () => {
  if (typeof document === 'undefined') return

  openSheetCount = Math.max(0, openSheetCount - 1)

  if (openSheetCount === 0) {
    document.body.style.overflow = originalBodyOverflow
    document.body.style.paddingRight = originalBodyPaddingRight
  }
}

const BottomSheet = ({
  isOpen,
  title,
  subtitle,
  onClose,
  children,
  className = '',
  bodyClassName = '',
  zIndex = 1200,
  closeOnBackdrop = true,
  showHandle = true,
}) => {
  useEffect(() => {
    if (!isOpen) return undefined

    lockBodyScroll()

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose?.()
      }
    }

    window.addEventListener('keydown', onKeyDown)

    return () => {
      window.removeEventListener('keydown', onKeyDown)
      unlockBodyScroll()
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0" style={{ zIndex }} role="dialog" aria-modal="true">
      <button
        type="button"
        onClick={closeOnBackdrop ? onClose : undefined}
        className="animate-fade-in absolute inset-0 bg-slate-900/45"
        aria-label="Close panel"
      />
      <section
        className={`animate-sheet-up absolute bottom-0 left-0 right-0 mx-auto flex w-full max-w-2xl max-h-[84svh] flex-col overflow-hidden rounded-t-3xl bg-snow px-4 pb-[calc(0.9rem+env(safe-area-inset-bottom))] pt-[max(0.5rem,env(safe-area-inset-top))] shadow-soft sm:bottom-4 sm:max-h-[88dvh] sm:rounded-3xl ${className}`}
      >
        {showHandle ? (
          <div className="mb-2 flex justify-center">
            <span className="h-1.5 w-10 rounded-full bg-slate-300" />
          </div>
        ) : null}
        <header className="mb-3 flex items-start justify-between gap-3">
          <div>
            <h2 className="font-heading text-xl font-semibold text-slate-900 sm:text-2xl">{title}</h2>
            {subtitle ? <p className="mt-0.5 text-xs text-slate-700 sm:text-sm">{subtitle}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-slate-100 p-2 text-slate-600 transition hover:bg-slate-200"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </header>
        <div className={`min-h-0 flex-1 ${bodyClassName}`}>{children}</div>
      </section>
    </div>
  )
}

export default BottomSheet
