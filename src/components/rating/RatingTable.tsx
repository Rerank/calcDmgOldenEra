import type { Metric } from '../../domain/types'
import { lang, t } from '../../i18n'
import type { RatingSort, SortKey } from '../../state/ratingTransitions'
import { creatureIcon } from '../creatureIcons'
import {
  factionName,
  formatGrowth,
  formatIndex,
  formatShare,
  formatStat,
  metaLine,
  placeShift,
  STATS,
  tierName,
  USED_STATS,
} from './ratingFormat'
import type { RatingGroup, RatingRow } from './ratingRows'
import './rating-table.css'

type Props = {
  groups: RatingGroup[]
  metric: Metric
  weekly: boolean
  sort: RatingSort
  onSort: (key: SortKey) => void
  /** id заголовка панели — он же подпись таблицы */
  labelledBy: string
}

/** Столбец: по чему сортирует, подпись и модификатор заголовка. */
type Column = { key: SortKey; label: string; head: string }

const column = (key: SortKey, label: string, head: string): Column => ({ key, label, head })

/** Столбцы в порядке показа. С приростом их два лишних: «Прирост» и «Поштучно». */
function columnsOf(weekly: boolean): Column[] {
  const c = t.ratingColumns

  return [
    column('place', c.place, 'place'),
    column('name', c.name, 'name'),
    column('faction', c.faction, 'faction'),
    ...STATS.map((stat) => column(stat, t.ratingStats[stat], 'stat')),
    ...(weekly ? [column('growth', c.growth, 'growth')] : []),
    column('value', weekly ? c.valueWeekly : c.value, 'index'),
    column('share', c.share, 'percent'),
    ...(weekly ? [column('solo', c.solo, 'solo')] : []),
  ]
}

/** Места 1–3 выделены цветом. */
const TOP_PLACES = 3

/**
 * Таблица рейтинга: блок на каждый ранг — строка ранга, заголовки
 * столбцов и существа. Заголовки повторяются в каждом блоке, чтобы при
 * прокрутке длинной таблицы смысл цифр не терялся, но сортировка одна
 * на всех: строки сортируются внутри своего ранга.
 *
 * На узком экране видны только место, существо и индекс. Остальное
 * переезжает в те же ячейки: фракция и характеристики — строкой под имя,
 * доля — под индекс, сдвиг места — под место. Эти элементы в разметке
 * всегда, какие из них видны — решает CSS.
 */
export function RatingTable({ groups, metric, weekly, sort, onSort, labelledBy }: Props) {
  const columns = columnsOf(weekly)

  return (
    <table
      className={'rating-table' + (weekly ? ' rating-table--weekly' : '')}
      aria-labelledby={labelledBy}
    >
      {groups.map(({ tier, rows }) => (
        <tbody key={tier} className="rating-table__group">
          <tr>
            <th className="rating-table__rank" colSpan={columns.length} scope="rowgroup">
              <span className="rating-table__rank-name">{tierName(tier)}</span>
            </th>
          </tr>
          <tr>
            {columns.map((col) => (
              <SortHeader key={col.key} column={col} sort={sort} onSort={onSort} />
            ))}
          </tr>
          {rows.map((row) => (
            <Row key={row.creature.id} row={row} metric={metric} weekly={weekly} />
          ))}
        </tbody>
      ))}
    </table>
  )
}

/**
 * Заголовок столбца. Сортирует кнопка внутри него — так до неё достаёт
 * клавиатура; направление видно по стрелке и слышно по aria-sort.
 */
function SortHeader({
  column: { key, label, head },
  sort,
  onSort,
}: {
  column: Column
  sort: RatingSort
  onSort: (key: SortKey) => void
}) {
  const sorted = sort.key === key
  const cls = [
    'rating-table__head',
    `rating-table__head--${head}`,
    sorted && `rating-table__head--sort-${sort.dir}`,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <th
      className={cls}
      scope="col"
      aria-sort={sorted ? (sort.dir === 'asc' ? 'ascending' : 'descending') : undefined}
    >
      <button className="rating-table__sort" type="button" onClick={() => onSort(key)}>
        {label}
      </button>
    </th>
  )
}

function Row({
  row: { creature, entry },
  metric,
  weekly,
}: {
  row: RatingRow
  metric: Metric
  weekly: boolean
}) {
  const faction = factionName(creature.faction)
  const used = USED_STATS[metric]
  const shift = placeShift(entry.place, entry.soloPlace)
  const icon = creatureIcon(creature.id)

  return (
    <tr>
      <td className="rating-table__cell rating-table__cell--place">
        <span
          className={
            'rating-table__place' + (entry.place <= TOP_PLACES ? ' rating-table__place--top' : '')
          }
        >
          {entry.place}
        </span>
        {weekly && <Shift {...shift} narrow />}
      </td>

      <td className="rating-table__cell rating-table__cell--name">
        <span className="rating-table__creature">
          {/* имя рядом, поэтому alt пустой; lazy — пока экран скрыт или строка
              далеко внизу, картинка не грузится */}
          {icon && <img className="rating-table__icon" src={icon} alt="" loading="lazy" />}
          <span className="rating-table__names">
            <span className="rating-table__name">{creature.name[lang]}</span>
            {/* английское имя — подсказка тем, кто играет на английском */}
            {lang !== 'en' && <span className="rating-table__name-en">{creature.name.en}</span>}
            <span className="rating-table__meta">{metaLine(creature, faction, metric, weekly)}</span>
          </span>
        </span>
      </td>

      <td className="rating-table__cell rating-table__cell--faction">{faction}</td>

      {STATS.map((stat) => (
        <td
          key={stat}
          className={
            'rating-table__cell rating-table__cell--stat' +
            (used.includes(stat) ? ' rating-table__cell--used' : '')
          }
        >
          {formatStat(creature, stat)}
        </td>
      ))}

      {/* прирост, когда он виден, участвует в расчёте всегда */}
      {weekly && (
        <td className="rating-table__cell rating-table__cell--growth rating-table__cell--used">
          {formatGrowth(creature.growth)}
        </td>
      )}

      <td className="rating-table__cell rating-table__cell--index">
        <span className="rating-table__value">{formatIndex(entry.value)}</span>
        <Share share={entry.share} narrow />
      </td>

      <td className="rating-table__cell rating-table__cell--percent">
        <Share share={entry.share} />
      </td>

      {weekly && (
        <td className="rating-table__cell rating-table__cell--solo">
          <span className="rating-table__solo">
            <span className="rating-table__solo-place">{entry.soloPlace}</span>
            <Shift {...shift} />
          </span>
        </td>
      )}
    </tr>
  )
}

/** Доля от лидера ранга: полоска и процент. narrow — копия под индексом для узкого экрана. */
function Share({ share, narrow = false }: { share: number; narrow?: boolean }) {
  return (
    <span className={'rating-table__share' + (narrow ? ' rating-table__share--narrow' : '')}>
      <span className="rating-table__bar">
        <span className="rating-table__fill" style={{ width: `${share * 100}%` }} />
      </span>
      <span className="rating-table__percent">{formatShare(share)}</span>
    </span>
  )
}

/** Сдвиг места с приростом. narrow — копия под местом для узкого экрана. */
function Shift({
  text,
  kind,
  narrow = false,
}: ReturnType<typeof placeShift> & { narrow?: boolean }) {
  const cls = [
    'rating-table__delta',
    kind !== 'same' && `rating-table__delta--${kind}`,
    narrow && 'rating-table__delta--narrow',
  ]
    .filter(Boolean)
    .join(' ')

  return <span className={cls}>{text}</span>
}
