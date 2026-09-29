import type { FactionId } from '../data/creatures'
import type { Metric } from '../domain/types'

/**
 * Состояние экрана рейтинга: настройки показа и чистые переходы без React,
 * как armyTransitions.ts у армий. Если переход ничего не меняет — тот же
 * объект, и React не перерисовывает экран зря.
 *
 * В состоянии только выбор пользователя. Сам рейтинг выводится из него
 * при каждой отрисовке — см. rating.ts.
 */

/** Столбцы таблицы, по которым можно сортировать. */
export type SortKey =
  | 'place'
  | 'name'
  | 'faction'
  | 'attack'
  | 'damage'
  | 'hp'
  | 'defense'
  | 'growth'
  | 'value'
  | 'share'
  | 'solo'

export interface RatingSort {
  key: SortKey
  dir: 'asc' | 'desc'
}

/**
 * Какие существа в рейтинге: все, только базовые или только улучшенные.
 * Невыбранных для рейтинга будто нет — см. ratingPool в rating.ts.
 */
export type CreatureKind = 'all' | 'base' | 'upgraded'

/** Вид существ в порядке кнопок фильтра. */
export const CREATURE_KINDS: CreatureKind[] = ['all', 'base', 'upgraded']

export interface RatingOptions {
  /** категория: урон, живучесть или мощность */
  metric: Metric
  /** кто соревнуется: в отличие от ранга и фракции, меняет места и доли */
  kind: CreatureKind
  /** выбранные ранги; пусто — «Все» */
  tiers: number[]
  /** выбранные фракции; пусто — «Все» */
  factions: FactionId[]
  /** «Учитывать прирост»: сравниваются отряды из недельного прироста */
  weekly: boolean
  /** одна сортировка на все ранги: строки сортируются внутри своего ранга */
  sort: RatingSort
}

/**
 * Места и названия сортируются сначала по возрастанию: наверху первое
 * место и начало алфавита. Числа — сначала по убыванию: наверху сильнейшие.
 */
const ASCENDING_FIRST: SortKey[] = ['place', 'name', 'faction', 'solo']

/** Столбцы, которые есть только с приростом. */
const WEEKLY_ONLY: SortKey[] = ['growth', 'solo']

const DEFAULT_SORT: RatingSort = { key: 'value', dir: 'desc' }

/** Экран открывается на уроне поштучно, все существа, ранги и фракции, по индексу ▼. */
export const DEFAULT_RATING: RatingOptions = {
  metric: 'damage',
  kind: 'all',
  tiers: [],
  factions: [],
  weekly: false,
  sort: DEFAULT_SORT,
}

export function setMetric(options: RatingOptions, metric: Metric): RatingOptions {
  return options.metric === metric ? options : { ...options, metric }
}

/** Выбор ровно один: «Все», «Базовые» или «Улучшенные». */
export function setKind(options: RatingOptions, kind: CreatureKind): RatingOptions {
  return options.kind === kind ? options : { ...options, kind }
}

/** Значение включается или выключается. Снятое последним — пустой выбор, то есть снова «Все». */
const toggle = <T>(selected: T[], value: T) =>
  selected.includes(value) ? selected.filter((item) => item !== value) : [...selected, value]

export function toggleTier(options: RatingOptions, tier: number): RatingOptions {
  return { ...options, tiers: toggle(options.tiers, tier) }
}

/** «Все» сбрасывает выбор рангов. */
export function allTiers(options: RatingOptions): RatingOptions {
  return options.tiers.length === 0 ? options : { ...options, tiers: [] }
}

export function toggleFaction(options: RatingOptions, faction: FactionId): RatingOptions {
  return { ...options, factions: toggle(options.factions, faction) }
}

/** «Все» сбрасывает выбор фракций. */
export function allFactions(options: RatingOptions): RatingOptions {
  return options.factions.length === 0 ? options : { ...options, factions: [] }
}

/**
 * «Учитывать прирост». Без прироста пропадают столбцы «Прирост» и «Поштучно» —
 * если таблица была отсортирована по ним, сортировка возвращается к индексу.
 */
export function setWeekly(options: RatingOptions, weekly: boolean): RatingOptions {
  if (options.weekly === weekly) return options

  const lost = !weekly && WEEKLY_ONLY.includes(options.sort.key)
  return { ...options, weekly, sort: lost ? DEFAULT_SORT : options.sort }
}

/** Клик по заголовку столбца: новый столбец — в его направлении по умолчанию, тот же — обратно. */
export function sortBy(options: RatingOptions, key: SortKey): RatingOptions {
  const { sort } = options

  if (sort.key === key) {
    return { ...options, sort: { key, dir: sort.dir === 'asc' ? 'desc' : 'asc' } }
  }

  return { ...options, sort: { key, dir: ASCENDING_FIRST.includes(key) ? 'asc' : 'desc' } }
}
