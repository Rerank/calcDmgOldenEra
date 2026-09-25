import { findTemplate } from '../../data/creatures'
import { F } from '../../domain/rules'
import { lang, t } from '../../i18n'
import type { Troop } from '../../state/armyTransitions'
import { creatureIcon } from '../creatureIcons'
import { TEMPLATE_GROUPS } from '../templateGroups'
import { Combobox } from '../ui/Combobox'
import { Stepper } from '../ui/Stepper'
import { NARROW } from './narrow'
import './army-slot.css'

type Props = {
  /** уникален на странице: от него строятся id списка выбора */
  id: string
  /** null — пустая ячейка */
  troop: Troop | null
  /** отряд только что добавили: фокус — в его количество */
  focusCount: boolean
  onAdd: (creatureId: string) => void
  onRemove: () => void
  onCountChange: (count: number) => void
}

/**
 * Ячейка армии. Карточка одна на ПК и на телефоне: имя, картинка, количество.
 *
 * Пустая ячейка — сама кнопка выбора существа. Список тот же, что у поля
 * «Шаблон» в калькуляторе: группы фракций, ранг справа, тот же поиск. На ПК
 * он раскрывается под ячейкой, на узком экране — на весь экран: там ячейка
 * стоит в ленте с прокруткой, и выпавший под ней список лента обрезала бы.
 */
export function ArmySlot({ id, troop, focusCount, onAdd, onRemove, onCountChange }: Props) {
  if (!troop) {
    return (
      <li className="army-slot army-slot--empty">
        <span className="army-slot__name">{t.emptySlot}</span>
        <Combobox
          id={id}
          value=""
          trigger={{ className: 'army-slot__cell army-slot__add', content: '+', label: t.addTroop }}
          groups={TEMPLATE_GROUPS}
          searchPlaceholder={t.templateSearch}
          fullscreenQuery={NARROW}
          onChange={onAdd}
        />
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
        autoFocus={focusCount}
        value={troop.count}
        {...F.count}
        label={name}
        inputLabel={`${name}: ${t.quantity}`}
        onChange={onCountChange}
      />
    </li>
  )
}
