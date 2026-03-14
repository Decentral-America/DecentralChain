import { AppBar, Toolbar, Box, Button, Stack, Container, useScrollTrigger } from '@mui/material';
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
        transition: 'all 0.3s ease',
        position: 'fixed',
        top: 0,
      }}
    >
      <Container maxWidth="lg">
        <Toolbar
          sx={{
            height: { xs: 64, md: 72 },
            px: { xs: 0 },
          }}
        >
          {/* Logo */}
          <Logo sx={{ height: { xs: 32, md: 36 } }} />

          {/* Spacer */}
          <Box sx={{ flexGrow: 1 }} />

          {/* Navigation Links (desktop) */}
          <Stack
            direction="row"
            spacing={3}
            sx={{
              display: { xs: 'none', md: 'flex' },
            }}
          >
            {navLinks.map((link) => (
              <Button
                key={link}
                color="inherit"
                sx={{
                  fontWeight: 500,
                  fontSize: 15,
                  opacity: trigger ? 1 : 0.95,
                  '&:hover': {
                    opacity: 1,
                  },
                }}
              >
                {link}
              </Button>
            ))}
          </Stack>

          {/* Auth Buttons */}
          <Stack direction="row" spacing={1.5} sx={{ ml: { xs: 0, md: 3 } }}>
            {/* Login Button */}
            <Button
              color="inherit"
              onClick={() => navigate('/sign-in')}
              sx={{
                fontWeight: 500,
                opacity: trigger ? 1 : 0.95,
                '&:hover': {
                  opacity: 1,
                },
              }}
            >
              Sign in
            </Button>

            {/* Create Wallet Button */}
            <Button
              variant="contained"
              onClick={() => navigate('/create-account')}
              sx={{
                borderRadius: 999,
                px: 2.5,
                py: 1,
                fontWeight: 500,
                bgcolor: trigger ? 'primary.main' : 'rgba(255, 255, 255, 0.95)',
                color: trigger ? '#fff' : 'primary.main',
                '&:hover': {
                  bgcolor: trigger ? 'primary.dark' : '#fff',
                },
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
