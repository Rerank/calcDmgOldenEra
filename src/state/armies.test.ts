import { describe, expect, test } from 'vitest'
import { summaryTroops } from './armies'
import { emptyArmy, slotsOf, type Army, type Troop } from './armyTransitions'

/**
 * Кого сравнивает «Итог». summaryTroops не смотрит в справочник, поэтому
 * id существ здесь — просто метки, как в armyTransitions.test.ts.
 */

const troop = (creatureId: string, count = 10): Troop => ({ creatureId, count })
const army = (id: string, troops: Array<Troop | null>): Army => ({ id, slots: slotsOf(troops) })

describe('что сравнивает «Итог»', () => {
  test('армия одна — её отряды по порядку ячеек, пустые пропущены', () => {
    // дыра на ПК: средний отряд убрали
    const troops = summaryTroops([army('a', [troop('hoplet', 15), null, troop('naiad', 8)])])

    expect(troops).toEqual([troop('hoplet', 15), troop('naiad', 8)])
  })

  test('отряд один — он и есть, а что сравнивать нечего, решит сравнение', () => {
    // compareArmies для одной строки вернёт вердикт none, и «Итога» не будет
    expect(summaryTroops([army('a', [troop('hoplet')])])).toEqual([troop('hoplet')])
  })

  test('существа только в одной из армий — её отряды, где бы она ни стояла', () => {
    // так бывает сразу после «Добавить армию» или когда первую армию очистили
    const armies = [
      emptyArmy('a'),
      army('b', [troop('minotaur'), troop('infiltrator')]),
      emptyArmy('c'),
    ]

    expect(summaryTroops(armies)).toEqual([troop('minotaur'), troop('infiltrator')])
  })

  test('существа в двух армиях — сравниваются армии', () => {
    const armies = [army('a', [troop('hoplet')]), emptyArmy('b'), army('c', [troop('naiad')])]

    expect(summaryTroops(armies)).toBeNull()
  })

  test('все армии пустые — сравнивать нечего', () => {
    expect(summaryTroops([emptyArmy('a')])).toBeNull()
    expect(summaryTroops([emptyArmy('a'), emptyArmy('b')])).toBeNull()
  })
})
