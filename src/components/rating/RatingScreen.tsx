import { t } from '../../i18n'
import { useRating } from '../../state/rating'
import { AppHeader } from '../AppHeader'
import { RatingCategories } from './RatingCategories'
import { RatingFilters } from './RatingFilters'
import { RatingPanel } from './RatingPanel'
import { summaryExample } from './ratingFormat'
import { ratingGroups } from './ratingRows'
import { RatingSummary } from './RatingSummary'
import './rating.css'

/** Экран рейтинга существ: шапка, категории, фильтры, таблица и сводка. */
export function RatingScreen() {
  const rating = useRating()
  const { options } = rating
  const notes = t.ratingNotes

  return (
    <>
      <AppHeader title={t.ratingTitle} lead={t.ratingLead}>
        <p>
          <strong>{t.damageIndex}</strong>&nbsp;— {notes.damage}
          <br />
          <strong>{t.hardinessIndex}</strong>&nbsp;— {notes.hardiness}
          <br />
          <strong>{t.powerIndex}</strong>&nbsp;— {notes.power}
        </p>
        <p>{notes.growth}</p>
      </AppHeader>

      {/* Цвет выбранной категории — модификатором: его берут таблица и сводка */}
      <main className={`rating rating--${options.metric}`}>
        <RatingCategories metric={options.metric} onChange={rating.setMetric} />
        <RatingFilters
          options={options}
          onToggleTier={rating.toggleTier}
          onAllTiers={rating.allTiers}
          onToggleFaction={rating.toggleFaction}
          onAllFactions={rating.allFactions}
          onKindChange={rating.setKind}
          onWeeklyChange={rating.setWeekly}
        />
        <RatingPanel
          metric={options.metric}
          kind={options.kind}
          weekly={options.weekly}
          groups={ratingGroups(rating.creatures, rating.entries, options)}
          sort={options.sort}
          onSort={rating.sortBy}
        />
        {/* Сводка сравнивает фракции по рангам: при одной фракции или одном ранге
            сравнивать в ней нечего — всё видно в таблице */}
        {rating.summary.rows.length > 1 && rating.summary.tiers.length > 1 && (
          <RatingSummary
            summary={rating.summary}
            metric={options.metric}
            kind={options.kind}
            weekly={options.weekly}
            example={summaryExample(rating.creatures, rating.entries, rating.summary)}
            someFactions={options.factions.length > 0}
          />
        )}
      </main>
    </>
  )
}
