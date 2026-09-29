import { indicesOf, nearlyEqual, placeAmong, shareOf } from './indices'
import type { Metric, RatedUnit, RatingEntry, RatingSummary, SummaryCell } from './types'

/**
 * Рейтинг существ — то же сравнение, что у армий, в другом представлении:
 * существо — это армия из одного отряда. Поштучно — из одного существа,
 * с приростом — из недельного прироста. Поэтому индексы считает indices.ts,
 * а здесь только раскладка по рангам: места, доли от лидера и сводка
 * по фракциям.
 *
 * Существа сравниваются только внутри своего ранга: дракон и мечник
 * в одном списке ничего бы друг о друге не сказали.
 */

/** Индекс существа: одного или недельного отряда. */
const valueOf = (unit: RatedUnit, metric: Metric, weekly: boolean) =>
  indicesOf([{ unit, count: weekly ? unit.growth : 1 }])[metric]

/**
 * Места и доли от лидера — среди существ своего ранга. Результат — в том же
 * порядке, что и существа на входе.
 *
 * Место поштучно считается всегда: с приростом по нему видно, насколько
 * существо поднялось или опустилось.
 */
export function rateUnits(units: RatedUnit[], metric: Metric, weekly: boolean): RatingEntry[] {
  const values = units.map((unit) => valueOf(unit, metric, weekly))
  const solo = weekly ? units.map((unit) => valueOf(unit, metric, false)) : values

  // значения соседей по рангу — с ними и сравнивается существо
  const rivals = (list: number[], tier: number) => list.filter((_, i) => units[i].tier === tier)

  return units.map((unit, i) => {
    const tierValues = rivals(values, unit.tier)

    return {
      value: values[i],
      share: shareOf(values[i], Math.max(...tierValues)),
      place: placeAmong(values[i], tierValues),
      soloPlace: placeAmong(solo[i], rivals(solo, unit.tier)),
    }
  })
}

/** Среднее; у пустого списка его нет. */
const mean = (values: number[]) =>
  values.length > 0 ? values.reduce((sum, value) => sum + value, 0) / values.length : null

/**
 * Сводка по фракциям. В ячейке — средняя доля от лидера у существ фракции
 * в ранге, в строке — среднее по рангам. Фракции — по убыванию среднего,
 * при равенстве — в порядке, в каком встретились среди существ.
 *
 * Доли берутся из рейтинга, поэтому сводка следует за метрикой и приростом.
 * entries — рейтинг тех же существ в том же порядке.
 */
export function factionSummary(units: RatedUnit[], entries: RatingEntry[]): RatingSummary {
  const tiers = [...new Set(units.map((unit) => unit.tier))].sort((a, b) => a - b)
  const factions = [...new Set(units.map((unit) => unit.faction))]

  // средняя доля фракции в каждом ранге; null — существ этого ранга у фракции нет
  const shares = factions.map((faction) =>
    tiers.map((tier) =>
      mean(
        entries.flatMap((entry, i) =>
          units[i].faction === faction && units[i].tier === tier ? [entry.share] : [],
        ),
      ),
    ),
  )

  // Лучшая и худшая фракции — в каждом ранге свои. Равные делят звание;
  // если равны все, это лучшие, а не худшие
  const cellOf = (share: number | null, column: number): SummaryCell | null => {
    if (share === null) return null

    const present = shares.map((row) => row[column]).filter((other) => other !== null)
    const best = nearlyEqual(share, Math.max(...present))
    return { share, best, worst: !best && nearlyEqual(share, Math.min(...present)) }
  }

  const rows = factions.map((faction, f) => ({
    faction,
    cells: shares[f].map(cellOf),
    average: mean(shares[f].filter((share) => share !== null)) ?? 0,
  }))

  // sort устойчивая: при равном среднем фракции остаются в исходном порядке
  return { tiers, rows: rows.sort((a, b) => b.average - a.average) }
}
