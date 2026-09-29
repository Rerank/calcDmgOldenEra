import type { Metric, RatingSummary as Summary, SummaryCell } from '../../domain/types'
import { t } from '../../i18n'
import type { CreatureKind } from '../../state/ratingTransitions'
import { ROMAN } from '../roman'
import { factionName, formatAverage } from './ratingFormat'
// Панель — микс с result-panel: фон, рамку, тень и шапку даёт он.
// Импорт раньше своих стилей — свои правила должны идти после и перекрывать его.
import '../result-panel.css'
import './rating-summary.css'

type Props = {
  summary: Summary
  metric: Metric
  /** среди кого считана сводка — видно в шапке, если выбраны не все */
  kind: CreatureKind
  weekly: boolean
  /** пример под сводкой: как получилось число в ячейке — см. summaryExample */
  example: string | null
  /** выбраны не все фракции: лучшая и худшая — среди показанных, и примечание говорит об этом */
  someFactions: boolean
}

/** Прочерк вместо доли, если у фракции нет существ этого ранга: ноль читался бы как результат. */
const NO_VALUE = '—'

const cellClass = (cell: SummaryCell | null) =>
  [
    'rating-summary__cell',
    cell?.best && 'rating-summary__cell--best',
    cell?.worst && 'rating-summary__cell--worst',
  ]
    .filter(Boolean)
    .join(' ')

/**
 * Сводка по фракциям: в ячейке — средний % от лидера у существ фракции
 * в ранге, справа — среднее по рангам, фракции — по нему. Следует
 * за категорией, видом существ и приростом; ранг и фракция выбирают
 * столбцы и строки. Под таблицей — пример на живых числах.
 *
 * Показывается, только когда сравнивать есть что, — это решает экран.
 * На узком экране ранги прокручиваются вбок, а фракция и «Среднее»
 * закреплены по краям.
 */
export function RatingSummary({
  summary,
  metric,
  kind,
  weekly,
  example,
  someFactions,
}: Props) {
  const category = t.ratingCategories[metric]
  const aside = [
    t.summaryAside,
    weekly ? category.summaryWeekly : category.summary,
    ...(kind === 'all' ? [] : [t.summaryKinds[kind]]),
  ]

  return (
    <section className="result-panel rating-summary">
      <header className="result-panel__header rating-summary__header">
        <h2 className="result-panel__title">{t.summaryTitle}</h2>
        <span className="rating-summary__aside">{aside.join(' · ')}</span>
      </header>

      <div className="rating-summary__scroll">
        <table className="rating-summary__table">
          <thead>
            <tr>
              <th className="rating-summary__head rating-summary__head--label" scope="col">
                {t.faction}
              </th>
              {summary.tiers.map((tier) => (
                <th key={tier} className="rating-summary__head" scope="col">
                  {ROMAN[tier - 1]}
                </th>
              ))}
              <th className="rating-summary__head rating-summary__head--average" scope="col">
                {t.summaryAverage}
              </th>
            </tr>
          </thead>

          <tbody>
            {summary.rows.map((row) => (
              <tr key={row.faction}>
                <th className="rating-summary__label" scope="row">
                  {factionName(row.faction)}
                </th>
                {row.cells.map((cell, i) => (
                  <td key={summary.tiers[i]} className={cellClass(cell)}>
                    {cell ? formatAverage(cell.share) : NO_VALUE}
                  </td>
                ))}
                <td className="rating-summary__cell rating-summary__cell--average">
                  {formatAverage(row.average)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="rating-summary__note">
        {[t.summaryNote, example, someFactions ? t.summaryBestSelected : t.summaryBest]
          .filter(Boolean)
          .join(' ')}
      </p>
    </section>
  )
}
