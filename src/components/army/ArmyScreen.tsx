import { useRef, useState } from 'react'
import { ARMY_RULES } from '../../domain/rules'
import { t } from '../../i18n'
import { useArmies } from '../../state/armies'
import { landingSlot, type Army } from '../../state/armyTransitions'
import { AppHeader } from '../AppHeader'
import { Button } from '../ui/Button'
import { ArmyPanel } from './ArmyPanel'
import { armyName } from './armyFormat'
import { isNarrow } from './narrow'
import './army-compare.css'

/** Экран сравнения армий: шапка, армии и — следующим этапом — «Итог». */
export function ArmyScreen() {
  const { armies, stats, addArmy, removeArmy, addTroop, removeTroop, setCount } = useArmies()
  const armiesRef = useRef<HTMLDivElement>(null)

  /** ячейка только что добавленного отряда: туда встанет фокус */
  const [focusTarget, setFocusTarget] = useState<{ armyId: string; slot: number } | null>(null)

  /**
   * Выбрали существо в пустой ячейке. Новый отряд — одно существо, и сразу
   * после выбора нужно набрать количество: фокус переходит в его поле.
   * Ячейку считаем тем же правилом, что и сам переход, — на узком экране
   * отряд встаёт не туда, где кликнули, а в конец армии.
   *
   * Только при мыши: на сенсорном экране фокус выдвинул бы клавиатуру
   * поверх армии — поэтому и поиск в списке там фокус не получает.
   */
  const onAddTroop = (army: Army, slot: number, creatureId: string) => {
    const narrow = isNarrow()
    const landed = landingSlot(army, slot, narrow)

    addTroop(army.id, slot, creatureId, narrow)

    const pointer = matchMedia('(pointer: fine)').matches
    setFocusTarget(pointer && landed >= 0 ? { armyId: army.id, slot: landed } : null)
  }

  // Удаление на узком экране сдвигает отряды, и в ячейку прежней цели фокуса
  // может въехать другой отряд — его поле перехватило бы фокус. Цель сбрасываем.
  const onRemoveTroop = (armyId: string, slot: number) => {
    setFocusTarget(null)
    removeTroop(armyId, slot, isNarrow())
  }

  const notes = t.armyNotes
  const removable = armies.length > ARMY_RULES.minArmies
  const canAdd = armies.length < ARMY_RULES.maxArmies

  const onAddArmy = () => {
    addArmy()

    // На узком экране армии идут лентой, и новая появляется за правым краем —
    // докручиваем ленту до конца. На ПК лента не прокручивается, вызов ничего
    // не делает. Кадр ждём, чтобы новая армия уже была в разметке.
    requestAnimationFrame(() => {
      const list = armiesRef.current
      const smooth = !matchMedia('(prefers-reduced-motion: reduce)').matches
      list?.scrollTo({ left: list.scrollWidth, behavior: smooth ? 'smooth' : 'auto' })
    })
  }

  return (
    <>
      <AppHeader title={t.armyTitle} lead={t.armyLead}>
        <p>
          <strong>{t.damageIndex}</strong>&nbsp;— {notes.damage}
          <br />
          <strong>{t.hardinessIndex}</strong>&nbsp;— {notes.hardiness}
          <br />
          <strong>{t.powerIndex}</strong>&nbsp;— {notes.power}
        </p>
      </AppHeader>

      <main className="army-compare">
        <div className="army-compare__armies" ref={armiesRef}>
          {armies.map((army, index) => (
            <ArmyPanel
              key={army.id}
              army={army}
              name={armyName(index)}
              stats={stats[index]}
              removable={removable}
              focusSlot={focusTarget?.armyId === army.id ? focusTarget.slot : null}
              onRemove={() => removeArmy(army.id)}
              onAddTroop={(slot, creatureId) => onAddTroop(army, slot, creatureId)}
              onRemoveTroop={(slot) => onRemoveTroop(army.id, slot)}
              onCountChange={(slot, count) => setCount(army.id, slot, count)}
            />
          ))}

          {/* На ПК — по центру под армиями, на узком экране — последней колонкой ленты, одним «+» */}
          {canAdd && (
            <Button
              variant="large"
              quiet
              collapsible
              icon="+"
              className="army-compare__add"
              onClick={onAddArmy}
            >
              {t.addArmy}
            </Button>
          )}
        </div>
      </main>
    </>
  )
}
