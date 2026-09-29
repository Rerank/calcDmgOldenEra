import { describe, expect, test } from 'vitest'
import { armyStats, compareArmies } from './army'
import type { ArmyStats, ArmyUnit } from './types'

/**
 * Формулы индексов проверяет indices.test.ts. Здесь — то, что добавляет
 * к ним армия: численность, доли и места в колонках, вердикт.
 */

const swordsman: ArmyUnit = { hp: 12, attack: 4, defense: 4, damageMin: 2, damageMax: 3 }
const griffin: ArmyUnit = { hp: 30, attack: 7, defense: 6, damageMin: 5, damageMax: 9 }
const cavalry: ArmyUnit = { hp: 85, attack: 12, defense: 17, damageMin: 10, damageMax: 14 }

describe('итог армии', () => {
  test('численность — сумма отрядов, индексы — из общего расчёта', () => {
    // армия I из макета: 20 мечников, 14 грифонов, 6 кавалеристов;
    // D = 307,5, H = 1777,5, мощность ≈ 739,311 — расписано в indices.test.ts
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

  test('бонус героя доходит до расчёта', () => {
    // 10 мечников, герой +5 / +3: D = 36,25, H = 162
    const stats = armyStats([{ unit: swordsman, count: 10 }], { attack: 5, defense: 3 })

    expect(stats.damage).toBeCloseTo(36.25, 9)
    expect(stats.hardiness).toBeCloseTo(162, 9)
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
