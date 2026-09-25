import type { ArmyComparison, ArmyStats, ArmyVerdict } from '../../domain/types'
import { t } from '../../i18n'
import {
  ARMY_METRICS,
  armyName,
  formatInteger,
  formatLag,
  joinArmyNumbers,
  NO_VALUE,
} from './armyFormat'
// Панель — микс с result-panel, как и панели армий: это тот же «Итог»,
// что в калькуляторе. Импорт раньше своих стилей — свои должны перекрывать его.
import '../result-panel.css'
import './army-summary.css'
import './army-table.css'

type Props = {
  stats: ArmyStats[]
  comparison: ArmyComparison
}

/**
 * «Итог» сравнения: вердикт в шапке и таблица армий по трём индексам.
 *
 * У каждого значения — полоска длиной с долю от лучшего в колонке и процент
 * отставания от него. Считаются они от одной точки, поэтому не спорят.
 * У лучшего в колонке процента нет, число выделено цветом метрики.
 *
 * Показывается, только когда сравнивать есть что — это решает экран.
 */
export function ArmySummary({ stats, comparison }: Props) {
  return (
    <section className="result-panel army-summary">
      <header className="result-panel__header army-summary__header">
        <h2 className="result-panel__title">{t.resultTitle}</h2>
        <Verdict verdict={comparison.verdict} />
      </header>

      <div className="army-summary__body">
        <table className="army-table">
          <colgroup>
            <col className="army-table__col-label" />
            {ARMY_METRICS.map(({ key }) => (
              <col key={key} />
            ))}
          </colgroup>

          <thead>
            <tr>
              <td className="army-table__corner" />
              {ARMY_METRICS.map(({ key, label }) => (
                <th key={key} className={`army-table__head army-table__head--${key}`} scope="col">
                  {label}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {comparison.places.map((places, index) => {
              // пустая армия ни с кем не соревнуется: прочерк и пустая полоска
              const filled = stats[index].count > 0

              return (
                <tr key={index}>
                  <th className="army-table__label" scope="row">
                    {armyName(index)}
                  </th>

                  {ARMY_METRICS.map(({ key }) => {
                    const { share, leader } = places[key]
                    const cls = [
                      'army-table__cell',
                      `army-table__cell--${key}`,
                      leader && 'army-table__cell--leader',
                    ]
                      .filter(Boolean)
                      .join(' ')

                    return (
                      <td key={key} className={cls}>
                        <span className="army-table__value">
                          {filled && !leader && (
                            <>
                              <span className="army-table__diff">{formatLag(share)}</span>{' '}
                            </>
                          )}
                          {filled ? formatInteger(stats[index][key]) : NO_VALUE}
                        </span>
                        <span className="army-table__bar">
                          <span className="army-table__fill" style={{ width: `${share * 100}%` }} />
                        </span>
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>

        <p className="army-summary__note">{t.armyNote}</p>
      </div>
    </section>
  )
}

/** «Сильнейшая армия — Армия I» или «Армии I и II примерно равны». */
function Verdict({ verdict }: { verdict: ArmyVerdict }) {
  if (verdict.kind === 'leader') {
    return (
      <p className="army-summary__verdict">
        {t.strongestArmy} <b className="army-summary__leader">{armyName(verdict.army)}</b>
      </p>
    )
  }

  if (verdict.kind === 'tie') {
    return (
      <p className="army-summary__verdict">
        {t.armiesPlural}{' '}
        <b className="army-summary__leader">{joinArmyNumbers(verdict.armies)}</b>{' '}
        {t.roughlyEqual}
      </p>
    )
  }

  return null
}
