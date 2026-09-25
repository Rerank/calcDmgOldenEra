import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
} from 'react'
import searchIcon from '../../assets/images/search.svg'
import { t } from '../../i18n'
import { filterGroups, type ComboboxGroup } from './comboboxFilter'
import './combobox.css'

/**
 * Своя кнопка вместо поля-селекта — например, пустая ячейка армии «+».
 * Подписи рядом нет, поэтому доступное имя кнопки и списка — label.
 */
type CustomTrigger = {
  className: string
  content: ReactNode
  label: string
}

type Props = {
  /** id кнопки; от него строятся id списка и опций */
  id: string
  /** id подписи поля: по ней называются и кнопка, и список. Не нужен при своей кнопке */
  labelId?: string
  value: string
  /** подпись поля, когда значения в списке нет — у шаблонов это «Свой» */
  emptyLabel?: string
  /** своя кнопка вместо поля-селекта */
  trigger?: CustomTrigger
  groups: ComboboxGroup[]
  searchPlaceholder: string
  /** на каких экранах список раскрывается на весь экран, а не под кнопкой */
  fullscreenQuery?: string
  onChange: (value: string) => void
}

/** Зазор между полем и списком — в него помещается контур фокуса. Совпадает с combobox.css. */
const GAP = 6
/** Ближе к краю окна список не подходит. */
const EDGE_MARGIN = 16
/** Выше не растёт, даже если места много: длинная простыня хуже прокрутки. */
const MAX_HEIGHT = 420
/** Если снизу места меньше, пробуем открыться вверх. */
const MIN_HEIGHT_BELOW = 240
/** Совсем тесное окно: меньше этого список не сжимаем. */
const MIN_HEIGHT = 120
/**
 * Ширина списка при своей кнопке — как у поля «Шаблон» в калькуляторе.
 * Совпадает с combobox.css. При обычном поле список шириной с поле.
 */
const BUTTON_POPUP_WIDTH = 340
/** Телефон: список на весь экран. Совпадает с компактной метрикой в variables.css. */
const PHONE = '(max-width: 600px)'

type Placement = {
  up: boolean
  maxHeight: number
  /** выровнять по правому краю кнопки: вправо список не помещается */
  end: boolean
  /** на весь экран вместо выпадающего списка */
  fullscreen: boolean
}

/**
 * Куда и как раскрыться. На узком экране — на весь экран: решает медиазапрос
 * в момент раскрытия. Иначе по умолчанию — вниз, так привычнее; вверх — только
 * если снизу тесно, а сверху просторнее. Высота считается от места до края
 * окна с отступом, поэтому список не упирается в нижнюю кромку.
 *
 * Список шире своей кнопки (ячейка армии — 98px) растёт вправо от её левого
 * края, а если там не хватает места — влево от правого.
 */
function placeNear(trigger: HTMLElement, popupWidth: number | null, fullscreenQuery: string): Placement {
  const box = trigger.getBoundingClientRect()
  const below = window.innerHeight - box.bottom - GAP - EDGE_MARGIN
  const above = box.top - GAP - EDGE_MARGIN
  const up = below < MIN_HEIGHT_BELOW && above > below

  return {
    up,
    maxHeight: Math.max(MIN_HEIGHT, Math.min(MAX_HEIGHT, up ? above : below)),
    end: popupWidth !== null && box.left + popupWidth > window.innerWidth - EDGE_MARGIN,
    fullscreen: matchMedia(fullscreenQuery).matches,
  }
}

/**
 * Прокручивает список к опции, не трогая прокрутку страницы. Нативный
 * scrollIntoView сдвинул бы заодно и страницу, если бы решил, что опция
 * должна оказаться посередине экрана.
 */
function revealOption(list: HTMLElement, option: HTMLElement, center: boolean) {
  const listBox = list.getBoundingClientRect()
  const box = option.getBoundingClientRect()

  if (center) {
    list.scrollTop += box.top - listBox.top - (listBox.height - box.height) / 2
    return
  }

  // верх списка закрыт прилипшим заголовком группы — его высота в scroll-padding-top
  const covered = Number.parseFloat(getComputedStyle(list).scrollPaddingTop) || 0
  if (box.top < listBox.top + covered) list.scrollTop -= listBox.top + covered - box.top
  else if (box.bottom > listBox.bottom) list.scrollTop += box.bottom - listBox.bottom
}

/**
 * Выпадающий список с поиском и группами.
 *
 * Поле — кнопка, а строка поиска живёт внутри раскрытого списка. Так одна
 * реализация подходит и мыши, и пальцу: на ПК поиск сразу получает фокус,
 * и можно печатать; на сенсорном экране фокус не ставится, клавиатура
 * не выезжает, и список просто листается. На узком экране список
 * раскрывается на весь экран, логика та же.
 *
 * Вместо поля-селекта может быть своя кнопка (trigger) — список, поиск
 * и клавиатура остаются теми же.
 */
export function Combobox({
  id,
  labelId,
  value,
  emptyLabel,
  trigger,
  groups,
  searchPlaceholder,
  fullscreenQuery = PHONE,
  onChange,
}: Props) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  /** подсвеченная опция: сквозной номер по всем видимым группам */
  const [active, setActive] = useState(0)
  const [placement, setPlacement] = useState<Placement>({
    up: false,
    maxHeight: MAX_HEIGHT,
    end: false,
    fullscreen: false,
  })

  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  /** что сделать сразу после раскрытия: ставить ли фокус в поиск и к какой опции прокрутить */
  const onOpenRef = useRef({ focusSearch: false, reveal: 0 })

  const filtered = useMemo(() => filterGroups(groups, query), [groups, query])
  const options = useMemo(() => filtered.flatMap((group) => group.options), [filtered])
  /** с какого сквозного номера начинается каждая группа */
  const offsets = useMemo(
    () => filtered.map((_, i) => filtered.slice(0, i).reduce((sum, g) => sum + g.options.length, 0)),
    [filtered],
  )

  const allOptions = useMemo(() => groups.flatMap((group) => group.options), [groups])
  const selected = allOptions.find((option) => option.value === value)

  const listId = `${id}-list`
  const optionId = (index: number) => `${id}-option-${index}`

  // Подпись списка и поиска: у поля — внешняя подпись, у своей кнопки — её label
  const listLabel = trigger ? { 'aria-label': trigger.label } : { 'aria-labelledby': labelId }

  const openList = (initialQuery: string, focusSearch: boolean) => {
    if (triggerRef.current) {
      const popupWidth = trigger ? BUTTON_POPUP_WIDTH : null
      setPlacement(placeNear(triggerRef.current, popupWidth, fullscreenQuery))
    }

    // Без запроса курсор встаёт на текущее значение, с запросом — на первую
    // находку. Если значения в списке нет (у шаблонов — «Свой»), не подсвечено
    // ничего (-1): иначе Enter сразу после раскрытия молча выбрал бы первую опцию.
    // Стрелка вниз из этого состояния встаёт на первую.
    const start = initialQuery ? 0 : allOptions.findIndex((o) => o.value === value)
    onOpenRef.current = { focusSearch, reveal: start }

    setQuery(initialQuery)
    setActive(start)
    setOpen(true)
  }

  const close = (returnFocus: boolean) => {
    setOpen(false)
    setQuery('')
    if (returnFocus) triggerRef.current?.focus()
  }

  const choose = (optionValue: string) => {
    onChange(optionValue)
    close(true)
  }

  const moveActive = (next: number) => {
    setActive(next)
    const option = document.getElementById(optionId(next))
    if (listRef.current && option) revealOption(listRef.current, option, false)
  }

  // Сразу после раскрытия, до отрисовки: фокус и прокрутка к нужной опции.
  // preventScroll — фокус не должен дёргать страницу, список и так в окне.
  useLayoutEffect(() => {
    if (!open) return

    const { focusSearch, reveal } = onOpenRef.current
    if (focusSearch) searchRef.current?.focus({ preventScroll: true })
    else listRef.current?.focus({ preventScroll: true })

    const option = document.getElementById(`${id}-option-${reveal}`)
    if (listRef.current && option) revealOption(listRef.current, option, true)
  }, [open, id])

  // Клик мимо закрывает список. Фокус не возвращаем: человек уже целится в другое
  useEffect(() => {
    if (!open) return

    const onPointerDown = (event: PointerEvent) => {
      if (rootRef.current?.contains(event.target as Node)) return
      setOpen(false)
      setQuery('')
    }

    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [open])

  const onTriggerKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      openList('', true)
      return
    }

    // Начал печатать на закрытом поле — раскрываемся с этой буквой в поиске.
    // Пробел и Enter не трогаем: их кнопка превращает в обычный клик.
    const printable = event.key.length === 1 && event.key !== ' '
    if (printable && !event.ctrlKey && !event.metaKey && !event.altKey) {
      event.preventDefault()
      openList(event.key, true)
    }
  }

  const onPopupKeyDown = (event: KeyboardEvent) => {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault()
        if (options.length > 0) moveActive(Math.min(active + 1, options.length - 1))
        break
      case 'ArrowUp':
        event.preventDefault()
        if (options.length > 0) moveActive(Math.max(active - 1, 0))
        break
      case 'Enter':
        event.preventDefault()
        if (options[active]) choose(options[active].value)
        break
      // Tab тоже закрывает: иначе фокус ушёл бы на кнопку «×» внутри списка
      // и потерялся бы вместе с ним
      case 'Escape':
      case 'Tab':
        event.preventDefault()
        close(true)
        break
    }
  }

  // Поведение кнопки одно для поля и для своей кнопки — различаются только вид и подпись
  const triggerProps = {
    ref: triggerRef,
    type: 'button',
    id,
    'aria-haspopup': 'listbox',
    'aria-expanded': open,
    'aria-controls': open ? listId : undefined,
    onClick: () => (open ? close(false) : openList('', matchMedia('(pointer: fine)').matches)),
    onKeyDown: onTriggerKeyDown,
  } as const

  const rootCls = ['combobox', trigger && 'combobox--button', open && 'combobox--open']
    .filter(Boolean)
    .join(' ')

  const popupCls = [
    'combobox__popup',
    placement.up && 'combobox__popup--up',
    placement.end && 'combobox__popup--end',
    placement.fullscreen && 'combobox__popup--fullscreen',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={rootCls} ref={rootRef}>
      {trigger ? (
        <button
          {...triggerProps}
          className={`combobox__button ${trigger.className}`}
          aria-label={trigger.label}
        >
          {trigger.content}
        </button>
      ) : (
        <button
          {...triggerProps}
          className="combobox__trigger"
          aria-labelledby={`${labelId} ${id}`}
        >
          <span className="combobox__value">{selected?.label ?? emptyLabel}</span>
          <span className="combobox__arrow" aria-hidden="true">
            ▼
          </span>
        </button>
      )}

      {open && (
        <div
          className={popupCls}
          // переменной, а не max-height: на весь экран CSS её просто не использует
          style={{ '--combobox-max-height': `${placement.maxHeight}px` } as CSSProperties}
          onKeyDown={onPopupKeyDown}
        >
          <div className="combobox__head">
            {/* label — чтобы касание лупы тоже ставило курсор в поиск */}
            <label className="combobox__field">
              <img className="combobox__search-icon" src={searchIcon} alt="" />
              <input
                ref={searchRef}
                className="combobox__search"
                type="text"
                role="combobox"
                aria-expanded="true"
                aria-controls={listId}
                aria-autocomplete="list"
                aria-activedescendant={options[active] ? optionId(active) : undefined}
                {...listLabel}
                placeholder={searchPlaceholder}
                autoComplete="off"
                spellCheck={false}
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value)
                  setActive(0)
                  if (listRef.current) listRef.current.scrollTop = 0
                }}
              />
            </label>
            <button
              type="button"
              className="combobox__close"
              aria-label={t.close}
              onClick={() => close(true)}
            >
              ×
            </button>
          </div>

          <ul
            ref={listRef}
            id={listId}
            className="combobox__list"
            role="listbox"
            {...listLabel}
            tabIndex={-1}
          >
            {filtered.map((group, groupIndex) => {
              const headerId = `${id}-group-${groupIndex}`

              return (
                <li key={group.label} role="presentation">
                  <div className="combobox__group" id={headerId} role="presentation">
                    {group.label}
                  </div>
                  <ul className="combobox__options" role="group" aria-labelledby={headerId}>
                    {group.options.map((option, optionIndex) => {
                      const index = offsets[groupIndex] + optionIndex
                      const cls = [
                        'combobox__option',
                        index === active && 'combobox__option--active',
                        option.value === value && 'combobox__option--current',
                      ]
                        .filter(Boolean)
                        .join(' ')

                      return (
                        <li
                          key={option.value}
                          id={optionId(index)}
                          className={cls}
                          role="option"
                          aria-selected={index === active}
                          // mousemove, а не mouseenter: иначе прокрутка колесом под
                          // неподвижной мышью перехватывала бы подсветку у клавиатуры
                          onMouseMove={() => index !== active && setActive(index)}
                          // фокус остаётся в поиске, а не уходит на список
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => choose(option.value)}
                        >
                          <span className="combobox__label">{option.label}</span>
                          {option.hint && <span className="combobox__hint">{option.hint}</span>}
                        </li>
                      )
                    })}
                  </ul>
                </li>
              )
            })}

            {options.length === 0 && (
              <li className="combobox__empty" role="presentation">
                {t.nothingFound}
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  )
}
