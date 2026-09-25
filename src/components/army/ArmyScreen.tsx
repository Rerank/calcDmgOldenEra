import { useRef } from 'react'
import { ARMY_RULES } from '../../domain/rules'
import { t } from '../../i18n'
import { useArmies } from '../../state/armies'
import { AppHeader } from '../AppHeader'
import { Button } from '../ui/Button'
import { ArmyPanel } from './ArmyPanel'
import { armyName } from './armyFormat'
import { isNarrow } from './narrow'
import './army-compare.css'

/** Экран сравнения армий: шапка, армии и — следующим этапом — «Итог». */
export function ArmyScreen() {
  const { armies, stats, addArmy, removeArmy, removeTroop, setCount } = useArmies()
  const armiesRef = useRef<HTMLDivElement>(null)

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
              onRemove={() => removeArmy(army.id)}
              onRemoveTroop={(slot) => removeTroop(army.id, slot, isNarrow())}
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
