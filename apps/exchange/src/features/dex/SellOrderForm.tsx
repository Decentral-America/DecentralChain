/**
 * SellOrderForm Component
 * Form for placing sell orders on the DEX
 * Allows users to specify price, amount, and automatically calculates total
 */

import { useMutation } from '@tanstack/react-query';
import type React from 'react';
import { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { useAssetBalance } from '@/api/services/assetsService';
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
 * Title
 */
const Title = styled.h3`
  font-size: ${(p) => p.theme.fontSizes.lg};
  font-weight: ${(p) => p.theme.fontWeights.semibold};
  color: ${(p) => p.theme.colors.error};
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
 * Percentage button
 */
const PercentageButton = styled.button<{ $isActive?: boolean }>`
  padding: ${(p) => p.theme.spacing.xs};
  font-size: ${(p) => p.theme.fontSizes.xs};
  font-weight: ${(p) => p.theme.fontWeights.medium};
  color: ${(p) => (p.$isActive ? p.theme.colors.background : p.theme.colors.text)};
  background: ${(p) => (p.$isActive ? p.theme.colors.error : p.theme.colors.secondary)};
  border: 1px solid ${(p) => (p.$isActive ? p.theme.colors.error : p.theme.colors.border)};
  border-radius: ${(p) => p.theme.radii.sm};
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: ${(p) => (p.$isActive ? p.theme.colors.error : `${p.theme.colors.error}20`)};
    border-color: ${(p) => p.theme.colors.error};
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
 * SellOrderForm Component
 */
export const SellOrderForm: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const { selectedPair, marketData, addUserOrder } = useDexStore();

  const [price, setPrice] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [selectedPercentage, setSelectedPercentage] = useState<number | null>(null);
  const [error, setError] = useState<string>('');

  /**
   * Fetch user balance for amount asset (the asset being sold)
   * Use different hooks depending on whether it's DCC (native) or custom token
   */
  const isDccAmountAsset = !selectedPair?.amountAsset || selectedPair.amountAsset === 'DCC';

  // For DCC (native token), use useBalanceWatcher
  const { balances: dccBalances } = useBalanceWatcher({
    enabled: isAuthenticated && isDccAmountAsset,
  });

  // For custom tokens, use useAssetBalance
  const { data: assetBalanceData } = useAssetBalance(
    user?.address || '',
    selectedPair?.amountAsset || '',
    {
      enabled:
        isAuthenticated && !isDccAmountAsset && !!selectedPair?.amountAsset && !!user?.address,
    },
  );

  // Determine available balance based on asset type
  const availableBalance = useMemo(() => {
    if (isDccAmountAsset) {
      // DCC balance is in wavelets, convert to DCC
      return (dccBalances?.available ?? 0) / 100000000;
    } else {
      // Custom token balance is already in minimal units
      return (assetBalanceData?.balance ?? 0) / 100000000;
    }
  }, [isDccAmountAsset, dccBalances?.available, assetBalanceData?.balance]);

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
   * Calculate total (what user receives in price asset)
   */
  const total = useMemo(() => {
    const priceNum = parseFloat(price) || 0;
    const amountNum = parseFloat(amount) || 0;
    return priceNum * amountNum;
  }, [price, amount]);

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

    if (amountNum > availableBalance) {
      setError(
        `Insufficient balance. Available: ${availableBalance.toFixed(8)} ${amountAssetName}`,
      );
      return false;
    }

    return true;
  };

  /**
   * Create sell order mutation
   */
  const sellMutation = useMutation({
    mutationFn: async () => {
      if (!validate()) {
        throw new Error('Validation failed');
      }

      // In production, this would use @decentralchain/transactions order() function
      // For now, create a mock order transaction
      const orderTx = {
        amount: Math.round(parseFloat(amount) * 100000000), // Convert to satoshi
        assetPair: {
          amountAsset: selectedPair?.amountAsset || null,
          priceAsset: selectedPair?.priceAsset || null,
        },
        expiration: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
        matcherFee: 300000, // 0.003 DCC
        matcherPublicKey: '', // Would be fetched from matcher
        orderType: 'sell',
        price: Math.round(parseFloat(price) * 100000000), // Convert to satoshi
        senderPublicKey: user?.publicKey || '',
        timestamp: Date.now(),
        type: 7, // Order transaction type
        version: 3,
      };

      // Send to matcher
      const response = await fetch('/api/matcher/orderbook', {
        body: JSON.stringify(orderTx),
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to place order');
      }

      return response.json();
    },
    onError: (err: Error) => {
      setError(err.message || 'Failed to place sell order');
    },
    onSuccess: (data) => {
      // Add order to local state for immediate UI update
      if (data.orderId) {
        addUserOrder({
          amount: amount,
          filled: '0',
          id: data.orderId,
          price: price,
          status: 'pending',
          timestamp: Date.now(),
          type: 'sell',
        });
      }

      // Reset form
      setPrice(marketData.currentPrice?.toFixed(8) || '');
      setAmount('');
      setSelectedPercentage(null);
      setError('');
    },
  });

  /**
   * Handle percentage button click
   */
  const handlePercentageClick = (percentage: number) => {
    if (!availableBalance) return;

    setSelectedPercentage(percentage);
    const maxAmount = (availableBalance * percentage) / 100;
    setAmount(maxAmount.toFixed(8));
  };

  /**
   * Handle MAX click
   */
  const handleMaxClick = () => {
    if (!availableBalance) return;

    setSelectedPercentage(100);
    setAmount(availableBalance.toFixed(8));
  };

  /**
   * Handle submit
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      sellMutation.mutate();
    }
  };

  if (!selectedPair) {
    return (
      <FormContainer>
        <FormHeader>
          <Title>Sell</Title>
        </FormHeader>
        <ErrorMessage>Please select a trading pair</ErrorMessage>
      </FormContainer>
    );
  }

  return (
    <FormContainer>
      <FormHeader>
        <Title>Sell {amountAssetName}</Title>
      </FormHeader>

      <FormFields as="form" onSubmit={handleSubmit}>
        {/* Available Balance */}
        <BalanceRow>
          <BalanceLabel>Available</BalanceLabel>
          <BalanceValue>
            <BalanceAmount>
              {availableBalance.toFixed(8)} {amountAssetName}
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
          }}
          placeholder="0.00000000"
          step="0.00000001"
          min="0"
          disabled={sellMutation.isPending}
        />

        {/* Amount Input */}
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
            disabled={sellMutation.isPending}
          />
          <BalanceRow>
            <BalanceLabel></BalanceLabel>
            <BalanceValue>
              <MaxButton
                type="button"
                onClick={handleMaxClick}
                disabled={!availableBalance || sellMutation.isPending}
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
              disabled={!availableBalance || sellMutation.isPending}
            >
              {percentage}%
            </PercentageButton>
          ))}
        </PercentageButtons>

        {/* Total (what user receives) */}
        <InfoRow>
          <InfoLabel>Total (Receive)</InfoLabel>
          <InfoValue>
            {total.toFixed(8)} {priceAssetName}
          </InfoValue>
        </InfoRow>

        {/* Error Message */}
        {error && <ErrorMessage>{error}</ErrorMessage>}

        {/* Submit Button */}
        <Button
          type="submit"
          variant="secondary"
          size="large"
          isLoading={sellMutation.isPending}
          disabled={!isAuthenticated || sellMutation.isPending}
        >
          {isAuthenticated ? `Sell ${amountAssetName}` : 'Connect Wallet'}
        </Button>
      </FormFields>
    </FormContainer>
  );
};
