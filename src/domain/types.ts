/** Параметры одной стороны — ровно то, что нарисовано на экране. */
export interface Side {
  templateId: string
  /** максимальное здоровье одного существа */
  hp: number
  /**
   * Здоровье верхнего существа. В стеке ранено не больше одного — верхнее,
   * остальные либо целы, либо мертвы, поэтому хватает одного числа.
   * У нетронутого стека равно hp.
   */
  topHp: number
  attack: number
  defense: number
  damageMin: number
  damageMax: number
  count: number
  /** атака героя, прибавляется к атаке существа */
  heroAttack: number
  /** защита героя, прибавляется к защите существа */
  heroDefense: number
  /** увел. исх. урона, % */
  outgoing: number
  /** умен. вх. урона, % */
  incoming: number
  /**
   * Существо отвечает вполсилы: так контратакует стрелок, которого достали
   * в ближнем бою. Свойство существа, а не роли, поэтому при обмене сторонами
   * едет вместе с ним. В расчёте учитывается только у защищающегося —
   * атакующий в обмене не контратакует.
   */
  counterHalved: boolean
}

/** Всё, что нужно для расчёта. Он же — слепок закреплённого результата. */
export interface Input {
  attacker: Side
  defender: Side
  /** дистанционная атака: ответного удара не будет, зато возможен штраф */
  ranged: boolean
  /**
   * Штраф за дистанцию в процентах. Задаётся напрямую, а не считается из
   * расстояния: у части существ выстрел штрафа не имеет вовсе, и тогда
   * расстояние до цели ни о чём не говорит. Имеет смысл только при ranged.
   */
  rangePenalty: number
}

/** Одна колонка таблицы результата: мин, макс или сред. */
export interface Outcome {
  damage: number
  killed: number
  survived: number
  /** здоровье верхнего выжившего; знаменатель — hp получающей стороны */
  topHp: number
}

/** Один удар: три колонки + числа, которых нет во входных данных. */
export interface Strike {
  min: Outcome
  max: Outcome
  avg: Outcome
  /** сколько существ наносило удар; у ответного это выжившие, поэтому диапазон */
  countMin: number
  countMax: number
  /** атака бьющего — уже с героем */
  attack: number
  /** защита получающего — уже с героем */
  defense: number
  /** штраф на этот удар, %: дистанция у выстрела, ослабление у контратаки; 0 — штрафа нет */
  penalty: number
}

export interface Result {
  strike: Strike
  /** null — ответного удара нет, карточка не рендерится */
  counter: Strike | null
}

/** Строка в стопке результатов. */
export interface Entry {
  id: string
  /** слепок параметров на момент удара */
  input: Input
  result: Result
}

// ─── Сравнение армий ───

/**
 * Параметры существа, нужные оценке армии. Описаны по форме, а не взяты
 * из справочника: шаблон существа подходит сюда сам, и расчёт по-прежнему
 * ничего не знает о справочнике.
 */
export interface ArmyUnit {
  hp: number
  attack: number
  defense: number
  damageMin: number
  damageMax: number
}

/** Отряд армии: какое существо и сколько их. */
export interface ArmyStack {
  unit: ArmyUnit
  count: number
}

/** Бонусы героя: прибавляются к атаке и защите всех существ его армии. */
export interface ArmyHero {
  attack: number
  defense: number
}

/** Итог одной армии. */
export interface ArmyStats {
  /** сколько существ во всех отрядах; 0 — армия пустая */
  count: number
  /** индекс урона D: сколько урона армия наносит за один залп по цели с нулевой защитой */
  damage: number
  /** индекс живучести H: сколько урона армия выдержит, прежде чем погибнет целиком */
  hardiness: number
  /** индекс мощности √(D × H) */
  power: number
}

/** Место армии в одной колонке сравнения. */
export interface ArmyPlace {
  /** доля от лучшего значения в колонке: 1 — лучшее, 0.5 — вдвое меньше; у пустой армии 0 */
  share: number
  /** лучшее значение в колонке; при равенстве лидеров несколько */
  leader: boolean
}

/** Место армии во всех трёх колонках. */
export type ArmyPlaces = Record<'damage' | 'hardiness' | 'power', ArmyPlace>

/**
 * Кто сильнее по мощности. Армии — номера в исходном списке.
 * none — сравнивать нечего: существа есть меньше чем в двух армиях.
 */
export type ArmyVerdict =
  | { kind: 'none' }
  | { kind: 'leader'; army: number }
  | { kind: 'tie'; armies: number[] }

export interface ArmyComparison {
  /** места армий — в том же порядке, что и армии на входе */
  places: ArmyPlaces[]
  verdict: ArmyVerdict
}
