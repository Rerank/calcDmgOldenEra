import { FACTIONS } from '../../data/creatures'
import type { RatingEntry } from '../../domain/types'
import { lang } from '../../i18n'
import type { RatedCreature } from '../../state/rating'
import type { RatingOptions, SortKey } from '../../state/ratingTransitions'

/**
 * Строки таблицы рейтинга: фильтр, блоки по рангам и сортировка внутри
 * блока. Живёт рядом с интерфейсом, а не в состоянии: названия сортируются
 * по алфавиту языка интерфейса, как список шаблонов в templateGroups.ts.
 */

/** Строка таблицы: существо и его место в ранге. */
export interface RatingRow {
  creature: RatedCreature
  entry: RatingEntry
}

/** Блок таблицы — один ранг. */
export interface RatingGroup {
  tier: number
  rows: RatingRow[]
}

/** Название фракции по id: сводка получает id строкой из расчёта, таблица — из справочника. */
export const factionName = (id: string) =>
  FACTIONS.find((faction) => faction.id === id)?.name[lang] ?? id

const collator = new Intl.Collator(lang)

type Compare = (a: RatingRow, b: RatingRow) => number

const byIndex: Compare = (a, b) => a.entry.value - b.entry.value

/** Как сравнивает строки каждый столбец — по возрастанию; направление добавляет сортировка. */
const COMPARE: Record<SortKey, Compare> = {
  place: (a, b) => a.entry.place - b.entry.place,
  name: (a, b) => collator.compare(a.creature.name[lang], b.creature.name[lang]),
  faction: (a, b) => collator.compare(factionName(a.creature.faction), factionName(b.creature.faction)),
  attack: (a, b) => a.creature.attack - b.creature.attack,
  // урон показан как в игре, «4–6», а в расчёт идёт среднее — по нему и сортируем;
  // сумма границ упорядочивает так же, как среднее
  damage: (a, b) =>
    a.creature.damageMin + a.creature.damageMax - (b.creature.damageMin + b.creature.damageMax),
  hp: (a, b) => a.creature.hp - b.creature.hp,
  defense: (a, b) => a.creature.defense - b.creature.defense,
  growth: (a, b) => a.creature.growth - b.creature.growth,
  value: byIndex,
  // внутри ранга доля от лидера растёт вместе с индексом — порядок тот же
  share: byIndex,
  solo: (a, b) => a.entry.soloPlace - b.entry.soloPlace,
}

/**
 * Таблица: блоки выбранных рангов по возрастанию, в каждом — строки
 * выбранных фракций. Ранг, где после фильтра не осталось строк, не выводится.
 *
 * Фильтры только прячут строки: места и доли посчитаны среди всех существ
 * ранга ещё в расчёте. При равенстве в столбце — по индексу ▼, дальше
 * порядок справочника: sort устойчивая.
 *
 * entries — рейтинг тех же существ в том же порядке.
 */
export function ratingGroups(
  creatures: RatedCreature[],
  entries: RatingEntry[],
  { tiers, factions, sort }: RatingOptions,
): RatingGroup[] {
  const shown = creatures.flatMap((creature, i) =>
    (tiers.length === 0 || tiers.includes(creature.tier)) &&
    (factions.length === 0 || factions.includes(creature.faction))
      ? [{ creature, entry: entries[i] }]
      : [],
  )

  const direction = sort.dir === 'asc' ? 1 : -1
  const order: Compare = (a, b) => direction * COMPARE[sort.key](a, b) || byIndex(b, a)
  const shownTiers = [...new Set(shown.map((row) => row.creature.tier))].sort((a, b) => a - b)

  return shownTiers.map((tier) => ({
    tier,
    rows: shown.filter((row) => row.creature.tier === tier).sort(order),
  }))
}
