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

/**
 * Целое с разрядами, как в макете: 1777,5 → «1 778». Между разрядами —
 * неразрывный пробел, число не разорвётся переносом строки.
 */
export const formatInteger = (value: number) => INTEGER.format(value)
