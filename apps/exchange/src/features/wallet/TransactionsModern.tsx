/**
 * Transactions Component - Modern Material-UI Version
 * Matches Portfolio styling with landing page theme
 */

import { Box } from '@mui/material';
import { PageFrame } from '@/layouts/PageFrame';
import { Transactions as LegacyTransactions } from './Transactions';

export const TransactionsModern = () => {
  return (
    <PageFrame
      title="Transaction History"
      subtitle="View and export your complete transaction history"
    >
      <Box>
        <LegacyTransactions />
      </Box>
    </PageFrame>
  );
};
