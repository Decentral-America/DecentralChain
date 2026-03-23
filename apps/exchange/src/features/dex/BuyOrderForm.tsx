/**
 * BuyOrderForm Component
 * Form for placing buy orders on the DEX
 * Allows users to specify price, amount, and automatically calculates total
 * Mirrors SellOrderForm structure for consistency
 */
import type React from 'react';
import { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { useAssetBalance } from '@/api/services/assetsService';
import { useMatcherSettings, usePlaceOrder } from '@/api/services/matcherService';
import { Button } from '@/components/atoms/Button';
import { Input } from '@/components/atoms/Input';
import { useAuth } from '@/contexts/AuthContext';
import { useBalanceWatcher } from '@/hooks/useBalanceWatcher';
import { useDexStore } from '@/stores/dexStore';

/**
 * Form container
 */
const FormContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: ${(p) => p.theme.spacing.md};
  background: ${(p) => p.theme.colors.background};
`;

/**
 * Form header
 */
const FormHeader = styled.div`
  margin-bottom: ${(p) => p.theme.spacing.md};
`;

/**
 * Title (green for buy)
 */
const Title = styled.h3`
  font-size: ${(p) => p.theme.fontSizes.lg};
  font-weight: ${(p) => p.theme.fontWeights.semibold};
  color: ${(p) => p.theme.colors.success};
  margin: 0;
`;

/**
 * Form fields
 */
const FormFields = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${(p) => p.theme.spacing.md};
  flex: 1;
`;

/**
 * Info row
 */
const InfoRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: ${(p) => p.theme.spacing.sm};
  background: ${(p) => p.theme.colors.secondary};
  border-radius: ${(p) => p.theme.radii.md};
`;

/**
 * Info label
 */
const InfoLabel = styled.span`
  font-size: ${(p) => p.theme.fontSizes.sm};
  color: ${(p) => p.theme.colors.text};
  opacity: 0.7;
`;

/**
 * Info value
 */
const InfoValue = styled.span`
  font-size: ${(p) => p.theme.fontSizes.sm};
  font-weight: ${(p) => p.theme.fontWeights.medium};
  color: ${(p) => p.theme.colors.text};
  font-family: ${(p) => p.theme.fonts.mono};
`;

/**
 * Balance row
 */
const BalanceRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: ${(p) => p.theme.spacing.xs};
`;

/**
 * Balance label
 */
const BalanceLabel = styled.span`
  font-size: ${(p) => p.theme.fontSizes.xs};
  color: ${(p) => p.theme.colors.text};
  opacity: 0.6;
`;

/**
 * Balance value with max button
 */
const BalanceValue = styled.div`
  display: flex;
  align-items: center;
  gap: ${(p) => p.theme.spacing.xs};
`;

/**
 * Balance amount
 */
const BalanceAmount = styled.span`
  font-size: ${(p) => p.theme.fontSizes.xs};
  color: ${(p) => p.theme.colors.text};
  font-family: ${(p) => p.theme.fonts.mono};
`;

/**
 * MAX button
 */
const MaxButton = styled.button`
  padding: 2px 6px;
  font-size: ${(p) => p.theme.fontSizes.xs};
  font-weight: ${(p) => p.theme.fontWeights.medium};
  color: ${(p) => p.theme.colors.primary};
  background: transparent;
  border: 1px solid ${(p) => p.theme.colors.primary};
  border-radius: ${(p) => p.theme.radii.sm};
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: ${(p) => p.theme.colors.primary}15;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

/**
 * Percentage buttons
 */
const PercentageButtons = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: ${(p) => p.theme.spacing.xs};
`;

/**
 * Percentage button (green for buy)
 */
const PercentageButton = styled.button<{ $isActive?: boolean }>`
  padding: ${(p) => p.theme.spacing.xs};
  font-size: ${(p) => p.theme.fontSizes.xs};
  font-weight: ${(p) => p.theme.fontWeights.medium};
  color: ${(p) => (p.$isActive ? p.theme.colors.background : p.theme.colors.text)};
  background: ${(p) => (p.$isActive ? p.theme.colors.success : p.theme.colors.secondary)};
  border: 1px solid ${(p) => (p.$isActive ? p.theme.colors.success : p.theme.colors.border)};
  border-radius: ${(p) => p.theme.radii.sm};
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: ${(p) => (p.$isActive ? p.theme.colors.success : `${p.theme.colors.success}20`)};
    border-color: ${(p) => p.theme.colors.success};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

/**
 * Error message
 */
const ErrorMessage = styled.div`
  padding: ${(p) => p.theme.spacing.sm};
  background: ${(p) => p.theme.colors.error}15;
  border: 1px solid ${(p) => p.theme.colors.error};
  border-radius: ${(p) => p.theme.radii.md};
  color: ${(p) => p.theme.colors.error};
  font-size: ${(p) => p.theme.fontSizes.sm};
`;

/**
 * BuyOrderForm Component
 */
export const BuyOrderForm: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const { selectedPair, marketData, addUserOrder } = useDexStore();

  const [price, setPrice] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [selectedPercentage, setSelectedPercentage] = useState<number | null>(null);
  const [error, setError] = useState<string>('');

  /**
   * Fetch user balance for price asset (the asset used to buy)
   * Use different hooks depending on whether it's DCC (native) or custom token
   */
  const isDccPriceAsset = !selectedPair?.priceAsset || selectedPair.priceAsset === 'DCC';

  // For DCC (native token), use useBalanceWatcher
  const { balances: dccBalances } = useBalanceWatcher({
    enabled: isAuthenticated && isDccPriceAsset,
  });

  // For custom tokens, use useAssetBalance
  const { data: assetBalanceData } = useAssetBalance(
    user?.address || '',
    selectedPair?.priceAsset || '',
    {
      enabled: isAuthenticated && !isDccPriceAsset && !!selectedPair?.priceAsset && !!user?.address,
    },
  );

  // Determine available balance based on asset type
  const availableBalance = useMemo(() => {
    if (isDccPriceAsset) {
      // DCC balance is in wavelets, convert to DCC
      return (dccBalances?.available ?? 0) / 100000000;
    } else {
      // Custom token balance is already in minimal units
      return (assetBalanceData?.balance ?? 0) / 100000000;
    }
  }, [isDccPriceAsset, dccBalances?.available, assetBalanceData?.balance]);

  // Get display names from pair
  const priceAssetName = selectedPair?.priceAssetName || 'DCC';
  const amountAssetName = selectedPair?.amountAssetName || 'Asset';

  /**
   * Auto-fill price with current market price
   */
  useEffect(() => {
    if (marketData.currentPrice && !price) {
      setPrice(marketData.currentPrice.toFixed(8));
    }
  }, [marketData.currentPrice, price]);

  /**
   * Calculate total (what user pays in price asset)
   */
  const total = useMemo(() => {
    const priceNum = parseFloat(price) || 0;
    const amountNum = parseFloat(amount) || 0;
    return priceNum * amountNum;
  }, [price, amount]);

  /**
   * Calculate max amount user can buy with available balance
   */
  const maxBuyableAmount = useMemo(() => {
    const priceNum = parseFloat(price) || 0;
    if (priceNum === 0) return 0;
    return availableBalance / priceNum;
  }, [availableBalance, price]);

  /**
   * Validate form
   */
  const validate = (): boolean => {
    setError('');

    if (!isAuthenticated) {
      setError('Please connect your wallet');
      return false;
    }

    if (!selectedPair) {
      setError('Please select a trading pair');
      return false;
    }

    const priceNum = parseFloat(price);
    const amountNum = parseFloat(amount);

    if (!price || Number.isNaN(priceNum) || priceNum <= 0) {
      setError('Please enter a valid price');
      return false;
    }

    if (!amount || Number.isNaN(amountNum) || amountNum <= 0) {
      setError('Please enter a valid amount');
      return false;
    }

    if (total > availableBalance) {
      setError(`Insufficient balance. Available: ${availableBalance.toFixed(8)} ${priceAssetName}`);
      return false;
    }

    return true;
  };

  // Get matcher settings for public key and fees
  const { data: matcherSettings } = useMatcherSettings();
  const placeOrderMutation = usePlaceOrder();

  /**
   * Handle buy order submission
   */
  const handleBuyOrder = async () => {
    if (!validate()) {
      return;
    }

    if (!matcherSettings?.matcherPublicKey) {
      setError('Matcher settings not loaded');
      return;
    }

    try {
      // Create order parameters for the matcher
      const orderData = {
        amount: Math.round(parseFloat(amount) * 100000000), // Convert to satoshi
        assetPair: {
          amountAsset: selectedPair?.amountAsset || '',
          priceAsset: selectedPair?.priceAsset || '',
        },
        expiration: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
        matcherFee: matcherSettings.orderFee.dynamic.baseFee,
        matcherPublicKey: matcherSettings.matcherPublicKey,
        orderType: 'limit' as const, // Use 'limit' for buy orders
        price: Math.round(parseFloat(price) * 100000000), // Convert to satoshi
        proofs: [], // Will be signed by user's wallet
        senderPublicKey: user?.publicKey || '',
        timestamp: Date.now(),
        version: 3,
      };

      // Place order via matcher API
      const result = await placeOrderMutation.mutateAsync(orderData);

      // Success handling
      if (result?.id) {
        addUserOrder({
          amount: amount,
          filled: '0',
          id: result.id,
          price: price,
          status: 'pending',
          timestamp: Date.now(),
          type: 'buy',
        });
      }

      // Reset form
      setPrice(marketData.currentPrice?.toFixed(8) || '');
      setAmount('');
      setSelectedPercentage(null);
      setError('');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to place buy order';
      setError(errorMessage);
    }
  };

  // Create a mutation-like object for consistency with the component's API
  const buyMutation = {
    isPending: placeOrderMutation.isPending,
    mutate: handleBuyOrder,
  };

  /**
   * Handle percentage button click - calculates amount based on available balance
   */
  const handlePercentageClick = (percentage: number) => {
    if (!availableBalance || !parseFloat(price)) return;

    setSelectedPercentage(percentage);
    const maxAmount = (maxBuyableAmount * percentage) / 100;
    setAmount(maxAmount.toFixed(8));
  };

  /**
   * Handle MAX click - use all available balance
   */
  const handleMaxClick = () => {
    if (!maxBuyableAmount) return;

    setSelectedPercentage(100);
    setAmount(maxBuyableAmount.toFixed(8));
  };

  /**
   * Handle submit
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      void buyMutation.mutate();
    }
  };

  if (!selectedPair) {
    return (
      <FormContainer>
        <FormHeader>
          <Title>Buy</Title>
        </FormHeader>
        <ErrorMessage>Please select a trading pair</ErrorMessage>
      </FormContainer>
    );
  }

  return (
    <FormContainer>
      <FormHeader>
        <Title>Buy {amountAssetName}</Title>
      </FormHeader>

      <FormFields as="form" onSubmit={handleSubmit}>
        {/* Available Balance (in price asset - what user pays with) */}
        <BalanceRow>
          <BalanceLabel>Available</BalanceLabel>
          <BalanceValue>
            <BalanceAmount>
              {availableBalance.toFixed(8)} {priceAssetName}
            </BalanceAmount>
          </BalanceValue>
        </BalanceRow>

        {/* Price Input */}
        <Input
          label={`Price (${priceAssetName})`}
          type="number"
          value={price}
          onChange={(e) => {
            setPrice(e.target.value);
            setError('');
            // Recalculate max buyable amount when price changes
            if (selectedPercentage !== null) {
              const priceNum = parseFloat(e.target.value) || 0;
              if (priceNum > 0) {
                const maxAmt = (availableBalance / priceNum) * (selectedPercentage / 100);
                setAmount(maxAmt.toFixed(8));
              }
            }
          }}
          placeholder="0.00000000"
          step="0.00000001"
          min="0"
          disabled={buyMutation.isPending}
        />

        {/* Amount Input (what user receives) */}
        <div>
          <Input
            label={`Amount (${amountAssetName})`}
            type="number"
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value);
              setSelectedPercentage(null);
              setError('');
            }}
            placeholder="0.00000000"
            step="0.00000001"
            min="0"
            disabled={buyMutation.isPending}
          />
          <BalanceRow>
            <BalanceLabel></BalanceLabel>
            <BalanceValue>
              <MaxButton
                type="button"
                onClick={handleMaxClick}
                disabled={!availableBalance || !parseFloat(price) || buyMutation.isPending}
              >
                MAX
              </MaxButton>
            </BalanceValue>
          </BalanceRow>
        </div>

        {/* Percentage Buttons */}
        <PercentageButtons>
          {[25, 50, 75, 100].map((percentage) => (
            <PercentageButton
              key={percentage}
              type="button"
              $isActive={selectedPercentage === percentage}
              onClick={() => handlePercentageClick(percentage)}
              disabled={!availableBalance || !parseFloat(price) || buyMutation.isPending}
            >
              {percentage}%
            </PercentageButton>
          ))}
        </PercentageButtons>

        {/* Total (what user pays) */}
        <InfoRow>
          <InfoLabel>Total (Pay)</InfoLabel>
          <InfoValue>
            {total.toFixed(8)} {priceAssetName}
          </InfoValue>
        </InfoRow>

        {/* Error Message */}
        {error && <ErrorMessage>{error}</ErrorMessage>}

        {/* Submit Button */}
        <Button
          type="submit"
          variant="primary"
          size="large"
          isLoading={buyMutation.isPending}
          disabled={!isAuthenticated || buyMutation.isPending}
        >
          {isAuthenticated ? `Buy ${amountAssetName}` : 'Connect Wallet'}
        </Button>
      </FormFields>
    </FormContainer>
  );
};
