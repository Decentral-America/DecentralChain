import { Box } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import BigCTA from '@/components/landing/BigCTA';
import CoinsMarquee from '@/components/landing/CoinsMarquee';
import DiscoveryCTA from '@/components/landing/DiscoveryCTA';
import FeatureQuads from '@/components/landing/FeatureQuads';
import FeaturesRow from '@/components/landing/FeaturesRow';
import Footer from '@/components/landing/Footer';
import Header from '@/components/landing/Header';
import HeroSection from '@/components/landing/HeroSection';
import IconBullets from '@/components/landing/IconBullets';
import PricingFinder from '@/components/landing/PricingFinder';
import QRReceive from '@/components/landing/QRReceive';
import StakingSection from '@/components/landing/StakingSection';
import { landingTheme } from '@/theme/landingTheme';

/**
 * New Landing Page with modern design
 * Following the design spec with Material UI theme
 */
export default function LandingPage() {
  return (
    <ThemeProvider theme={landingTheme}>
      <Box sx={{ bgcolor: 'background.default' }}>
        <Header />
        <Box component="main">
          <HeroSection />
          <CoinsMarquee />
          <FeaturesRow />
          <StakingSection />
          <PricingFinder />
          <FeatureQuads />
          <QRReceive />
          <DiscoveryCTA />
          <IconBullets />
          <BigCTA />
        </Box>
        <Footer />
      </Box>
    </ThemeProvider>
  );
}
