import { describe, expect, test } from 'vitest'
import { factionSummary, rateUnits } from './rating'
import type { RatedUnit } from './types'

/**
 * Ожидания посчитаны вручную и записаны числом, как в indices.test.ts.
 * Существа заданы прямо здесь: параметры совпадают с одноимёнными
 * существами справочника на момент написания, но правка справочника
 * тестов не ломает.
 */

const faunWarrior: RatedUnit = {
  tier: 1, faction: 'grove', growth: 13,
  hp: 11, attack: 6, defense: 6, damageMin: 4, damageMax: 6,
}
const faun: RatedUnit = {
  tier: 1, faction: 'grove', growth: 13,
  hp: 11, attack: 4, defense: 3, damageMin: 3, damageMax: 5,
}
// те же числа, что у фавна: делят с ним место
const faunArcher: RatedUnit = { ...faun }
const ravagerParasite: RatedUnit = {
  tier: 1, faction: 'hive', growth: 22,
  hp: 7, attack: 6, defense: 3, damageMin: 2, damageMax: 4,
}
const skeletonWarrior: RatedUnit = {
  tier: 1, faction: 'necropolis', growth: 30,
  hp: 6, attack: 4, defense: 3, damageMin: 2, damageMax: 3,
}
// II ранг: по урону сильнее всех выше, но соревнуется только со своим рангом
const votary: RatedUnit = {
  tier: 2, faction: 'schism', growth: 12,
  hp: 15, attack: 9, defense: 4, damageMin: 4, damageMax: 8,
}

const units = [faunWarrior, faun, faunArcher, ravagerParasite, skeletonWarrior, votary]

describe('рейтинг существ', () => {
  test('поштучно: места и доли от лидера — внутри ранга, равные делят место', () => {
    // индекс урона: фавн-мечница 5 × 26/20 = 6,5; фавн и фавн-лучница 4 × 24/20 = 4,8;
    // паразит-опустошитель 3 × 26/20 = 3,9; скелет-мечник 2,5 × 24/20 = 3;
    // служитель 6 × 29/20 = 8,7 — один в своём ранге
    const entries = rateUnits(units, 'damage', false)

    expect(entries.map((entry) => entry.place)).toEqual([1, 2, 2, 4, 5, 1])
    expect(entries.map((entry) => entry.value)).toEqual([6.5, 4.8, 4.8, 3.9, 3, 8.7])

    // доли от 6,5: 4,8 / 6,5 ≈ 0,738; 3,9 / 6,5 = 0,6; 3 / 6,5 ≈ 0,462
    expect(entries[0].share).toBe(1)
    expect(entries[1].share).toBeCloseTo(0.738462, 6)
    expect(entries[3].share).toBeCloseTo(0.6, 9)
    expect(entries[4].share).toBeCloseTo(0.461538, 6)
    expect(entries[5].share).toBe(1)

    // без прироста место поштучно — то же самое место
    expect(entries.map((entry) => entry.soloPlace)).toEqual([1, 2, 2, 4, 5, 1])
  })

  test('с приростом сравниваются отряды недельного прироста, место поштучно остаётся', () => {
    // урон за неделю: 6,5 × 13 = 84,5; 4,8 × 13 = 62,4; 3,9 × 22 = 85,8; 3 × 30 = 90;
    // служитель 8,7 × 12 = 104,4
    const entries = rateUnits(units, 'damage', true)

    expect(entries[0].value).toBeCloseTo(84.5, 9)
    expect(entries[1].value).toBeCloseTo(62.4, 9)
    expect(entries[3].value).toBeCloseTo(85.8, 9)
    expect(entries[4].value).toBeCloseTo(90, 9)
    expect(entries[5].value).toBeCloseTo(104.4, 9)

    // скелет-мечник поднялся с 5-го места на 1-е, фавн-мечница опустилась с 1-го на 3-е
    expect(entries.map((entry) => entry.place)).toEqual([3, 4, 4, 2, 1, 1])
    expect(entries.map((entry) => entry.soloPlace)).toEqual([1, 2, 2, 4, 5, 1])

    // доли — от нового лидера: 85,8 / 90 ≈ 0,953; 84,5 / 90 ≈ 0,939
    expect(entries[4].share).toBe(1)
    expect(entries[3].share).toBeCloseTo(0.953333, 6)
    expect(entries[0].share).toBeCloseTo(0.938889, 6)
  })

  test('мощность недельного отряда — мощность одного существа, умноженная на прирост', () => {
    // фавн-мечница: √(6,5 × 14,3) = √92,95 ≈ 9,6411, за неделю × 13 ≈ 125,334;
    // скелет-мечник: √(3 × 6,9) = √20,7 ≈ 4,5497, за неделю × 30 ≈ 136,492
    const solo = rateUnits([faunWarrior, skeletonWarrior], 'power', false)
    const weekly = rateUnits([faunWarrior, skeletonWarrior], 'power', true)

    expect(solo[0].value).toBeCloseTo(9.6411, 4)
    expect(solo[1].value).toBeCloseTo(4.5497, 4)
    expect(weekly[0].value).toBeCloseTo(125.334, 3)
    expect(weekly[1].value).toBeCloseTo(136.492, 3)
    expect(weekly.map((entry) => entry.place)).toEqual([2, 1])
  })

  test('живучесть: здоровье × (20 + защита) / 20', () => {
    // фавн-мечница 11 × 26/20 = 14,3; фавн 11 × 23/20 = 12,65; скелет-мечник 6 × 23/20 = 6,9
    const entries = rateUnits([faunWarrior, faun, skeletonWarrior], 'hardiness', false)

    expect(entries[0].value).toBeCloseTo(14.3, 9)
    expect(entries[1].value).toBeCloseTo(12.65, 9)
    expect(entries[2].value).toBeCloseTo(6.9, 9)
    expect(entries.map((entry) => entry.place)).toEqual([1, 2, 3])
  })
})

/**
 * Для сводки существа подобраны так, чтобы индекс урона был равен урону:
 * атака 0, урон без разброса. Тогда доли видны сразу.
 */
const unit = (tier: number, faction: string, damage: number, growth = 1): RatedUnit => ({
  tier,
  faction,
  growth,
  hp: 1,
  attack: 0,
  defense: 0,
  damageMin: damage,
  damageMax: damage,
})

describe('сводка по фракциям', () => {
  test('средняя доля фракции в ранге, среднее по рангам, лучшие и худшие', () => {
    // I ранг, лидер 10: у «a» доли 1 и 0,5 — в среднем 0,75; у «b» и «c» по 0,8.
    // II ранг, лидер 6: у «a» 4 / 6 ≈ 0,667, у «b» 1; у «c» существ II ранга нет.
    // Средние: «b» (0,8 + 1) / 2 = 0,9; «c» — 0,8, только по I рангу;
    // «a» (0,75 + 0,667) / 2 ≈ 0,708
    const pool = [
      unit(1, 'a', 10),
      unit(1, 'a', 5),
      unit(1, 'b', 8),
      unit(1, 'c', 8),
      unit(2, 'a', 4),
      unit(2, 'b', 6),
    ]
    const summary = factionSummary(pool, rateUnits(pool, 'damage', false))

    expect(summary.tiers).toEqual([1, 2])
    expect(summary.rows.map((row) => row.faction)).toEqual(['b', 'c', 'a'])

    const [b, c, a] = summary.rows
    expect(b.average).toBeCloseTo(0.9, 9)
    expect(c.average).toBeCloseTo(0.8, 9)
    expect(a.average).toBeCloseTo(0.708333, 6)

    // I ранг: «b» и «c» поровну — обе лучшие, «a» худшая
    expect(b.cells[0]).toEqual({ share: 0.8, best: true, worst: false })
    expect(c.cells[0]).toEqual({ share: 0.8, best: true, worst: false })
    expect(a.cells[0]).toEqual({ share: 0.75, best: false, worst: true })

    // II ранг: у «c» пусто, остальные сравниваются без неё
    expect(b.cells[1]).toEqual({ share: 1, best: true, worst: false })
    expect(c.cells[1]).toBeNull()
    expect(a.cells[1]?.share).toBeCloseTo(0.666667, 6)
    expect(a.cells[1]?.worst).toBe(true)
  })

  test('сводка следует за рейтингом: с приростом лидер другой', () => {
    // поштучно «x» (10) сильнее «y» (4), но за неделю у «y» 4 × 5 = 20 против 10
    const pool = [unit(1, 'x', 10), unit(1, 'y', 4, 5)]

    const solo = factionSummary(pool, rateUnits(pool, 'damage', false))
    const weekly = factionSummary(pool, rateUnits(pool, 'damage', true))

    expect(solo.rows.map((row) => row.faction)).toEqual(['x', 'y'])
    expect(weekly.rows.map((row) => row.faction)).toEqual(['y', 'x'])
    expect(weekly.rows[1].average).toBeCloseTo(0.5, 9)
  })

  test('выбранные ранги: только их столбцы, среднее — по ним', () => {
    // I ранг: x 10, y 5 — доли 1 и 0,5; II ранг: x 2, y 4 — 0,5 и 1; III ранг: как I
    const pool = [
      unit(1, 'x', 10),
      unit(1, 'y', 5),
      unit(2, 'x', 2),
      unit(2, 'y', 4),
      unit(3, 'x', 10),
      unit(3, 'y', 5),
    ]
    const entries = rateUnits(pool, 'damage', false)

    // все ранги: x (1 + 0,5 + 1) / 3 ≈ 0,833 — первая
    expect(factionSummary(pool, entries).rows[0].faction).toBe('x')

    // только II ранг: доли те же, но теперь впереди y
    const second = factionSummary(pool, entries, { tiers: [2] })
    expect(second.tiers).toEqual([2])
    expect(second.rows.map((row) => [row.faction, row.average])).toEqual([
      ['y', 1],
      ['x', 0.5],
    ])
  })

  test('выбранные фракции: доли — от лидера всего ранга, лучшая и худшая — среди показанных', () => {
    // лидер I ранга — z (20), он скрыт: у x 10 / 20 = 0,5, у y 5 / 20 = 0,25
    const pool = [unit(1, 'x', 10), unit(1, 'y', 5), unit(1, 'z', 20)]
    const entries = rateUnits(pool, 'damage', false)
    const summary = factionSummary(pool, entries, { factions: ['x', 'y'] })

    expect(summary.rows.map((row) => row.faction)).toEqual(['x', 'y'])
    expect(summary.rows[0].cells[0]).toEqual({ share: 0.5, best: true, worst: false })
    expect(summary.rows[1].cells[0]).toEqual({ share: 0.25, best: false, worst: true })
  })

  test('все равны — все лучшие, худших нет; при равном среднем порядок исходный', () => {
    const pool = [unit(1, 'x', 7), unit(1, 'y', 7)]
    const summary = factionSummary(pool, rateUnits(pool, 'damage', false))

    expect(summary.rows.map((row) => row.faction)).toEqual(['x', 'y'])
    expect(summary.rows.map((row) => row.cells[0])).toEqual([
      { share: 1, best: true, worst: false },
      { share: 1, best: true, worst: false },
    ])
  })
})
