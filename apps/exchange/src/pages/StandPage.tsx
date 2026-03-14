import React, { useState, useEffect } from 'react';
import { styled, keyframes } from '@mui/material/styles';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  TextField,
  Checkbox,
  Switch,
  Radio,
  RadioGroup,
  FormControlLabel,
  CircularProgress,
  LinearProgress,
  Chip,
  Tabs,
  Tab,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Fade,
  Slide,
  Snackbar,
  Alert,
  IconButton,
  Tooltip,
  Slider,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ContentCopy as ContentCopyIcon,
  CheckCircle as CheckCircleIcon,
  Palette as PaletteIcon,
  Code as CodeIcon,
  TouchApp as TouchAppIcon,
} from '@mui/icons-material';

// Animations
const float = keyframes`
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  50% { transform: translateY(-20px) rotate(5deg); }
`;

const gradientShift = keyframes`
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
`;

// Styled Components
const PageContainer = styled(Box)(({ theme }) => ({
  minHeight: '100vh',
  padding: theme.spacing(4),
  background:
    theme.palette.mode === 'dark'
      ? 'linear-gradient(180deg, #0a0e27 0%, #1a1f3a 100%)'
      : 'linear-gradient(180deg, #f5f7fa 0%, #e8f0fe 100%)',
  position: 'relative',
  overflow: 'hidden',
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(2),
  },
}));

const FloatingShape = styled(Box)<{ delay?: number }>(({ theme, delay = 0 }) => ({
  position: 'absolute',
  borderRadius: '50%',
  background: `linear-gradient(135deg, ${theme.palette.primary.main}40, ${theme.palette.secondary.main}40)`,
  animation: `${float} ${6 + delay}s ease-in-out infinite`,
  animationDelay: `${delay}s`,
  pointerEvents: 'none',
  zIndex: 0,
}));

const ContentWrapper = styled(Box)({
  maxWidth: '1400px',
  margin: '0 auto',
  position: 'relative',
  zIndex: 1,
});

const HeroSection = styled(Box)(({ theme }) => ({
  textAlign: 'center',
  marginBottom: theme.spacing(6),
  [theme.breakpoints.down('sm')]: {
    marginBottom: theme.spacing(4),
  },
}));

const Title = styled(Typography)(({ theme }) => ({
  fontSize: '3.5rem',
  fontWeight: 800,
  background: 'linear-gradient(135deg, #1f5af6 0%, #5a81ff 50%, #8b5cf6 100%)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  marginBottom: theme.spacing(2),
  backgroundSize: '200% auto',
  animation: `${gradientShift} 3s linear infinite`,
  [theme.breakpoints.down('md')]: {
    fontSize: '2.5rem',
  },
  [theme.breakpoints.down('sm')]: {
    fontSize: '2rem',
  },
}));

const Subtitle = styled(Typography)(({ theme }) => ({
  fontSize: '1.25rem',
  color: theme.palette.text.secondary,
  marginBottom: theme.spacing(4),
  [theme.breakpoints.down('sm')]: {
    fontSize: '1rem',
  },
}));

const ShowcaseCard = styled(Paper)(({ theme }) => ({
  background: theme.palette.mode === 'dark' ? 'rgba(26, 31, 58, 0.9)' : 'rgba(255, 255, 255, 0.9)',
  backdropFilter: 'blur(24px)',
  borderRadius: theme.spacing(3),
  padding: theme.spacing(4),
  border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)'}`,
  boxShadow:
    theme.palette.mode === 'dark'
      ? '0 8px 32px rgba(0, 0, 0, 0.4)'
      : '0 8px 32px rgba(0, 0, 0, 0.08)',
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow:
      theme.palette.mode === 'dark'
        ? '0 12px 40px rgba(31, 90, 246, 0.3)'
        : '0 12px 40px rgba(31, 90, 246, 0.2)',
  },
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(3),
  },
}));

const SectionTitle = styled(Typography)(({ theme }) => ({
  fontSize: '1.5rem',
  fontWeight: 700,
  color: theme.palette.text.primary,
  marginBottom: theme.spacing(3),
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
}));

const DemoGroup = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(4),
  '&:last-child': {
    marginBottom: 0,
  },
}));

const DemoLabel = styled(Typography)(({ theme }) => ({
  fontSize: '0.875rem',
  fontWeight: 600,
  color: theme.palette.text.secondary,
  marginBottom: theme.spacing(2),
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
}));

const ColorSwatch = styled(Box)<{ color: string }>(({ theme, color }) => ({
  width: '100%',
  height: 80,
  borderRadius: theme.spacing(2),
  background: color,
  border: `2px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
  position: 'relative',
  overflow: 'hidden',
  cursor: 'pointer',
  transition: 'transform 0.3s ease',
  '&:hover': {
    transform: 'scale(1.05)',
  },
  '&::after': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'linear-gradient(135deg, rgba(255,255,255,0.3) 0%, transparent 100%)',
  },
}));

const CodeBlock = styled(Box)(({ theme }) => ({
  background: theme.palette.mode === 'dark' ? '#1e1e1e' : '#f5f5f5',
  borderRadius: theme.spacing(2),
  padding: theme.spacing(3),
  fontFamily: "'Fira Code', 'Courier New', monospace",
  fontSize: '0.875rem',
  color: theme.palette.text.primary,
  overflowX: 'auto',
  position: 'relative',
  border: `1px solid ${theme.palette.divider}`,
  '& pre': {
    margin: 0,
  },
}));

const CopyButton = styled(IconButton)(({ theme }) => ({
  position: 'absolute',
  top: theme.spacing(1),
  right: theme.spacing(1),
  background: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
  '&:hover': {
    background: theme.palette.primary.main,
    color: 'white',
  },
}));

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`showcase-tabpanel-${index}`}
      aria-labelledby={`showcase-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export const StandPage: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [inputValue, setInputValue] = useState('');
  const [checked, setChecked] = useState(false);
  const [switchChecked, setSwitchChecked] = useState(true);
  const [radioValue, setRadioValue] = useState('option1');
  const [progress, setProgress] = useState(0);
  const [sliderValue, setSliderValue] = useState(50);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'info' | 'warning' | 'error',
  });

  useEffect(() => {
    setIsVisible(true);
    const timer = setInterval(() => {
      setProgress((prevProgress) => (prevProgress >= 100 ? 0 : prevProgress + 10));
    }, 800);
    return () => clearInterval(timer);
  }, []);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleShowSnackbar = (
    message: string,
    severity: 'success' | 'info' | 'warning' | 'error' = 'success'
  ) => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    handleShowSnackbar('Code copied to clipboard!', 'success');
  };

  const colors = [
    {
      name: 'Primary',
      value: '#1f5af6',
      gradient: 'linear-gradient(135deg, #1f5af6 0%, #5a81ff 100%)',
    },
    {
      name: 'Secondary',
      value: '#6c757d',
      gradient: 'linear-gradient(135deg, #6c757d 0%, #adb5bd 100%)',
    },
    {
      name: 'Success',
      value: '#10b981',
      gradient: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
    },
    {
      name: 'Warning',
      value: '#f59e0b',
      gradient: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)',
    },
    {
      name: 'Error',
      value: '#ef4444',
      gradient: 'linear-gradient(135deg, #ef4444 0%, #f87171 100%)',
    },
    {
      name: 'Info',
      value: '#3b82f6',
      gradient: 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)',
    },
  ];

  return (
    <PageContainer>
      {/* Floating Shapes */}
      <FloatingShape sx={{ width: 300, height: 300, top: '10%', left: '5%' }} delay={0} />
      <FloatingShape sx={{ width: 200, height: 200, top: '60%', right: '10%' }} delay={2} />
      <FloatingShape sx={{ width: 250, height: 250, bottom: '10%', left: '15%' }} delay={4} />

      <ContentWrapper>
        <Fade in={isVisible} timeout={600}>
          <HeroSection>
            <Title>Component Showcase</Title>
            <Subtitle>
              Interactive Material-UI component library with live demos and examples
            </Subtitle>
          </HeroSection>
        </Fade>

        <Slide direction="up" in={isVisible} timeout={800}>
          <ShowcaseCard>
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              variant="scrollable"
              scrollButtons="auto"
              sx={{
                borderBottom: 1,
                borderColor: 'divider',
                marginBottom: 3,
                '& .MuiTab-root': {
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '1rem',
                },
                '& .Mui-selected': {
                  color: 'primary.main',
                },
                '& .MuiTabs-indicator': {
                  height: 3,
                  borderRadius: '3px 3px 0 0',
                  background: 'linear-gradient(135deg, #1f5af6 0%, #5a81ff 100%)',
                },
              }}
            >
              <Tab icon={<TouchAppIcon />} iconPosition="start" label="Buttons & Inputs" />
              <Tab icon={<PaletteIcon />} iconPosition="start" label="Colors & Progress" />
              <Tab icon={<CodeIcon />} iconPosition="start" label="Code Examples" />
            </Tabs>

            {/* Tab 1: Buttons & Inputs */}
            <TabPanel value={tabValue} index={0}>
              <Grid container spacing={4}>
                {/* Buttons */}
                <Grid item xs={12} md={6}>
                  <ShowcaseCard
                    elevation={0}
                    sx={{
                      background: 'transparent',
                      boxShadow: 'none',
                      '&:hover': { transform: 'none' },
                    }}
                  >
                    <SectionTitle>
                      <TouchAppIcon /> Buttons
                    </SectionTitle>

                    <DemoGroup>
                      <DemoLabel>Variants</DemoLabel>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                        <Button
                          variant="contained"
                          onClick={() => handleShowSnackbar('Contained button clicked!')}
                        >
                          Contained
                        </Button>
                        <Button
                          variant="outlined"
                          onClick={() => handleShowSnackbar('Outlined button clicked!', 'info')}
                        >
                          Outlined
                        </Button>
                        <Button
                          variant="text"
                          onClick={() => handleShowSnackbar('Text button clicked!', 'info')}
                        >
                          Text
                        </Button>
                      </Box>
                    </DemoGroup>

                    <DemoGroup>
                      <DemoLabel>Sizes</DemoLabel>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
                        <Button variant="contained" size="small">
                          Small
                        </Button>
                        <Button variant="contained" size="medium">
                          Medium
                        </Button>
                        <Button variant="contained" size="large">
                          Large
                        </Button>
                      </Box>
                    </DemoGroup>

                    <DemoGroup>
                      <DemoLabel>Colors</DemoLabel>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                        <Button variant="contained" color="primary">
                          Primary
                        </Button>
                        <Button variant="contained" color="secondary">
                          Secondary
                        </Button>
                        <Button variant="contained" color="success">
                          Success
                        </Button>
                        <Button variant="contained" color="warning">
                          Warning
                        </Button>
                        <Button variant="contained" color="error">
                          Error
                        </Button>
                      </Box>
                    </DemoGroup>

                    <DemoGroup>
                      <DemoLabel>States</DemoLabel>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                        <Button variant="contained">Normal</Button>
                        <Button variant="contained" disabled>
                          Disabled
                        </Button>
                        <Button variant="contained" fullWidth sx={{ mt: 2 }}>
                          Full Width
                        </Button>
                      </Box>
                    </DemoGroup>
                  </ShowcaseCard>
                </Grid>

                {/* Inputs & Controls */}
                <Grid item xs={12} md={6}>
                  <ShowcaseCard
                    elevation={0}
                    sx={{
                      background: 'transparent',
                      boxShadow: 'none',
                      '&:hover': { transform: 'none' },
                    }}
                  >
                    <SectionTitle>Inputs & Controls</SectionTitle>

                    <DemoGroup>
                      <DemoLabel>Text Field</DemoLabel>
                      <TextField
                        fullWidth
                        variant="outlined"
                        label="Default"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder="Enter text..."
                      />
                      <TextField
                        fullWidth
                        variant="outlined"
                        label="With Helper Text"
                        helperText="This is a helper text"
                        sx={{ mt: 2 }}
                      />
                      <TextField
                        fullWidth
                        variant="outlined"
                        label="Error State"
                        error
                        helperText="This field has an error"
                        sx={{ mt: 2 }}
                      />
                    </DemoGroup>

                    <DemoGroup>
                      <DemoLabel>Checkbox & Switch</DemoLabel>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={checked}
                              onChange={(e) => setChecked(e.target.checked)}
                            />
                          }
                          label="Checkbox Label"
                        />
                        <FormControlLabel
                          control={
                            <Switch
                              checked={switchChecked}
                              onChange={(e) => setSwitchChecked(e.target.checked)}
                            />
                          }
                          label="Switch Label"
                        />
                      </Box>
                    </DemoGroup>

                    <DemoGroup>
                      <DemoLabel>Radio Buttons</DemoLabel>
                      <RadioGroup
                        value={radioValue}
                        onChange={(e) => setRadioValue(e.target.value)}
                      >
                        <FormControlLabel value="option1" control={<Radio />} label="Option 1" />
                        <FormControlLabel value="option2" control={<Radio />} label="Option 2" />
                        <FormControlLabel value="option3" control={<Radio />} label="Option 3" />
                      </RadioGroup>
                    </DemoGroup>

                    <DemoGroup>
                      <DemoLabel>Slider</DemoLabel>
                      <Slider
                        value={sliderValue}
                        onChange={(e, value) => setSliderValue(value as number)}
                        valueLabelDisplay="auto"
                        sx={{ mt: 2 }}
                      />
                      <Typography variant="body2" sx={{ mt: 1, textAlign: 'center' }}>
                        Value: {sliderValue}
                      </Typography>
                    </DemoGroup>
                  </ShowcaseCard>
                </Grid>
              </Grid>
            </TabPanel>

            {/* Tab 2: Colors & Progress */}
            <TabPanel value={tabValue} index={1}>
              <Grid container spacing={4}>
                {/* Color Swatches */}
                <Grid item xs={12}>
                  <SectionTitle>
                    <PaletteIcon /> Theme Colors
                  </SectionTitle>
                  <Grid container spacing={3}>
                    {colors.map((color) => (
                      <Grid item xs={6} sm={4} md={2} key={color.name}>
                        <Tooltip title={`Click to copy ${color.value}`} arrow>
                          <Box>
                            <ColorSwatch
                              color={color.gradient}
                              onClick={() => handleCopyCode(color.value)}
                            />
                            <Typography
                              variant="caption"
                              sx={{ display: 'block', mt: 1, textAlign: 'center', fontWeight: 600 }}
                            >
                              {color.name}
                            </Typography>
                            <Typography
                              variant="caption"
                              sx={{
                                display: 'block',
                                textAlign: 'center',
                                color: 'text.secondary',
                                fontFamily: 'monospace',
                              }}
                            >
                              {color.value}
                            </Typography>
                          </Box>
                        </Tooltip>
                      </Grid>
                    ))}
                  </Grid>
                </Grid>

                {/* Progress Indicators */}
                <Grid item xs={12} md={6}>
                  <SectionTitle>Circular Progress</SectionTitle>
                  <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'center' }}>
                    <Box sx={{ textAlign: 'center' }}>
                      <CircularProgress />
                      <Typography variant="caption" sx={{ display: 'block', mt: 1 }}>
                        Indeterminate
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'center' }}>
                      <CircularProgress variant="determinate" value={progress} />
                      <Typography variant="caption" sx={{ display: 'block', mt: 1 }}>
                        {progress}%
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'center' }}>
                      <CircularProgress color="secondary" />
                      <Typography variant="caption" sx={{ display: 'block', mt: 1 }}>
                        Secondary
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'center' }}>
                      <CircularProgress color="success" />
                      <Typography variant="caption" sx={{ display: 'block', mt: 1 }}>
                        Success
                      </Typography>
                    </Box>
                  </Box>
                </Grid>

                <Grid item xs={12} md={6}>
                  <SectionTitle>Linear Progress</SectionTitle>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <Box>
                      <Typography variant="caption" sx={{ mb: 1, display: 'block' }}>
                        Indeterminate
                      </Typography>
                      <LinearProgress />
                    </Box>
                    <Box>
                      <Typography variant="caption" sx={{ mb: 1, display: 'block' }}>
                        Determinate ({progress}%)
                      </Typography>
                      <LinearProgress variant="determinate" value={progress} />
                    </Box>
                    <Box>
                      <Typography variant="caption" sx={{ mb: 1, display: 'block' }}>
                        Buffer
                      </Typography>
                      <LinearProgress
                        variant="buffer"
                        value={progress}
                        valueBuffer={progress + 10}
                      />
                    </Box>
                  </Box>
                </Grid>

                {/* Chips */}
                <Grid item xs={12}>
                  <SectionTitle>Chips</SectionTitle>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                    <Chip label="Default" />
                    <Chip label="Primary" color="primary" />
                    <Chip label="Secondary" color="secondary" />
                    <Chip label="Success" color="success" />
                    <Chip label="Warning" color="warning" />
                    <Chip label="Error" color="error" />
                    <Chip
                      label="Clickable"
                      color="primary"
                      onClick={() => handleShowSnackbar('Chip clicked!')}
                    />
                    <Chip
                      label="Deletable"
                      color="secondary"
                      onDelete={() => handleShowSnackbar('Chip deleted!', 'warning')}
                    />
                    <Chip icon={<CheckCircleIcon />} label="With Icon" color="success" />
                  </Box>
                </Grid>
              </Grid>
            </TabPanel>

            {/* Tab 3: Code Examples */}
            <TabPanel value={tabValue} index={2}>
              <SectionTitle>
                <CodeIcon /> Integration Examples
              </SectionTitle>

              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography fontWeight={600}>Button Usage</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <CodeBlock>
                    <CopyButton
                      size="small"
                      onClick={() =>
                        handleCopyCode(
                          `import { Button } from '@mui/material';\n\n<Button variant="contained" color="primary">\n  Click Me\n</Button>`
                        )
                      }
                    >
                      <ContentCopyIcon fontSize="small" />
                    </CopyButton>
                    <pre>{`import { Button } from '@mui/material';

<Button variant="contained" color="primary">
  Click Me
</Button>

<Button variant="outlined" color="secondary">
  Outlined Button
</Button>

<Button variant="text">
  Text Button
</Button>`}</pre>
                  </CodeBlock>
                </AccordionDetails>
              </Accordion>

              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography fontWeight={600}>TextField Usage</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <CodeBlock>
                    <CopyButton
                      size="small"
                      onClick={() =>
                        handleCopyCode(
                          `import { TextField } from '@mui/material';\n\n<TextField\n  label="Username"\n  variant="outlined"\n  fullWidth\n  helperText="Enter your username"\n/>`
                        )
                      }
                    >
                      <ContentCopyIcon fontSize="small" />
                    </CopyButton>
                    <pre>{`import { TextField } from '@mui/material';

<TextField
  label="Username"
  variant="outlined"
  fullWidth
  helperText="Enter your username"
/>

<TextField
  label="Email"
  variant="outlined"
  type="email"
  error={!valid}
  helperText={error}
/>`}</pre>
                  </CodeBlock>
                </AccordionDetails>
              </Accordion>

              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography fontWeight={600}>Theme Configuration</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <CodeBlock>
                    <CopyButton
                      size="small"
                      onClick={() =>
                        handleCopyCode(
                          `import { createTheme } from '@mui/material/styles';\n\nconst theme = createTheme({\n  palette: {\n    primary: { main: '#1f5af6' },\n    secondary: { main: '#6c757d' },\n  },\n});`
                        )
                      }
                    >
                      <ContentCopyIcon fontSize="small" />
                    </CopyButton>
                    <pre>{`import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1f5af6',
    },
    secondary: {
      main: '#6c757d',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", sans-serif',
  },
});`}</pre>
                  </CodeBlock>
                </AccordionDetails>
              </Accordion>

              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography fontWeight={600}>Widget Embed</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <CodeBlock>
                    <CopyButton
                      size="small"
                      onClick={() =>
                        handleCopyCode(
                          `<iframe\n  src="https://wallet.decentralchain.io/stand"\n  width="100%"\n  height="600"\n  frameborder="0"\n></iframe>`
                        )
                      }
                    >
                      <ContentCopyIcon fontSize="small" />
                    </CopyButton>
                    <pre>{`<!-- Embed as Widget -->
<iframe
  src="https://wallet.decentralchain.io/stand"
  width="100%"
  height="600"
  frameborder="0"
></iframe>`}</pre>
                  </CodeBlock>
                </AccordionDetails>
              </Accordion>
            </TabPanel>
          </ShowcaseCard>
        </Slide>
      </ContentWrapper>

      {/* Snackbar for Feedback */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </PageContainer>
  );
};
