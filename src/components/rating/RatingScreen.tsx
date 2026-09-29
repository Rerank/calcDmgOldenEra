import { t } from '../../i18n'
import { AppHeader } from '../AppHeader'

/** Экран рейтинга существ: шапка, категории, фильтры, таблица и сводка. */
export function RatingScreen() {
  const notes = t.ratingNotes

  return (
    <AppHeader title={t.ratingTitle} lead={t.ratingLead}>
      <p>
        <strong>{t.damageIndex}</strong>&nbsp;— {notes.damage}
        <br />
        <strong>{t.hardinessIndex}</strong>&nbsp;— {notes.hardiness}
        <br />
        <strong>{t.powerIndex}</strong>&nbsp;— {notes.power}
      </p>
      <p>{notes.growth}</p>
      <p>{notes.scope}</p>
    </AppHeader>
  )
}
