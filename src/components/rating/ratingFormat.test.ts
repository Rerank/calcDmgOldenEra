import { describe, expect, test } from 'vitest'
import type { RatedCreature } from '../../state/rating'
import {
  formatAverage,
  formatDamage,
  formatIndex,
  formatShare,
  metaLine,
  placeShift,
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
