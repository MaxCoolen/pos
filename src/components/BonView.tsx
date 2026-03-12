import { QRCodeSVG } from 'qrcode.react'
import { useInstellingenStore } from '../store/useInstellingenStore'
import type { BonData } from '../types'

interface BonViewProps {
  bon: BonData
}

function fmt(n: number) {
  return n.toLocaleString('nl-NL', { style: 'currency', currency: 'EUR' })
}

function formatDatum(iso: string) {
  return new Date(iso).toLocaleDateString('nl-NL', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  })
}

function formatTijd(iso: string) {
  return new Date(iso).toLocaleTimeString('nl-NL', {
    hour: '2-digit', minute: '2-digit',
  })
}

const METHODE_LABEL: Record<string, string> = {
  contant:   'Contant',
  pin:       'PIN',
  cadeaubon: 'Cadeaubon',
  gesplitst: 'Gesplitst',
}

export function BonView({ bon }: BonViewProps) {
  const {
    bedrijfsnaam, adres, postcode, plaats,
    telefoon, email, btwNummer, kvkNummer,
    logo, bonHeader, bonFooter, bonQrUrl,
  } = useInstellingenStore()

  const qrUrl = bonQrUrl.trim()

  const heeftKorting = bon.kortingRegels.length > 0

  return (
    <div
      id="bon-content"
      className="bg-white text-gray-900 font-mono text-[13px] leading-relaxed w-full max-w-[340px] mx-auto select-text print:max-w-none print:w-full"
    >
      {/* ── Bedrijfsinfo ── */}
      <div className="text-center mb-3">
        {logo && (
          <img
            src={logo}
            alt={bedrijfsnaam}
            className="max-h-10 mx-auto mb-2 object-contain"
          />
        )}
        <p className="font-bold text-base">{bedrijfsnaam}</p>
        {adres && <p className="text-[12px] text-gray-600">{adres}</p>}
        {(postcode || plaats) && (
          <p className="text-[12px] text-gray-600">
            {[postcode, plaats].filter(Boolean).join(' ')}
          </p>
        )}
        {telefoon && <p className="text-[12px] text-gray-600">Tel: {telefoon}</p>}
        {email && <p className="text-[12px] text-gray-600">{email}</p>}
        {btwNummer && <p className="text-[12px] text-gray-600">BTW: {btwNummer}</p>}
        {kvkNummer && <p className="text-[12px] text-gray-600">KVK: {kvkNummer}</p>}
      </div>

      {/* Bon header */}
      {bonHeader && (
        <>
          <Divider />
          <p className="text-center text-[12px] text-gray-600 whitespace-pre-wrap">{bonHeader}</p>
        </>
      )}

      <Divider />

      {/* ── Transactie info ── */}
      <div className="text-[12px] space-y-0.5 mb-3">
        <Row label="Datum" value={formatDatum(bon.tijdstip)} />
        <Row label="Tijd" value={formatTijd(bon.tijdstip)} />
        <Row label="Bon nr." value={bon.transactieId} />
        {bon.medewerker && <Row label="Kassier" value={bon.medewerker} />}
      </div>

      <Divider />

      {/* ── Producten ── */}
      <div className="mb-3 space-y-1">
        {bon.regels.map((r, i) => (
          <div key={i}>
            <p className="font-medium truncate">{r.naam}</p>
            <div className="flex justify-between text-[12px] text-gray-600 pl-2">
              <span>
                {r.aantal} × {fmt(r.prijs)}
              </span>
              <span className="font-medium text-gray-900">{fmt(r.prijs * r.aantal)}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ── Kortingen ── */}
      {heeftKorting && (
        <>
          <Divider />
          <div className="mb-3 space-y-1">
            <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1">Kortingen</p>
            {bon.kortingRegels.map((k) => (
              <div key={k.kortingId} className="flex justify-between text-[12px]">
                <span className="text-emerald-700">- {k.naam}</span>
                <span className="text-emerald-700 font-semibold">-{fmt(k.bedrag)}</span>
              </div>
            ))}
          </div>
        </>
      )}

      <Divider />

      {/* ── Totalen ── */}
      <div className="mb-3 space-y-0.5 text-[12px]">
        {heeftKorting && (
          <Row label="Subtotaal" value={fmt(bon.totaalVoorKorting)} />
        )}
        {heeftKorting && (
          <Row label="Korting" value={`-${fmt(bon.totaalVoorKorting - bon.totaalNaKorting)}`} className="text-emerald-700" />
        )}
        <Row label={`BTW`} value={fmt(bon.btw)} />
      </div>

      <Divider double />

      <div className="flex justify-between font-black text-[15px] mb-3">
        <span>TOTAAL</span>
        <span>{fmt(bon.totaalNaKorting)}</span>
      </div>

      <Divider double />

      {/* ── Betaling ── */}
      <div className="mb-3 space-y-0.5 text-[12px]">
        <Row label="Betaalmethode" value={METHODE_LABEL[bon.betaalmethode] ?? bon.betaalmethode} />
        {bon.betaaldCents != null && (
          <Row label="Betaald" value={fmt(bon.betaaldCents / 100)} />
        )}
        {bon.wisselgeldCents != null && bon.wisselgeldCents > 0 && (
          <Row label="Wisselgeld" value={fmt(bon.wisselgeldCents / 100)} />
        )}
      </div>

      <Divider />

      {/* Footer */}
      <p className="text-center text-[12px] text-gray-600 whitespace-pre-wrap mt-2">
        {bonFooter || 'Bedankt voor uw bezoek!'}
      </p>

      {/* QR code */}
      {qrUrl && (
        <>
          <Divider />
          <div className="flex flex-col items-center gap-1 py-1">
            <QRCodeSVG value={qrUrl} size={80} level="M" />
            <p className="text-[10px] text-gray-400 text-center break-all max-w-[200px]">{qrUrl}</p>
          </div>
        </>
      )}
    </div>
  )
}

// ─── helpers ──────────────────────────────────────────────────────────────────

function Divider({ double = false }: { double?: boolean }) {
  return (
    <div className="my-2">
      <div className="border-t border-dashed border-gray-300" />
      {double && <div className="border-t border-dashed border-gray-300 mt-0.5" />}
    </div>
  )
}

function Row({
  label,
  value,
  className = '',
}: {
  label: string
  value: string
  className?: string
}) {
  return (
    <div className={`flex justify-between gap-2 ${className}`}>
      <span className="text-gray-600">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  )
}
