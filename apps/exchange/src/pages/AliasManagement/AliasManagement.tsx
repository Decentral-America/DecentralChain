/**
 * Alias Management Page
 * View and manage all aliases for the user's address
 */

import AddIcon from '@mui/icons-material/Add';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  IconButton,
  Stack,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import { CreateAliasModal } from '@/components/modals/CreateAliasModal';
import { useAuth } from '@/contexts/AuthContext';
import { useConfig } from '@/contexts/ConfigContext';
import { useAliases } from '@/hooks/useAliases';
import { logger } from '@/lib/logger';

export const AliasManagement = () => {
  const { user } = useAuth();
  const { networkCode } = useConfig(); // Network code character ('?', '!', 'S') from current network config
  const { aliases, isLoading, error, fetchAliases, addAlias } = useAliases();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [copiedAlias, setCopiedAlias] = useState<string | null>(null);

  const handleCopyAlias = async (alias: string) => {
    try {
      // Use networkCode from current config (?, !, S) instead of hardcoded fallback
      await navigator.clipboard.writeText(`alias:${networkCode}:${alias}`);
      setCopiedAlias(alias);
      setTimeout(() => setCopiedAlias(null), 2000);
    } catch (err) {
      logger.error('Failed to copy alias:', err);
    }
  };

  const handleCopyAddress = async () => {
    if (!user?.address) return;
    try {
      await navigator.clipboard.writeText(user.address);
    } catch (err) {
      logger.error('Failed to copy address:', err);
    }
  };

  const handleAliasCreated = (newAlias: string) => {
    // Add alias to local list immediately (Angular approach)
    // Don't wait for blockchain confirmation
    addAlias(newAlias);
  };

  return (
    <Box sx={{ py: 4 }}>
      <Container maxWidth="md">
        <Stack spacing={4}>
          {/* Header */}
          <Stack
            direction="row"
            sx={{
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Box>
              <Typography
                variant="h4"
                gutterBottom
                sx={{
                  fontWeight: 700,
                }}
              >
                Alias Management
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  color: 'text.secondary',
                }}
              >
                Create and manage aliases for your address
              </Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setCreateModalOpen(true)}
            >
              Create Alias
            </Button>
          </Stack>

          {/* Address Info */}
          <Card>
            <CardContent>
              <Typography
                variant="subtitle2"
                gutterBottom
                sx={{
                  color: 'text.secondary',
                }}
              >
                Your Address
              </Typography>
              <Stack
                direction="row"
                spacing={1}
                sx={{
                  alignItems: 'center',
                }}
              >
                <Typography
                  variant="body1"
                  sx={{
                    flex: 1,
                    fontFamily: 'monospace',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {user?.address}
                </Typography>
                <IconButton size="small" onClick={handleCopyAddress}>
                  <ContentCopyIcon fontSize="small" />
                </IconButton>
              </Stack>
            </CardContent>
          </Card>

          {/* Error Alert */}
          {error && (
            <Alert severity="error" onClose={() => fetchAliases()}>
              {error}
            </Alert>
          )}

          {/* Aliases List */}
          <Box>
            <Typography
              variant="h6"
              gutterBottom
              sx={{
                fontWeight: 600,
              }}
            >
              Your Aliases ({aliases.length})
            </Typography>

            {isLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                <CircularProgress />
              </Box>
            ) : aliases.length === 0 ? (
              <Card>
                <CardContent sx={{ py: 8, textAlign: 'center' }}>
                  <Typography
                    variant="body1"
                    gutterBottom
                    sx={{
                      color: 'text.secondary',
                    }}
                  >
                    You don&apos;t have any aliases yet
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      color: 'text.secondary',
                      mb: 3,
                    }}
                  >
                    Create an alias to make your address easier to share and remember
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => setCreateModalOpen(true)}
                  >
                    Create Your First Alias
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Stack spacing={2}>
                {aliases.map((alias) => (
                  <Card key={alias}>
                    <CardContent>
                      <Stack
                        direction="row"
                        spacing={2}
                        sx={{
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <Stack
                          direction="row"
                          spacing={2}
                          sx={{
                            alignItems: 'center',
                            flex: 1,
                          }}
                        >
                          <Typography
                            variant="h6"
                            sx={{
                              fontFamily: 'monospace',
                            }}
                          >
                            {alias}
                          </Typography>
                          {copiedAlias === alias && (
                            <Chip label="Copied!" size="small" color="success" />
                          )}
                        </Stack>
                        <IconButton
                          size="small"
                          onClick={() => handleCopyAlias(alias)}
                          color="primary"
                        >
                          <ContentCopyIcon fontSize="small" />
                        </IconButton>
                      </Stack>
                      <Typography
                        variant="caption"
                        sx={{
                          color: 'text.secondary',
                          display: 'block',
                          fontFamily: 'monospace',
                          mt: 1,
                        }}
                      >
                        alias:{networkCode}:{alias}
                      </Typography>
                    </CardContent>
                  </Card>
                ))}
              </Stack>
            )}
          </Box>

          {/* Info Section */}
          <Card sx={{ bgcolor: 'action.hover' }}>
            <CardContent>
              <Typography
                variant="subtitle2"
                gutterBottom
                sx={{
                  fontWeight: 600,
                }}
              >
                About Aliases
              </Typography>
              <Stack spacing={1}>
                <Typography
                  variant="body2"
                  sx={{
                    color: 'text.secondary',
                  }}
                >
                  • Aliases are permanent and cannot be changed or deleted
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: 'text.secondary',
                  }}
                >
                  • Each alias costs 0.001 DCC to create
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: 'text.secondary',
                  }}
                >
                  • Aliases must be 4-30 characters long
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: 'text.secondary',
                  }}
                >
                  • Only lowercase letters, numbers, and the symbols -@_. are allowed
                </Typography>
              </Stack>
            </CardContent>
          </Card>
        </Stack>

        {/* Create Alias Modal */}
        <CreateAliasModal
          open={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          onSuccess={handleAliasCreated}
        />
      </Container>
    </Box>
  );
};
