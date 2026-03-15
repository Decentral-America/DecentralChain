import { AppBar, Box, Button, Container, Stack, Toolbar, useScrollTrigger } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import Logo from '@/components/atoms/Logo';

/**
 * Landing page header with transparent background over hero
 * Becomes solid on scroll
 */
export default function Header() {
  const navigate = useNavigate();
  const trigger = useScrollTrigger({
    disableHysteresis: true,
    threshold: 50,
  });

  const navLinks = ['Explore', 'Institute', 'Business', 'Resources', 'Company'];

  return (
    <AppBar
      elevation={trigger ? 4 : 0}
      sx={{
        bgcolor: trigger ? 'background.paper' : 'transparent',
        color: trigger ? 'text.primary' : '#fff',
        position: 'fixed',
        top: 0,
        transition: 'all 0.3s ease',
      }}
    >
      <Container maxWidth="lg">
        <Toolbar
          sx={{
            height: { md: 72, xs: 64 },
            px: { xs: 0 },
          }}
        >
          {/* Logo */}
          <Logo sx={{ height: { md: 36, xs: 32 } }} />

          {/* Spacer */}
          <Box sx={{ flexGrow: 1 }} />

          {/* Navigation Links (desktop) */}
          <Stack
            direction="row"
            spacing={3}
            sx={{
              display: { md: 'flex', xs: 'none' },
            }}
          >
            {navLinks.map((link) => (
              <Button
                key={link}
                color="inherit"
                sx={{
                  '&:hover': {
                    opacity: 1,
                  },
                  fontSize: 15,
                  fontWeight: 500,
                  opacity: trigger ? 1 : 0.95,
                }}
              >
                {link}
              </Button>
            ))}
          </Stack>

          {/* Auth Buttons */}
          <Stack direction="row" spacing={1.5} sx={{ ml: { md: 3, xs: 0 } }}>
            {/* Login Button */}
            <Button
              color="inherit"
              onClick={() => navigate('/sign-in')}
              sx={{
                '&:hover': {
                  opacity: 1,
                },
                fontWeight: 500,
                opacity: trigger ? 1 : 0.95,
              }}
            >
              Sign in
            </Button>

            {/* Create Wallet Button */}
            <Button
              variant="contained"
              onClick={() => navigate('/create-account')}
              sx={{
                '&:hover': {
                  bgcolor: trigger ? 'primary.dark' : '#fff',
                },
                bgcolor: trigger ? 'primary.main' : 'rgba(255, 255, 255, 0.95)',
                borderRadius: 999,
                color: trigger ? '#fff' : 'primary.main',
                fontWeight: 500,
                px: 2.5,
                py: 1,
              }}
            >
              Sign up
            </Button>
          </Stack>
        </Toolbar>
      </Container>
    </AppBar>
  );
}
