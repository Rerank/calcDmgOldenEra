import type { ReactNode } from 'react'
import { t } from '../i18n'
import { Disclosure } from './ui/Disclosure'
import './app-header.css'

type Props = {
  title: string
  /** строка под заголовком: формула у калькулятора, описание у сравнения армий */
  lead: ReactNode
  /** пояснения под «Подробнее» */
  children: ReactNode
}

/** Шапка экрана: заголовок, вводная строка и раскрывающиеся пояснения к ней. */
export function AppHeader({ title, lead, children }: Props) {
  return (
    <header className="app-header">
      <h1 className="app-header__title">{title}</h1>
      <p className="app-header__lead">{lead}</p>

      <Disclosure
        label={t.more}
        className="disclosure--inline app-header__more"
        bodyClassName="app-header__notes"
      >
        {children}
      </Disclosure>
    </header>
  )
}
