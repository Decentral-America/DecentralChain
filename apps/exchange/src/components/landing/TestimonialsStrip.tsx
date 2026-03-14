import { Box, Container, Grid, Stack, Avatar, Typography } from '@mui/material';

const testimonials = [
  {
    name: 'Sarah Johnson',
    role: 'Crypto Trader',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    quote:
      'The best decentralized exchange for managing my crypto portfolio with ease and security.',
  },
  {
    name: 'Michael Chen',
    role: 'DeFi Enthusiast',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    quote: 'Fast swaps, reliable trading, and incredibly user-friendly. Highly recommended!',
  },
  {
    name: 'Emma Davis',
    role: 'Business Owner',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150',
    quote:
      'Decentral.Exchange has transformed how we handle crypto payments and treasury management.',
  },
];

/**
 * Testimonials strip with user quotes
 */
export default function TestimonialsStrip() {
  return (
    <Box component="section" sx={{ py: { xs: 7, md: 7 }, bgcolor: 'background.default' }}>
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          {testimonials.map((testimonial) => (
            <Grid item xs={12} md={4} key={testimonial.name}>
              <Stack spacing={2} alignItems="center" textAlign="center">
                <Avatar
                  src={testimonial.avatar}
                  sx={{
                    width: 48,
                    height: 48,
                    bgcolor: 'primary.main',
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
