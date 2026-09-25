import { describe, expect, test } from 'vitest'
import { ARMY_RULES } from '../../domain/rules'
import { ROMAN } from '../roman'
import { armyName, formatInteger } from './armyFormat'

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

  test('римских цифр хватает на все армии', () => {
    // подняли предел армий выше длины ROMAN — допиши массив, иначе у армии не будет номера
    expect(ROMAN.length).toBeGreaterThanOrEqual(ARMY_RULES.maxArmies)
  })
})
