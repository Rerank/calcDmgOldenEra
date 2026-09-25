import { useState } from 'react'
import { findTemplate } from '../data/creatures'
import { armyStats, compareArmies } from '../domain/army'
import type { ArmyStack } from '../domain/types'
import * as transitions from './armyTransitions'
import type { Army } from './armyTransitions'

/**
 * Состояние экрана армий. Как и у калькулятора, это useState за фасадом
 * хука, а правила правок — чистые функции в armyTransitions.ts.
 *
 * Кнопки «Посчитать» нет: индексы выводятся из армий при каждой отрисовке.
 * Это семь отрядов на армию и три умножения на отряд — кешировать нечего.
 */
export function useArmies() {
  const [armies, setArmies] = useState<Army[]>(transitions.DEFAULT_ARMIES)
  const stats = armies.map((army) => armyStats(stacksOf(army)))

  return {
    armies,
    /** итоги армий — в том же порядке, что и армии */
    stats,
    /** места армий в колонках и вердикт для «Итога» */
    comparison: compareArmies(stats),

    addArmy: () => setArmies((current) => transitions.addArmy(current, crypto.randomUUID())),

    removeArmy: (armyId: string) =>
      setArmies((current) => transitions.removeArmy(current, armyId)),

    addTroop: (armyId: string, slot: number, creatureId: string, narrow: boolean) =>
      setArmies((current) => transitions.addTroop(current, armyId, slot, creatureId, narrow)),

    removeTroop: (armyId: string, slot: number, narrow: boolean) =>
      setArmies((current) => transitions.removeTroop(current, armyId, slot, narrow)),

    setCount: (armyId: string, slot: number, count: number) =>
      setArmies((current) => transitions.setCount(current, armyId, slot, count)),
  }
}

/**
 * Отряды армии для расчёта. Числа существа берутся из справочника здесь,
 * в момент расчёта: в состоянии лежит только id. Шаблон справочника
 * подходит расчёту по форме, переделывать его не нужно.
 */
function stacksOf(army: Army): ArmyStack[] {
  return army.slots.flatMap((troop) => {
    const unit = troop && findTemplate(troop.creatureId)
    return troop && unit ? [{ unit, count: troop.count }] : []
  })
}
