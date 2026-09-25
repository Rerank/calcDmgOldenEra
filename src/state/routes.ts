/**
 * Экраны приложения и их адреса. Модуль без React и без import.meta.env:
 * его читает не только приложение, но и сборка — vite.config.ts кладёт
 * копию index.html по адресу каждого экрана (зачем — см. там).
 */

export type Screen = 'calculator' | 'army'

/**
 * Адрес экрана относительно корня сайта. Главная — калькулятор.
 *
 * Адрес — со слешем на конце: экран в сборке лежит папкой с index.html,
 * и GitHub Pages отдаёт её именно так, а адрес без слеша перенаправляет
 * на адрес со слешем.
 */
export const ROUTES: Record<Screen, string> = {
  calculator: '',
  army: 'army/',
}

/** Экраны в порядке объявления — в этом же порядке они стоят в навигации. */
export const SCREENS = Object.keys(ROUTES) as Screen[]

/** Полный адрес экрана: `base` — корень сайта, например '/calcDmgOldenEra/'. */
export const screenPath = (screen: Screen, base: string) => base + ROUTES[screen]

/**
 * Какой экран открыт по этому адресу. Чужой или неизвестный адрес — главная:
 * GitHub Pages такие адреса до приложения не пропустит, а дев-сервер
 * отдаёт приложение по любому адресу.
 */
export function screenFromPath(pathname: string, base: string): Screen {
  if (!pathname.startsWith(base)) return 'calculator'

  // «army» и «army/» — один экран: без слеша адрес набирают руками
  const rest = pathname.slice(base.length)
  const route = rest === '' ? '' : rest.replace(/\/*$/, '/')

  return SCREENS.find((screen) => ROUTES[screen] === route) ?? 'calculator'
}
