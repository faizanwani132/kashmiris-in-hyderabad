import { MapPin } from 'lucide-react'
import BottomSheet from '../ui/BottomSheet'

const MemberDetailsSheet = ({ member, isOpen, onClose }) => (
  <BottomSheet
    isOpen={isOpen}
    onClose={onClose}
    title={member?.name ?? 'Community Member'}
    subtitle={member?.origin ? `Origin: ${member.origin}` : undefined}
    className="h-[34svh] max-w-xl sm:h-[280px]"
  >
    <div className="flex h-full flex-col items-start justify-center rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center gap-2">
        <p className="text-sm text-slate-700">Kashmiri living nearby</p>
        {member?.isNew ? (
          <span className="rounded-full bg-saffron/30 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-900">
            New
          </span>
        ) : null}
      </div>
      <p className="mt-2 inline-flex items-center gap-1 rounded-full bg-saffron/20 px-3 py-1 text-sm font-semibold text-slate-900">
        <MapPin size={14} className="text-pine" />
        {member?.area || 'Approximate area not shared'}
      </p>
    </div>
  </BottomSheet>
)

export default MemberDetailsSheet
