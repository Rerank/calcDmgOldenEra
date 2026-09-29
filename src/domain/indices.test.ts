import { describe, expect, test } from 'vitest'
import { indicesOf, nearlyEqual, placeAmong, shareOf } from './indices'
import type { ArmyUnit } from './types'

/**
 * Ожидания посчитаны вручную и записаны числом, как в damage.test.ts:
 * формула здесь не повторяется, иначе тест проверял бы сам себя.
 *
 * Существа заданы прямо здесь, а не взяты из справочника: правка чисел
 * в справочнике не должна ломать проверку формулы. Параметры совпадают
 * с одноимёнными существами на момент написания — так примеры сверяются
 * с макетом экрана армий.
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
    // D = 20 × 2,5 × 24/20 + 14 × 7 × 27/20 + 6 × 12 × 32/20 = 60 + 132,3 + 115,2 = 307,5
    // H = 20 × 12 × 24/20 + 14 × 30 × 26/20 + 6 × 85 × 37/20 = 288 + 546 + 943,5 = 1777,5
    // мощность = √(307,5 × 1777,5) = √546 581,25 ≈ 739,311
    const indices = indicesOf([
      { unit: swordsman, count: 20 },
      { unit: griffin, count: 14 },
      { unit: cavalry, count: 6 },
    ])

    expect(indices.damage).toBeCloseTo(307.5, 9)
    expect(indices.hardiness).toBeCloseTo(1777.5, 9)
    expect(indices.power).toBeCloseTo(739.311, 3)
  })

  test('армия II из макета: 80 скелетов, 18 фантомов, 12 оживших питомцев', () => {
    // D = 80 × 2 × 24/20 + 18 × 3 × 26/20 + 12 × 4 × 24/20 = 192 + 70,2 + 57,6 = 319,8
    // H = 80 × 6 × 21/20 + 18 × 8 × 24/20 + 12 × 14 × 26/20 = 504 + 172,8 + 218,4 = 895,2
    // мощность = √(319,8 × 895,2) = √286 284,96 ≈ 535,056
    const indices = indicesOf([
      { unit: skeleton, count: 80 },
      { unit: phantasm, count: 18 },
      { unit: undeadPet, count: 12 },
    ])

    expect(indices.damage).toBeCloseTo(319.8, 9)
    expect(indices.hardiness).toBeCloseTo(895.2, 9)
    expect(indices.power).toBeCloseTo(535.056, 3)
  })

  test('армия III из макета: 10 мечников, 30 скелетов', () => {
    // D = 10 × 2,5 × 24/20 + 30 × 2 × 24/20 = 30 + 72 = 102
    // H = 10 × 12 × 24/20 + 30 × 6 × 21/20 = 144 + 189 = 333
    // мощность = √(102 × 333) = √33 966 ≈ 184,299
    const indices = indicesOf([
      { unit: swordsman, count: 10 },
      { unit: skeleton, count: 30 },
    ])

    expect(indices.damage).toBeCloseTo(102, 9)
    expect(indices.hardiness).toBeCloseTo(333, 9)
    expect(indices.power).toBeCloseTo(184.299, 3)
  })

  test('было / стало: после потерь и найма армия стала слабее на 1,2%', () => {
    // Было: 13 фавнов, 7 хмельков, 9 корневых ириадов
    // D = 13 × 4 × 24/20 + 7 × 6 × 26/20 + 9 × 6 × 26/20 = 62,4 + 54,6 + 70,2 = 187,2
    // H = 13 × 11 × 23/20 + 7 × 18 × 25/20 + 9 × 45 × 31/20 = 164,45 + 157,5 + 627,75 = 949,7
    const before = indicesOf([
      { unit: faun, count: 13 },
      { unit: hoplet, count: 7 },
      { unit: vineIriyad, count: 9 },
    ])

    // Стало: 10 фавнов, 12 хмельков, 7 ириадов
    // D = 48 + 93,6 + 54,6 = 196,2;  H = 126,5 + 270 + 488,25 = 884,75
    const after = indicesOf([
      { unit: faun, count: 10 },
      { unit: hoplet, count: 12 },
      { unit: vineIriyad, count: 7 },
    ])

    expect(before.damage).toBeCloseTo(187.2, 9)
    expect(before.hardiness).toBeCloseTo(949.7, 9)
    expect(after.damage).toBeCloseTo(196.2, 9)
    expect(after.hardiness).toBeCloseTo(884.75, 9)

    // мощность: √177 783,84 ≈ 421,644 → √173 587,95 ≈ 416,639, то есть −1,19%
    expect(before.power).toBeCloseTo(421.644, 3)
    expect(after.power).toBeCloseTo(416.639, 3)
    expect(1 - after.power / before.power).toBeCloseTo(0.0119, 4)
  })

  test('одно существо — индексы на одну единицу: так их видит рейтинг', () => {
    // фавн: D = 4 × 24/20 = 4,8;  H = 11 × 23/20 = 12,65;  мощность = √60,72 ≈ 7,792
    const indices = indicesOf([{ unit: faun, count: 1 }])

    expect(indices.damage).toBeCloseTo(4.8, 9)
    expect(indices.hardiness).toBeCloseTo(12.65, 9)
    expect(indices.power).toBeCloseTo(7.792, 3)
  })

  test('бонус героя прибавляется к атаке и защите каждого существа', () => {
    // 10 мечников, герой +5 к атаке и +3 к защите:
    // D = 10 × 2,5 × (20 + 4 + 5)/20 = 36,25;  H = 10 × 12 × (20 + 4 + 3)/20 = 162
    // мощность = √(36,25 × 162) = √5872,5 ≈ 76,632
    const indices = indicesOf([{ unit: swordsman, count: 10 }], { attack: 5, defense: 3 })

    expect(indices.damage).toBeCloseTo(36.25, 9)
    expect(indices.hardiness).toBeCloseTo(162, 9)
    expect(indices.power).toBeCloseTo(76.632, 3)
  })

  test('вдвое больше тех же существ — вдвое больше мощности', () => {
    // Ради этого мощность и берётся под корнем: 10 мечников — √(30 × 144) ≈ 65,727,
    // 20 мечников — √(60 × 288) ≈ 131,453
    const ten = indicesOf([{ unit: swordsman, count: 10 }])
    const twenty = indicesOf([{ unit: swordsman, count: 20 }])

    expect(ten.power).toBeCloseTo(65.727, 3)
    expect(twenty.power).toBeCloseTo(131.453, 3)
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
