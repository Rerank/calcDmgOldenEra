import type { Metric } from '../../domain/types'
import { t } from '../../i18n'
import { METRIC_ICONS } from './ratingFormat'
import './rating-category.css'

type Props = {
  metric: Metric
  active: boolean
  onSelect: () => void
}

/**
 * Карточка категории: значок, название и описание. Цвет у каждой карточки
 * свой — по её метрике, — выбранная обведена им.
 */
export function RatingCategory({ metric, active, onSelect }: Props) {
  const { title, desc } = t.ratingCategories[metric]
  const cls = ['rating-category', `rating-category--${metric}`, active && 'rating-category--active']
    .filter(Boolean)
    .join(' ')

  return (
    <button className={cls} type="button" aria-pressed={active} onClick={onSelect}>
      <span className="rating-category__head">
        <img className="rating-category__icon" src={METRIC_ICONS[metric]} alt="" />
        <span className="rating-category__title">{title}</span>
      </span>
      <span className="rating-category__desc">{desc}</span>
    </button>
  )
}
