import { ARMY_RULES, RULES } from './rules'
import type {
  ArmyComparison,
  ArmyHero,
  ArmyPlace,
  ArmyPlaces,
  ArmyStack,
  ArmyStats,
  ArmyVerdict,
} from './types'

/**
 * Оценка армии — раздел 5 «Рейтинга существ Olden Era». Чистые функции,
 * как и расчёт урона: на вход числа, на выход числа.
 *
 * Армия сводится к двум индексам. Индекс урона — сколько она наносит за один
 * залп по цели с нулевой защитой, индекс живучести — сколько урона от удара
 * с нулевой атакой она выдержит. Настоящие защита цели и атака врага одинаковы
 * для всех сравниваемых армий и при сравнении сокращаются — знать их не нужно.
 */

const NO_HERO: ArmyHero = { attack: 0, defense: 0 }

/**
 * Допуск при сравнении долей. Суммы по разным отрядам складываются в разном
 * порядке и расходятся в последних знаках double: 0.1 + 0.2 — это
 * 0.30000000000000004, а 1 − 0.97 — 0.030000000000000027. Без допуска один
 * из равных лидеров потерял бы звание, а отставание ровно в 3% не считалось
 * бы ничьей.
 */
const EPSILON = 1e-9

export function armyStats(stacks: ArmyStack[], hero: ArmyHero = NO_HERO): ArmyStats {
  let count = 0
  let damage = 0
  let hardiness = 0

  for (const { unit, count: n } of stacks) {
    const avgDamage = (unit.damageMin + unit.damageMax) / 2
    count += n
    // бонус героя прибавляется к атаке и защите каждого существа армии
    damage += (n * avgDamage * (RULES.base + unit.attack + hero.attack)) / RULES.base
    hardiness += (n * unit.hp * (RULES.base + unit.defense + hero.defense)) / RULES.base
  }

  // Произведение, а не сумма: армия А уничтожит армию Б за H(Б) / D(А) ходов,
  // Б уничтожит А за H(А) / D(Б) — побеждает та, у кого D × H больше. Армия
  // с огромной живучестью, но без урона, никого не победит, а сумма оценила бы
  // её высоко. Корень возвращает масштаб: вдвое больше тех же существ — вдвое
  // больше мощности, поэтому проценты разницы читаются естественно.
  return { count, damage, hardiness, power: Math.sqrt(damage * hardiness) }
}

/** Место в колонке. Пустая армия ни с кем не соревнуется — в таблице у неё прочерк. */
function placeOf(value: number, best: number, filled: boolean): ArmyPlace {
  if (!filled || best <= 0) return { share: 0, leader: false }

  const share = value / best
  return { share, leader: share >= 1 - EPSILON }
}

/**
 * Сравнение армий: в каждой колонке — доля от лучшего значения, по мощности —
 * вердикт. Колонки независимы: лучшая по урону армия не обязана быть лучшей
 * по мощности.
 */
export function compareArmies(armies: ArmyStats[]): ArmyComparison {
  const filled = armies.filter((army) => army.count > 0)
  const best = (metric: keyof ArmyPlaces) => Math.max(0, ...filled.map((army) => army[metric]))
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
