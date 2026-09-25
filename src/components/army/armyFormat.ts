import type { ArmyPlaces } from '../../domain/types'
import { lang, t } from '../../i18n'
import { ROMAN } from '../roman'

/**
 * Числа и подписи экрана армий. Расчёт отдаёт дробные индексы —
 * округляются они только здесь, при показе.
 */

/** Колонки сравнения в порядке показа: в итогах армии и в таблице «Итога». */
export const ARMY_METRICS: Array<{ key: keyof ArmyPlaces; label: string }> = [
  { key: 'damage', label: t.damageIndex },
  { key: 'hardiness', label: t.hardinessIndex },
  { key: 'power', label: t.powerIndex },
]

/** Прочерк вместо индексов пустой армии: ноль читался бы как результат. */
export const NO_VALUE = '—'

/**
 * «Армия III». Номер — место в списке: убрали армию из середины — номера
 * следующих сдвигаются, пропусков не бывает.
 */
export const armyName = (index: number) => `${t.army} ${ROMAN[index]}`

const INTEGER = new Intl.NumberFormat(lang, { maximumFractionDigits: 0 })
const ONE_DIGIT = new Intl.NumberFormat(lang, { maximumSignificantDigits: 1 })

/**
 * Целое с разрядами, как в макете: 1777,5 → «1 778». Между разрядами —
 * неразрывный пробел, число не разорвётся переносом строки.
 */
export const formatInteger = (value: number) => INTEGER.format(value)

/**
 * Отставание от лучшего в колонке: доля 0,96 → «(−4%)».
 *
 * Меньше процента — одной значащей цифрой: 0,4% → «(−0,4%)», 0,04% →
 * «(−0,04%)». Целое округлило бы их до «−0%», и армия выглядела бы
 * равной лучшей, хотя лидер в колонке один. Точное равенство сюда
 * не попадает: у равных лидеров процента нет вовсе.
 */
export function formatLag(share: number): string {
  const percent = (1 - share) * 100
  const value = percent < 1 ? ONE_DIGIT.format(percent) : formatInteger(percent)
  return `(−${value}%)`
}

/** Номера армий перечислением: [0, 1, 2] → «I, II и III». */
export function joinArmyNumbers(indexes: number[]): string {
  const numbers = indexes.map((index) => ROMAN[index])
  if (numbers.length < 2) return numbers.join('')
  return `${numbers.slice(0, -1).join(', ')} ${t.and} ${numbers[numbers.length - 1]}`
}
