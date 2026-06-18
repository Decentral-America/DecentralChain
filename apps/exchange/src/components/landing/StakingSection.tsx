import { Box, Container, Typography } from '@mui/material';

export default function StakingSection() {
  return (
    <Box component="section" sx={{ bgcolor: 'background.default', py: { md: 10, xs: 8 } }}>
      <Container maxWidth="lg">
        <Typography
          variant="h3"
          sx={{
            fontWeight: 700,
            mb: 6,
            textAlign: 'center',
          }}
        >
          Professional trading tools at your fingertips
        </Typography>
        <Box
          component="img"
          src="/images/landing-trading-dashboard.jpg"
          alt="Professional trading dashboard"
          sx={{
            border: '1px solid #E9EEF5',
            borderRadius: 4,
            boxShadow: '0 35px 90px rgba(15,25,55,0.18)',
            display: 'block',
            height: { md: 400, xs: 220 },
            maxWidth: 980,
            mx: 'auto',
            objectFit: 'cover',
            width: '100%',
          }}
        />
      </Container>
    </Box>
  );
}
