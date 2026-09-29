import { describe, expect, test } from 'vitest'
import type { RatingEntry } from '../../domain/types'
import type { RatedCreature } from '../../state/rating'
import { DEFAULT_RATING, type RatingOptions } from '../../state/ratingTransitions'
import { ratingGroups } from './ratingRows'

/**
 * Существа и их места заданы прямо здесь: раскладка таблицы не должна
 * зависеть ни от чисел справочника, ни от расчёта.
 */

const creature = (id: string, patch: Partial<RatedCreature> = {}): RatedCreature => ({
  id,
  name: { ru: id, en: id },
  faction: 'temple',
  tier: 1,
  growth: 10,
  hp: 10,
  attack: 5,
  defense: 5,
  damageMin: 2,
  damageMax: 4,
  ...patch,
})

const entry = (value: number, place = 1, soloPlace = place): RatingEntry => ({
  value,
  share: 1,
  place,
  soloPlace,
})

const options = (patch: Partial<RatingOptions> = {}): RatingOptions => ({ ...DEFAULT_RATING, ...patch })

/** id существ по блокам: [ранг, [id…]] */
const layout = (creatures: RatedCreature[], entries: RatingEntry[], patch: Partial<RatingOptions>) =>
  ratingGroups(creatures, entries, options(patch)).map((group) => [
    group.tier,
    group.rows.map((row) => row.creature.id),
  ])

describe('фильтры', () => {
  const creatures = [
    creature('a', { tier: 1, faction: 'temple' }),
    creature('b', { tier: 1, faction: 'grove' }),
    creature('c', { tier: 2, faction: 'grove' }),
    creature('d', { tier: 3, faction: 'temple' }),
  ]
  const entries = [entry(4), entry(3), entry(2), entry(1)]

  test('без выбора видно всё — ранги по возрастанию', () => {
    expect(layout(creatures, entries, {})).toEqual([
      [1, ['a', 'b']],
      [2, ['c']],
      [3, ['d']],
    ])
  })

  test('ранг и фракция только прячут строки; ранг без строк не выводится', () => {
    expect(layout(creatures, entries, { tiers: [1, 2], factions: ['grove'] })).toEqual([
      [1, ['b']],
      [2, ['c']],
    ])
    expect(layout(creatures, entries, { factions: ['temple'] })).toEqual([
      [1, ['a']],
      [3, ['d']],
    ])
  })

  test('места не пересчитываются: строка несёт то место, что ей дал расчёт', () => {
    const [group] = ratingGroups([creature('x')], [entry(7, 5)], options())

    expect(group.rows[0].entry.place).toBe(5)
  })
})

describe('сортировка внутри ранга', () => {
  test('по умолчанию — по индексу ▼, равные — в порядке справочника', () => {
    const creatures = [creature('x'), creature('y'), creature('z')]

    expect(layout(creatures, [entry(3), entry(5), entry(5)], {})).toEqual([[1, ['y', 'z', 'x']]])
  })

  test('по имени — по алфавиту, повторный клик — в обратном порядке', () => {
    const creatures = [
      creature('griffin', { name: { ru: 'Грифон', en: 'Griffin' } }),
      creature('angel', { name: { ru: 'Ангел', en: 'Angel' } }),
      creature('bull', { name: { ru: 'Бык', en: 'Bull' } }),
    ]
    const entries = [entry(1), entry(2), entry(3)]

    expect(layout(creatures, entries, { sort: { key: 'name', dir: 'asc' } })).toEqual([
      [1, ['angel', 'bull', 'griffin']],
    ])
    expect(layout(creatures, entries, { sort: { key: 'name', dir: 'desc' } })).toEqual([
      [1, ['griffin', 'bull', 'angel']],
    ])
  })

  test('фракция — по алфавиту названий, а не по порядку справочника', () => {
    const creatures = [
      creature('t', { faction: 'temple' }),
      creature('g', { faction: 'grove' }),
      creature('n', { faction: 'necropolis' }),
    ]

    // Некрополь, Роща, Храм
    expect(
      layout(creatures, [entry(1), entry(2), entry(3)], { sort: { key: 'faction', dir: 'asc' } }),
    ).toEqual([[1, ['n', 'g', 't']]])
  })

  test('равные в столбце — по индексу ▼', () => {
    const creatures = [
      creature('a', { attack: 6 }),
      creature('b', { attack: 6 }),
      creature('c', { attack: 7 }),
    ]

    expect(
      layout(creatures, [entry(1), entry(9), entry(2)], { sort: { key: 'attack', dir: 'desc' } }),
    ).toEqual([[1, ['c', 'b', 'a']]])
  })

  test('урон — по среднему: 1–9 и 5–5 равны, 4–5 меньше', () => {
    const creatures = [
      creature('wide', { damageMin: 1, damageMax: 9 }),
      creature('mid', { damageMin: 4, damageMax: 5 }),
      creature('flat', { damageMin: 5, damageMax: 5 }),
    ]

    // wide и flat — средний урон 5, между ними решает индекс: у flat он больше
    expect(
      layout(creatures, [entry(1), entry(3), entry(2)], { sort: { key: 'damage', dir: 'desc' } }),
    ).toEqual([[1, ['flat', 'wide', 'mid']]])
  })

  test('место поштучно — по возрастанию, первое наверху', () => {
    const creatures = [creature('a'), creature('b'), creature('c')]
    const entries = [entry(3, 1, 3), entry(2, 2, 1), entry(1, 3, 2)]

    expect(layout(creatures, entries, { sort: { key: 'solo', dir: 'asc' } })).toEqual([
      [1, ['b', 'c', 'a']],
    ])
  })
})
