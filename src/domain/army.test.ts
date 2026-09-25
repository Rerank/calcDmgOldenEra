import { describe, expect, test } from 'vitest'
import { armyStats, compareArmies } from './army'
import type { ArmyStats, ArmyUnit } from './types'

/**
 * Ожидания посчитаны вручную и записаны числом, как в damage.test.ts:
 * формула здесь не повторяется, иначе тест проверял бы сам себя.
 *
 * Существа заданы прямо здесь, а не взяты из справочника: правка чисел
 * в справочнике не должна ломать проверку формулы. Параметры совпадают
 * с одноимёнными существами на момент написания — так примеры сверяются
 * с макетом экрана.
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

describe('индексы армии', () => {
  test('армия I из макета: 20 мечников, 14 грифонов, 6 кавалеристов', () => {
    // D = 20 × 2,5 × 24/20 + 14 × 7 × 27/20 + 6 × 12 × 32/20 = 60 + 132,3 + 115,2 = 307,5
    // H = 20 × 12 × 24/20 + 14 × 30 × 26/20 + 6 × 85 × 37/20 = 288 + 546 + 943,5 = 1777,5
    // мощность = √(307,5 × 1777,5) = √546 581,25 ≈ 739,311
    const stats = armyStats([
      { unit: swordsman, count: 20 },
      { unit: griffin, count: 14 },
      { unit: cavalry, count: 6 },
    ])

    expect(stats.count).toBe(40)
    expect(stats.damage).toBeCloseTo(307.5, 9)
    expect(stats.hardiness).toBeCloseTo(1777.5, 9)
    expect(stats.power).toBeCloseTo(739.311, 3)
  })

  test('армия II из макета: 80 скелетов, 18 фантомов, 12 оживших питомцев', () => {
    // D = 80 × 2 × 24/20 + 18 × 3 × 26/20 + 12 × 4 × 24/20 = 192 + 70,2 + 57,6 = 319,8
    // H = 80 × 6 × 21/20 + 18 × 8 × 24/20 + 12 × 14 × 26/20 = 504 + 172,8 + 218,4 = 895,2
    // мощность = √(319,8 × 895,2) = √286 284,96 ≈ 535,056
    const stats = armyStats([
      { unit: skeleton, count: 80 },
      { unit: phantasm, count: 18 },
      { unit: undeadPet, count: 12 },
    ])

    expect(stats.count).toBe(110)
    expect(stats.damage).toBeCloseTo(319.8, 9)
    expect(stats.hardiness).toBeCloseTo(895.2, 9)
    expect(stats.power).toBeCloseTo(535.056, 3)
  })

  test('армия III из макета: 10 мечников, 30 скелетов', () => {
    // D = 10 × 2,5 × 24/20 + 30 × 2 × 24/20 = 30 + 72 = 102
    // H = 10 × 12 × 24/20 + 30 × 6 × 21/20 = 144 + 189 = 333
    // мощность = √(102 × 333) = √33 966 ≈ 184,299
    const stats = armyStats([
      { unit: swordsman, count: 10 },
      { unit: skeleton, count: 30 },
    ])

    expect(stats.count).toBe(40)
    expect(stats.damage).toBeCloseTo(102, 9)
    expect(stats.hardiness).toBeCloseTo(333, 9)
    expect(stats.power).toBeCloseTo(184.299, 3)
  })

  test('было / стало: после потерь и найма армия стала слабее на 1,2%', () => {
    // Было: 13 фавнов, 7 хмельков, 9 корневых ириадов
    // D = 13 × 4 × 24/20 + 7 × 6 × 26/20 + 9 × 6 × 26/20 = 62,4 + 54,6 + 70,2 = 187,2
    // H = 13 × 11 × 23/20 + 7 × 18 × 25/20 + 9 × 45 × 31/20 = 164,45 + 157,5 + 627,75 = 949,7
    const before = armyStats([
      { unit: faun, count: 13 },
      { unit: hoplet, count: 7 },
      { unit: vineIriyad, count: 9 },
    ])

    // Стало: 10 фавнов, 12 хмельков, 7 ириадов
    // D = 48 + 93,6 + 54,6 = 196,2;  H = 126,5 + 270 + 488,25 = 884,75
    const after = armyStats([
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

  test('бонус героя прибавляется к атаке и защите каждого существа', () => {
    // 10 мечников, герой +5 к атаке и +3 к защите:
    // D = 10 × 2,5 × (20 + 4 + 5)/20 = 36,25;  H = 10 × 12 × (20 + 4 + 3)/20 = 162
    // мощность = √(36,25 × 162) = √5872,5 ≈ 76,632
    const stats = armyStats([{ unit: swordsman, count: 10 }], { attack: 5, defense: 3 })

    expect(stats.damage).toBeCloseTo(36.25, 9)
    expect(stats.hardiness).toBeCloseTo(162, 9)
    expect(stats.power).toBeCloseTo(76.632, 3)
  })

  test('вдвое больше тех же существ — вдвое больше мощности', () => {
    // Ради этого мощность и берётся под корнем: 10 мечников — √(30 × 144) ≈ 65,727,
    // 20 мечников — √(60 × 288) ≈ 131,453
    const ten = armyStats([{ unit: swordsman, count: 10 }])
    const twenty = armyStats([{ unit: swordsman, count: 20 }])

    expect(ten.power).toBeCloseTo(65.727, 3)
    expect(twenty.power).toBeCloseTo(131.453, 3)
  })

  test('пустая армия — одни нули', () => {
    expect(armyStats([])).toEqual({ count: 0, damage: 0, hardiness: 0, power: 0 })
  })
})

/**
 * Итоги армий для сравнения заданы числами напрямую: сравнение индексы
 * не пересчитывает, поэтому мощность здесь условная и с уроном и живучестью
 * не связана.
 */
const army = (damage: number, hardiness: number, power: number, count = 10): ArmyStats => ({
  count,
  damage,
  hardiness,
  power,
})

const EMPTY = army(0, 0, 0, 0)

describe('сравнение армий', () => {
  test('доля от лучшего и лидер — в каждой колонке отдельно', () => {
    const { places, verdict } = compareArmies([army(300, 1000, 500), army(400, 500, 450)])

    // урон: лучший 400, у первой 300 / 400 = 0,75; живучесть: 500 / 1000 = 0,5;
    // мощность: 450 / 500 = 0,9
    expect(places[0]).toEqual({
      damage: { share: 0.75, leader: false },
      hardiness: { share: 1, leader: true },
      power: { share: 1, leader: true },
    })
    expect(places[1]).toEqual({
      damage: { share: 1, leader: true },
      hardiness: { share: 0.5, leader: false },
      power: { share: 0.9, leader: false },
    })

    // отрыв по мощности 10% — больше порога ничьей
    expect(verdict).toEqual({ kind: 'leader', army: 0 })
  })

  test('пустая армия не соревнуется и не мешает остальным', () => {
    const { places, verdict } = compareArmies([army(300, 1000, 500), EMPTY, army(400, 500, 450)])

    expect(places[1]).toEqual({
      damage: { share: 0, leader: false },
      hardiness: { share: 0, leader: false },
      power: { share: 0, leader: false },
    })
    expect(places[2].damage).toEqual({ share: 1, leader: true })
    expect(verdict).toEqual({ kind: 'leader', army: 0 })
  })

  test('погрешность дробных чисел не отнимает лидерство у равных', () => {
    // 0.1 + 0.2 в double — это 0.30000000000000004, а математически те же 0,3
    const { places, verdict } = compareArmies([army(0.1 + 0.2, 10, 10), army(0.3, 10, 10)])

    expect(places[0].damage.leader).toBe(true)
    expect(places[1].damage.leader).toBe(true)
    expect(verdict).toEqual({ kind: 'tie', armies: [0, 1] })
  })

  test('ничья — отставание по мощности не больше 3%, включая ровно 3%', () => {
    // 97 / 100 — отставание ровно 3%. В double 1 − 0,97 — это 0.030000000000000027,
    // без допуска граница не включилась бы
    expect(compareArmies([army(1, 1, 100), army(1, 1, 97)]).verdict).toEqual({
      kind: 'tie',
      armies: [0, 1],
    })

    // 96,9 / 100 — отставание 3,1%: победитель есть
    expect(compareArmies([army(1, 1, 100), army(1, 1, 96.9)]).verdict).toEqual({
      kind: 'leader',
      army: 0,
    })
  })

  test('в ничью попадают все, кто близок к сильнейшей, — в порядке армий', () => {
    // сильнейшая — вторая (100); 97,5 и 98 отстают меньше чем на 3%, 90 — на 10%
    const { verdict } = compareArmies([
      army(1, 1, 90),
      army(1, 1, 100),
      army(1, 1, 97.5),
      army(1, 1, 98),
    ])

    expect(verdict).toEqual({ kind: 'tie', armies: [1, 2, 3] })
  })

  test('сравнивать нечего, пока существа есть меньше чем в двух армиях', () => {
    expect(compareArmies([]).verdict).toEqual({ kind: 'none' })
    expect(compareArmies([army(300, 1000, 500)]).verdict).toEqual({ kind: 'none' })
    expect(compareArmies([army(300, 1000, 500), EMPTY]).verdict).toEqual({ kind: 'none' })
  })

  test('все армии пустые — нули без деления на ноль', () => {
    const { places, verdict } = compareArmies([EMPTY, EMPTY])

    expect(places[0].power).toEqual({ share: 0, leader: false })
    expect(places[1].damage).toEqual({ share: 0, leader: false })
    expect(verdict).toEqual({ kind: 'none' })
  })
})
