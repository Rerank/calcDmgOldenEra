import { describe, expect, test } from 'vitest'
import { SCREENS, screenFromPath, screenPath } from './routes'

const BASE = '/calcDmgOldenEra/'

describe('адреса экранов', () => {
  test('корень сайта — калькулятор, army/ — сравнение армий', () => {
    expect(screenFromPath('/calcDmgOldenEra/', BASE)).toBe('calculator')
    expect(screenFromPath('/calcDmgOldenEra/army/', BASE)).toBe('army')
  })

  test('адрес без слеша на конце — тот же экран', () => {
    expect(screenFromPath('/calcDmgOldenEra/army', BASE)).toBe('army')
    expect(screenFromPath('/calcDmgOldenEra/army//', BASE)).toBe('army')
  })

  test('неизвестный и чужой адрес — главная', () => {
    expect(screenFromPath('/calcDmgOldenEra/armies/', BASE)).toBe('calculator')
    expect(screenFromPath('/calcDmgOldenEra/index.html', BASE)).toBe('calculator')
    expect(screenFromPath('/army/', BASE)).toBe('calculator')
    // корень без слеша не начинается с base — это не наш адрес
    expect(screenFromPath('/calcDmgOldenEra', BASE)).toBe('calculator')
  })

  test('адрес каждого экрана ведёт обратно к нему — и в подпапке, и в корне домена', () => {
    for (const base of [BASE, '/']) {
      for (const screen of SCREENS) {
        expect(screenFromPath(screenPath(screen, base), base)).toBe(screen)
      }
    }
  })
})
