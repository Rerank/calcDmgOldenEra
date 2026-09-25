import { Activity, useEffect } from 'react'
import { AppNav } from './components/AppNav'
import { ArmyScreen } from './components/army/ArmyScreen'
import { CalculatorScreen } from './components/CalculatorScreen'
import { t } from './i18n'
import { useScreen } from './state/screen'

/**
 * Оболочка: верхняя строка с переключателем и два экрана.
 *
 * Скрытый экран не размонтируется: Activity прячет его через display: none
 * и отключает его эффекты. Поэтому при переключении сохраняется всё — ввод,
 * результаты, раскрытые блоки, прокрутка. Самим экранам об этом знать
 * не нужно: их состояние живёт в них же.
 */
export function App() {
  const { screen, hrefOf, navigate } = useScreen()

  // Заголовок вкладки браузера — по экрану. До запуска скриптов его задаёт
  // сам HTML: index.html у главной, копия с подставленным заголовком у остальных
  useEffect(() => {
    document.title = t.screens[screen].documentTitle
  }, [screen])

  return (
    <div className="page__inner">
      <AppNav screen={screen} hrefOf={hrefOf} onNavigate={navigate} />

      <Activity mode={screen === 'calculator' ? 'visible' : 'hidden'}>
        <CalculatorScreen />
      </Activity>
      <Activity mode={screen === 'army' ? 'visible' : 'hidden'}>
        <ArmyScreen />
      </Activity>
    </div>
  )
}
