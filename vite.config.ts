import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'
import { ru } from './src/i18n/ru.ts'
import { ROUTES, SCREENS } from './src/state/routes.ts'

/**
 * Копия index.html по адресу каждого экрана, кроме главной.
 *
 * GitHub Pages раздаёт только файлы. Внутри приложения экраны переключаются
 * без него — через History API, — но прямая ссылка на /army/ и обновление
 * страницы идут к серверу, а тот ищет army/index.html и без него отдаёт свою 404.
 *
 * Копия — не вторая страница, а то же приложение: скрипты и стили в ней
 * подключены абсолютными путями, а экран приложение определит по адресу само.
 * Отличается только <title> — его видно до запуска скриптов и в превью ссылки.
 *
 * Дев-сервер и `npm run preview` отдают приложение по любому адресу, поэтому
 * локально всё работает и без копий — проверить их можно только в dist.
 */
function screenPages(): Plugin {
  return {
    name: 'screen-pages',
    apply: 'build',
    // после встроенной сборки HTML: к этому моменту index.html уже в бандле
    enforce: 'post',

    generateBundle(_, bundle) {
      const index = bundle['index.html']
      if (index?.type !== 'asset' || typeof index.source !== 'string') {
        this.error('в сборке нет index.html — копии для экранов сделать не из чего')
      }

      for (const screen of SCREENS) {
        if (ROUTES[screen] === '') continue

        const title = ru.screens[screen].documentTitle
        this.emitFile({
          type: 'asset',
          fileName: `${ROUTES[screen]}index.html`,
          source: index.source.replace(/<title>.*<\/title>/, `<title>${title}</title>`),
        })
      }
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), screenPages()],
  // Проект публикуется в подпапке GitHub Pages: https://rerank.github.io/calcDmgOldenEra/
  // Без этого на Pages отвалятся ассеты. В dev адрес тоже будет с префиксом.
  base: '/calcDmgOldenEra/',
})
