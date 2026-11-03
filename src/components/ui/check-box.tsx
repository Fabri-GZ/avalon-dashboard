'use client'

interface Props {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  disabled?: boolean
  className?: string
}

/**
 * Same checkbox look as the Proyectos task rows (`TaskCard`). A `button` with
 * `role="checkbox"`, so it toggles with Space/Enter and, inside a `<label>`,
 * with a click on the label text.
 */
export function CheckBox({ checked, onCheckedChange, disabled = false, className = '' }: Props) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={`group/check flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border-[1.5px] transition-all duration-200 ease-in outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:cursor-not-allowed ${
        checked
          ? 'border-primary bg-primary text-primary-foreground hover:border-primary/80 hover:bg-primary/80'
          : 'border-muted-foreground/40 hover:border-primary hover:bg-primary/10'
      } ${className}`}
    >
      {checked && <CheckMark />}
      {!checked && !disabled && (
        <span className="text-primary opacity-0 transition-opacity duration-200 ease-in group-hover/check:opacity-60">
          <CheckMark />
        </span>
      )}
    </button>
  )
}

function CheckMark() {
  return (
    <svg width="13" height="13" viewBox="0 0 10 10" fill="none" aria-hidden="true">
      <path d="M1.5 5L3.8 7.5L8.5 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
