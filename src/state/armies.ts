import { useState } from 'react'
import { findTemplate } from '../data/creatures'
import { armyStats, compareArmies } from '../domain/army'
import type { ArmyStack } from '../domain/types'
import * as transitions from './armyTransitions'
import type { Army, Troop } from './armyTransitions'

/**
 * Состояние экрана армий. Как и у калькулятора, это useState за фасадом
 * хука, а правила правок — чистые функции в armyTransitions.ts.
 *
 * Кнопки «Посчитать» нет: индексы выводятся из армий при каждой отрисовке.
 * Это семь отрядов на армию и три умножения на отряд — кешировать нечего.
 */
export function useArmies() {
  const [armies, setArmies] = useState<Army[]>(transitions.DEFAULT_ARMIES)
  const stats = armies.map((army) => armyStats(stacksOf(army.slots)))

  // Строки «Итога»: армии или отряды единственной заполненной армии. Отряд
  // сравнивается как армия из одного отряда — доли, лидеры и вердикт считает
  // та же compareArmies, и номера «армий» в вердикте — это номера отрядов.
  const troops = summaryTroops(armies)
  const rows = troops ? troops.map((troop) => armyStats(stacksOf([troop]))) : stats

  return {
    armies,
    /** итоги армий — в том же порядке, что и армии */
    stats,
    /**
     * «Итог»: кого сравнивает — отряды единственной заполненной армии
     * или армии (troops: null), — итоги строк, места в колонках и вердикт
     */
    summary: { troops, stats: rows, comparison: compareArmies(rows) },

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

/** Отряды армии по порядку ячеек, без пустых. */
const troopsOf = (army: Army) => army.slots.filter((troop) => troop !== null)

/**
 * Чьи отряды сравнивает «Итог». Если существа есть только в одной армии,
 * сравнивать её не с кем — и «Итог» сравнивает её отряды. Так и при одной
 * армии на экране, и при нескольких, пока остальные пустые: например,
 * сразу после «Добавить армию».
 *
 * null — существа есть в нескольких армиях или нигде: «Итог» сравнивает
 * армии, а при пустых сравнивать нечего вовсе.
 */
export function summaryTroops(armies: Army[]): Troop[] | null {
  const filled = armies.filter((army) => troopsOf(army).length > 0)
  return filled.length === 1 ? troopsOf(filled[0]) : null
}

/**
 * Отряды для расчёта. Числа существа берутся из справочника здесь,
 * в момент расчёта: в состоянии лежит только id. Шаблон справочника
 * подходит расчёту по форме, переделывать его не нужно.
 */
function stacksOf(slots: Array<Troop | null>): ArmyStack[] {
  return slots.flatMap((troop) => {
    const unit = troop && findTemplate(troop.creatureId)
    return troop && unit ? [{ unit, count: troop.count }] : []
  })
}
