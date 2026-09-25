import { CREATURE_TEMPLATES, FACTIONS } from '../data/creatures'
import { lang } from '../i18n'
import { ROMAN } from './roman'
import type { ComboboxGroup } from './ui/comboboxFilter'

/**
 * Список шаблонов для комбобокса: фракции в порядке справочника, внутри —
 * по рангу. Ранг — меткой справа от имени.
 *
 * «Своего» в списке нет: выбирать его незачем, стек становится «Своим» сам
 * при первой правке параметров существа. Поле показывает «Свой», когда
 * значения нет среди опций, — см. emptyLabel у комбобокса.
 *
 * Ключи поиска: имя на обоих языках, какой бы язык ни был у интерфейса,
 * и ранг цифрой — «2» находит всех существ второго ранга, «3 гриф» —
 * грифонов третьего. Цифрой, а не римскими: их удобно набирать в любой
 * раскладке, и цифр нет ни в одном имени, так что ложных находок не будет.
 *
 * Собирается один раз: язык пока константа. Когда появится переключатель,
 * сборка переедет в useMemo с зависимостью от языка.
 */
export const TEMPLATE_GROUPS: ComboboxGroup[] = FACTIONS.map((faction) => ({
  label: faction.name[lang],
  options: CREATURE_TEMPLATES.filter((c) => c.faction === faction.id).map((c) => ({
    value: c.id,
    label: c.name[lang],
    hint: ROMAN[c.tier - 1],
    keywords: [c.name.ru, c.name.en, String(c.tier)],
  })),
}))
