import { Avatar, Box, Container, Grid, Stack, Typography } from '@mui/material';

const testimonials = [
  {
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    name: 'Sarah Johnson',
    quote:
      'The best decentralized exchange for managing my crypto portfolio with ease and security.',
    role: 'Crypto Trader',
  },
  {
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    name: 'Michael Chen',
    quote: 'Fast swaps, reliable trading, and incredibly user-friendly. Highly recommended!',
    role: 'DeFi Enthusiast',
  },
  {
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150',
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
              <Stack spacing={2} alignItems="center" textAlign="center">
                <Avatar
                  src={testimonial.avatar}
                  sx={{
                    bgcolor: 'primary.main',
                    height: 48,
                    width: 48,
                  }}
                >
                  {testimonial.name[0]}
                </Avatar>
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {testimonial.quote}
                  </Typography>
                  <Typography variant="caption" fontWeight={600}>
                    {testimonial.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block">
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
