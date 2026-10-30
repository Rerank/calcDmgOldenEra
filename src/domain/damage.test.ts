import { describe, expect, test } from 'vitest'
import { calculate } from './damage'
import type { Input, Side } from './types'

/**
 * Ожидания в тестах посчитаны вручную и записаны числом — формула здесь
 * намеренно не повторяется, иначе тест проверял бы сам себя.
 * Цель — зафиксировать края, которых не видно глазами в браузере.
 */

const side = (over: Partial<Side> = {}): Side => {
  const merged: Side = {
    templateId: 'custom',
    hp: 10,
    topHp: 10,
    attack: 0,
    defense: 0,
    damageMin: 1,
    damageMax: 1,
    count: 1,
    heroAttack: 0,
    heroDefense: 0,
    outgoing: 0,
    incoming: 0,
    counterHalved: false,
    ...over,
  }

  // по умолчанию стек цел: текущее здоровье равно максимальному
  return over.topHp === undefined ? { ...merged, topHp: merged.hp } : merged
}

const input = (
  attacker: Partial<Side>,
  defender: Partial<Side>,
  extra: Partial<Input> = {},
): Input => ({
  attacker: side(attacker),
  defender: side(defender),
  ranged: false,
  rangePenalty: 0,
  ...extra,
})

describe('удар по защищающемуся', () => {
  test('базовая формула, округление к ближайшему и точное деление на здоровье', () => {
    // Разница 13 − 8 = 5 очков: 4 + 3,96 + 3,92 + 3,88 + 3,84 = 19,6%, множитель 1,196.
    // 10 шт × 7–9 урона × 1,196 = 83,72 / 107,64 / 95,68
    const { strike } = calculate(
      input({ count: 10, damageMin: 7, damageMax: 9, attack: 13 }, { defense: 8, hp: 28, count: 8 }),
    )

    expect(strike.min.damage).toBe(84)
    expect(strike.max.damage).toBe(108)
    expect(strike.avg.damage).toBe(96)

    // 84 делится на 28 нацело: трое погибли, верхний выживший невредим
    expect(strike.min).toMatchObject({ killed: 3, survived: 5, topHp: 28 })
    expect(strike.max).toMatchObject({ killed: 3, survived: 5, topHp: 4 })
  })

  test('атака и защита героя прибавляются к параметрам существа', () => {
    const { strike } = calculate(
      input({ attack: 10, heroAttack: 4 }, { defense: 8, heroDefense: 5, hp: 100 }),
    )

    expect(strike.attack).toBe(14)
    expect(strike.defense).toBe(13)
  })

  test('проценты внутри слоя складываются, а не перемножаются', () => {
    // +25% исходящего против −25% входящего гасят друг друга: ×1.0.
    // Если бы множители перемножались (1.25 × 0.75), вышло бы 93.
    const { strike } = calculate(
      input(
        { count: 10, damageMin: 10, damageMax: 10, outgoing: 25 },
        { incoming: 25, hp: 1000 },
      ),
    )

    expect(strike.min.damage).toBe(100)
  })

  test('после всех штрафов остаётся минимум 10% урона', () => {
    // 10 шт × 7 урона = 70, «умен. вх. 100%» срезает не до нуля, а до 10%
    const { strike } = calculate(
      input({ count: 10, damageMin: 7, damageMax: 7 }, { incoming: 100, hp: 1000 }),
    )

    expect(strike.min.damage).toBe(7)
  })

  test('финальный урон не меньше единицы при любой защите', () => {
    const { strike } = calculate(input({}, { defense: 99, heroDefense: 99, hp: 100 }))

    expect(strike.min.damage).toBe(1)
  })

  test('погрешность дробных чисел не уводит ровную половину вниз', () => {
    // 5 шт × 4 урона × 75% × 70% — это ровно 10.5, но в double 10.499999999999998.
    // Без EPSILON в damageOf округление дало бы 10: тест охраняет именно эту поправку
    // и упадёт, если её убрать.
    //
    // Опасная граница зависит от способа округления. При округлении вниз ею были ровные
    // целые (60 → 59.999… → 59), при округлении к ближайшему — ровные половины.
    //
    // Ожидание 11 заодно фиксирует предположение, что половина округляется вверх:
    // с игрой это пока не сверено.
    const { strike } = calculate(
      input(
        { count: 5, damageMin: 4, damageMax: 4 },
        { incoming: 25, hp: 1000 },
        { ranged: true, rangePenalty: 30 },
      ),
    )

    expect(strike.min.damage).toBe(11)
    expect(strike.penalty).toBe(30)
  })

  test('округление к ближайшему: 4 шт × 5–9 урона против защиты 5', () => {
    // Разница 9 − 5 = 4 очка: множитель 1,1576, урон 23,15 и 41,67 — это 23 и 42.
    // При округлении вниз вышло бы 41. До патча 0.82.06 тот же удар сверили
    // с игрой: по старой формуле 23,2 и 41,76, игра показала 23 и 42. По новой
    // формуле с игрой ещё не сверено.
    const { strike } = calculate(
      input(
        { count: 4, damageMin: 5, damageMax: 9, attack: 9, defense: 7, hp: 30 },
        { count: 16, damageMin: 3, damageMax: 3, attack: 5, defense: 5, hp: 10 },
      ),
    )

    expect(strike.min.damage).toBe(23)
    expect(strike.max.damage).toBe(42)
  })
})

describe('множитель от разницы атаки и защиты', () => {
  // 10 шт × 10 урона без модификаторов = 100, урон умножается только на множитель
  const hit = (attacker: Partial<Side>, defender: Partial<Side>) =>
    calculate(input({ count: 10, damageMin: 10, damageMax: 10, ...attacker }, { hp: 1000, ...defender }))
      .strike.min.damage

  test('пример разработчиков: 1000 троглодитов бьют чревеней', () => {
    // Атака 2 против защиты 20, разница 18: 4 + 3,96 + … + 3,32 = 65,88%.
    // 1000 шт × 2 урона / 1,6588 = 1205,7 — в посте патча 1206
    const { strike } = calculate(
      input({ count: 1000, damageMin: 1, damageMax: 3, attack: 2 }, { defense: 20, hp: 120, count: 100 }),
    )

    expect(strike.avg.damage).toBe(1206)
  })

  test('пример разработчиков: 75 чревеней бьют троглодитов', () => {
    // Атака 20 против защиты 3, разница 17: 62,56%.
    // 75 шт × 22,5 урона × 1,6256 = 2743,2 — в посте патча 2743
    const { strike } = calculate(
      input({ count: 75, damageMin: 22, damageMax: 23, attack: 20 }, { defense: 3, hp: 9, count: 1000 }),
    )

    expect(strike.avg.damage).toBe(2743)
  })

  test('равные атака и защита урон не меняют, сколько бы их ни было', () => {
    expect(hit({ attack: 30 }, { defense: 30 })).toBe(100)
    expect(hit({ attack: 0 }, { defense: 0 })).toBe(100)
  })

  test('одинаковые бонусы героев друг друга гасят', () => {
    // 12 против 8 — разница 4: 100 × 1,1576 = 115,76. С героями +40 и +40 разница та же
    expect(hit({ attack: 12 }, { defense: 8 })).toBe(116)
    expect(hit({ attack: 12, heroAttack: 40 }, { defense: 8, heroDefense: 40 })).toBe(116)
  })

  test('защита выше атаки — урон делится на тот же множитель', () => {
    // Разница 10: 4 + 3,96 + … + 3,64 = 38,2%. 100 × 1,382 = 138,2 и 100 / 1,382 = 72,36
    expect(hit({ attack: 20 }, { defense: 10 })).toBe(138)
    expect(hit({ attack: 10 }, { defense: 20 })).toBe(72)
  })

  test('после разницы 100 множитель не растёт', () => {
    // Сотня очков — 202%: 100 × 3,02 = 302 и 100 / 3,02 = 33,1
    expect(hit({ attack: 100 }, {})).toBe(302)
    expect(hit({ attack: 150 }, {})).toBe(302)
    expect(hit({}, { defense: 100 })).toBe(33)
    expect(hit({}, { defense: 150 })).toBe(33)
  })
})

describe('раненый стек', () => {
  test('урон сначала добивает раненое верхнее существо', () => {
    // 5 шт × 5 урона без модификаторов = 25
    const shot = (topHp: number) =>
      calculate(input({ count: 5, damageMin: 5, damageMax: 5 }, { hp: 10, count: 16, topHp }))
        .strike.min

    // у целого стека 25 урона снимают двоих и ранят третьего на 5
    expect(shot(10)).toMatchObject({ damage: 25, killed: 2, survived: 14, topHp: 5 })
    // у стека с раненым на 4 верхним тех же 25 хватает уже на троих
    expect(shot(4)).toMatchObject({ damage: 25, killed: 3, survived: 13, topHp: 9 })
  })

  test('урона не хватило даже на раненого — никто не гибнет', () => {
    const { strike } = calculate(
      input({ count: 3, damageMin: 1, damageMax: 1 }, { hp: 10, count: 16, topHp: 4 }),
    )

    expect(strike.min).toMatchObject({ damage: 3, killed: 0, survived: 16, topHp: 1 })
  })

  test('урон ровно добил верхнего — следующий остаётся невредимым', () => {
    const { strike } = calculate(
      input({ count: 4, damageMin: 1, damageMax: 1 }, { hp: 10, count: 16, topHp: 4 }),
    )

    expect(strike.min).toMatchObject({ damage: 4, killed: 1, survived: 15, topHp: 10 })
  })

  test('раненый стек гибнет целиком там, где целый выстоял бы', () => {
    const wipe = (topHp: number) =>
      calculate(input({ count: 11, damageMin: 1, damageMax: 1 }, { hp: 10, count: 2, topHp }))

    expect(wipe(10).strike.min).toMatchObject({ killed: 1, survived: 1 })
    expect(wipe(1).strike.min).toMatchObject({ killed: 2, survived: 0, topHp: 0 })
    expect(wipe(1).counter).toBeNull()
  })
})

describe('штраф за дистанцию', () => {
  // 10 шт × 10 урона без модификаторов = 100
  const shot = (rangePenalty: number, ranged = true) =>
    calculate(
      input({ count: 10, damageMin: 10, damageMax: 10 }, { hp: 1000 }, { ranged, rangePenalty }),
    ).strike

  test('штраф снимает свою долю урона', () => {
    expect(shot(0).min.damage).toBe(100)
    expect(shot(10).min.damage).toBe(90)
    expect(shot(50).min.damage).toBe(50)
  })

  test('штраф не превышает 50%, каким бы ни пришёл', () => {
    expect(shot(80).min.damage).toBe(50)
    expect(shot(80).penalty).toBe(50)
  })

  test('в ближнем бою штраф не применяется', () => {
    expect(shot(50, false).min.damage).toBe(100)
    expect(shot(50, false).penalty).toBe(0)
  })
})

describe('ослабленная контратака', () => {
  // удар слабый и никого не убивает, отвечают все десять
  const battle = (over: Partial<Side>, extra: Partial<Input> = {}) =>
    calculate(
      input(
        { count: 10, damageMin: 1, damageMax: 1, hp: 1000 },
        { count: 10, damageMin: 10, damageMax: 10, hp: 1000, ...over },
        extra,
      ),
    )

  test('стрелок в ближнем бою отвечает вполсилы', () => {
    expect(battle({}).counter?.min.damage).toBe(100)
    expect(battle({ counterHalved: true }).counter?.min.damage).toBe(50)
    expect(battle({ counterHalved: true }).counter?.penalty).toBe(50)
  })

  test('ослабленная контратака не отменяет правила о выстреле', () => {
    expect(battle({ counterHalved: true }, { ranged: true }).counter).toBeNull()
  })

  test('тот же флаг у атакующего на расчёт не влияет', () => {
    // атакующий в этом обмене не контратакует, его собственный флаг ничего не меняет
    const { strike, counter } = calculate(
      input(
        { count: 10, damageMin: 1, damageMax: 1, hp: 1000, counterHalved: true },
        { count: 10, damageMin: 10, damageMax: 10, hp: 1000 },
      ),
    )

    expect(strike.min.damage).toBe(10)
    expect(counter?.min.damage).toBe(100)
  })
})

describe('ответный удар', () => {
  const battle = calculate(
    input(
      { count: 10, damageMin: 5, damageMax: 12, attack: 10, defense: 12, hp: 35 },
      { hp: 25, count: 8, defense: 8, attack: 8, damageMin: 3, damageMax: 6 },
    ),
  )

  test('отвечают выжившие, а ветки перекрёстные', () => {
    // Удар: разница 10 − 8 = 2, множитель 1,0796.
    // 54 / 130 / 92 урона → выжило 6 / 3 / 5 защищающихся
    expect(battle.strike.min.survived).toBe(6)
    expect(battle.strike.max.survived).toBe(3)
    expect(battle.strike.avg.survived).toBe(5)

    // Ответ: разница 8 − 12 = −4, урон делится на 1,1576.
    // Минимум входящего — от самого сильного удара: выжило трое, бьют по минимуму.
    // Максимум — от самого слабого: выжило шестеро, бьют по максимуму.
    expect(battle.counter?.min.damage).toBe(8) // 3 шт × 3 урона / 1,1576 = 7,77
    expect(battle.counter?.max.damage).toBe(31) // 6 шт × 6 урона / 1,1576 = 31,10
    expect(battle.counter?.avg.damage).toBe(19) // 5 шт × 4,5 урона / 1,1576 = 19,44
  })

  test('в расшифровке количество отвечающих — диапазон', () => {
    expect(battle.counter?.countMin).toBe(3)
    expect(battle.counter?.countMax).toBe(6)
  })

  test('дистанционная атака ответа не провоцирует', () => {
    const { counter } = calculate(
      input({ count: 10, damageMin: 1, damageMax: 1 }, { hp: 100, count: 8 }, { ranged: true }),
    )

    expect(counter).toBeNull()
  })

  test('погибший стек не отвечает', () => {
    const { strike, counter } = calculate(
      input({ count: 100, damageMin: 100, damageMax: 100 }, { hp: 10, count: 2 }),
    )

    expect(strike.min.survived).toBe(0)
    expect(counter).toBeNull()
  })
})
