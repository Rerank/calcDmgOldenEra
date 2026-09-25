import { useEffect, useRef } from 'react'
import { t } from '../../i18n'
import { clamp, useNumberInput } from './useNumberInput'
import './stepper.css'

export type StepperProps = {
  id?: string
  value: number
  onChange: (value: number) => void
  min: number
  max: number
  step?: number
  /** доступное имя для кнопок ±: «Атака: уменьшить» */
  label: string
  /**
   * Доступное имя самого поля, когда видимой подписи рядом нет: «Мечник:
   * количество». Обычно поле подписывает <label htmlFor={id}> снаружи.
   */
  inputLabel?: string
  /** компактный вид во всю ширину ячейки армии: 98px вместо 144px */
  compact?: boolean
  /**
   * Поставить фокус в поле и выделить число: набранное заменит его,
   * а не допишется. Срабатывает, когда флаг включается, — не на каждой
   * перерисовке.
   */
  autoFocus?: boolean
  /** фиксированный знак перед числом: «+» у увеличения, «−» у уменьшения */
  sign?: string
  /** единица измерения после числа */
  unit?: string
  /** к параметру прибавлен бонус героя — число подсвечивается */
  boosted?: boolean
  title?: string
}

export function Stepper({
  id,
  value,
  onChange,
  min,
  max,
  step = 1,
  label,
  inputLabel,
  compact,
  autoFocus,
  sign,
  unit,
  boosted,
  title,
}: StepperProps) {
  const input = useNumberInput({ value, min, max, onChange })
  const inputRef = useRef<HTMLInputElement>(null)

  // Срабатывает, когда поле становится целью фокуса: при появлении с autoFocus
  // или когда флаг включили уже смонтированному полю. Перерисовки с тем же
  // флагом фокус не трогают. Нативный autoFocus не подходит: он срабатывает
  // только при монтировании и не выделяет число.
  useEffect(() => {
    if (!autoFocus) return
    inputRef.current?.focus()
    inputRef.current?.select()
  }, [autoFocus])

  const fieldCls = 'stepper__field' + (sign || unit ? ' stepper__field--with-unit' : '')
  const inputCls = 'stepper__input' + (boosted ? ' stepper__input--boosted' : '')

  return (
    <div className={'stepper' + (compact ? ' stepper--compact' : '')}>
      <button
        className="stepper__btn stepper__btn--dec"
        type="button"
        aria-label={`${label}: ${t.decrease}`}
        disabled={value <= min}
        onClick={() => onChange(clamp(value - step, min, max))}
      >
        −
      </button>

      <div className={fieldCls}>
        {sign && <span className="stepper__sign">{sign}</span>}
        <input
          ref={inputRef}
          className={inputCls}
          id={id}
          title={title}
          aria-label={inputLabel}
          {...input}
        />
        {unit && <span className="stepper__unit">{unit}</span>}
      </div>

      <button
        className="stepper__btn stepper__btn--inc"
        type="button"
        aria-label={`${label}: ${t.increase}`}
        disabled={value >= max}
        onClick={() => onChange(clamp(value + step, min, max))}
      >
        +
      </button>
    </div>
  )
}
