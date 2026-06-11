'use client'

import { QRCodeSVG } from 'qrcode.react'
import { Gift, Check, Clock, XCircle } from 'lucide-react'

type RawStatus = 'claimed' | 'redeemed' | 'expired'

export interface RewardClaimCardProps {
  title: string
  organizer: string | null
  eventName?: string | null
  qrToken: string
  status: RawStatus
  expiresAt?: string | null
  pointsRequired?: number | null
}

/** Resolve the display status (a still-"claimed" reward past its expiry shows as Expiré). */
function displayStatus(status: RawStatus, expiresAt?: string | null) {
  if (status === 'redeemed') return { key: 'redeemed', label: 'Utilisé',  cls: 'bg-zinc-700/50 text-zinc-300 border-zinc-600/40', icon: Check }
  if (status === 'expired' || (expiresAt && new Date(expiresAt).getTime() <= Date.now()))
    return { key: 'expired', label: 'Expiré', cls: 'bg-red-500/15 text-red-400 border-red-500/30', icon: XCircle }
  return { key: 'active', label: 'Actif', cls: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30', icon: Clock }
}

export default function RewardClaimCard({
  title, organizer, eventName, qrToken, status, expiresAt, pointsRequired,
}: RewardClaimCardProps) {
  const s = displayStatus(status, expiresAt)
  const StatusIcon = s.icon
  const inactive = s.key !== 'active'

  return (
    <div className="bg-zinc-900 border border-amber-900/30 rounded-[1.75rem] p-5">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-start gap-3 min-w-0">
          <span className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500/25 to-yellow-400/20 border border-amber-500/40 flex items-center justify-center shrink-0">
            <Gift className="w-5 h-5 text-amber-400" />
          </span>
          <div className="min-w-0">
            <h3 className="text-white font-bold text-sm leading-tight">{title}</h3>
            {organizer && <p className="text-white/40 text-xs mt-0.5 truncate">par {organizer}</p>}
            {eventName && <p className="text-white/30 text-[11px] truncate">{eventName}</p>}
          </div>
        </div>
        <span className={`flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full border shrink-0 ${s.cls}`}>
          <StatusIcon className="w-3 h-3" />{s.label}
        </span>
      </div>

      {/* QR */}
      <div className="flex justify-center">
        <div className={`bg-white rounded-2xl p-3 transition-opacity ${inactive ? 'opacity-40' : ''}`}>
          <QRCodeSVG value={qrToken} size={150} level="M" />
        </div>
      </div>

      <p className="text-center text-white/30 text-[11px] mt-3 font-mono tracking-wider">{qrToken}</p>
      {pointsRequired != null && (
        <p className="text-center text-amber-400/70 text-[11px] mt-1 font-semibold">{pointsRequired} pts</p>
      )}
      {s.key === 'active' && (
        <p className="text-center text-white/40 text-xs mt-2">Présente ce QR à l&apos;organisateur</p>
      )}
    </div>
  )
}
