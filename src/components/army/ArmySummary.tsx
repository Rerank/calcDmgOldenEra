import type { ArmyComparison, ArmyStats, ArmyVerdict } from '../../domain/types'
import { t } from '../../i18n'
import type { Troop } from '../../state/armyTransitions'
import { ROMAN } from '../roman'
import {
  ARMY_METRICS,
  armyName,
  creatureName,
  formatInteger,
  formatLag,
  joinList,
  NO_VALUE,
  troopName,
} from './armyFormat'
// Панель — микс с result-panel, как и панели армий: это тот же «Итог»,
// что в калькуляторе. Импорт раньше своих стилей — свои должны перекрывать его.
import '../result-panel.css'
import './army-summary.css'
import './army-table.css'

type Props = {
  /** отряды, которые сравнивает «Итог»; null — сравниваются армии */
  troops: Troop[] | null
  /** итоги строк — армий или отрядов, в том же порядке */
  stats: ArmyStats[]
  comparison: ArmyComparison
}

/**
 * «Итог» сравнения: вердикт в шапке и таблица по трём индексам. Строки
 * таблицы — армии, а если существа есть только в одной армии — её отряды.
 *
 * У каждого значения — полоска длиной с долю от лучшего в колонке и процент
 * отставания от него. Считаются они от одной точки, поэтому не спорят.
 * У лучшего в колонке процента нет, число выделено цветом метрики.
 *
 * Показывается, только когда сравнивать есть что — это решает экран.
 */
export function ArmySummary({ troops, stats, comparison }: Props) {
  return (
    <section className="result-panel army-summary">
      <header className="result-panel__header army-summary__header">
        <h2 className="result-panel__title">{t.resultTitle}</h2>
        <Verdict verdict={comparison.verdict} troops={troops} />
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
              const troop = troops?.[index]

              return (
                <tr key={index}>
                  <th className="army-table__label" scope="row">
                    {troop ? <TroopLabel troop={troop} /> : armyName(index)}
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

        <p className="army-summary__note">{troops ? t.troopNote : t.armyNote}</p>
      </div>
    </section>
  )
}

/** Отряд в строке таблицы: имя, под ним количество — как численность в шапке армии. */
function TroopLabel({ troop }: { troop: Troop }) {
  return (
    <>
      {creatureName(troop.creatureId)}
      <span className="army-table__count">
        {formatInteger(troop.count)}&nbsp;{t.pcs}
      </span>
    </>
  )
}

/**
 * Армии: «Сильнейшая армия — Армия I» или «Армии I и II примерно равны».
 * Отряды: «Сильнейший отряд — Наяда (8 шт)» или «Отряды Хмелёк (15 шт)
 * и Наяда (8 шт) примерно равны».
 */
function Verdict({ verdict, troops }: { verdict: ArmyVerdict; troops: Troop[] | null }) {
  if (verdict.kind === 'leader') {
    return (
      <p className="army-summary__verdict">
        {troops ? t.strongestTroop : t.strongestArmy}{' '}
        <b className="army-summary__leader">
          {troops ? troopName(troops[verdict.army]) : armyName(verdict.army)}
        </b>
      </p>
    )
  }

  if (verdict.kind === 'tie') {
    // армии после «Армии» — одними номерами, отряды — целиком, с количеством
    const names = verdict.armies.map((index) => (troops ? troopName(troops[index]) : ROMAN[index]))

    return (
      <p className="army-summary__verdict">
        {troops ? t.troopsPlural : t.armiesPlural}{' '}
        <b className="army-summary__leader">{joinList(names)}</b> {t.roughlyEqual}
      </p>
    )
  }

  return null
}
