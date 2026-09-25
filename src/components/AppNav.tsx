import type { MouseEvent } from 'react'
import { t } from '../i18n'
import { SCREENS, type Screen } from '../state/routes'
import './app-nav.css'

type Props = {
  screen: Screen
  /** адрес экрана для ссылки */
  hrefOf: (screen: Screen) => string
  onNavigate: (screen: Screen) => void
}

/**
 * Верхняя строка страницы: название игры и переключатель экранов.
 *
 * Пункты — настоящие ссылки: у каждого экрана свой адрес, поэтому
 * Ctrl-клик и средняя кнопка открывают его в новой вкладке, как на любом
 * сайте. Обычный клик перехватываем и переключаем экран без перезагрузки.
 */
export function AppNav({ screen, hrefOf, onNavigate }: Props) {
  const onClick = (event: MouseEvent<HTMLAnchorElement>, target: Screen) => {
    // клик с модификатором или не левой кнопкой — пусть браузер откроет вкладку сам
    if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return

    event.preventDefault()
    onNavigate(target)
  }

  return (
    <div className="app-nav">
      <p className="app-nav__game">{t.gameTitle}</p>

      <nav className="app-nav__links" aria-label={t.nav}>
        {SCREENS.map((target) => {
          const current = target === screen

          return (
            <a
              key={target}
              className={'app-nav__link' + (current ? ' app-nav__link--current' : '')}
              href={hrefOf(target)}
              aria-current={current ? 'page' : undefined}
              onClick={(event) => onClick(event, target)}
            >
              {t.screens[target].nav}
            </a>
          )
        })}
      </nav>
    </div>
  )
}
