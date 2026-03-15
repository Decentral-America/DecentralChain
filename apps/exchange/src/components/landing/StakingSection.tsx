import { Box, Container, Typography } from '@mui/material';

export default function StakingSection() {
  return (
    <Box component="section" sx={{ bgcolor: 'background.default', py: { md: 10, xs: 8 } }}>
      <Container maxWidth="lg">
        <Typography variant="h3" textAlign="center" sx={{ fontWeight: 700, mb: 6 }}>
          Professional trading tools at your fingertips
        </Typography>
        <Box
          sx={{
            '&::before': {
              bgcolor: 'rgba(255, 255, 255, 0.85)',
              borderRadius: 4,
              bottom: 0,
              content: '""',
              left: 0,
              position: 'absolute',
              right: 0,
              top: 0,
            },
            backgroundImage:
              'url(https://images.unsplash.com/photo-1642790106117-e829e14a795f?w=1200)',
            backgroundPosition: 'center',
            backgroundSize: 'cover',
            bgcolor: 'rgba(79, 70, 229, 0.05)',
            border: '1px solid #E9EEF5',
            borderRadius: 4,
            boxShadow: '0 35px 90px rgba(15,25,55,0.18)',
            height: { md: 400, xs: 300 },
            maxWidth: 980,
            mx: 'auto',
            position: 'relative',
          }}
        />
      </Container>
    </Box>
  );
}
