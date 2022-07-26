import { useCallback, useState, ChangeEvent, useMemo, useEffect } from 'react'
import { routes } from 'constants/routes'
import { Typography, Box, useTheme } from '@mui/material'
import { CurrencyAmount } from '@uniswap/sdk'
import AppBody from 'components/AppBody'
import { ReactComponent as ArrowCircle } from 'assets/svg/arrow_circle.svg'
import { AssetAccordion } from '../Swap/AssetAccordion'
import CurrencyInputPanel from 'components/Input/CurrencyInputPanel'
import { AllTokens } from 'models/allTokens'
import { useUserSlippageTolerance } from 'state/user/hooks'
import { useDerivedSwapInfo, useSwapActionHandlers, useSwapState } from 'state/swap/hooks'
import useWrapCallback, { WrapType } from 'hooks/useWrapCallback'
import { Field } from 'state/swap/actions'
import { ApprovalState, useApproveCallbackFromTrade } from 'hooks/useApproveCallback'
import { maxAmountSpend } from 'utils/maxAmountSpend'
import Card from 'components/Card'
import { useNavigate } from 'react-router-dom'
// import ConfirmSupplyModal from 'components/Modal/ConfirmSupplyModal'
import DoubleCurrencyLogo from 'components/essential/CurrencyLogo/DoubleLogo'
import Tag from 'components/Tag'

export default function ImportPool() {
  const navigate = useNavigate()

  const [allowedSlippage] = useUserSlippageTolerance()
  const { independentField, typedValue } = useSwapState()

  const { v2Trade, currencyBalances, parsedAmount, currencies } = useDerivedSwapInfo()
  const { [Field.INPUT]: fromAsset, [Field.OUTPUT]: toAsset } = currencies
  const { wrapType } = useWrapCallback(currencies[Field.INPUT], currencies[Field.OUTPUT], typedValue)
  const showWrap: boolean = wrapType !== WrapType.NOT_APPLICABLE

  const trade = showWrap ? undefined : v2Trade

  const parsedAmounts = showWrap
    ? {
        [Field.INPUT]: parsedAmount,
        [Field.OUTPUT]: parsedAmount
      }
    : {
        [Field.INPUT]: independentField === Field.INPUT ? parsedAmount : trade?.inputAmount,
        [Field.OUTPUT]: independentField === Field.OUTPUT ? parsedAmount : trade?.outputAmount
      }

  const { onCurrencySelection, onUserInput } = useSwapActionHandlers()

  const dependentField: Field = independentField === Field.INPUT ? Field.OUTPUT : Field.INPUT

  const formattedAmounts = {
    [independentField]: typedValue,
    [dependentField]: showWrap
      ? parsedAmounts[independentField]?.toExact() ?? ''
      : parsedAmounts[dependentField]?.toSignificant(6) ?? ''
  }
  const { [independentField]: fromVal, [dependentField]: toVal } = formattedAmounts

  const [approval] = useApproveCallbackFromTrade(trade, allowedSlippage)
  const [approvalSubmitted, setApprovalSubmitted] = useState<boolean>(false)

  useEffect(() => {
    if (approval === ApprovalState.PENDING) {
      setApprovalSubmitted(true)
    }
  }, [approval, approvalSubmitted])

  const maxAmountInput: CurrencyAmount | undefined = maxAmountSpend(currencyBalances[Field.INPUT])

  const handleMaxInput = useCallback(() => {
    maxAmountInput && onUserInput(Field.INPUT, maxAmountInput.toExact())
  }, [maxAmountInput, onUserInput])

  const handleFromVal = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      onUserInput(Field.INPUT, e.target.value)
    },
    [onUserInput]
  )

  const handleToVal = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      onUserInput(Field.OUTPUT, e.target.value)
    },
    [onUserInput]
  )

  const handleFromAsset = useCallback(
    (currency: AllTokens) => {
      setApprovalSubmitted(false) // reset 2 step UI for approvals
      onCurrencySelection(Field.INPUT, currency)
    },
    [onCurrencySelection]
  )

  const handleToAsset = useCallback(
    (currency: AllTokens) => {
      onCurrencySelection(Field.OUTPUT, currency)
    },
    [onCurrencySelection]
  )

  const error = useMemo(() => {
    if (!fromAsset || !toAsset) {
      return 'Select a token to find your liquidity'
    }

    return undefined
  }, [fromAsset, toAsset])

  return (
    <>
      {/* <ConfirmSupplyModal
        onConfirm={() => {}}
        from={fromAsset ?? undefined}
        to={toAsset ?? undefined}
        fromVal={fromVal}
        toVal={toVal}
        isOpen={false}
        onDismiss={() => {}}
      /> */}

      <AppBody
        width={'100%'}
        maxWidth={'680px'}
        onReturnClick={() => navigate(routes.pool)}
        title="Import Pool"
        sx={{ padding: '24px 32px' }}
      >
        <Box mt={35}>
          <Box mb={fromAsset ? 16 : 0}>
            <CurrencyInputPanel
              selectedTokenType={toAsset ? ('tokenId' in toAsset ? 'erc1155' : 'erc20') : undefined}
              value={fromVal}
              onChange={handleFromVal}
              onSelectCurrency={handleFromAsset}
              currency={fromAsset}
              onMax={handleMaxInput}
            />
          </Box>
          {fromAsset && <AssetAccordion token={fromAsset} />}
          <Box sx={{ height: 76, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ArrowCircle />
          </Box>

          <Box mb={toAsset ? 16 : 0}>
            <CurrencyInputPanel
              selectedTokenType={fromAsset ? ('tokenId' in fromAsset ? 'erc1155' : 'erc20') : undefined}
              value={toVal}
              onChange={handleToVal}
              onSelectCurrency={handleToAsset}
              currency={toAsset}
            />
          </Box>
          {toAsset && <AssetAccordion token={toAsset} />}

          <PositionInfo from={fromAsset} to={toAsset} price="25.1676" error={error} />
        </Box>
      </AppBody>
    </>
  )
}

function PositionInfo({
  from,
  to,
  price,
  error
}: {
  from?: AllTokens
  to?: AllTokens
  price?: string
  error?: string
}) {
  const theme = useTheme()
  const data = {
    ['Your pool share']: '5.00 %',
    ['DAI']: '0.2344887737787377',
    ['Tickets for the community #56']: '30'
  }
  return (
    <>
      {!error && (
        <Typography sx={{ textAlign: 'center', mt: 20, color: theme.palette.text.secondary }}>Pool Found!</Typography>
      )}
      <Card
        color={error ? theme.palette.action.disabledBackground : theme.palette.background.default}
        style={{
          margin: error ? '20px 0 40px' : '8px 0 40px',
          padding: '16px 20px',
          minHeight: 200,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {error && <Typography>{error}</Typography>}
        {!error && (
          <Box sx={{ width: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center', mb: 12 }}>
              <Typography sx={{ fontSize: 20 }}>Your position</Typography>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8
                }}
              >
                <Tag>ERC20</Tag>
                <Tag>ERC1155</Tag>
              </Box>
            </Box>

            <Box display="flex" justifyContent="space-between" mb={28}>
              <DoubleCurrencyLogo currency0={from} currency1={to} />
              <Typography fontSize={16} fontWeight={700}>
                {price || '-'}{' '}
              </Typography>
            </Box>
            <Box sx={{ display: 'grid', gap: 12 }}>
              {Object.keys(data).map((key, idx) => (
                <Box key={idx} display="flex" justifyContent="space-between">
                  <Typography sx={{ color: theme.palette.text.secondary, fontWeight: 500 }}>{key}</Typography>
                  <Typography sx={{ fontWeight: 700 }}>{data[key as keyof typeof data]}</Typography>
                </Box>
              ))}
            </Box>
          </Box>
        )}
      </Card>
    </>
  )
}