/**
 * Gateway Service
 * Main service class for interacting with gateway API (BTC bridge)
 */
import { BigNumber } from '@waves/bignumber';
import { GatewayConfig, DepositDetails, WithdrawDetails, GatewayType } from './types';
import { validateGatewayAddress, formatGatewayError } from './utils';

/**
 * Gateway Service Class
 * Handles communication with gateway API for deposit/withdraw operations
 */
export class GatewayService {
  private gatewayConfigs: Record<string, GatewayConfig>;
  private timeout = 30000; // 30 second timeout

  constructor(configs: Record<string, GatewayConfig>) {
    this.gatewayConfigs = configs;
  }

  /**
   * Check if an asset has gateway support for deposit or withdraw
   */
  hasSupportOf(assetId: string, type: GatewayType): boolean {
    return !!this.gatewayConfigs[assetId];
  }

  /**
   * Get deposit details from gateway API
   * @param assetId - The asset ID to deposit
   * @param userAddress - User's DecentralChain address
   * @returns Deposit details including gateway address, fees, limits
   */
  async getDepositDetails(assetId: string, userAddress: string): Promise<DepositDetails> {
    const config = this.gatewayConfigs[assetId];
    if (!config) {
      throw new Error('Asset not supported by gateway');
    }

    try {
      // Determine API endpoint based on gateway configuration
      let fetchUrl = `${config.url}/api/fullinfo`;
      if (config.otherNetwork) {
        // For gateways with otherNetwork, use the full-info endpoint
        // Extract ticker from asset configuration if available
        const ticker = 'BTC'; // TODO: Get from asset config
        fetchUrl = `${config.url}/api/full-info/${config.otherNetwork}/${ticker}`;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(fetchUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Gateway API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      // Parse response into DepositDetails interface
      const depositDetails: DepositDetails = {
        address: data.otherAddress || data.address || '',
        minimumAmount: new BigNumber(data.minAmount || data.min_amount || 0),
        maximumAmount: new BigNumber(data.maxAmount || data.max_amount || 0),
        gatewayFee: new BigNumber(data.fee || 0),
        disclaimerLink: data.disclaimer,
        minRecoveryAmount: data.recovery_amount ? new BigNumber(data.recovery_amount) : undefined,
        recoveryFee: data.recovery_fee ? new BigNumber(data.recovery_fee) : undefined,
        supportEmail: data.email,
        operator: data.company,
        walletAddress: userAddress,
        gatewayType: data.type || 'deposit',
        gatewayUrl: config.url,
      };

      // For static tunnel type, get the specific deposit address
      if (depositDetails.gatewayType === 'deposit') {
        const tunnelAddress = await this.getDepositAddress(assetId, userAddress);
        depositDetails.address = tunnelAddress;
      }

      return depositDetails;
    } catch (error: any) {
      if (error.name === 'AbortError') {
        throw new Error('Gateway request timeout');
      }
      throw new Error(formatGatewayError(error));
    }
  }

  /**
   * Get withdraw details from gateway API
   * @param assetId - The asset ID to withdraw
   * @param targetAddress - External blockchain address to withdraw to
   * @returns Withdraw details including gateway address, fees, limits
   */
  async getWithdrawDetails(assetId: string, targetAddress: string): Promise<WithdrawDetails> {
    const config = this.gatewayConfigs[assetId];
    if (!config) {
      throw new Error('Asset not supported by gateway');
    }

    // Validate target address format
    const isValidAddress = validateGatewayAddress(targetAddress, assetId, this.gatewayConfigs);
    if (!isValidAddress) {
      throw new Error('Invalid destination address format');
    }

    try {
      // Determine API endpoint
      let fetchUrl = `${config.url}/api/fullinfo`;
      if (config.otherNetwork) {
        const ticker = 'BTC'; // TODO: Get from asset config
        fetchUrl = `${config.url}/api/full-info/${config.otherNetwork}/${ticker}`;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(fetchUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Gateway API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      // Parse withdraw-specific fields
      const withdrawDetails: WithdrawDetails = {
        address: data.tnAddress || data.wavesAddress || '',
        attachment: targetAddress,
        minimumAmount: new BigNumber(data.minAmount || data.min_amount || 0),
        maximumAmount: new BigNumber(data.maxAmount || data.max_amount || 0),
        gatewayFee: new BigNumber(data.other_total_fee || data.fee || 0),
        gatewayType: data.type || 'deposit',
        gatewayUrl: config.url,
      };

      return withdrawDetails;
    } catch (error: any) {
      if (error.name === 'AbortError') {
        throw new Error('Gateway request timeout');
      }
      throw new Error(formatGatewayError(error));
    }
  }

  /**
   * Get static tunnel deposit address for a user
   * @param assetId - The asset ID
   * @param userAddress - User's DecentralChain address
   * @returns BTC deposit address
   */
  async getDepositAddress(assetId: string, userAddress: string): Promise<string> {
    const config = this.gatewayConfigs[assetId];
    if (!config) {
      throw new Error('Asset not supported by gateway');
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(`${config.url}/tunnel/${userAddress}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Failed to get deposit address: ${response.status}`);
      }

      const data = await response.json();
      return data.address || '';
    } catch (error: any) {
      if (error.name === 'AbortError') {
        throw new Error('Gateway request timeout');
      }
      throw new Error(formatGatewayError(error));
    }
  }

  /**
   * Get round-robin deposit address (temporary with expiry)
   * @param assetId - The asset ID
   * @param userAddress - User's DecentralChain address
   * @param recaptcha - Recaptcha token
   * @returns Temporary deposit address with expiry date
   */
  async getRobinAddress(
    assetId: string,
    userAddress: string,
    recaptcha: string
  ): Promise<{ address: string; expiry: Date }> {
    const config = this.gatewayConfigs[assetId];
    if (!config) {
      throw new Error('Asset not supported by gateway');
    }

    try {
      const ticker = 'BTC'; // TODO: Get from asset config
      const otherNetwork = config.otherNetwork || 'Bitcoin';

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(`${config.url}/api/deposits`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          ticker,
          dstAddress: userAddress,
          srcNetwork: otherNetwork,
          dstNetwork: 'TurtleNetwork',
          recaptcha,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Failed to get round-robin address: ${response.status}`);
      }

      const data = await response.json();
      return {
        address: data.depositAddress || '',
        expiry: new Date(data.expiry),
      };
    } catch (error: any) {
      if (error.name === 'AbortError') {
        throw new Error('Gateway request timeout');
      }
      throw new Error(formatGatewayError(error));
    }
  }
}
