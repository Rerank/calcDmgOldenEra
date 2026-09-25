import { describe, expect, test } from 'vitest'
import { CREATURE_TEMPLATES } from '../data/creatures'
import { creatureIcon } from './creatureIcons'

/**
 * Иконки добавляют руками — в папку фракции, по имени существа. Ошибку
 * в имени или папке ни типы, ни сборка не заметят: существо просто
 * останется без картинки. Каждый тест возвращает список нарушителей.
 */

// только пути: без eager файлы не загружаются
const files = Object.keys(import.meta.glob('../assets/images/units/*/*.webp'))

/** По правилу из creatureIcons.ts: «Sun's Aegis» из Храма → temple/Suns_Aegis.webp */
const expectedPath = (en: string, faction: string) =>
  `../assets/images/units/${faction}/${en.replaceAll("'", '').replaceAll(' ', '_')}.webp`

describe('иконки существ', () => {
  test('у каждого существа есть иконка', () => {
    const missing = CREATURE_TEMPLATES.filter((c) => creatureIcon(c.id) === undefined)

    expect(missing.map((c) => c.id)).toEqual([])
  })

  test('файл назван по английскому имени и лежит в папке своей фракции', () => {
    const misplaced = CREATURE_TEMPLATES.filter(
      (c) => !files.includes(expectedPath(c.name.en, c.faction)),
    )

    expect(misplaced.map((c) => expectedPath(c.name.en, c.faction))).toEqual([])
  })

  test('лишних файлов нет: иконок ровно столько, сколько существ', () => {
    const expected = new Set(CREATURE_TEMPLATES.map((c) => expectedPath(c.name.en, c.faction)))
    const extra = files.filter((path) => !expected.has(path))

    expect(extra).toEqual([])
  })
})
