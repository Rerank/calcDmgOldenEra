import { Fragment } from 'react'
import arrowIcon from '../assets/images/arrow_right.webp'
import swapIcon from '../assets/images/swap.svg'
import { t } from '../i18n'
import { useCalculator } from '../state/calculator'
import { AppHeader } from './AppHeader'
import { RangedFields } from './RangedFields'
import { Results } from './Results'
import { UnitSide } from './UnitSide'
import { Button } from './ui/Button'
import { IconButton } from './ui/IconButton'
import '../battle.css'

/** Экран калькулятора урона: шапка, две стороны, удар и результаты. */
export function CalculatorScreen() {
  const {
    input,
    fresh,
    pinned,
    enteringIds,
    leavingIds,
    patchSide,
    patchAttack,
    selectTemplate,
    swap,
    strike,
    pin,
    unpin,
  } = useCalculator()

  const notes = t.formulaNotes

  return (
    <>
      <AppHeader title={t.calculatorTitle} lead={<Formula />}>
        <p>
          <strong>{t.outgoing}</strong>&nbsp;— {notes.outgoing}
          <br />
          <strong>{t.incoming}</strong>&nbsp;— {notes.incoming}
          <br />
          {notes.where}
        </p>
        <p>{notes.floor}</p>
        <p>{notes.abilities}</p>
      </AppHeader>

      <main className="battle">
        <UnitSide
          role="attacker"
          side={input.attacker}
          onChange={(patch) => patchSide('attacker', patch)}
          onTemplateChange={(templateId) => selectTemplate('attacker', templateId)}
          extra={
            <RangedFields
              ranged={input.ranged}
              rangePenalty={input.rangePenalty}
              onRangedChange={(ranged) => patchAttack({ ranged })}
              onPenaltyChange={(rangePenalty) => patchAttack({ rangePenalty })}
            />
          }
        />

        <div className="battle__swap">
          <IconButton icon={swapIcon} label={t.swapSides} onClick={swap} />
        </div>

        <UnitSide
          role="defender"
          side={input.defender}
          onChange={(patch) => patchSide('defender', patch)}
          onTemplateChange={(templateId) => selectTemplate('defender', templateId)}
        />

        <div className="battle__strike">
          <img className="battle__arrow" src={arrowIcon} alt="" />
          <Button variant="strike" onClick={strike}>
            {t.strike}
          </Button>
        </div>
      </main>

      <Results
        fresh={fresh}
        pinned={pinned}
        enteringIds={enteringIds}
        leavingIds={leavingIds}
        onPin={pin}
        onUnpin={unpin}
      />
    </>
  )
}

/**
 * Формула урона в шапке. Делится на слагаемые по « × », каждое не разрывается:
 * на узком экране строка переносится только перед знаком умножения, а скобки
 * вроде «(20 + ATK)» остаются целыми.
 */
function Formula() {
  const terms = t.headerFormula.split(' × ')

  return terms.map((term, i) => (
    <Fragment key={i}>
      {i > 0 && ' '}
      <span className="app-header__term">{i > 0 ? `× ${term}` : term}</span>
    </Fragment>
  ))
}
