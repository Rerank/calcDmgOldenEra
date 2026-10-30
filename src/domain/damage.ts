import { RULES } from './rules'
import type { Input, Outcome, Result, Side, Strike } from './types'

/**
 * Расчёт урона. Чистые функции: ни React, ни строк интерфейса здесь нет,
 * наружу уходят только числа. Текст расшифровки собирается в слое UI.
 */

/**
 * Прибавка к множителю от разницы атаки и защиты, в долях единицы.
 * Первое очко разницы даёт 4%, каждое следующее — на 0,04% меньше,
 * а после 100 очков прибавка кончается. Это сумма арифметической
 * прогрессии: n × (2 × 4% − (n − 1) × 0,04%) / 2. Сотня очков — 202%.
 */
function deltaBonus(points: number): number {
  const n = Math.min(points, RULES.deltaCap)
  return (n * (2 * RULES.deltaFirstPoint - (n - 1) * RULES.deltaStep)) / 2 / 100
}

/**
 * Множитель атаки/защиты — с патча 0.82.06 он зависит только от разницы
 * Δ = ATK − DEF, а не от самих значений. Атака выше — урон умножается
 * на 1 + прибавка, защита выше — делится на ту же величину. Поэтому
 * одинаковый бонус обоих героев на урон не влияет. Множитель — от ×0,33
 * до ×3,02.
 *
 * Тем же множителем считают индексы армий и рейтинга: формула в проекте одна.
 */
export function attackDefenseMultiplier(attack: number, defense: number): number {
  const delta = attack - defense
  return delta >= 0 ? 1 + deltaBonus(delta) : 1 / (1 + deltaBonus(-delta))
}

/**
 * Слой процентных бонусов. Проценты внутри слоя складываются, а не
 * перемножаются: «увеличил исходящий на 25%» против «уменьшил входящий
 * на 25%» дают ×1.0, а не ×0.94. После всех штрафов остаётся минимум 10%.
 */
function bonusMultiplier(outgoing: number, incoming: number): number {
  return Math.max(RULES.minMultiplier, 1 + (outgoing - incoming) / 100)
}

/**
 * Поправка на ошибку представления. Цепочка множителей считается в double,
 * поэтому значение, которое математически ровно попадает на половину,
 * может оказаться чуть ниже неё — и округлиться не в ту сторону.
 * Величина заведомо больше погрешности double на наших числах
 * и заведомо меньше единицы урона.
 */
const EPSILON = 1e-6

/**
 * Урон одной ветки. Округление — к ближайшему и ровно один раз, в самом конце:
 * округления на промежуточных шагах накапливали бы ошибку.
 *
 * Правило округления в гайде не описано, выведено сверкой с игрой ещё
 * до патча 0.82.06: 4 × 5–9 против защиты 5 по старой формуле — это 23.2
 * и 41.76, а игра показывала 23 и 42.
 *
 * Минимум в 1 единицу — правило игры, но только если бить есть чем.
 */
function damageOf(count: number, perCreature: number, multiplier: number): number {
  const raw = count * perCreature * multiplier
  if (raw <= 0) return 0
  return Math.max(RULES.minDamage, Math.round(raw + EPSILON))
}

/**
 * Раскладывает урон по стеку: кто погиб, кто уцелел и с каким здоровьем верхний.
 * Урон сначала добивает верхнее существо — оно могло прийти в бой уже раненым, —
 * и только потом принимается за целые.
 */
function applyToStack(damage: number, hp: number, count: number, topHp: number): Outcome {
  if (damage >= topHp + (count - 1) * hp) {
    return { damage, killed: count, survived: 0, topHp: 0 }
  }

  if (damage < topHp) {
    return { damage, killed: 0, survived: count, topHp: topHp - damage }
  }

  // верхнее добито, остаток снимаем с целых
  const rest = damage - topHp
  const killed = 1 + Math.floor(rest / hp)
  const tail = rest % hp

  return {
    damage,
    killed,
    survived: count - killed,
    // без остатка следующее существо невредимо
    topHp: tail === 0 ? hp : hp - tail,
  }
}

/**
 * Один удар по стороне-получателю.
 * `counts` — сколько существ бьёт в каждой ветке. У обычного удара это одно
 * и то же число, у ответного — выжившие, а их количество зависит от того,
 * насколько сильным вышел первый удар.
 */
function buildStrike(
  striker: Side,
  receiver: Side,
  counts: { min: number; max: number; avg: number },
  penaltyPercent: number,
): Strike {
  const attack = striker.attack + striker.heroAttack
  const defense = receiver.defense + receiver.heroDefense

  const multiplier =
    attackDefenseMultiplier(attack, defense) *
    bonusMultiplier(striker.outgoing, receiver.incoming) *
    (1 - penaltyPercent / 100)

  const branch = (count: number, perCreature: number) =>
    applyToStack(
      damageOf(count, perCreature, multiplier),
      receiver.hp,
      receiver.count,
      receiver.topHp,
    )

  return {
    min: branch(counts.min, striker.damageMin),
    max: branch(counts.max, striker.damageMax),
    avg: branch(counts.avg, (striker.damageMin + striker.damageMax) / 2),
    countMin: Math.min(counts.min, counts.max),
    countMax: Math.max(counts.min, counts.max),
    attack,
    defense,
    penalty: penaltyPercent,
  }
}

export function calculate(input: Input): Result {
  const { attacker, defender, ranged, rangePenalty } = input

  const count = attacker.count
  const strike = buildStrike(
    attacker,
    defender,
    { min: count, max: count, avg: count },
    // в ближнем бою штрафа нет, каким бы ни осталось значение в поле
    ranged ? Math.min(rangePenalty, RULES.rangePenaltyMax) : 0,
  )

  // Отвечают выжившие, поэтому ветки перекрёстные: самый слабый удар
  // оставляет больше всего живых, а значит грозит самым сильным ответом.
  const survivors = {
    min: strike.max.survived,
    max: strike.min.survived,
    avg: strike.avg.survived,
  }

  // Выстрел ответа не провоцирует; мёртвые не отвечают
  const counter =
    ranged || survivors.max === 0
      ? null
      : buildStrike(
          defender,
          attacker,
          survivors,
          // стрелок, которого достали в ближнем бою, отвечает вполсилы
          defender.counterHalved ? RULES.weakCounterPenalty : 0,
        )

  return { strike, counter }
}
