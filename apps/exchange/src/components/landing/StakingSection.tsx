import { Box, Container, Typography } from '@mui/material';

export default function StakingSection() {
  return (
    <Box component="section" sx={{ bgcolor: 'background.default', py: { md: 8, xs: 6 } }}>
      <Container maxWidth="lg">
        <Typography variant="h3" sx={{ fontWeight: 700, textAlign: 'center' }}>
          Professional trading tools at your fingertips
        </Typography>
      </Container>
    </Box>
  );
}
