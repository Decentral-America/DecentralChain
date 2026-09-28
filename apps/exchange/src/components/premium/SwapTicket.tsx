/**
 * Swap ticket — a pay leg and a receive leg with a flip button on the seam
 * that really trades their places (a shared-layout spring, not a swap of
 * labels), big amount inputs, token pills with a picker that covers the
 * ticket, and a rate line under the pair.
 *
 * Ported from 21st.dev "Swap Ticket" by @ssychui (demo 27122). The demo's
 * sample book, fiat line, balances and Buy/Sell CTA are gone: this ticket
 * prints only what the host gives it, and the host owns the action button and
 * whether it is enabled.
 */
import { ArrowUpDown, Check, ChevronDown, X } from 'lucide-react';
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from 'motion/react';
import { type ReactNode, useId, useState } from 'react';
import styled from 'styled-components';
import { markInk } from '@/styles/brandMarks';
import { chrome, spring } from '@/styles/tokens';
import { hasContent } from './hasContent';

export interface SwapAsset {
  symbol: string;
  name: string;
  /** Brand colour of the asset's mark; kept native in both themes. */
  color: string;
}

export interface SwapTicketProps {
  assets: SwapAsset[];
  pay: SwapAsset;
  receive: SwapAsset;
  /** Called with the new pair after a flip or a pick. */
  onPairChange: (pair: { pay: SwapAsset; receive: SwapAsset }) => void;
  amount: string;
  onAmountChange: (value: string) => void;
  /** The quoted receive amount; empty when there is no quote. */
  receiveAmount?: string | undefined;
  /** Rows under the pair, e.g. the rate and fee. */
  details?: ReactNode | undefined;
  /** The action, owned by the host. */
  action: ReactNode;
  /** Controls docked at the right of the title row. */
  toolbar?: ReactNode | undefined;
  title?: string | undefined;
}

const Card = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
  padding: 16px;
  border-radius: 20px;
  background: ${({ theme }) => theme.colors.surface};
  box-shadow: ${({ theme }) =>
    theme.mode === 'dark' ? `0 0 0 1px ${theme.colors.border}` : theme.shadows.lg};
`;

const TitleRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 4px;
`;

const Title = styled.h2`
  margin: 0;
  font-size: 17px;
  font-weight: 600;
  letter-spacing: -0.02em;
  color: ${({ theme }) => theme.colors.text};
`;

const Legs = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const Leg = styled(motion.div)`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px;
  border-radius: 16px;
  background: ${({ theme }) => chrome[theme.mode].fillSubtle};
  transition: box-shadow 160ms cubic-bezier(0.32, 0.72, 0, 1);

  &:focus-within {
    box-shadow: inset 0 0 0 1px ${({ theme }) => theme.colors.primary};
  }
`;

const LegLabel = styled.span`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const LegMain = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const Amount = styled.input`
  all: unset;
  flex: 1;
  min-width: 0;
  font-size: 34px;
  font-weight: 500;
  letter-spacing: -0.03em;
  line-height: 42px;
  font-variant-numeric: tabular-nums;
  color: ${({ theme }) => theme.colors.text};
  caret-color: ${({ theme }) => theme.colors.primary};

  &::placeholder {
    color: ${({ theme }) => theme.colors.textSubtle};
  }

  &:read-only {
    cursor: default;
  }
`;

const Pill = styled(motion.button)`
  all: unset;
  box-sizing: border-box;
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  gap: 8px;
  height: 40px;
  padding: 0 12px 0 6px;
  border-radius: 20px;
  cursor: pointer;
  font-size: 15px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text};
  background: ${({ theme }) => theme.colors.surface};
  box-shadow: ${({ theme }) =>
    theme.mode === 'dark' ? `0 0 0 1px ${theme.colors.borderStrong}` : chrome.light.ticketShadow};
  transition: background-color 160ms cubic-bezier(0.32, 0.72, 0, 1);

  &:hover {
    background: ${({ theme }) => theme.colors.surfaceHover};
  }

  &:focus-visible {
    box-shadow: 0 0 0 2px ${({ theme }) => theme.colors.primary};
  }

  svg {
    color: ${({ theme }) => theme.colors.textSecondary};
  }
`;

const Mark = styled.span`
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  font-size: 12px;
  font-weight: 600;
  color: ${markInk};
`;

const Flip = styled(motion.button)`
  all: unset;
  position: absolute;
  top: 50%;
  left: 50%;
  z-index: 2;
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  margin: -20px 0 0 -20px;
  border-radius: 12px;
  cursor: pointer;
  color: ${({ theme }) => theme.colors.text};
  background: ${({ theme }) => theme.colors.surface};
  /* A ring of the card colour cuts the button out of both legs. */
  box-shadow: 0 0 0 4px ${({ theme }) => theme.colors.surface};

  &:hover {
    background: ${({ theme }) => theme.colors.surfaceHover};
  }

  &:focus-visible {
    box-shadow:
      0 0 0 4px ${({ theme }) => theme.colors.surface},
      0 0 0 6px ${({ theme }) => theme.colors.primary};
  }
`;

const Details = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 0 4px;
`;

const Picker = styled(motion.div)`
  position: absolute;
  inset: 0;
  z-index: 5;
  display: flex;
  flex-direction: column;
  padding: 16px;
  border-radius: 20px;
  background: ${({ theme }) => theme.colors.surface};
`;

const PickerHead = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 4px 8px;
`;

const IconButton = styled.button`
  all: unset;
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border-radius: 10px;
  cursor: pointer;
  color: ${({ theme }) => theme.colors.textSecondary};

  &:hover {
    background: color-mix(in srgb, ${({ theme }) => theme.colors.text} 6%, transparent);
    color: ${({ theme }) => theme.colors.text};
  }

  &:focus-visible {
    box-shadow: 0 0 0 2px ${({ theme }) => theme.colors.primary};
  }
`;

const Option = styled.button<{ $active: boolean }>`
  all: unset;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 8px;
  border-radius: 12px;
  cursor: pointer;
  background: ${({ theme, $active }) => ($active ? theme.colors.primarySurface : 'transparent')};

  &:hover {
    background: ${({ theme, $active }) =>
      $active
        ? theme.colors.primarySurface
        : `color-mix(in srgb, ${theme.colors.text} 5%, transparent)`};
  }

  &:focus-visible {
    box-shadow: inset 0 0 0 2px ${({ theme }) => theme.colors.primary};
  }

  strong {
    display: block;
    font-size: 15px;
    font-weight: 600;
    color: ${({ theme }) => theme.colors.text};
  }

  small {
    display: block;
    font-size: 13px;
    color: ${({ theme }) => theme.colors.textSecondary};
  }

  svg {
    margin-left: auto;
    color: ${({ theme }) => theme.colors.primary};
  }
`;

function AssetMark({ asset }: { asset: SwapAsset }) {
  return (
    <Mark aria-hidden style={{ background: asset.color }}>
      {asset.symbol.slice(0, 1)}
    </Mark>
  );
}

export function SwapTicket({
  assets,
  pay,
  receive,
  onPairChange,
  amount,
  onAmountChange,
  receiveAmount = '',
  details,
  action,
  toolbar,
  title = 'Swap',
}: SwapTicketProps) {
  const reduced = useReducedMotion();
  const group = useId();
  const [picking, setPicking] = useState<'pay' | 'receive' | null>(null);
  const [turns, setTurns] = useState(0);
  const layout = reduced ? { duration: 0 } : spring;

  // The legs trade places through their layoutIds, so the pay card physically
  // travels to the bottom and the receive card to the top.
  const flip = () => {
    setTurns((t) => t + 1);
    onPairChange({ pay: receive, receive: pay });
    if (receiveAmount) onAmountChange(receiveAmount);
  };

  const pick = (asset: SwapAsset) => {
    if (picking === 'pay') {
      onPairChange({ pay: asset, receive: asset.symbol === receive.symbol ? pay : receive });
    } else if (picking === 'receive') {
      onPairChange({ pay: asset.symbol === pay.symbol ? receive : pay, receive: asset });
    }
    setPicking(null);
  };

  const leg = (side: 'pay' | 'receive') => {
    const asset = side === 'pay' ? pay : receive;
    return (
      <Leg key={asset.symbol} layout layoutId={`${group}-${asset.symbol}`} transition={layout}>
        <LegLabel>{side === 'pay' ? 'You pay' : 'You receive'}</LegLabel>
        <LegMain>
          <Amount
            value={side === 'pay' ? amount : receiveAmount}
            onChange={
              side === 'pay'
                ? (e) => {
                    const v = e.target.value;
                    if (/^\d*\.?\d*$/.test(v)) onAmountChange(v);
                  }
                : undefined
            }
            readOnly={side === 'receive'}
            placeholder="0"
            inputMode="decimal"
            aria-label={side === 'pay' ? 'Amount to pay' : 'Amount to receive'}
          />
          <Pill
            type="button"
            onClick={() => setPicking(side)}
            aria-haspopup="listbox"
            aria-label={`${side === 'pay' ? 'Pay' : 'Receive'} asset: ${asset.symbol}`}
            whileTap={reduced ? {} : { scale: 0.97 }}
          >
            <AssetMark asset={asset} />
            {asset.symbol}
            <ChevronDown size={16} strokeWidth={2.25} />
          </Pill>
        </LegMain>
      </Leg>
    );
  };

  return (
    <Card>
      <TitleRow>
        <Title>{title}</Title>
        {toolbar}
      </TitleRow>

      <LayoutGroup id={group}>
        <Legs>
          {leg('pay')}
          <Flip
            type="button"
            onClick={flip}
            aria-label="Reverse direction"
            animate={{ rotate: turns * 180 }}
            transition={layout}
            whileTap={reduced ? {} : { scale: 0.92 }}
          >
            <ArrowUpDown size={18} strokeWidth={2} />
          </Flip>
          {leg('receive')}
        </Legs>
      </LayoutGroup>

      {hasContent(details) ? <Details>{details}</Details> : null}
      {action}

      <AnimatePresence>
        {picking ? (
          <Picker
            role="listbox"
            aria-label="Choose an asset"
            initial={{ opacity: 0, scale: reduced ? 1 : 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: reduced ? 1 : 0.98 }}
            transition={{ duration: 0.18, ease: [0.32, 0.72, 0, 1] }}
          >
            <PickerHead>
              <Title as="h3">{picking === 'pay' ? 'You pay' : 'You receive'}</Title>
              <IconButton type="button" onClick={() => setPicking(null)} aria-label="Close">
                <X size={16} />
              </IconButton>
            </PickerHead>
            {assets.map((asset) => {
              const active = (picking === 'pay' ? pay : receive).symbol === asset.symbol;
              return (
                <Option
                  key={asset.symbol}
                  type="button"
                  role="option"
                  aria-selected={active}
                  $active={active}
                  onClick={() => pick(asset)}
                >
                  <AssetMark asset={asset} />
                  <span>
                    <strong>{asset.symbol}</strong>
                    <small>{asset.name}</small>
                  </span>
                  {active ? <Check size={18} /> : null}
                </Option>
              );
            })}
          </Picker>
        ) : null}
      </AnimatePresence>
    </Card>
  );
}
