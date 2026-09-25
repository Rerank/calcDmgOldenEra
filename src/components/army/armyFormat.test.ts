import { describe, expect, test } from 'vitest'
import { ARMY_RULES } from '../../domain/rules'
import { ROMAN } from '../roman'
import { armyName, formatInteger, formatLag, joinArmyNumbers } from './armyFormat'

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

  test('номера армий в вердикте — перечислением через «и»', () => {
    expect(joinArmyNumbers([0])).toBe('I')
    expect(joinArmyNumbers([0, 1])).toBe('I и II')
    expect(joinArmyNumbers([0, 2, 3])).toBe('I, III и IV')
  })

  test('римских цифр хватает на все армии', () => {
    // подняли предел армий выше длины ROMAN — допиши массив, иначе у армии не будет номера
    expect(ROMAN.length).toBeGreaterThanOrEqual(ARMY_RULES.maxArmies)
  })
})
