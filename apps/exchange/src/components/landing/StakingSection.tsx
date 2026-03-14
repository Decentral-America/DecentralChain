import { Box, Container, Typography } from '@mui/material';

export default function StakingSection() {
  return (
    <Box component="section" sx={{ py: { xs: 8, md: 10 }, bgcolor: 'background.default' }}>
      <Container maxWidth="lg">
        <Typography variant="h3" textAlign="center" sx={{ mb: 6, fontWeight: 700 }}>
          Professional trading tools at your fingertips
        </Typography>
        <Box
          sx={{
            maxWidth: 980,
            mx: 'auto',
            height: { xs: 300, md: 400 },
            borderRadius: 4,
            bgcolor: 'rgba(79, 70, 229, 0.05)',
            border: '1px solid #E9EEF5',
            boxShadow: '0 35px 90px rgba(15,25,55,0.18)',
            backgroundImage:
              'url(https://images.unsplash.com/photo-1642790106117-e829e14a795f?w=1200)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            position: 'relative',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              bgcolor: 'rgba(255, 255, 255, 0.85)',
              borderRadius: 4,
            },
          }}
        />
      </Container>
    </Box>
  );
}
