import type { ComponentType } from 'react'

type IconType = ComponentType<{ size?: number; strokeWidth?: number; 'aria-hidden'?: boolean }>

export function Metric({ icon: Icon, label, value }: { icon: IconType; label: string; value: string }) {
  return (
    <div className="metric">
      <Icon size={17} aria-hidden={true} />
      <span>{value}</span>
      <small>{label}</small>
    </div>
  )
}

export function ModeButton({
  active,
  icon: Icon,
  label,
  onClick,
}: {
  active: boolean
  icon: IconType
  label: string
  onClick: () => void
}) {
  return (
    <button
      aria-selected={active}
      className={`mode-button ${active ? 'is-active' : ''}`}
      onClick={onClick}
      role="tab"
      title={label}
      type="button"
    >
      <Icon size={17} aria-hidden={true} />
      <span>{label}</span>
    </button>
  )
}
