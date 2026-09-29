import attackIcon from '../../assets/images/attack.webp'
import defenseIcon from '../../assets/images/defense.webp'
import powerIcon from '../../assets/images/power.webp'
import { FACTIONS } from '../../data/creatures'
import type { Metric, RatingEntry, RatingSummary } from '../../domain/types'
import { fill, lang, t } from '../../i18n'
import type { RatedCreature } from '../../state/rating'
import { ROMAN } from '../roman'

/**
 * Числа и подписи экрана рейтинга. Расчёт отдаёт дробные индексы и доли —
 * округляются они только здесь, при показе.
 *
 * Округляет только Intl, не toFixed. Индекс 17,825 в double хранится как
 * 17,82499…, и toFixed(2) дал бы «17,82», а Intl округляет кратчайшую
 * запись числа — «17,825» — и даёт «17,83», как посчитал бы человек.
 */

/** Категории в порядке показа — как колонки «Итога» у армий. */
export const METRICS: Metric[] = ['damage', 'hardiness', 'power']

/** Значок категории: у урона и живучести — те же, что у сторон боя в калькуляторе. */
export const METRIC_ICONS: Record<Metric, string> = {
  damage: attackIcon,
  hardiness: defenseIcon,
  power: powerIcon,
}

/** Характеристика существа — столбцы «Атк», «Урон», «Здор.», «Защ.» в этом порядке. */
export type Stat = 'attack' | 'damage' | 'hp' | 'defense'

export const STATS: Stat[] = ['attack', 'damage', 'hp', 'defense']

/** Характеристики из формулы категории: в таблице они тёмные, на узком экране — строкой под именем. */
export const USED_STATS: Record<Metric, Stat[]> = {
  damage: ['attack', 'damage'],
  hardiness: ['hp', 'defense'],
  power: ['attack', 'damage', 'hp', 'defense'],
}

const TWO_DIGITS = new Intl.NumberFormat(lang, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const ONE_DIGIT = new Intl.NumberFormat(lang, { minimumFractionDigits: 1, maximumFractionDigits: 1 })

/** Индекс — два знака после запятой: 6,5 → «6,50». */
export const formatIndex = (value: number) => TWO_DIGITS.format(value)

/**
 * Доля от лидера в процентах, один знак: 0,738 → «73,8%». Знак процента —
 * вплотную: процентный стиль Intl поставил бы перед ним пробел.
 */
export const formatShare = (share: number) => `${ONE_DIGIT.format(share * 100)}%`

/** Средняя доля в сводке — те же проценты, но без знака: 0,826 → «82,6». */
export const formatAverage = (share: number) => ONE_DIGIT.format(share * 100)

/** Урон как в игре: «4–6», без разброса — одно число. */
export const formatDamage = (min: number, max: number) => (min === max ? String(min) : `${min}–${max}`)

/** Недельный прирост: «×13». */
export const formatGrowth = (growth: number) => `×${growth}`

/** Значение характеристики для таблицы. */
export const formatStat = (creature: RatedCreature, stat: Stat) =>
  stat === 'damage' ? formatDamage(creature.damageMin, creature.damageMax) : String(creature[stat])

/** Название фракции по id: сводка получает id строкой из расчёта, таблица — из справочника. */
export const factionName = (id: string) =>
  FACTIONS.find((faction) => faction.id === id)?.name[lang] ?? id

/** «Ранг III» — строка над блоком ранга. */
export const tierName = (tier: number) => `${t.tier} ${ROMAN[tier - 1]}`

/**
 * Насколько сдвинулось место с приростом относительно места поштучно:
 * ▲ поднялось, ▼ опустилось, «=» — осталось.
 */
export function placeShift(place: number, soloPlace: number) {
  const shift = soloPlace - place
  if (shift > 0) return { text: `▲${shift}`, kind: 'up' as const }
  if (shift < 0) return { text: `▼${-shift}`, kind: 'down' as const }
  return { text: '=', kind: 'same' as const }
}

/** Перечисление через запятую и «и» перед последним: «А, Б и В». */
function joinList(items: string[]) {
  if (items.length < 2) return items.join('')
  return `${items.slice(0, -1).join(', ')} ${t.and} ${items[items.length - 1]}`
}

/**
 * Пример под сводкой — как получилось число в ячейке: первая строка
 * (сильнейшая фракция) и первый ранг. Собирается из того же рейтинга, что
 * и сводка, поэтому следует за категорией, видом существ и приростом
 * и не устареет, если поменяются числа в справочнике.
 *
 * Существа — от сильнейшего, с долями как в таблице. Доли округлены,
 * а среднее посчитано по точным — пересчёт по округлённым может разойтись
 * с ним на 0,1. null — сводка пустая, показывать нечего.
 *
 * creatures и entries — рейтинг в том же порядке, по которому посчитана сводка.
 */
export function summaryExample(
  creatures: RatedCreature[],
  entries: RatingEntry[],
  summary: RatingSummary,
): string | null {
  const [row] = summary.rows
  const [tier] = summary.tiers
  const cell = row?.cells[0]
  if (!row || !cell) return null

  const members = creatures
    .flatMap((creature, i) =>
      creature.faction === row.faction && creature.tier === tier
        ? [{ name: creature.name[lang], share: entries[i].share }]
        : [],
    )
    .sort((a, b) => b.share - a.share)
    .map(({ name, share }) => `${name} ${formatShare(share)}`)

  const example = fill(members.length > 1 ? t.summaryExample : t.summaryExampleSingle, {
    faction: factionName(row.faction),
    tier: ROMAN[tier - 1],
    creatures: joinList(members),
    share: formatAverage(cell.share),
  })

  return `${example} ${fill(t.summaryExampleAverage, { average: formatAverage(row.average) })}`
}

/**
 * Строка под именем на узком экране, где столбцы характеристик спрятаны:
 * фракция, прирост, если он учитывается, и характеристики из формулы
 * категории — «Роща · ×13 · атк 6 · урон 4–6». Между подписью и числом —
 * неразрывный пробел: перенос их не разорвёт.
 */
export function metaLine(creature: RatedCreature, faction: string, metric: Metric, weekly: boolean) {
  const stats = USED_STATS[metric].map((stat) => `${t.ratingStats[stat]} ${formatStat(creature, stat)}`)
  return [faction, ...(weekly ? [formatGrowth(creature.growth)] : []), ...stats].join(' · ')
}
