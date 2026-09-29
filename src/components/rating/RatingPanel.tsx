import type { Metric } from '../../domain/types'
import { t } from '../../i18n'
import type { RatingSort, SortKey } from '../../state/ratingTransitions'
import { METRIC_ICONS } from './ratingFormat'
import type { RatingGroup } from './ratingRows'
import { RatingTable } from './RatingTable'
// Панель — микс с result-panel: фон, рамку, тень и шапку даёт он.
// Импорт раньше своих стилей — свои правила должны идти после и перекрывать его.
import '../result-panel.css'
import './rating-panel.css'

type Props = {
  metric: Metric
  weekly: boolean
  groups: RatingGroup[]
  sort: RatingSort
  onSort: (key: SortKey) => void
}

/** id заголовка: он же подпись таблицы для скринридера */
const TITLE_ID = 'rating-table-title'

/**
 * Панель рейтинга: значок и заголовок категории, таблица и примечание.
 * Выглядит как результаты калькулятора и «Итог» армий.
 */
export function RatingPanel({ metric, weekly, groups, sort, onSort }: Props) {
  const titles = t.ratingCategories[metric]

  return (
    <section className="result-panel rating-panel">
      <header className="result-panel__header">
        <div className="rating-panel__heading">
          <img className="rating-panel__icon" src={METRIC_ICONS[metric]} alt="" />
          <h2 className="result-panel__title" id={TITLE_ID}>
            {weekly ? titles.tableWeekly : titles.table}
          </h2>
        </div>
      </header>

      <div className="rating-panel__scroll">
        {groups.length > 0 ? (
          <RatingTable
            groups={groups}
            metric={metric}
            weekly={weekly}
            sort={sort}
            onSort={onSort}
            labelledBy={TITLE_ID}
          />
        ) : (
          // Защита на случай новых данных: сейчас в каждом ранге есть
          // все фракции, и фильтры пустоты не дают
          <p className="rating-panel__empty">{t.ratingEmpty}</p>
        )}
      </div>

      <p className="rating-panel__note">
        {weekly ? `${t.ratingNote} ${t.ratingNoteWeekly}` : t.ratingNote}
      </p>
    </section>
  )
}
