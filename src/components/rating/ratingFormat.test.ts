import { describe, expect, test } from 'vitest'
import type { FactionId } from '../../data/creatures'
import { factionSummary, rateUnits } from '../../domain/rating'
import type { RatedCreature } from '../../state/rating'
import {
  formatAverage,
  formatDamage,
  formatIndex,
  formatShare,
  metaLine,
  placeShift,
  summaryExample,
  tierName,
} from './ratingFormat'

describe('числа рейтинга', () => {
  test('индекс — два знака после запятой', () => {
    expect(formatIndex(6.5)).toBe('6,50')
    expect(formatIndex(199.5)).toBe('199,50')
    expect(formatIndex(3.125)).toBe('3,13')
  })

  test('ровно половина округляется вверх и там, где double хранит её чуть меньше', () => {
    // 11,5 × 31 / 20 = 17,825, а в double это 17,82499…: toFixed(2) дал бы «17,82»
    expect(formatIndex((11.5 * 31) / 20)).toBe('17,83')
  })

  test('доля от лидера — процент с одним знаком, знак вплотную', () => {
    expect(formatShare(1)).toBe('100,0%')
    expect(formatShare(4.8 / 6.5)).toBe('73,8%')
  })

  test('средняя доля в сводке — тот же процент без знака', () => {
    expect(formatAverage(0.8256)).toBe('82,6')
  })

  test('урон — как в игре: диапазон, без разброса — одно число', () => {
    expect(formatDamage(4, 6)).toBe('4–6')
    expect(formatDamage(3, 3)).toBe('3')
  })

  test('сдвиг места с приростом: ▲ поднялось, ▼ опустилось, = на месте', () => {
    expect(placeShift(1, 13)).toEqual({ text: '▲12', kind: 'up' })
    expect(placeShift(3, 1)).toEqual({ text: '▼2', kind: 'down' })
    expect(placeShift(5, 5)).toEqual({ text: '=', kind: 'same' })
  })

  test('строка ранга — римской цифрой', () => {
    expect(tierName(3)).toBe('Ранг III')
  })
})

describe('строка под именем на узком экране', () => {
  const faunWarrior: RatedCreature = {
    id: 'faunwarrior',
    name: { ru: 'Фавн-мечница', en: 'Faun Warrior' },
    faction: 'grove',
    tier: 1,
    growth: 13,
    hp: 11,
    attack: 6,
    defense: 6,
    damageMin: 4,
    damageMax: 6,
  }

  test('фракция и характеристики из формулы категории, число не отрывается от подписи', () => {
    expect(metaLine(faunWarrior, 'Роща', 'damage', false)).toBe('Роща · атк 6 · урон 4–6')
    expect(metaLine(faunWarrior, 'Роща', 'hardiness', false)).toBe('Роща · здор. 11 · защ. 6')
  })

  test('у мощности — все четыре; с приростом — прирост после фракции', () => {
    expect(metaLine(faunWarrior, 'Роща', 'power', true)).toBe(
      'Роща · ×13 · атк 6 · урон 4–6 · здор. 11 · защ. 6',
    )
  })
})

describe('пример под сводкой', () => {
  /** Существо, у которого индекс урона равен урону: атака 0, урон без разброса. */
  const creature = (
    name: string,
    faction: FactionId,
    tier: number,
    damage: number,
  ): RatedCreature => ({
    id: name,
    name: { ru: name, en: name },
    faction,
    tier,
    growth: 1,
    hp: 1,
    attack: 0,
    defense: 0,
    damageMin: damage,
    damageMax: damage,
  })

  /** Пример для этих существ — по той же сводке, что увидел бы экран. */
  const exampleFor = (creatures: RatedCreature[]) => {
    const entries = rateUnits(creatures, 'damage', false)
    return summaryExample(creatures, entries, factionSummary(creatures, entries))
  }

  test('фракция примера — первая по сводке без лидера ранга, лидер назван прямо', () => {
    // I ранг: лидер — Альфа (Роща). Роща первая в сводке, но берём Рой: у него
    // доли 6 / 10 и 4 / 10 — в среднем 0,5. II ранг: у Роя 3 / 6 = 0,5,
    // поэтому его «Среднее» тоже 0,5
    const example = exampleFor([
      creature('Бета', 'grove', 1, 9),
      creature('Альфа', 'grove', 1, 10),
      creature('Дельта', 'hive', 1, 4),
      creature('Гамма', 'hive', 1, 6),
      creature('Эпсилон', 'grove', 2, 6),
      creature('Дзета', 'hive', 2, 3),
    ])

    expect(example).toBe(
      'Например, в I ранге 100% — это лидер ранга, Альфа (Роща). ' +
        'У фракции Рой здесь Гамма 60,0% и Дельта 40,0% — в среднем 50,0. ' +
        '«Среднее» — то же по всем рангам: 50,0.',
    )
  })

  test('если у первой строки лидера нет — пример по ней', () => {
    // лидер I ранга — Гамма из Роя, но первая в сводке Роща:
    // в I ранге у неё 0,9, во II — 1, в среднем 0,95; у Роя 1 и 1/3
    const example = exampleFor([
      creature('Альфа', 'grove', 1, 9),
      creature('Бета', 'grove', 1, 9),
      creature('Гамма', 'hive', 1, 10),
      creature('Дельта', 'grove', 2, 6),
      creature('Эпсилон', 'hive', 2, 2),
    ])

    expect(example).toBe(
      'Например, в I ранге 100% — это лидер ранга, Гамма (Рой). ' +
        'У фракции Роща здесь Альфа 90,0% и Бета 90,0% — в среднем 90,0. ' +
        '«Среднее» — то же по всем рангам: 95,0.',
    )
  })

  test('одно существо в ранге — его доля и есть число в ячейке', () => {
    // как при фильтре «Базовые»: у фракции в ранге одно существо
    const example = exampleFor([creature('Альфа', 'grove', 1, 10), creature('Гамма', 'hive', 1, 8)])

    expect(example).toBe(
      'Например, в I ранге 100% — это лидер ранга, Альфа (Роща). ' +
        'У фракции Рой здесь Гамма 80,0% — это и есть число в ячейке. ' +
        '«Среднее» — то же по всем рангам: 80,0.',
    )
  })

  test('лидеров несколько — названы все, пример по фракции без лидера', () => {
    const example = exampleFor([
      creature('Альфа', 'grove', 1, 10),
      creature('Гамма', 'hive', 1, 10),
      creature('Бета', 'schism', 1, 5),
    ])

    expect(example).toBe(
      'Например, в I ранге 100% — это лидеры ранга: Альфа (Роща) и Гамма (Рой). ' +
        'У фракции Раскол здесь Бета 50,0% — это и есть число в ячейке. ' +
        '«Среднее» — то же по всем рангам: 50,0.',
    )
  })

  test('лидеры у всех фракций — пример по первой строке', () => {
    const example = exampleFor([creature('Альфа', 'grove', 1, 7), creature('Гамма', 'hive', 1, 7)])

    expect(example).toContain('У фракции Роща здесь Альфа 100,0%')
  })

  test('трёх существ перечисляет через запятую и «и»', () => {
    const example = exampleFor([
      creature('Лидер', 'hive', 1, 10),
      creature('Альфа', 'grove', 1, 8),
      creature('Бета', 'grove', 1, 6),
      creature('Гамма', 'grove', 1, 4),
    ])

    expect(example).toContain('Альфа 80,0%, Бета 60,0% и Гамма 40,0% — в среднем 60,0.')
  })

  test('пустая сводка — примера нет', () => {
    expect(exampleFor([])).toBeNull()
  })
})
