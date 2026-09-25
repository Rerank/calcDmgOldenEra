import { t } from '../../i18n'
import { AppHeader } from '../AppHeader'

/**
 * Экран сравнения армий. Пока только шапка: армии и «Итог» появятся
 * на следующих этапах.
 */
export function ArmyScreen() {
  const notes = t.armyNotes

  return (
    <AppHeader title={t.armyTitle} lead={t.armyLead}>
      <p>
        <strong>{t.damageIndex}</strong>&nbsp;— {notes.damage}
        <br />
        <strong>{t.hardinessIndex}</strong>&nbsp;— {notes.hardiness}
        <br />
        <strong>{t.powerIndex}</strong>&nbsp;— {notes.power}
      </p>
    </AppHeader>
  )
}
