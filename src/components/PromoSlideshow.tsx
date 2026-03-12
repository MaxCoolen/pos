import { useEffect, useRef, useState } from 'react'
import type { Promotie } from '../store/usePromoStore'

interface PromoSlideshowProps {
  promoties: Promotie[]
  className?: string
  interval?: number // ms between slides
}

export function PromoSlideshow({
  promoties,
  className = '',
  interval = 8000,
}: PromoSlideshowProps) {
  const actief = promoties.filter((p) => p.actief)
  const [index, setIndex] = useState(0)
  const [fadeIn, setFadeIn] = useState(true)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Advance slide every `interval` ms; cross-fade by toggling opacity
  useEffect(() => {
    if (actief.length <= 1) return

    timerRef.current = setInterval(() => {
      setFadeIn(false)
      setTimeout(() => {
        setIndex((i) => (i + 1) % actief.length)
        setFadeIn(true)
      }, 600) // matches the CSS transition duration
    }, interval)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [actief.length, interval])

  // Reset index when active list changes
  useEffect(() => {
    setIndex(0)
    setFadeIn(true)
  }, [actief.length])

  if (actief.length === 0) {
    return (
      <div className={`flex items-center justify-center bg-slate-900 ${className}`}>
        <p className="text-slate-600 text-lg font-medium select-none">Geen promoties</p>
      </div>
    )
  }

  const promo = actief[index % actief.length]!

  return (
    <div className={`relative overflow-hidden bg-slate-900 ${className}`}>
      <div
        className="absolute inset-0"
        style={{
          opacity: fadeIn ? 1 : 0,
          transition: 'opacity 600ms ease-in-out',
        }}
      >
        {/* Image */}
        {promo.type === 'afbeelding' && promo.afbeelding && (
          <img
            src={promo.afbeelding}
            alt="promotie"
            className="w-full h-full object-cover"
          />
        )}

        {/* Video (URL only) */}
        {promo.type === 'video' && promo.videoUrl && (
          <iframe
            src={promo.videoUrl}
            className="w-full h-full border-0"
            allow="autoplay; muted"
            allowFullScreen
          />
        )}

        {/* Text */}
        {promo.type === 'tekst' && (
          <div
            className="w-full h-full flex items-center justify-center p-8 text-center"
            style={{
              backgroundColor: promo.achtergrondKleur || '#1e293b',
              color: promo.tekstKleur || '#ffffff',
            }}
          >
            <p className="text-4xl font-black leading-tight tracking-tight whitespace-pre-wrap break-words max-w-2xl">
              {promo.tekst || ''}
            </p>
          </div>
        )}
      </div>

      {/* Dot indicators (bottom centre) */}
      {actief.length > 1 && (
        <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5 pointer-events-none">
          {actief.map((_, i) => (
            <span
              key={i}
              className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                i === index % actief.length
                  ? 'bg-white w-4'
                  : 'bg-white/40'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
