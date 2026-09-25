import { findTemplate } from '../../data/creatures'
import { F } from '../../domain/rules'
import { lang, t } from '../../i18n'
import type { Troop } from '../../state/armyTransitions'
import { creatureIcon } from '../creatureIcons'
import { Stepper } from '../ui/Stepper'
import './army-slot.css'

type Props = {
  /** null — пустая ячейка */
  troop: Troop | null
  onRemove: () => void
  onCountChange: (count: number) => void
}

/**
 * Ячейка армии. Карточка одна на ПК и на телефоне: имя, картинка, количество.
 * Пустая ячейка — сама кнопка «добавить существо».
 */
export function ArmySlot({ troop, onRemove, onCountChange }: Props) {
  if (!troop) {
    return (
      <li className="army-slot army-slot--empty">
        <span className="army-slot__name">{t.emptySlot}</span>
        <button className="army-slot__cell army-slot__add" type="button" aria-label={t.addTroop}>
          +
        </button>
      </li>
    )
  }

  const name = findTemplate(troop.creatureId)?.name[lang] ?? troop.creatureId
  const icon = creatureIcon(troop.creatureId)

  return (
    <li className="army-slot">
      {/* длинное имя обрезается многоточием — целиком оно во всплывающей подсказке */}
      <span className="army-slot__name" title={name}>
        {name}
      </span>

      <div className="army-slot__cell">
        {/* подпись — имя над картинкой, поэтому alt пустой; без иконки ячейка просто пустая.
            lazy — пока экран армий скрыт, картинки не грузятся */}
        {icon && <img className="army-slot__image" src={icon} alt="" loading="lazy" />}
        <button
          className="army-slot__remove"
          type="button"
          aria-label={`${t.removeTroop}: ${name}`}
          onClick={onRemove}
        >
          ×
        </button>
      </div>

      <Stepper
        compact
        value={troop.count}
        {...F.count}
        label={name}
        inputLabel={`${name}: ${t.quantity}`}
        onChange={onCountChange}
      />
    </li>
  )
}
