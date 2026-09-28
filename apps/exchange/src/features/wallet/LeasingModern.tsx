/**
 * Leasing Screen
 *
 * Header, gutters and rhythm come from `PageFrame`, so this screen no longer
 * carries its own hero block at a size no other screen used.
 */

import { PageFrame } from '@/layouts/PageFrame';
import { Leasing as LegacyLeasing } from './Leasing';

export const LeasingModern = () => (
  <PageFrame title="Leasing" subtitle="Delegate DCC to a node and earn network rewards.">
    <LegacyLeasing />
  </PageFrame>
);
