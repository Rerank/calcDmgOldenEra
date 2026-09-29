import { describe, expect, test } from 'vitest'
import {
  allFactions,
  allTiers,
  DEFAULT_RATING,
  setKind,
  setMetric,
  setWeekly,
  sortBy,
  toggleFaction,
  toggleTier,
  type RatingOptions,
} from './ratingTransitions'

const options = (patch: Partial<RatingOptions> = {}): RatingOptions => ({ ...DEFAULT_RATING, ...patch })

describe('категория', () => {
  test('по умолчанию — урон поштучно, все существа, ранги и фракции, по индексу ▼', () => {
    expect(DEFAULT_RATING).toEqual({
      metric: 'damage',
      kind: 'all',
      tiers: [],
      factions: [],
      weekly: false,
      sort: { key: 'value', dir: 'desc' },
    })
  })

  test('другая категория меняется, та же — тот же объект', () => {
    const start = options()

    expect(setMetric(start, 'power').metric).toBe('power')
    expect(setMetric(start, 'damage')).toBe(start)
  })
})

describe('вид существ: выбор ровно один', () => {
  test('выбранный вид меняется, повторный выбор — тот же объект', () => {
    const start = options()

    expect(setKind(start, 'base').kind).toBe('base')
    expect(setKind(setKind(start, 'base'), 'upgraded').kind).toBe('upgraded')
    expect(setKind(start, 'all')).toBe(start)
  })

  test('вид не трогает ни фильтров, ни сортировки', () => {
    const start = options({ tiers: [2], factions: ['hive'], sort: { key: 'name', dir: 'asc' } })
    const next = setKind(start, 'upgraded')

    expect(next.tiers).toBe(start.tiers)
    expect(next.factions).toBe(start.factions)
    expect(next.sort).toBe(start.sort)
  })
})

describe('ранги и фракции: пустой выбор — «Все»', () => {
  test('клик включает ранг, можно несколько, повторный клик выключает', () => {
    const one = toggleTier(options(), 3)
    const two = toggleTier(one, 1)

    expect(one.tiers).toEqual([3])
    expect(two.tiers).toEqual([3, 1])
    expect(toggleTier(two, 3).tiers).toEqual([1])
  })

  test('снятый последним ранг — снова «Все»', () => {
    expect(toggleTier(options({ tiers: [5] }), 5).tiers).toEqual([])
  })

  test('«Все» сбрасывает выбор; если выбора нет — тот же объект', () => {
    const start = options()

    expect(allTiers(options({ tiers: [1, 2] })).tiers).toEqual([])
    expect(allTiers(start)).toBe(start)
  })

  test('фракции — по тем же правилам', () => {
    const two = toggleFaction(toggleFaction(options(), 'grove'), 'hive')
    const start = options()

    expect(two.factions).toEqual(['grove', 'hive'])
    expect(toggleFaction(two, 'grove').factions).toEqual(['hive'])
    expect(allFactions(two).factions).toEqual([])
    expect(allFactions(start)).toBe(start)
  })
})

describe('сортировка', () => {
  test('числовой столбец — сначала по убыванию, место и названия — по возрастанию', () => {
    expect(sortBy(options(), 'attack').sort).toEqual({ key: 'attack', dir: 'desc' })
    expect(sortBy(options(), 'share').sort).toEqual({ key: 'share', dir: 'desc' })
    expect(sortBy(options(), 'place').sort).toEqual({ key: 'place', dir: 'asc' })
    expect(sortBy(options(), 'name').sort).toEqual({ key: 'name', dir: 'asc' })
    expect(sortBy(options(), 'faction').sort).toEqual({ key: 'faction', dir: 'asc' })
    expect(sortBy(options({ weekly: true }), 'solo').sort).toEqual({ key: 'solo', dir: 'asc' })
  })

  test('повторный клик по тому же столбцу меняет направление', () => {
    const once = sortBy(options(), 'name')

    expect(sortBy(once, 'name').sort).toEqual({ key: 'name', dir: 'desc' })
    expect(sortBy(options(), 'value').sort).toEqual({ key: 'value', dir: 'asc' })
  })
})

describe('прирост', () => {
  test('включается и выключается; то же значение — тот же объект', () => {
    const start = options()

    expect(setWeekly(start, true).weekly).toBe(true)
    expect(setWeekly(start, false)).toBe(start)
  })

  test('без прироста его столбцов нет — сортировка по ним возвращается к индексу', () => {
    const byGrowth = options({ weekly: true, sort: { key: 'growth', dir: 'asc' } })
    const bySolo = options({ weekly: true, sort: { key: 'solo', dir: 'desc' } })

    expect(setWeekly(byGrowth, false).sort).toEqual({ key: 'value', dir: 'desc' })
    expect(setWeekly(bySolo, false).sort).toEqual({ key: 'value', dir: 'desc' })
  })

  test('сортировка по другим столбцам переживает выключение прироста', () => {
    const byName = options({ weekly: true, sort: { key: 'name', dir: 'desc' } })

    expect(setWeekly(byName, false).sort).toEqual({ key: 'name', dir: 'desc' })
  })
})
