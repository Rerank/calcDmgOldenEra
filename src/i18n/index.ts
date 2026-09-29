import { ru } from './ru'

export type Lang = 'ru' | 'en'

/**
 * Активный язык и словарь. Пока язык один, поэтому это простые константы —
 * переключатель добавится здесь и компоненты его не заметят.
 *
 * `lang` нужен отдельно от словаря: имена существ живут не в нём,
 * а в справочнике, сразу на обоих языках — `template.name[lang]`.
 */
export const lang: Lang = 'ru'
export const t = ru

/**
 * Подставляет значения в шаблон строки: «{faction} в {tier} ранге» →
 * «Роща в I ранге». Шаблон, а не склейка кусков: в переводе порядок слов
 * может быть другим. Неизвестный ключ остаётся в тексте как есть — ошибку
 * в шаблоне видно сразу.
 */
export const fill = (template: string, values: Record<string, string>) =>
  template.replace(/\{(\w+)\}/g, (match, key: string) => values[key] ?? match)
