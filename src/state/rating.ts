import { useState } from 'react'
import { CREATURE_TEMPLATES, FACTIONS, type CreatureTemplate, type FactionId } from '../data/creatures'
import { factionSummary, rateUnits } from '../domain/rating'
import type { Metric } from '../domain/types'
import * as transitions from './ratingTransitions'
import type { CreatureKind, SortKey } from './ratingTransitions'

/** Существо рейтинга — шаблон справочника, у которого есть прирост. */
export type RatedCreature = CreatureTemplate & { growth: number }

/**
 * Кто в рейтинге: существа, которых нанимают в городе, — у них есть прирост.
 * Нейтралов и Огненную личинку (её призывает герой) в городе не нанимают,
 * прироста у них нет, и с существами фракций они не сравниваются.
 */
export const RATED_CREATURES = CREATURE_TEMPLATES.filter(
  (creature): creature is RatedCreature => creature.growth !== undefined,
)

/**
 * Существа выбранного вида. Остальных для рейтинга будто нет: места, доли
 * от лидера, место поштучно и сводка считаются только среди выбранных.
 * Этим вид и отличается от ранга и фракции — те лишь прячут строки.
 */
export const ratingPool = (kind: CreatureKind): RatedCreature[] =>
  kind === 'all'
    ? RATED_CREATURES
    : RATED_CREATURES.filter((creature) => Boolean(creature.upgraded) === (kind === 'upgraded'))

/** Ранги рейтинга по возрастанию: кнопки фильтра. */
export const RATING_TIERS = [...new Set(RATED_CREATURES.map((creature) => creature.tier))].sort(
  (a, b) => a - b,
)

/** Фракции рейтинга в порядке справочника: кнопки фильтра. */
export const RATING_FACTIONS = FACTIONS.filter((faction) =>
  RATED_CREATURES.some((creature) => creature.faction === faction.id),
)

/**
 * Состояние экрана рейтинга. Как и у армий, это useState за фасадом хука,
 * а правила правок — чистые функции в ratingTransitions.ts.
 *
 * Кнопки «Посчитать» нет: рейтинг выводится из настроек при каждой
 * отрисовке. Это 126 существ и несколько умножений на каждое — кешировать
 * нечего.
 */
export function useRating() {
  const [options, setOptions] = useState(transitions.DEFAULT_RATING)
  const creatures = ratingPool(options.kind)
  const entries = rateUnits(creatures, options.metric, options.weekly)

  return {
    options,
    /** существа выбранного вида — среди них и считается рейтинг */
    creatures,
    /** места и доли существ — в том же порядке, что creatures */
    entries,
    /** сводка по фракциям: следует за категорией, видом и приростом, но не за рангом и фракцией */
    summary: factionSummary(creatures, entries),

    setMetric: (metric: Metric) => setOptions((current) => transitions.setMetric(current, metric)),
    setKind: (kind: CreatureKind) => setOptions((current) => transitions.setKind(current, kind)),
    toggleTier: (tier: number) => setOptions((current) => transitions.toggleTier(current, tier)),
    allTiers: () => setOptions(transitions.allTiers),
    toggleFaction: (faction: FactionId) =>
      setOptions((current) => transitions.toggleFaction(current, faction)),
    allFactions: () => setOptions(transitions.allFactions),
    setWeekly: (weekly: boolean) => setOptions((current) => transitions.setWeekly(current, weekly)),
    sortBy: (key: SortKey) => setOptions((current) => transitions.sortBy(current, key)),
  }
}
