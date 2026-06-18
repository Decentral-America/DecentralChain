import { Avatar, Box, Container, Grid, Stack, Typography } from '@mui/material';

const testimonials = [
  {
    initials: 'SJ',
    name: 'Sarah Johnson',
    quote:
      'The best decentralized exchange for managing my crypto portfolio with ease and security.',
    role: 'Crypto Trader',
  },
  {
    initials: 'MC',
    name: 'Michael Chen',
    quote: 'Fast swaps, reliable trading, and incredibly user-friendly. Highly recommended!',
    role: 'DeFi Enthusiast',
  },
  {
    initials: 'ED',
    name: 'Emma Davis',
    quote:
      'DecentralExchange has transformed how we handle crypto payments and treasury management.',
    role: 'Business Owner',
  },
];

/**
 * Testimonials strip with user quotes
 */
export default function TestimonialsStrip() {
  return (
    <Box component="section" sx={{ bgcolor: 'background.default', py: { md: 7, xs: 7 } }}>
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          {testimonials.map((testimonial) => (
            <Grid
              key={testimonial.name}
              size={{
                md: 4,
                xs: 12,
              }}
            >
              <Stack
                spacing={2}
                sx={{
                  alignItems: 'center',
                  textAlign: 'center',
                }}
              >
                <Avatar
                  sx={{
                    bgcolor: 'primary.main',
                    fontSize: 16,
                    fontWeight: 700,
                    height: 48,
                    width: 48,
                  }}
                >
                  {testimonial.initials}
                </Avatar>
                <Box>
                  <Typography
                    variant="body2"
                    sx={{
                      color: 'text.secondary',
                      mb: 1,
                    }}
                  >
                    {testimonial.quote}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      fontWeight: 600,
                    }}
                  >
                    {testimonial.name}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      color: 'text.secondary',
                      display: 'block',
                    }}
                  >
                    {testimonial.role}
                  </Typography>
                </Box>
              </Stack>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}
