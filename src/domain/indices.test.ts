import { describe, expect, test } from 'vitest'
import { indicesOf, nearlyEqual, placeAmong, shareOf } from './indices'
import type { ArmyUnit } from './types'

/**
 * Ожидания посчитаны вручную и записаны числом, как в damage.test.ts:
 * формула здесь не повторяется, иначе тест проверял бы сам себя.
 *
 * Существа заданы прямо здесь, а не взяты из справочника: правка чисел
 * в справочнике не должна ломать проверку формулы. Параметры совпадают
 * с одноимёнными существами до патча 0.82.06 — так примеры сверяются
 * с макетом экрана армий.
 *
 * K(n) — множитель от разницы атаки и защиты: K(3) = 1,1188, K(4) = 1,1576,
 * K(6) = 1,234, K(7) = 1,2716, K(9) = 1,3456, K(11) = 1,418, K(12) = 1,4536,
 * K(17) = 1,6256. Без противника разница — это сами атака и защита.
 */

const swordsman: ArmyUnit = { hp: 12, attack: 4, defense: 4, damageMin: 2, damageMax: 3 }
const griffin: ArmyUnit = { hp: 30, attack: 7, defense: 6, damageMin: 5, damageMax: 9 }
const cavalry: ArmyUnit = { hp: 85, attack: 12, defense: 17, damageMin: 10, damageMax: 14 }
const skeleton: ArmyUnit = { hp: 6, attack: 4, defense: 1, damageMin: 1, damageMax: 3 }
const phantasm: ArmyUnit = { hp: 8, attack: 6, defense: 4, damageMin: 2, damageMax: 4 }
const undeadPet: ArmyUnit = { hp: 14, attack: 4, defense: 6, damageMin: 3, damageMax: 5 }
const faun: ArmyUnit = { hp: 11, attack: 4, defense: 3, damageMin: 3, damageMax: 5 }
const hoplet: ArmyUnit = { hp: 18, attack: 6, defense: 5, damageMin: 4, damageMax: 8 }
const vineIriyad: ArmyUnit = { hp: 45, attack: 6, defense: 11, damageMin: 5, damageMax: 7 }

describe('индексы', () => {
  test('армия I из макета: 20 мечников, 14 грифонов, 6 кавалеристов', () => {
    // D = 20 × 2,5 × K(4) + 14 × 7 × K(7) + 6 × 12 × K(12) = 57,88 + 124,6168 + 104,6592 = 287,156
    // H = 20 × 12 × K(4) + 14 × 30 × K(6) + 6 × 85 × K(17) = 277,824 + 518,28 + 829,056 = 1625,16
    // мощность = √(287,156 × 1625,16) ≈ 683,136
    const indices = indicesOf([
      { unit: swordsman, count: 20 },
      { unit: griffin, count: 14 },
      { unit: cavalry, count: 6 },
    ])

    expect(indices.damage).toBeCloseTo(287.156, 9)
    expect(indices.hardiness).toBeCloseTo(1625.16, 9)
    expect(indices.power).toBeCloseTo(683.136, 3)
  })

  test('армия II из макета: 80 скелетов, 18 фантомов, 12 оживших питомцев', () => {
    // D = 80 × 2 × K(4) + 18 × 3 × K(6) + 12 × 4 × K(4) = 185,216 + 66,636 + 55,5648 = 307,4168
    // H = 80 × 6 × K(1) + 18 × 8 × K(4) + 12 × 14 × K(6) = 499,2 + 166,6944 + 207,312 = 873,2064
    // мощность = √(307,4168 × 873,2064) ≈ 518,110
    const indices = indicesOf([
      { unit: skeleton, count: 80 },
      { unit: phantasm, count: 18 },
      { unit: undeadPet, count: 12 },
    ])

    expect(indices.damage).toBeCloseTo(307.4168, 9)
    expect(indices.hardiness).toBeCloseTo(873.2064, 9)
    expect(indices.power).toBeCloseTo(518.11, 3)
  })

  test('армия III из макета: 10 мечников, 30 скелетов', () => {
    // D = 10 × 2,5 × K(4) + 30 × 2 × K(4) = 28,94 + 69,456 = 98,396
    // H = 10 × 12 × K(4) + 30 × 6 × K(1) = 138,912 + 187,2 = 326,112
    // мощность = √(98,396 × 326,112) ≈ 179,132
    const indices = indicesOf([
      { unit: swordsman, count: 10 },
      { unit: skeleton, count: 30 },
    ])

    expect(indices.damage).toBeCloseTo(98.396, 9)
    expect(indices.hardiness).toBeCloseTo(326.112, 9)
    expect(indices.power).toBeCloseTo(179.132, 3)
  })

  test('было / стало: после потерь и найма армия стала слабее на 1%', () => {
    // Было: 13 фавнов, 7 хмельков, 9 корневых ириадов
    // D = 13 × 4 × K(4) + 7 × 6 × K(6) + 9 × 6 × K(6) = 60,1952 + 51,828 + 66,636 = 178,6592
    // H = 13 × 11 × K(3) + 7 × 18 × K(5) + 9 × 45 × K(11) = 159,9884 + 150,696 + 574,29 = 884,9744
    const before = indicesOf([
      { unit: faun, count: 13 },
      { unit: hoplet, count: 7 },
      { unit: vineIriyad, count: 9 },
    ])

    // Стало: 10 фавнов, 12 хмельков, 7 ириадов
    // D = 46,304 + 88,848 + 51,828 = 186,98;  H = 123,068 + 258,336 + 446,67 = 828,074
    const after = indicesOf([
      { unit: faun, count: 10 },
      { unit: hoplet, count: 12 },
      { unit: vineIriyad, count: 7 },
    ])

    expect(before.damage).toBeCloseTo(178.6592, 9)
    expect(before.hardiness).toBeCloseTo(884.9744, 9)
    expect(after.damage).toBeCloseTo(186.98, 9)
    expect(after.hardiness).toBeCloseTo(828.074, 9)

    // мощность: ≈ 397,629 → ≈ 393,489, то есть −1,04%
    expect(before.power).toBeCloseTo(397.629, 3)
    expect(after.power).toBeCloseTo(393.489, 3)
    expect(1 - after.power / before.power).toBeCloseTo(0.0104, 4)
  })

  test('одно существо — индексы на одну единицу: так их видит рейтинг', () => {
    // фавн: D = 4 × K(4) = 4,6304;  H = 11 × K(3) = 12,3068;  мощность ≈ 7,549
    const indices = indicesOf([{ unit: faun, count: 1 }])

    expect(indices.damage).toBeCloseTo(4.6304, 9)
    expect(indices.hardiness).toBeCloseTo(12.3068, 9)
    expect(indices.power).toBeCloseTo(7.549, 3)
  })

  test('бонус героя прибавляется к атаке и защите каждого существа', () => {
    // 10 мечников, герой +5 к атаке и +3 к защите:
    // D = 10 × 2,5 × K(4 + 5) = 33,64;  H = 10 × 12 × K(4 + 3) = 152,592;  мощность ≈ 71,646
    const indices = indicesOf([{ unit: swordsman, count: 10 }], { hero: { attack: 5, defense: 3 } })

    expect(indices.damage).toBeCloseTo(33.64, 9)
    expect(indices.hardiness).toBeCloseTo(152.592, 9)
    expect(indices.power).toBeCloseTo(71.646, 3)
  })

  test('противник: урон — от разницы с его защитой, живучесть — от разницы с его атакой', () => {
    // 10 мечников против атаки 8 и защиты 9:
    // D = 25 / K(9 − 4) = 25 / 1,196 ≈ 20,903;  H = 120 / K(8 − 4) = 120 / 1,1576 ≈ 103,663
    const indices = indicesOf([{ unit: swordsman, count: 10 }], {
      opponent: { attack: 8, defense: 9 },
    })

    expect(indices.damage).toBeCloseTo(20.903, 3)
    expect(indices.hardiness).toBeCloseTo(103.663, 3)
  })

  test('от противника зависит, кто бьёт сильнее', () => {
    // Надзиратель Бездны: атака 40, урон 40–60; Королева роя: атака 30, урон 60.
    // По цели без защиты: 50 × K(40) = 114,4 и 60 × K(30) = 121,56 — сильнее Королева.
    // По защите 30: 50 × K(10) = 69,1 и 60 × K(0) = 60 — сильнее Надзиратель.
    // По старой формуле они наносили поровну любой цели: 50 × 60 = 60 × 50
    const overseer: ArmyUnit = { hp: 250, attack: 40, defense: 40, damageMin: 40, damageMax: 60 }
    const queen: ArmyUnit = { hp: 200, attack: 30, defense: 30, damageMin: 60, damageMax: 60 }
    const damage = (unit: ArmyUnit, defense: number) =>
      indicesOf([{ unit, count: 1 }], { opponent: { attack: 0, defense } }).damage

    expect(damage(overseer, 0)).toBeCloseTo(114.4, 9)
    expect(damage(queen, 0)).toBeCloseTo(121.56, 9)
    expect(damage(overseer, 30)).toBeCloseTo(69.1, 9)
    expect(damage(queen, 30)).toBeCloseTo(60, 9)
  })

  test('вдвое больше тех же существ — вдвое больше мощности', () => {
    // Ради этого мощность и берётся под корнем: 10 мечников — √(28,94 × 138,912) ≈ 63,404,
    // 20 мечников — √(57,88 × 277,824) ≈ 126,809
    const ten = indicesOf([{ unit: swordsman, count: 10 }])
    const twenty = indicesOf([{ unit: swordsman, count: 20 }])

    expect(ten.power).toBeCloseTo(63.404, 3)
    expect(twenty.power).toBeCloseTo(126.809, 3)
  })

  test('без отрядов — одни нули', () => {
    expect(indicesOf([])).toEqual({ damage: 0, hardiness: 0, power: 0 })
  })
})

describe('доли и места', () => {
  test('доля от лучшего; если лучшего нет — ноль, без деления на ноль', () => {
    expect(shareOf(300, 400)).toBe(0.75)
    expect(shareOf(400, 400)).toBe(1)
    expect(shareOf(0, 0)).toBe(0)
  })

  test('равные делят место, следующее пропускается: 1, 2, 2, 4', () => {
    const values = [6.5, 4.8, 4.8, 3.9]

    expect(values.map((value) => placeAmong(value, values))).toEqual([1, 2, 2, 4])
  })

  test('погрешность дробных чисел не разводит равных', () => {
    // 0.1 + 0.2 в double — это 0.30000000000000004, а математически те же 0,3
    const values = [0.1 + 0.2, 0.3, 0.2]

    expect(nearlyEqual(0.1 + 0.2, 0.3)).toBe(true)
    expect(nearlyEqual(0.3, 0.30001)).toBe(false)
    expect(values.map((value) => placeAmong(value, values))).toEqual([1, 1, 3])
  })

  test('нули равны друг другу и делят место', () => {
    expect(nearlyEqual(0, 0)).toBe(true)
    expect([5, 0, 0].map((value, _, all) => placeAmong(value, all))).toEqual([1, 2, 2])
  })
})
