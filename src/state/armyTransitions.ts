import { ARMY_RULES } from '../domain/rules'

/**
 * Состояние экрана армий: типы, стартовые армии и переходы. Переходы —
 * чистые функции без React, как transitions.ts у калькулятора: берут
 * список армий и возвращают новый. Если ничего не изменилось — тот же
 * массив, и React не перерисовывает экран зря.
 *
 * В ячейке — только id существа и количество. Числа существа берутся
 * из справочника при расчёте: в армии их не правят, поэтому копировать
 * их в состояние незачем — в отличие от сторон калькулятора.
 *
 * Широкий и узкий экран обращаются с ячейками по-разному:
 * - на ПК видны все семь ячеек, как в игре: удалённый отряд оставляет
 *   дыру, а новый встаёт ровно в ту ячейку, по которой кликнули;
 * - на узком экране место дороже, и армия всегда сжата: удаление сдвигает
 *   остальных вверх, а новый отряд встаёт в конец — туда, где стоит
 *   единственный «+». Дыры, оставшиеся с ПК (повернули планшет), убирает
 *   первое же добавление или удаление, а до тех пор их прячет CSS.
 * Какой сейчас экран, решает интерфейс — флагом narrow.
 */

/** Отряд в ячейке: какое существо и сколько их. */
export interface Troop {
  creatureId: string
  count: number
}

export interface Army {
  /** ключ для React: армии удаляют из середины, и номер в списке для этого не годится */
  id: string
  /** всегда ARMY_RULES.slots ячеек; null — пустая */
  slots: Array<Troop | null>
}

/** новый отряд — одно существо: количество набирают сразу после выбора */
const NEW_TROOP_COUNT = 1

/** Ячейки армии: переданные по порядку, остальные до семи — пустые. */
export const slotsOf = (troops: Array<Troop | null>) =>
  Array.from({ length: ARMY_RULES.slots }, (_, i) => troops[i] ?? null)

export const emptyArmy = (id: string): Army => ({ id, slots: slotsOf([]) })

/** Сдвигает отряды к началу армии: дыр не остаётся. */
const compact = (slots: Array<Troop | null>) => slotsOf(slots.filter((slot) => slot !== null))

/**
 * Стартовые армии. Ранги II–IV у обеих, численность почти равна, и кто
 * сильнее, на глаз не видно. Первая сильнее на 5% — больше порога ничьей —
 * и лидирует по живучести, вторая лидирует по урону: с первого взгляда
 * видно, что умеет сравнение.
 */
export const DEFAULT_ARMIES: Army[] = [
  {
    id: 'start-1',
    slots: slotsOf([
      { creatureId: 'hoplet', count: 15 },
      { creatureId: 'vineiriyad', count: 9 },
      { creatureId: 'naiad', count: 8 },
    ]),
  },
  {
    id: 'start-2',
    slots: slotsOf([
      { creatureId: 'infiltrator', count: 13 },
      { creatureId: 'onyxdancer', count: 12 },
      { creatureId: 'minotaur', count: 10 },
    ]),
  },
]

/** Меняет одну армию. Если переход её не тронул, возвращает тот же массив. */
function updateArmy(armies: Army[], armyId: string, change: (army: Army) => Army): Army[] {
  let changed = false

  const next = armies.map((army) => {
    if (army.id !== armyId) return army
    const updated = change(army)
    changed = updated !== army
    return updated
  })

  return changed ? next : armies
}

/** Новая пустая армия в конце. Сверх предела — ничего. */
export function addArmy(armies: Army[], id: string): Army[] {
  return armies.length >= ARMY_RULES.maxArmies ? armies : [...armies, emptyArmy(id)]
}

/** Убрать армию. Последнюю — нельзя: экрану нужна хотя бы одна. */
export function removeArmy(armies: Army[], armyId: string): Army[] {
  if (armies.length <= ARMY_RULES.minArmies) return armies

  const next = armies.filter((army) => army.id !== armyId)
  return next.length === armies.length ? armies : next
}

/**
 * В какую ячейку встанет новый отряд: на ПК — в ту, по которой кликнули,
 * на узком экране — сразу за последним отрядом сжатой армии. −1 — ставить
 * некуда: армия полна или ячейка занята. По этому номеру интерфейс
 * находит новый отряд, чтобы поставить фокус в его количество.
 */
export function landingSlot(army: Army, slot: number, narrow: boolean): number {
  if (narrow) {
    const filled = army.slots.filter((troop) => troop !== null).length
    return filled < ARMY_RULES.slots ? filled : -1
  }

  // занятая ячейка или номер за пределами армии
  return army.slots[slot] === null ? slot : -1
}

/**
 * Новый отряд — одно существо. На ПК — в ячейку slot, если она пуста.
 * На узком экране армия сначала сжимается, и отряд встаёт в конец: slot
 * там не важен. В полную армию добавить нечего.
 */
export function addTroop(
  armies: Army[],
  armyId: string,
  slot: number,
  creatureId: string,
  narrow: boolean,
): Army[] {
  return updateArmy(armies, armyId, (army) => {
    const target = landingSlot(army, slot, narrow)
    if (target < 0) return army

    const next = narrow ? compact(army.slots) : [...army.slots]
    next[target] = { creatureId, count: NEW_TROOP_COUNT }
    return { ...army, slots: next }
  })
}

/** Убрать отряд. На ПК остаётся дыра, на узком экране остальные сдвигаются вверх. */
export function removeTroop(armies: Army[], armyId: string, slot: number, narrow: boolean): Army[] {
  return updateArmy(armies, armyId, (army) => {
    if (!army.slots[slot]) return army

    const slots = army.slots.map((troop, i) => (i === slot ? null : troop))
    return { ...army, slots: narrow ? compact(slots) : slots }
  })
}

/** Количество в отряде. Границы держит поле ввода, здесь их не проверяем. */
export function setCount(armies: Army[], armyId: string, slot: number, count: number): Army[] {
  return updateArmy(armies, armyId, (army) => {
    const troop = army.slots[slot]
    if (!troop || troop.count === count) return army

    return { ...army, slots: army.slots.map((t, i) => (i === slot ? { ...troop, count } : t)) }
  })
}
