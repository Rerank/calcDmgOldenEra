import type { ButtonHTMLAttributes } from 'react'
import './button.css'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  /**
   * strike — главная кнопка удара, small — компактная в шапке панели,
   * large — крупная с значком («Добавить армию»)
   */
  variant?: 'strike' | 'small' | 'large'
  /** приглушённый вид: действие не должно спорить с «Ударом» */
  quiet?: boolean
  /** значок перед текстом, виден всегда: «+ Добавить армию» */
  icon?: string
  /** значок только на узком экране — там, где collapsible прячет текст: «×» у «Убрать армию» */
  narrowIcon?: string
  /**
   * На узком экране кнопка сжимается до квадратного значка. Текст прячется
   * только визуально: скринридер его читает, и отдельный aria-label не нужен.
   */
  collapsible?: boolean
}

export function Button({
  variant,
  quiet,
  icon,
  narrowIcon,
  collapsible,
  className,
  children,
  ...rest
}: Props) {
  const cls = [
    'button',
    variant && `button--${variant}`,
    quiet && 'button--quiet',
    collapsible && 'button--collapsible',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  const glyph = icon ?? narrowIcon

  return (
    <button type="button" className={cls} {...rest}>
      {glyph ? (
        <>
          <span
            className={'button__icon' + (icon ? '' : ' button__icon--narrow')}
            aria-hidden="true"
          >
            {glyph}
          </span>
          <span className="button__label">{children}</span>
        </>
      ) : (
        children
      )}
    </button>
  )
}
