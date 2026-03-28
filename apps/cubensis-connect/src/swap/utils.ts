import type { SwapVendor } from '#swap/constants';
import { swapVendorLogosByName } from '#swap/constants';

export function getSwapVendorLogo(swapVendor: SwapVendor) {
  return swapVendorLogosByName[swapVendor];
}
