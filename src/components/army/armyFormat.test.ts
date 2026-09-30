import { describe, expect, test } from 'vitest'
import { CREATURE_TEMPLATES } from '../../data/creatures'
import { ARMY_RULES } from '../../domain/rules'
import { lang } from '../../i18n'
import { ROMAN } from '../roman'
import {
  armyName,
  creatureName,
  formatInteger,
  formatLag,
  joinList,
  troopName,
} from './armyFormat'

describe('подписи экрана армий', () => {
  test('индекс — целое, половина округляется вверх, разряды через неразрывный пробел', () => {
    expect(formatInteger(307.5)).toBe('308')
    expect(formatInteger(1777.5)).toBe('1 778')
    expect(formatInteger(12345.4)).toBe('12 345')
  })

  test('армии нумеруются римскими цифрами по месту в списке', () => {
    expect(armyName(0)).toBe('Армия I')
    expect(armyName(2)).toBe('Армия III')
  })

  test('отставание — целыми процентами, как в макете', () => {
    // доли из макета: 307,5 / 319,8 и 895,2 / 1777,5
    expect(formatLag(0.9615)).toBe('(−4%)')
    expect(formatLag(0.5036)).toBe('(−50%)')
    expect(formatLag(0.97)).toBe('(−3%)')
  })

  test('меньше процента — одной значащей цифрой, но не «−0%»', () => {
    expect(formatLag(0.996)).toBe('(−0,4%)')
    expect(formatLag(0.9996)).toBe('(−0,04%)')
    // 0,97% округляется до целого процента — формат совпадает с соседями
    expect(formatLag(0.9903)).toBe('(−1%)')
  })

  test('перечисление в вердикте — через запятую и «и»', () => {
    expect(joinList(['I'])).toBe('I')
    expect(joinList(['I', 'II'])).toBe('I и II')
    expect(joinList(['I', 'III', 'IV'])).toBe('I, III и IV')
  })

  test('римских цифр хватает на все армии', () => {
    // подняли предел армий выше длины ROMAN — допиши массив, иначе у армии не будет номера
    expect(ROMAN.length).toBeGreaterThanOrEqual(ARMY_RULES.maxArmies)
  })
})

describe('подписи отрядов', () => {
  // существо — любое из справочника: тест не завязан на его имя
  const [creature] = CREATURE_TEMPLATES
  const name = creature.name[lang]

  test('имя существа — из справочника, неизвестный id — как есть', () => {
    expect(creatureName(creature.id)).toBe(name)
    expect(creatureName('nosuchcreature')).toBe('nosuchcreature')
  })

  test('отряд в вердикте — имя и количество в скобках', () => {
    expect(troopName({ creatureId: creature.id, count: 8 })).toBe(`${name} (8\u00a0шт)`)
  })

  test('количество — с разрядами, «шт» не отрывается от числа', () => {
    // оба пробела неразрывные: и между разрядами, и перед «шт»
    expect(troopName({ creatureId: creature.id, count: 1500 })).toBe(`${name} (1\u00a0500\u00a0шт)`)
  })
})
