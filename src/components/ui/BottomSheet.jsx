import { X } from 'lucide-react'

const BottomSheet = ({
  isOpen,
  title,
  subtitle,
  onClose,
  children,
  className = '',
}) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[1200]">
      <button
        type="button"
        onClick={onClose}
        className="animate-fade-in absolute inset-0 bg-slate-900/45"
        aria-label="Close panel"
      />
      <section
        className={`animate-sheet-up absolute bottom-0 left-0 right-0 mx-auto w-full max-w-2xl rounded-t-3xl bg-snow px-4 pb-6 pt-4 shadow-soft sm:bottom-4 sm:rounded-3xl ${className}`}
      >
        <header className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="font-heading text-2xl font-semibold text-slate-900">
              {title}
            </h2>
            {subtitle ? (
              <p className="mt-1 text-sm text-slate-700">{subtitle}</p>
            ) : null}
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
        {children}
      </section>
    </div>
  )
}

export default BottomSheet
