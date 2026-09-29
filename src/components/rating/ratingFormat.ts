import attackIcon from '../../assets/images/attack.webp'
import defenseIcon from '../../assets/images/defense.webp'
import powerIcon from '../../assets/images/power.webp'
import type { Metric } from '../../domain/types'

/**
 * Числа и подписи экрана рейтинга. Расчёт отдаёт дробные индексы и доли —
 * округляются они только здесь, при показе.
 */

/** Категории в порядке показа — как колонки «Итога» у армий. */
export const METRICS: Metric[] = ['damage', 'hardiness', 'power']

/** Значок категории: у урона и живучести — те же, что у сторон боя в калькуляторе. */
export const METRIC_ICONS: Record<Metric, string> = {
  damage: attackIcon,
  hardiness: defenseIcon,
  power: powerIcon,
}
