import { EPSILON, indicesOf, nearlyEqual, shareOf } from './indices'
import { ARMY_RULES } from './rules'
import type {
  ArmyComparison,
  ArmyHero,
  ArmyPlace,
  ArmyPlaces,
  ArmyStack,
  ArmyStats,
  ArmyVerdict,
  Metric,
} from './types'

/**
 * Сравнение армий: итог каждой армии, места в колонках и вердикт.
 * Индексы считает indices.ts — та же математика, что у рейтинга существ.
 */

/** Итог армии: индексы и численность — по ней видно, что армия пустая. */
export function armyStats(stacks: ArmyStack[], hero?: ArmyHero): ArmyStats {
  const count = stacks.reduce((sum, stack) => sum + stack.count, 0)
  return { count, ...indicesOf(stacks, hero) }
}

/** Место в колонке. Пустая армия ни с кем не соревнуется — в таблице у неё прочерк. */
function placeOf(value: number, best: number, filled: boolean): ArmyPlace {
  if (!filled || best <= 0) return { share: 0, leader: false }
  return { share: shareOf(value, best), leader: nearlyEqual(value, best) }
}

/**
 * Сравнение армий: в каждой колонке — доля от лучшего значения, по мощности —
 * вердикт. Колонки независимы: лучшая по урону армия не обязана быть лучшей
 * по мощности.
 */
export function compareArmies(armies: ArmyStats[]): ArmyComparison {
  const filled = armies.filter((army) => army.count > 0)
  const best = (metric: Metric) => Math.max(0, ...filled.map((army) => army[metric]))
  const top = { damage: best('damage'), hardiness: best('hardiness'), power: best('power') }

  const places = armies.map((army) => {
    const isFilled = army.count > 0
    return {
      damage: placeOf(army.damage, top.damage, isFilled),
      hardiness: placeOf(army.hardiness, top.hardiness, isFilled),
      power: placeOf(army.power, top.power, isFilled),
    }
  })

  return { places, verdict: verdictOf(places, filled.length) }
}

/**
 * Вердикт — по мощности. Все, кто отстаёт от сильнейшей не больше чем на порог,
 * стоят с ней вровень: если таких армий несколько, это ничья.
 */
function verdictOf(places: ArmyPlaces[], filledCount: number): ArmyVerdict {
  const close = places.flatMap(({ power }, i) =>
    power.share > 0 && 1 - power.share <= ARMY_RULES.tieThreshold + EPSILON ? [i] : [],
  )

  // Сравнивать нечего, если существа есть меньше чем в двух армиях.
  // Пустой close — это армии без единой единицы урона или здоровья:
  // со справочником так не бывает, но и назвать лидера тут некого.
  if (filledCount < 2 || close.length === 0) return { kind: 'none' }

  return close.length > 1 ? { kind: 'tie', armies: close } : { kind: 'leader', army: close[0] }
}
