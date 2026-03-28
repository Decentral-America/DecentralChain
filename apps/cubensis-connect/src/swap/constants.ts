import keeperLogo from './logos/keeper.svg';
import puzzleLogo from './logos/puzzle.svg';
import swopfiLogo from './logos/swopfi.svg';

export const SwapVendor = {
  Keeper: 'keeper',
  Puzzle: 'puzzle',
  Swopfi: 'swopfi',
} as const;
export type SwapVendor = (typeof SwapVendor)[keyof typeof SwapVendor];

export const swapVendorLogosByName = {
  [SwapVendor.Keeper]: keeperLogo,
  [SwapVendor.Puzzle]: puzzleLogo,
  [SwapVendor.Swopfi]: swopfiLogo,
};
