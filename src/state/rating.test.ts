import { describe, expect, test } from 'vitest'
import { RATED_CREATURES, RATING_FACTIONS, RATING_TIERS, ratingPool } from './rating'

describe('кто в рейтинге', () => {
  test('только существа, которых нанимают в городе: нет нейтралов и Огненной личинки', () => {
    const ids = RATED_CREATURES.map((creature) => creature.id)

    expect(RATED_CREATURES.some((creature) => creature.faction === 'neutral')).toBe(false)
    expect(ids).not.toContain('firelarva')
    // и никого из фракций не потеряли: личинка — единственная без прироста
    expect(ids).toContain('scorpion')
  })

  test('кнопки фильтров: ранги по возрастанию, фракции в порядке справочника, без нейтралов', () => {
    expect(RATING_TIERS).toEqual([1, 2, 3, 4, 5, 6, 7])
    expect(RATING_FACTIONS.map((faction) => faction.id)).toEqual([
      'temple',
      'necropolis',
      'grove',
      'hive',
      'schism',
      'dungeon',
    ])
  })
})

describe('вид существ', () => {
  test('«Все» — весь рейтинг', () => {
    expect(ratingPool('all')).toBe(RATED_CREATURES)
  })

  test('базовые и улучшенные делят рейтинг без остатка и без пересечений', () => {
    const base = ratingPool('base')
    const upgraded = ratingPool('upgraded')

    expect(base.every((creature) => !creature.upgraded)).toBe(true)
    expect(upgraded.every((creature) => creature.upgraded)).toBe(true)
    expect(base.length + upgraded.length).toBe(RATED_CREATURES.length)
  })

  test('мечник — базовый, капитан стражи — его улучшение', () => {
    const ids = (kind: 'base' | 'upgraded') => ratingPool(kind).map((creature) => creature.id)

    expect(ids('base')).toContain('swordsman')
    expect(ids('base')).not.toContain('guardcaptain')
    expect(ids('upgraded')).toContain('guardcaptain')
  })
})
