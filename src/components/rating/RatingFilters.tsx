import type { ReactNode } from 'react'
import type { FactionId } from '../../data/creatures'
import { lang, t } from '../../i18n'
import { RATING_FACTIONS, RATING_TIERS } from '../../state/rating'
import {
  CREATURE_KINDS,
  type CreatureKind,
  type RatingOptions,
} from '../../state/ratingTransitions'
import { ROMAN } from '../roman'
import { Button } from '../ui/Button'
import { Toggle } from '../ui/Toggle'
// Панель — микс с result-panel: фон, рамку и тень даёт он.
// Импорт раньше своих стилей — свои правила должны идти после и перекрывать его.
import '../result-panel.css'
import './rating-filters.css'

type Props = {
  options: RatingOptions
  onToggleTier: (tier: number) => void
  onAllTiers: () => void
  onToggleFaction: (faction: FactionId) => void
  onAllFactions: () => void
  onKindChange: (kind: CreatureKind) => void
  onWeeklyChange: (weekly: boolean) => void
}

const TIER_OPTIONS = RATING_TIERS.map((tier) => ({ value: tier, label: ROMAN[tier - 1] }))
const FACTION_OPTIONS = RATING_FACTIONS.map((faction) => ({
  value: faction.id,
  label: faction.name[lang],
}))

/**
 * Фильтры — вторичные параметры: какие ранги и фракции показать, каких
 * существ сравнивать и считать ли прирост. Ранг и фракция только прячут
 * строки — места и доли от лидера по-прежнему считаются среди всех существ
 * ранга. Вид существ решает, кто соревнуется: невыбранных для рейтинга
 * будто нет.
 */
export function RatingFilters({
  options,
  onToggleTier,
  onAllTiers,
  onToggleFaction,
  onAllFactions,
  onKindChange,
  onWeeklyChange,
}: Props) {
  return (
    <section className="result-panel rating-filters" aria-label={t.ratingFilters}>
      <Choice
        id="rating-tier-label"
        label={t.tier}
        options={TIER_OPTIONS}
        selected={options.tiers}
        onToggle={onToggleTier}
        onAll={onAllTiers}
      />
      <Choice
        id="rating-faction-label"
        label={t.faction}
        options={FACTION_OPTIONS}
        selected={options.factions}
        onToggle={onToggleFaction}
        onAll={onAllFactions}
      />

      {/* выбор ровно один, как у категорий */}
      <FilterRow id="rating-kind-label" label={t.kind}>
        {CREATURE_KINDS.map((kind) => (
          <Chip key={kind} pressed={options.kind === kind} onClick={() => onKindChange(kind)}>
            {t.kinds[kind]}
          </Chip>
        ))}
      </FilterRow>

      <div className="rating-filters__row rating-filters__row--toggle">
        <Toggle id="rating-weekly" checked={options.weekly} onChange={onWeeklyChange} />
        <label className="rating-filters__toggle-label" htmlFor="rating-weekly">
          {t.weekly}
        </label>
        <span className="rating-filters__hint">{t.weeklyHint}</span>
      </div>
    </section>
  )
}

type RowProps = {
  /** id подписи: по нему группа кнопок получает своё имя */
  id: string
  label: string
  children: ReactNode
}

/** Строка фильтра: подпись и группа кнопок выбора. */
function FilterRow({ id, label, children }: RowProps) {
  return (
    <div className="rating-filters__row">
      <span className="rating-filters__label" id={id}>
        {label}
      </span>
      <div className="rating-filters__chips" role="group" aria-labelledby={id}>
        {children}
      </div>
    </div>
  )
}

type ChoiceProps<T> = Omit<RowProps, 'children'> & {
  options: Array<{ value: T; label: string }>
  /** выбранные значения; пусто — «Все» */
  selected: T[]
  onToggle: (value: T) => void
  onAll: () => void
}

/**
 * Множественный выбор кнопками: клик включает или выключает значение,
 * «Все» сбрасывает выбор. Снятое последним значение — снова «Все»:
 * это правило живёт в переходах состояния.
 */
function Choice<T extends string | number>({
  id,
  label,
  options,
  selected,
  onToggle,
  onAll,
}: ChoiceProps<T>) {
  return (
    <FilterRow id={id} label={label}>
      <Chip pressed={selected.length === 0} onClick={onAll}>
        {t.all}
      </Chip>
      {options.map((option) => (
        <Chip
          key={option.value}
          pressed={selected.includes(option.value)}
          onClick={() => onToggle(option.value)}
        >
          {option.label}
        </Chip>
      ))}
    </FilterRow>
  )
}

/** Кнопка выбора: выбранная — красная, остальные — тихие. */
function Chip({
  pressed,
  onClick,
  children,
}: {
  pressed: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <Button variant="small" quiet={!pressed} aria-pressed={pressed} onClick={onClick}>
      {children}
    </Button>
  )
}
