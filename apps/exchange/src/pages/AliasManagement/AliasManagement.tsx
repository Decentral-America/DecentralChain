/**
 * Alias Management Page
 *
 * The address first, on its own card with a copy button, then the aliases that
 * point at it as a grouped list with one copy action per row. An account with
 * none gets an empty state that explains what an alias is for and starts one.
 */

import { Alert, Button, Card } from '@mui/material';
import { AtSign, Plus, Tag, UserRound } from 'lucide-react';
import { useState } from 'react';
import styled from 'styled-components';
import { CreateAliasModal } from '@/components/modals/CreateAliasModal';
import { ClipboardButton } from '@/components/premium/ClipboardButton';
import { EmptyState } from '@/components/premium/EmptyState';
import {
  InsetGroup,
  InsetGroupHeader,
  InsetRow,
  InsetRowSkeleton,
  TokenAvatar,
} from '@/components/premium/InsetList';
import { useAuth } from '@/contexts/AuthContext';
import { useConfig } from '@/contexts/ConfigContext';
import { useAliases } from '@/hooks/useAliases';
import { PageFrame, pageRhythm } from '@/layouts/PageFrame';

const Layout = styled.div`
  display: grid;
  gap: ${pageRhythm * 8}px;
  grid-template-columns: minmax(0, 1fr);
  align-items: start;

  @media (min-width: 1200px) {
    grid-template-columns: minmax(0, 1.7fr) minmax(0, 1fr);
  }
`;

const Column = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${pageRhythm * 8}px;
  min-width: 0;
`;

const AddressLabel = styled.div`
  font-size: 13px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const AddressRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 6px;
`;

const Address = styled.code`
  flex: 1;
  min-width: 0;
  font-family: var(--font-mono);
  font-size: 15px;
  letter-spacing: -0.01em;
  color: ${({ theme }) => theme.colors.text};
  overflow-wrap: anywhere;
`;

const Facts = styled.ul`
  margin: 0;
  padding: 0;
  list-style: none;

  li {
    padding: 12px 0;
    font-size: 14px;
    line-height: 1.45;
    color: ${({ theme }) => theme.colors.textSecondary};
  }

  li + li {
    box-shadow: inset 0 1px 0 ${({ theme }) => theme.colors.border};
  }

  strong {
    display: block;
    font-weight: 500;
    color: ${({ theme }) => theme.colors.text};
  }
`;

const FactsTitle = styled.h2`
  margin: 0 0 4px;
  font-size: 17px;
  font-weight: 600;
  letter-spacing: -0.3px;
  color: ${({ theme }) => theme.colors.text};
`;

export const AliasManagement = () => {
  const { user } = useAuth();
  const { networkCode } = useConfig(); // Network code character ('?', '!', 'S') from current network config
  const { aliases, isLoading, error, fetchAliases, addAlias } = useAliases();
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const handleAliasCreated = (newAlias: string) => {
    // Add alias to local list immediately (Angular approach)
    // Don't wait for blockchain confirmation
    addAlias(newAlias);
  };

  return (
    <PageFrame title="Aliases" subtitle="Human-readable names that point at your address.">
      <Layout>
        <Column>
          <Card sx={{ p: 3 }}>
            <AddressLabel id="alias-address">Your address</AddressLabel>
            <AddressRow>
              <Address aria-labelledby="alias-address">{user?.address}</Address>
              <ClipboardButton
                value={user?.address ?? ''}
                label="Copy address"
                copiedLabel="Copied"
              />
            </AddressRow>
          </Card>

          {error && (
            <Alert severity="error" onClose={() => fetchAliases()}>
              {error}
            </Alert>
          )}

          {/*
            The create action lives beside the list it adds to, so it is
            present on both platforms — as a frame action it would have
            disappeared inside the mobile shell, which draws its own header.
          */}
          <section aria-labelledby="alias-list">
            <InsetGroupHeader
              id="alias-list"
              title="Your aliases"
              count={isLoading ? undefined : aliases.length}
              trailing={
                aliases.length > 0 ? (
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<Plus size={16} />}
                    onClick={() => setCreateModalOpen(true)}
                  >
                    Create alias
                  </Button>
                ) : null
              }
            />
            <InsetGroup>
              {isLoading ? (
                <InsetRowSkeleton rows={2} />
              ) : aliases.length === 0 ? (
                <EmptyState
                  icons={[UserRound, AtSign, Tag]}
                  title="No aliases yet"
                  description="An alias is a short name anyone can send to instead of your full address."
                  action={
                    <Button
                      variant="contained"
                      startIcon={<Plus size={16} />}
                      onClick={() => setCreateModalOpen(true)}
                    >
                      Create your first alias
                    </Button>
                  }
                />
              ) : (
                aliases.map((alias) => (
                  <InsetRow
                    key={alias}
                    leading={<TokenAvatar icon={<AtSign />} />}
                    title={alias}
                    subtitle={`alias:${networkCode}:${alias}`}
                    accessory={
                      <ClipboardButton
                        variant="icon"
                        // Use networkCode from current config (?, !, S) instead of a hardcoded fallback
                        value={`alias:${networkCode}:${alias}`}
                        label={`Copy alias ${alias}`}
                      />
                    }
                  />
                ))
              )}
            </InsetGroup>
          </section>
        </Column>

        <Card sx={{ p: 3 }}>
          <FactsTitle>About aliases</FactsTitle>
          <Facts>
            <li>
              <strong>Permanent</strong>
              An alias cannot be changed or deleted once created.
            </li>
            <li>
              <strong>0.001 DCC</strong>
              The network fee to create one.
            </li>
            <li>
              <strong>4 to 30 characters</strong>
              Lowercase letters, numbers and the symbols - @ _ . only.
            </li>
          </Facts>
        </Card>
      </Layout>

      <CreateAliasModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={handleAliasCreated}
      />
    </PageFrame>
  );
};
