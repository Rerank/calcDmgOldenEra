import { useEffect, useState } from 'react'
import { screenFromPath, screenPath, type Screen } from './routes'

/** Корень сайта — подпапка GitHub Pages, заданная `base` в vite.config.ts. */
const BASE = import.meta.env.BASE_URL

/**
 * Текущий экран и переход между экранами без перезагрузки страницы.
 *
 * Адрес меняется через History API, поэтому экран можно открыть прямой
 * ссылкой, обновить страницу и вернуться кнопкой «Назад». Для двух экранов
 * библиотека маршрутизации не нужна: весь роутер — этот хук и routes.ts.
 */
export function useScreen() {
  const [screen, setScreen] = useState(() => screenFromPath(location.pathname, BASE))

  // «Назад» и «Вперёд» меняют адрес сами — экран догоняет его
  useEffect(() => {
    const onPopState = () => setScreen(screenFromPath(location.pathname, BASE))
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  return {
    screen,

    /** адрес экрана для ссылки */
    hrefOf: (target: Screen) => screenPath(target, BASE),

    navigate: (target: Screen) => {
      // повторный клик по текущему экрану не плодит записей в истории
      if (target === screen) return
      history.pushState(null, '', screenPath(target, BASE))
      setScreen(target)
    },
  }
}
