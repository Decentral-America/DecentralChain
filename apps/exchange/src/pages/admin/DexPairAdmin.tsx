/**
 * DEX Pair Admin Page
 * Hidden admin interface for managing trading pairs
 * Only accessible via direct URL: /dccadmin
 */
import { useState, useEffect } from 'react';
import { AdminTradingPair } from '@/hooks/useAdminTradingPairs';
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Stack,
  Alert,
  Snackbar,
  Tooltip,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';

interface TradingPair extends AdminTradingPair {}

interface PairFormData {
  amountAssetId: string;
  amountAssetName: string;
  amountAssetTicker: string;
  amountAssetDecimals: number;
  priceAssetId: string;
  priceAssetName: string;
  priceAssetTicker: string;
  priceAssetDecimals: number;
  enabled: boolean;
  featured: boolean;
  sortOrder: number;
}

const STORAGE_KEY = 'dex_trading_pairs';

export const DexPairAdmin = () => {
  const [pairs, setPairs] = useState<TradingPair[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPair, setEditingPair] = useState<TradingPair | null>(null);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info';
  }>({ open: false, message: '', severity: 'success' });

  const [formData, setFormData] = useState<PairFormData>({
    amountAssetId: '',
    amountAssetName: '',
    amountAssetTicker: '',
    amountAssetDecimals: 8,
    priceAssetId: '',
    priceAssetName: '',
    priceAssetTicker: '',
    priceAssetDecimals: 8,
    enabled: true,
    featured: false,
    sortOrder: 0,
  });

  // Load pairs from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setPairs(JSON.parse(stored));
      } catch (error) {
        console.error('Failed to load trading pairs:', error);
      }
    } else {
      // Initialize with default DCC/USDT pair
      const defaultPairs: TradingPair[] = [
        {
          id: 'dcc-usdt',
          amountAsset: {
            id: 'DCC',
            name: 'DecentralChain',
            ticker: 'DCC',
            decimals: 8,
          },
          priceAsset: {
            id: 'USDT',
            name: 'Tether USD',
            ticker: 'USDT',
            decimals: 6,
          },
          enabled: true,
          featured: true,
          sortOrder: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];
      setPairs(defaultPairs);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultPairs));
    }
  }, []);

  // Save pairs to localStorage
  const savePairs = (updatedPairs: TradingPair[]) => {
    setPairs(updatedPairs);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedPairs));
  };

  const handleOpenDialog = (pair?: TradingPair) => {
    if (pair) {
      setEditingPair(pair);
      setFormData({
        amountAssetId: pair.amountAsset.id,
        amountAssetName: pair.amountAsset.name,
        amountAssetTicker: pair.amountAsset.ticker,
        amountAssetDecimals: pair.amountAsset.decimals,
        priceAssetId: pair.priceAsset.id,
        priceAssetName: pair.priceAsset.name,
        priceAssetTicker: pair.priceAsset.ticker,
        priceAssetDecimals: pair.priceAsset.decimals,
        enabled: pair.enabled,
        featured: pair.featured,
        sortOrder: pair.sortOrder,
      });
    } else {
      setEditingPair(null);
      setFormData({
        amountAssetId: '',
        amountAssetName: '',
        amountAssetTicker: '',
        amountAssetDecimals: 8,
        priceAssetId: '',
        priceAssetName: '',
        priceAssetTicker: '',
        priceAssetDecimals: 8,
        enabled: true,
        featured: false,
        sortOrder: pairs.length,
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingPair(null);
  };

  const handleSavePair = () => {
    // Validation
    if (!formData.amountAssetId || !formData.amountAssetTicker) {
      setSnackbar({
        open: true,
        message: 'Amount asset ID and ticker are required',
        severity: 'error',
      });
      return;
    }

    if (!formData.priceAssetId || !formData.priceAssetTicker) {
      setSnackbar({
        open: true,
        message: 'Price asset ID and ticker are required',
        severity: 'error',
      });
      return;
    }

    const now = new Date().toISOString();

    if (editingPair) {
      // Update existing pair
      const updatedPairs = pairs.map((pair) =>
        pair.id === editingPair.id
          ? {
              ...pair,
              amountAsset: {
                id: formData.amountAssetId,
                name: formData.amountAssetName || formData.amountAssetTicker,
                ticker: formData.amountAssetTicker,
                decimals: formData.amountAssetDecimals,
              },
              priceAsset: {
                id: formData.priceAssetId,
                name: formData.priceAssetName || formData.priceAssetTicker,
                ticker: formData.priceAssetTicker,
                decimals: formData.priceAssetDecimals,
              },
              enabled: formData.enabled,
              featured: formData.featured,
              sortOrder: formData.sortOrder,
              updatedAt: now,
            }
          : pair
      );
      savePairs(updatedPairs);
      setSnackbar({
        open: true,
        message: 'Trading pair updated successfully',
        severity: 'success',
      });
    } else {
      // Create new pair
      const newPair: TradingPair = {
        id: `${formData.amountAssetTicker.toLowerCase()}-${formData.priceAssetTicker.toLowerCase()}`,
        amountAsset: {
          id: formData.amountAssetId,
          name: formData.amountAssetName || formData.amountAssetTicker,
          ticker: formData.amountAssetTicker,
          decimals: formData.amountAssetDecimals,
        },
        priceAsset: {
          id: formData.priceAssetId,
          name: formData.priceAssetName || formData.priceAssetTicker,
          ticker: formData.priceAssetTicker,
          decimals: formData.priceAssetDecimals,
        },
        enabled: formData.enabled,
        featured: formData.featured,
        sortOrder: formData.sortOrder,
        createdAt: now,
        updatedAt: now,
      };
      savePairs([...pairs, newPair]);
      setSnackbar({
        open: true,
        message: 'Trading pair created successfully',
        severity: 'success',
      });
    }

    handleCloseDialog();
  };

  const handleDeletePair = (pairId: string) => {
    if (window.confirm('Are you sure you want to delete this trading pair?')) {
      const updatedPairs = pairs.filter((pair) => pair.id !== pairId);
      savePairs(updatedPairs);
      setSnackbar({
        open: true,
        message: 'Trading pair deleted successfully',
        severity: 'success',
      });
    }
  };

  const handleToggleEnabled = (pairId: string) => {
    const updatedPairs = pairs.map((pair) =>
      pair.id === pairId
        ? { ...pair, enabled: !pair.enabled, updatedAt: new Date().toISOString() }
        : pair
    );
    savePairs(updatedPairs);
  };

  const handleToggleFeatured = (pairId: string) => {
    const updatedPairs = pairs.map((pair) =>
      pair.id === pairId
        ? { ...pair, featured: !pair.featured, updatedAt: new Date().toISOString() }
        : pair
    );
    savePairs(updatedPairs);
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
          <Box>
            <Typography variant="h4" fontWeight={700} gutterBottom>
              DEX Trading Pairs Management
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Configure trading pairs that will appear on the DEX trading page
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
            size="large"
          >
            Add Pair
          </Button>
        </Stack>

        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2">
            <strong>Note:</strong> This admin panel is only accessible via direct URL (/dccadmin).
            Changes are stored locally and will persist across sessions.
          </Typography>
        </Alert>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Pair</TableCell>
                <TableCell>Amount Asset ID</TableCell>
                <TableCell>Price Asset ID</TableCell>
                <TableCell align="center">Decimals</TableCell>
                <TableCell align="center">Status</TableCell>
                <TableCell align="center">Featured</TableCell>
                <TableCell align="center">Sort Order</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {pairs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    <Typography variant="body2" color="text.secondary" py={4}>
                      No trading pairs configured. Click "Add Pair" to create one.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                pairs
                  .sort((a, b) => a.sortOrder - b.sortOrder)
                  .map((pair) => (
                    <TableRow key={pair.id} hover>
                      <TableCell>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Typography variant="body1" fontWeight={600}>
                            {pair.amountAsset.ticker}/{pair.priceAsset.ticker}
                          </Typography>
                          {pair.featured && (
                            <Chip label="Featured" size="small" color="primary" />
                          )}
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Tooltip title={pair.amountAsset.name}>
                          <Typography
                            variant="body2"
                            sx={{
                              maxWidth: 200,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {pair.amountAsset.id}
                          </Typography>
                        </Tooltip>
                      </TableCell>
                      <TableCell>
                        <Tooltip title={pair.priceAsset.name}>
                          <Typography
                            variant="body2"
                            sx={{
                              maxWidth: 200,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {pair.priceAsset.id}
                          </Typography>
                        </Tooltip>
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="body2">
                          {pair.amountAsset.decimals}/{pair.priceAsset.decimals}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <IconButton
                          size="small"
                          onClick={() => handleToggleEnabled(pair.id)}
                          color={pair.enabled ? 'success' : 'default'}
                        >
                          {pair.enabled ? <VisibilityIcon /> : <VisibilityOffIcon />}
                        </IconButton>
                      </TableCell>
                      <TableCell align="center">
                        <Switch
                          checked={pair.featured}
                          onChange={() => handleToggleFeatured(pair.id)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="body2">{pair.sortOrder}</Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Stack direction="row" spacing={1} justifyContent="center">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleOpenDialog(pair)}
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDeletePair(pair.id)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingPair ? 'Edit Trading Pair' : 'Add New Trading Pair'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 2 }}>
            {/* Amount Asset Section */}
            <Box>
              <Typography variant="subtitle2" gutterBottom fontWeight={600}>
                Amount Asset
              </Typography>
              <Stack spacing={2}>
                <TextField
                  label="Asset ID *"
                  fullWidth
                  value={formData.amountAssetId}
                  onChange={(e) =>
                    setFormData({ ...formData, amountAssetId: e.target.value })
                  }
                  placeholder="e.g., DCC or full asset ID"
                />
                <Stack direction="row" spacing={2}>
                  <TextField
                    label="Ticker *"
                    fullWidth
                    value={formData.amountAssetTicker}
                    onChange={(e) =>
                      setFormData({ ...formData, amountAssetTicker: e.target.value })
                    }
                    placeholder="e.g., DCC"
                  />
                  <TextField
                    label="Name"
                    fullWidth
                    value={formData.amountAssetName}
                    onChange={(e) =>
                      setFormData({ ...formData, amountAssetName: e.target.value })
                    }
                    placeholder="e.g., DecentralChain"
                  />
                  <TextField
                    label="Decimals"
                    type="number"
                    fullWidth
                    value={formData.amountAssetDecimals}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        amountAssetDecimals: parseInt(e.target.value) || 8,
                      })
                    }
                    inputProps={{ min: 0, max: 18 }}
                  />
                </Stack>
              </Stack>
            </Box>

            {/* Price Asset Section */}
            <Box>
              <Typography variant="subtitle2" gutterBottom fontWeight={600}>
                Price Asset
              </Typography>
              <Stack spacing={2}>
                <TextField
                  label="Asset ID *"
                  fullWidth
                  value={formData.priceAssetId}
                  onChange={(e) =>
                    setFormData({ ...formData, priceAssetId: e.target.value })
                  }
                  placeholder="e.g., USDT or full asset ID"
                />
                <Stack direction="row" spacing={2}>
                  <TextField
                    label="Ticker *"
                    fullWidth
                    value={formData.priceAssetTicker}
                    onChange={(e) =>
                      setFormData({ ...formData, priceAssetTicker: e.target.value })
                    }
                    placeholder="e.g., USDT"
                  />
                  <TextField
                    label="Name"
                    fullWidth
                    value={formData.priceAssetName}
                    onChange={(e) =>
                      setFormData({ ...formData, priceAssetName: e.target.value })
                    }
                    placeholder="e.g., Tether USD"
                  />
                  <TextField
                    label="Decimals"
                    type="number"
                    fullWidth
                    value={formData.priceAssetDecimals}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        priceAssetDecimals: parseInt(e.target.value) || 8,
                      })
                    }
                    inputProps={{ min: 0, max: 18 }}
                  />
                </Stack>
              </Stack>
            </Box>

            {/* Settings Section */}
            <Box>
              <Typography variant="subtitle2" gutterBottom fontWeight={600}>
                Settings
              </Typography>
              <Stack spacing={2}>
                <TextField
                  label="Sort Order"
                  type="number"
                  fullWidth
                  value={formData.sortOrder}
                  onChange={(e) =>
                    setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })
                  }
                  helperText="Lower numbers appear first"
                />
                <Stack direction="row" spacing={2}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.enabled}
                        onChange={(e) =>
                          setFormData({ ...formData, enabled: e.target.checked })
                        }
                      />
                    }
                    label="Enabled"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.featured}
                        onChange={(e) =>
                          setFormData({ ...formData, featured: e.target.checked })
                        }
                      />
                    }
                    label="Featured"
                  />
                </Stack>
              </Stack>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button startIcon={<CancelIcon />} onClick={handleCloseDialog}>
            Cancel
          </Button>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSavePair}
          >
            {editingPair ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};
