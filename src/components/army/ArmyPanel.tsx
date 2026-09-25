import type { ArmyStats } from '../../domain/types'
import { t } from '../../i18n'
import type { Army } from '../../state/armyTransitions'
import { Button } from '../ui/Button'
import { ARMY_METRICS, formatInteger, NO_VALUE } from './armyFormat'
import { ArmySlot } from './ArmySlot'
// Панель — микс с result-panel: фон, рамку, тень и шапку даёт он.
// Импорт раньше своих стилей — свои правила должны идти после и перекрывать его.
import '../result-panel.css'
import './army-panel.css'
import './army-stat.css'

type Props = {
  army: Army
  /** «Армия II» */
  name: string
  stats: ArmyStats
  /** последнюю армию убрать нельзя — кнопки у неё нет */
  removable: boolean
  /** ячейка только что добавленного отряда: фокус — в его количество; null — никуда */
  focusSlot: number | null
  onRemove: () => void
  onAddTroop: (slot: number, creatureId: string) => void
  onRemoveTroop: (slot: number) => void
  onCountChange: (slot: number, count: number) => void
}

/**
 * Панель армии. Выглядит как панель результата калькулятора: шапка
 * с номером армии, семь ячеек отрядов, под ними — итоговые индексы.
 */
export function ArmyPanel({
  army,
  name,
  stats,
  removable,
  focusSlot,
  onRemove,
  onAddTroop,
  onRemoveTroop,
  onCountChange,
}: Props) {
  const filled = stats.count > 0

  return (
    <section className="result-panel army-panel">
      <header className="result-panel__header army-panel__header">
        <div className="army-panel__heading">
          <h2 className="result-panel__title">{name}</h2>
          <span className="army-panel__count">
            {formatInteger(stats.count)}&nbsp;{t.pcs}
          </span>
        </div>

        {removable && (
          <Button variant="small" quiet collapsible narrowIcon="×" onClick={onRemove}>
            {t.removeArmy}
          </Button>
        )}
      </header>

      {/* Ячеек всегда семь, и стоят они на своих местах: ключ — номер ячейки */}
      <ul className="army-panel__slots">
        {army.slots.map((troop, slot) => (
          <ArmySlot
            key={slot}
            id={`${army.id}-slot-${slot}`}
            troop={troop}
            focusCount={slot === focusSlot}
            onAdd={(creatureId) => onAddTroop(slot, creatureId)}
            onRemove={() => onRemoveTroop(slot)}
            onCountChange={(count) => onCountChange(slot, count)}
          />
        ))}
      </ul>

      <dl className="army-panel__stats">
        {ARMY_METRICS.map(({ key, label }) => (
          <div key={key} className={`army-stat army-stat--${key}`}>
            <dt className="army-stat__label">{label}</dt>
            <dd className="army-stat__value">{filled ? formatInteger(stats[key]) : NO_VALUE}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
