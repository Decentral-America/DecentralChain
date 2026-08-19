/**
 * Leasing Component - Modern Material-UI Version
 * Matches Portfolio styling with landing page theme
 */

import { Box } from '@mui/material';
import { PageFrame } from '@/layouts/PageFrame';
import { Leasing as LegacyLeasing } from './Leasing';

export const LeasingModern = () => {
  return (
    <PageFrame
      title="Leasing & Staking"
      subtitle="Stake your DCC to earn rewards and support the network"
    >
      <Box>
        <LegacyLeasing />
      </Box>
    </PageFrame>
  );
};
