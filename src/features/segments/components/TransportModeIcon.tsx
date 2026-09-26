import type { TransportMode } from '../types'

const strokeProps = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

export function TransportModeIcon({ mode }: { mode: TransportMode }) {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
      {mode === 'fly' && <path fill="currentColor" d="M2 21l21-9L2 3v7l14 2-14 2z" />}
      {mode === 'tog' && (
        <g {...strokeProps}>
          <rect x="6" y="3" width="12" height="14" rx="3" />
          <line x1="6" y1="11" x2="18" y2="11" />
          <line x1="9" y1="20" x2="7" y2="23" />
          <line x1="15" y1="20" x2="17" y2="23" />
        </g>
      )}
      {mode === 'bil' && (
        <g {...strokeProps}>
          <path d="M4 16l1.5-5a2 2 0 0 1 1.9-1.4h9.2A2 2 0 0 1 18.5 11l1.5 5" />
          <rect x="3" y="16" width="18" height="4" rx="1.2" />
          <circle cx="7.5" cy="20" r="1.4" fill="currentColor" stroke="none" />
          <circle cx="16.5" cy="20" r="1.4" fill="currentColor" stroke="none" />
        </g>
      )}
      {mode === 'bus' && (
        <g {...strokeProps}>
          <rect x="4" y="4" width="16" height="13" rx="2" />
          <line x1="4" y1="10" x2="20" y2="10" />
          <line x1="8" y1="7" x2="8" y2="10" />
          <line x1="12" y1="7" x2="12" y2="10" />
          <line x1="16" y1="7" x2="16" y2="10" />
          <circle cx="8" cy="20" r="1.4" fill="currentColor" stroke="none" />
          <circle cx="16" cy="20" r="1.4" fill="currentColor" stroke="none" />
        </g>
      )}
      {mode === 'færge' && (
        <g {...strokeProps}>
          <path d="M3 15h18l-2.5 5h-13L3 15z" />
          <path d="M8 15V6h6l3 9" />
          <line x1="11" y1="6" x2="11" y2="3" />
        </g>
      )}
      {mode === 'gang' && (
        <g {...strokeProps}>
          <circle cx="13" cy="4" r="1.6" fill="currentColor" stroke="none" />
          <path d="M11 8l1 4 3 2 2 5M12 12l-3 2-2 5M11 8l-4 2" />
        </g>
      )}
    </svg>
  )
}
