import type { Input } from './types'

/**
 * Константы боевой механики Olden Era.
 * Собраны в одном месте: если разработчики поменяют цифры патчем,
 * правка будет здесь, а не по всему расчёту.
 */
export const RULES = {
  /** база в (20 + ATK) / (20 + DEF) */
  base: 20,
  /** пол слоя бонусов: после всех штрафов остаётся минимум 10% урона */
  minMultiplier: 0.1,
  /** максимальный штраф за дистанцию, % */
  rangePenaltyMax: 50,
  /** насколько слабее отвечает стрелок, которого достали в ближнем бою, % */
  weakCounterPenalty: 50,
  /** при любых модификаторах финальный урон не меньше этого */
  minDamage: 1,
} as const

/**
 * Сравнение армий: сколько ячеек в армии, сколько армий на экране и как
 * читать результат.
 */
export const ARMY_RULES = {
  /** ячеек под отряды в армии — как в игре */
  slots: 7,
  /** армий на экране: последнюю убрать нельзя */
  minArmies: 1,
  /** больше пяти вариантов сразу сравнивать неудобно, особенно на телефоне */
  maxArmies: 5,
  /**
   * Разницу мощности в пределах этой доли считаем ничьей. Оценка грубая,
   * и разница в 1–3% — ещё не победа; берём верхнюю границу: победителя
   * называем, только когда отрыв уверенный. Ровно 3% — ещё ничья.
   */
  tieThreshold: 0.03,
} as const

/**
 * Границы и шаг полей ввода. Раскладываются прямо в поле:
 * `<NumberField {...F.hp} />`. Отдельного слоя валидации нет —
 * поле само не выпустит наружу значение вне границ.
 */
export const F = {
  hp: { min: 1, max: 9999, step: 1 },
  /** верхнюю границу задаёт hp стороны, поэтому здесь только минимум */
  topHp: { min: 1, max: 9999, step: 1 },
  attack: { min: 0, max: 99, step: 1 },
  defense: { min: 0, max: 99, step: 1 },
  damage: { min: 0, max: 9999, step: 1 },
  count: { min: 1, max: 9999, step: 1 },
  hero: { min: 0, max: 99, step: 1 },
  /** шаг 10: в игре штраф набегает по −10% за гекс свыше трёх */
  rangePenalty: { min: 0, max: RULES.rangePenaltyMax, step: 10 },
  outgoing: { min: 0, max: 500, step: 5 },
  incoming: { min: 0, max: 100, step: 5 },
} as const

export const DEFAULT_INPUT: Input = {
  attacker: {
    templateId: 'custom',
    hp: 35,
    topHp: 35,
    attack: 10,
    defense: 12,
    damageMin: 7,
    damageMax: 9,
    count: 10,
    heroAttack: 0,
    heroDefense: 0,
    outgoing: 0,
    incoming: 0,
    counterHalved: false,
  },
  defender: {
    templateId: 'custom',
    hp: 25,
    topHp: 25,
    attack: 8,
    defense: 8,
    damageMin: 3,
    damageMax: 6,
    count: 8,
    heroAttack: 0,
    heroDefense: 0,
    outgoing: 0,
    incoming: 0,
    counterHalved: false,
  },
  ranged: false,
  rangePenalty: 0,
}
