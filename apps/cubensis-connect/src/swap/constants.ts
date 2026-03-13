export enum SwapVendor {
  Keeper = 'keeper',
  Puzzle = 'puzzle',
  Swopfi = 'swopfi',
}

import keeperLogo from './logos/keeper.svg';
import puzzleLogo from './logos/puzzle.svg';
import swopfiLogo from './logos/swopfi.svg';

export const swapVendorLogosByName = {
  [SwapVendor.Keeper]: keeperLogo,
  [SwapVendor.Puzzle]: puzzleLogo,
  [SwapVendor.Swopfi]: swopfiLogo,
};
