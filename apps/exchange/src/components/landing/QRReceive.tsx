import { Send as SendIcon } from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Stack,
  Tab,
  Tabs,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * QRReceive Component
 * Landing page section with Send/Receive tabs.
 *
 * Intentionally auth-agnostic: does NOT import useAuth, data-service, or wallet
 * features. Those would pull the entire auth dependency tree (262 kB) into the
 * landing page initial bundle. Instead, authenticated actions redirect to the
 * desktop wallet where those deps are already loaded lazily.
 */
export default function QRReceive() {
  const [tab, setTab] = useState(0); // 0 = Send, 1 = Receive
  const navigate = useNavigate();

  const renderContent = () => {
    if (tab === 0) {
      return (
        <Stack spacing={3} alignItems="center">
          <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mt: 2 }}>
            Send DCC or other assets to any address on the network
          </Typography>
          <Button
            variant="contained"
            size="large"
            startIcon={<SendIcon />}
            onClick={() => void navigate('/sign-in')}
            sx={{
              '&:hover': {
                background: 'linear-gradient(135deg, #5568d3 0%, #66407d 100%)',
              },
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: 2,
              px: 4,
              py: 1.5,
            }}
            fullWidth
          >
            Sign In to Send
          </Button>
        </Stack>
      );
    }

    return (
      <Stack spacing={3} alignItems="center">
        <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mt: 2 }}>
          Scan the QR code or copy your address to receive assets
        </Typography>
        <Alert severity="info" sx={{ width: '100%' }}>
          Please{' '}
          <Button size="small" onClick={() => void navigate('/sign-in')}>
            Sign In
          </Button>{' '}
          to view your receive address
        </Alert>
      </Stack>
    );
  };

  return (
    <Box component="section" sx={{ bgcolor: 'background.default', py: { md: 8, xs: 6 } }}>
      <Container maxWidth="sm">
        <Card sx={{ borderRadius: 3, maxWidth: 400, mx: 'auto' }}>
          <CardContent sx={{ p: 3 }}>
            <Tabs
              value={tab}
              onChange={(_, v) => setTab(v)}
              centered
              sx={{
                '& .MuiTab-root': {
                  fontWeight: 600,
                  minWidth: 120,
                },
              }}
            >
              <Tab label="Send" />
              <Tab label="Receive" />
            </Tabs>

            {/* Tab Content */}
            {renderContent()}
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}
