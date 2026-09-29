import { describe, expect, test } from 'vitest'
import { RATED_CREATURES, RATING_FACTIONS, RATING_TIERS } from './rating'

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
