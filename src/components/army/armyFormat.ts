import { findTemplate } from '../../data/creatures'
import type { Metric } from '../../domain/types'
import { lang, t } from '../../i18n'
import type { Troop } from '../../state/armyTransitions'
import { ROMAN } from '../roman'

/**
 * Числа и подписи экрана армий. Расчёт отдаёт дробные индексы —
 * округляются они только здесь, при показе.
 */

/** Колонки сравнения в порядке показа: в итогах армии и в таблице «Итога». */
export const ARMY_METRICS: Array<{ key: Metric; label: string }> = [
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

/** Имя существа на языке интерфейса. Неизвестный id — как есть: подпись не останется пустой. */
export const creatureName = (id: string) => findTemplate(id)?.name[lang] ?? id

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

/**
 * Отряд в вердикте «Итога»: «Наяда (8 шт)». Количество — часть имени:
 * в армии бывает два отряда одного существа. Между числом и «шт» —
 * неразрывный пробел, «шт» не оторвётся переносом строки.
 */
export const troopName = (troop: Troop) =>
  `${creatureName(troop.creatureId)} (${formatInteger(troop.count)}\u00a0${t.pcs})`

/** Перечисление для вердикта: [«I», «II», «III»] → «I, II и III». */
export function joinList(items: string[]): string {
  if (items.length < 2) return items.join('')
  return `${items.slice(0, -1).join(', ')} ${t.and} ${items[items.length - 1]}`
}
