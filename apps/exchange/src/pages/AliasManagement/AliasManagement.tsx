/**
 * Alias Management Page
 * View and manage all aliases for the user's address
 */
import { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  Stack,
  IconButton,
  Alert,
  Chip,
  CircularProgress,
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import AddIcon from '@mui/icons-material/Add';
import { useAuth } from '@/contexts/AuthContext';
import { useConfig } from '@/contexts/ConfigContext';
import { useAliases } from '@/hooks/useAliases';
import { CreateAliasModal } from '@/components/modals/CreateAliasModal';

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
      console.error('Failed to copy alias:', err);
    }
  };

  const handleCopyAddress = async () => {
    if (!user?.address) return;
    try {
      await navigator.clipboard.writeText(user.address);
    } catch (err) {
      console.error('Failed to copy address:', err);
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
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography variant="h4" fontWeight={700} gutterBottom>
                Alias Management
              </Typography>
              <Typography variant="body1" color="text.secondary">
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
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Your Address
              </Typography>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Typography
                  variant="body1"
                  fontFamily="monospace"
                  sx={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    flex: 1,
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
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Your Aliases ({aliases.length})
            </Typography>

            {isLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                <CircularProgress />
              </Box>
            ) : aliases.length === 0 ? (
              <Card>
                <CardContent sx={{ textAlign: 'center', py: 8 }}>
                  <Typography variant="body1" color="text.secondary" gutterBottom>
                    You don&apos;t have any aliases yet
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
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
                        justifyContent="space-between"
                        alignItems="center"
                        spacing={2}
                      >
                        <Stack direction="row" alignItems="center" spacing={2} sx={{ flex: 1 }}>
                          <Typography variant="h6" fontFamily="monospace">
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
                        color="text.secondary"
                        fontFamily="monospace"
                        sx={{ display: 'block', mt: 1 }}
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
              <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                About Aliases
              </Typography>
              <Stack spacing={1}>
                <Typography variant="body2" color="text.secondary">
                  • Aliases are permanent and cannot be changed or deleted
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  • Each alias costs 0.001 DCC to create
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  • Aliases must be 4-30 characters long
                </Typography>
                <Typography variant="body2" color="text.secondary">
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
