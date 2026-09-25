import { describe, expect, test } from 'vitest'
import { findTemplate } from '../data/creatures'
import { ARMY_RULES } from '../domain/rules'
import {
  addArmy,
  addTroop,
  DEFAULT_ARMIES,
  emptyArmy,
  landingSlot,
  removeArmy,
  removeTroop,
  setCount,
  slotsOf,
  type Army,
  type Troop,
} from './armyTransitions'

/**
 * Переходы не смотрят в справочник, поэтому id существ здесь — просто
 * метки, а числа справочника тестов не касаются. Исключение — последний
 * блок: стартовые армии должны ссылаться на настоящих существ.
 */

const troop = (creatureId: string, count = 10): Troop => ({ creatureId, count })
const army = (id: string, troops: Array<Troop | null>): Army => ({ id, slots: slotsOf(troops) })

/** id существ в ячейках армии: null — пустая ячейка */
const ids = (armies: Army[], index: number) =>
  armies[index].slots.map((slot) => slot?.creatureId ?? null)

describe('армии', () => {
  test('новая армия — пустая, из семи ячеек, в конце списка', () => {
    const armies = addArmy([army('a', [troop('griffin')])], 'b')

    expect(armies.map((a) => a.id)).toEqual(['a', 'b'])
    expect(armies[1].slots).toEqual(Array(ARMY_RULES.slots).fill(null))
  })

  test('сверх предела армия не добавляется', () => {
    const full = Array.from({ length: ARMY_RULES.maxArmies }, (_, i) => emptyArmy(`a${i}`))

    expect(addArmy(full, 'extra')).toBe(full)
  })

  test('армию убирают из середины, последнюю убрать нельзя', () => {
    const armies = [emptyArmy('a'), emptyArmy('b'), emptyArmy('c')]
    expect(removeArmy(armies, 'b').map((a) => a.id)).toEqual(['a', 'c'])

    const single = [emptyArmy('a')]
    expect(removeArmy(single, 'a')).toBe(single)
    expect(removeArmy(armies, 'unknown')).toBe(armies)
  })
})

describe('отряды на ПК: ячейки на своих местах, как в игре', () => {
  test('новый отряд встаёт в ту ячейку, по которой кликнули, — одно существо', () => {
    const armies = addTroop([emptyArmy('a')], 'a', 4, 'griffin', false)

    expect(ids(armies, 0)).toEqual([null, null, null, null, 'griffin', null, null])
    expect(armies[0].slots[4]).toEqual({ creatureId: 'griffin', count: 1 })
  })

  test('удалённый отряд оставляет дыру', () => {
    const armies = removeTroop([army('a', [troop('a1'), troop('a2'), troop('a3')])], 'a', 1, false)

    expect(ids(armies, 0)).toEqual(['a1', null, 'a3', null, null, null, null])
  })

  test('в занятую ячейку отряд не ставится', () => {
    const armies = [army('a', [troop('griffin')])]

    expect(addTroop(armies, 'a', 0, 'swordsman', false)).toBe(armies)
  })
})

describe('отряды на узком экране: армия всегда сжата', () => {
  test('новый отряд встаёт в конец, какой бы «+» ни нажали', () => {
    const armies = addTroop([army('a', [troop('a1')])], 'a', 6, 'griffin', true)

    expect(ids(armies, 0)).toEqual(['a1', 'griffin', null, null, null, null, null])
  })

  test('удаление сдвигает остальных вверх', () => {
    const armies = removeTroop([army('a', [troop('a1'), troop('a2'), troop('a3')])], 'a', 0, true)

    expect(ids(armies, 0)).toEqual(['a2', 'a3', null, null, null, null, null])
  })

  test('дыры, оставшиеся с ПК, убирает первое же добавление', () => {
    const armies = addTroop([army('a', [troop('a1'), null, troop('a3')])], 'a', 1, 'griffin', true)

    expect(ids(armies, 0)).toEqual(['a1', 'a3', 'griffin', null, null, null, null])
  })
})

describe('куда встанет новый отряд — по этому номеру ставится фокус', () => {
  const withHole = army('a', [troop('a1'), null, troop('a3')])

  test('на ПК — кликнутая ячейка, если она пуста', () => {
    expect(landingSlot(withHole, 1, false)).toBe(1)
    expect(landingSlot(withHole, 0, false)).toBe(-1)
    expect(landingSlot(withHole, ARMY_RULES.slots, false)).toBe(-1)
  })

  test('на узком экране — сразу за последним отрядом сжатой армии', () => {
    expect(landingSlot(withHole, 6, true)).toBe(2)
  })
})

describe('полная армия и то, что ничего не меняет', () => {
  const full = () => [army('a', Array.from({ length: ARMY_RULES.slots }, (_, i) => troop(`t${i}`)))]

  test('в полную армию не добавить ни на ПК, ни на узком экране', () => {
    const armies = full()

    expect(addTroop(armies, 'a', 3, 'griffin', false)).toBe(armies)
    expect(addTroop(armies, 'a', 3, 'griffin', true)).toBe(armies)
  })

  test('убрать пустую ячейку, задать то же количество — тот же массив', () => {
    const armies = [army('a', [troop('griffin', 14)])]

    expect(removeTroop(armies, 'a', 5, false)).toBe(armies)
    expect(setCount(armies, 'a', 0, 14)).toBe(armies)
    expect(setCount(armies, 'a', 5, 3)).toBe(armies)
  })

  test('правка одной армии не трогает остальные', () => {
    const armies = [army('a', [troop('griffin', 14)]), army('b', [troop('skeleton', 80)])]
    const next = setCount(armies, 'a', 0, 20)

    expect(next[0].slots[0]).toEqual({ creatureId: 'griffin', count: 20 })
    expect(next[1]).toBe(armies[1])
  })
})

describe('стартовые армии', () => {
  test('в пределах лимитов, по семь ячеек, только существа из справочника', () => {
    expect(DEFAULT_ARMIES.length).toBeGreaterThanOrEqual(ARMY_RULES.minArmies)
    expect(DEFAULT_ARMIES.length).toBeLessThanOrEqual(ARMY_RULES.maxArmies)

    for (const start of DEFAULT_ARMIES) {
      expect(start.slots).toHaveLength(ARMY_RULES.slots)
    }

    const unknown = DEFAULT_ARMIES.flatMap((a) => a.slots)
      .filter((slot) => slot !== null && !findTemplate(slot.creatureId))
      .map((slot) => slot?.creatureId)

    expect(unknown).toEqual([])
  })
})
