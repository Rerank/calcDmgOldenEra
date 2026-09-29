import type { Metric } from '../../domain/types'
import { t } from '../../i18n'
import { RatingCategory } from './RatingCategory'
import { METRICS } from './ratingFormat'
import './rating-categories.css'

type Props = {
  metric: Metric
  onChange: (metric: Metric) => void
}

/**
 * Выбор категории — главный выбор экрана, выбрана ровно одна. Группа кнопок,
 * а не навигация: навигация у сайта уже есть — AppNav.
 *
 * На узком экране карточки сжимаются до значка и названия, а описание
 * выбранной встаёт под ними. Оно в разметке всегда — показывает его CSS.
 */
export function RatingCategories({ metric, onChange }: Props) {
  return (
    <div className="rating-categories">
      <div className="rating-categories__list" role="group" aria-label={t.ratingCategory}>
        {METRICS.map((key) => (
          <RatingCategory
            key={key}
            metric={key}
            active={key === metric}
            onSelect={() => onChange(key)}
          />
        ))}
      </div>
      <p className="rating-categories__hint">{t.ratingCategories[metric].desc}</p>
    </div>
  )
}
