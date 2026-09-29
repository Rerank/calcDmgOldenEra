import { describe, expect, test } from 'vitest'
import { F } from '../domain/rules'
import { CREATURE_TEMPLATES, CUSTOM_TEMPLATE_ID } from './creatures'

/**
 * Справочник дальше правится руками, а типы видят не всё: дубли id
 * и числа вне границ полей компилятор пропустит. Каждый тест возвращает
 * список нарушителей — при падении сразу видно, кого чинить.
 */

const within = (value: number, limits: { min: number; max: number }) =>
  value >= limits.min && value <= limits.max

describe('справочник существ', () => {
  test('id уникальны и не заняты шаблоном «Свой»', () => {
    const ids = CREATURE_TEMPLATES.map((c) => c.id)
    const dupes = ids.filter((id, i) => ids.indexOf(id) !== i)

    expect(dupes).toEqual([])
    expect(ids).not.toContain(CUSTOM_TEMPLATE_ID)
  })

  test('id — английское имя строчными, без пробелов и знаков', () => {
    const broken = CREATURE_TEMPLATES.filter(
      (c) => c.id !== c.name.en.toLowerCase().replace(/[^a-z0-9]/g, ''),
    )

    expect(broken.map((c) => c.id)).toEqual([])
  })

  test('параметры помещаются в границы полей, урон мин не больше макс', () => {
    // иначе шаблон подставит число, которое поле не позволило бы ввести руками
    const broken = CREATURE_TEMPLATES.filter(
      (c) =>
        !within(c.hp, F.hp) ||
        !within(c.attack, F.attack) ||
        !within(c.defense, F.defense) ||
        !within(c.damageMin, F.damage) ||
        !within(c.damageMax, F.damage) ||
        c.damageMin > c.damageMax,
    )

    expect(broken.map((c) => c.id)).toEqual([])
  })

  test('прирост — целое больше нуля и одинаковый у существ одного ранга во фракции', () => {
    const firstInTier = new Map<string, number>()

    const broken = CREATURE_TEMPLATES.filter((c) => {
      if (c.growth === undefined) return false
      if (!Number.isInteger(c.growth) || c.growth < 1) return true

      const key = `${c.faction} ${c.tier}`
      if (!firstInTier.has(key)) firstInTier.set(key, c.growth)
      return c.growth !== firstInTier.get(key)
    })

    expect(broken.map((c) => c.id)).toEqual([])
  })

  test('прирост есть у всех существ фракций', () => {
    // Нейтралов и Огненную личинку — её призывает герой — в городе не нанимают
    const missing = CREATURE_TEMPLATES.filter(
      (c) => c.faction !== 'neutral' && c.id !== 'firelarva' && c.growth === undefined,
    )

    expect(missing.map((c) => c.id)).toEqual([])
  })

  test('в каждом ранге у каждой фракции — базовое существо и два улучшения', () => {
    // На это опираются тексты рейтинга существ: «в каждом ранге — 18 существ
    // шести фракций», «среди 6 базовых», «среди 12 улучшенных». Состав
    // поменялся — поправь ratingNotes и ratingNotePool в ru.ts
    const groups = new Map<string, { base: number; upgraded: number }>()
    for (const c of CREATURE_TEMPLATES.filter((c) => c.growth !== undefined)) {
      const key = `${c.faction} ${c.tier}`
      const group = groups.get(key) ?? { base: 0, upgraded: 0 }
      group[c.upgraded ? 'upgraded' : 'base']++
      groups.set(key, group)
    }

    const broken = [...groups].filter(([, g]) => g.base !== 1 || g.upgraded !== 2)
    expect(broken.map(([key]) => key)).toEqual([])
    // шесть фракций в семи рангах
    expect(groups.size).toBe(6 * 7)
  })

  test('улучшение отмечено только у существ, которых нанимают в городе', () => {
    const broken = CREATURE_TEMPLATES.filter((c) => c.upgraded && c.growth === undefined)

    expect(broken.map((c) => c.id)).toEqual([])
  })
})
