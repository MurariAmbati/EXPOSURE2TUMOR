// Exposure2Tumor Design System
// Exact ThingsBoard theme — tokens from ui-ngx/src/theme.scss, constants.scss, styles.scss
// Font: Roboto (Material Design), Colors: Material Indigo primary, Deep Orange accent

export const Colors = {
  // Core backgrounds — Material Design light theme
  background: '#EEEEEE',          // body bg (grey.200)
  surface: '#FFFFFF',              // card/panel bg
  surfaceElevated: '#FAFAFA',      // grey.50
  surfaceHighlight: '#F5F5F5',     // grey.100
  overlay: 'rgba(0, 0, 0, 0.45)',

  // Borders — Material Design dividers
  border: 'rgba(0,0,0,0.12)',      // standard mat divider
  borderSubtle: 'rgba(0,0,0,0.06)', // lighter divider
  borderFocus: '#305680',           // primary focus ring

  // Text — Material Design opacity levels
  textPrimary: 'rgba(0,0,0,0.87)',
  textSecondary: 'rgba(0,0,0,0.76)',
  textMuted: 'rgba(0,0,0,0.54)',
  textDisabled: 'rgba(0,0,0,0.38)',
  textInverse: '#FFFFFF',

  // ThingsBoard semantic exposure colors (domain-specific, kept for charts)
  environmental: '#1FA8C9',
  environmentalDim: '#8FD3E4',
  behavioral: '#FCC700',
  behavioralDim: '#FDE380',
  socialVulnerability: '#454E7C',
  socialVulnerabilityDim: '#A1A6BD',
  screeningAccess: '#FF7F44',
  screeningAccessDim: '#FEC0A1',
  preventionOpportunity: '#5AC189',
  preventionOpportunityDim: '#ACE1C4',
  occupational: '#3CCCCB',
  occupationalDim: '#9EE5E5',
  climateUV: '#A868B7',
  climateUVDim: '#D3B3DA',

  // ThingsBoard status colors — from api-usage-widget, alarm components
  highAlert: '#D12730',
  highAlertDim: '#E99397',
  warning: '#FAA405',
  success: '#198038',
  info: '#305680',

  // Cancer site colors (domain, kept)
  lung: '#1FA8C9',
  breast: '#FF7F44',
  colorectal: '#5AC189',
  melanoma: '#FCC700',
  liver: '#A868B7',
  cervical: '#D12730',

  // Map overlays
  mapHeatLow: '#C6ECE1',
  mapHeatMid: '#FAA405',
  mapHeatHigh: '#D12730',
  mapSelection: '#305680',
  mapCluster: '#454E7C',

  // Chart
  chartGrid: 'rgba(0,0,0,0.06)',
  chartAxis: 'rgba(0,0,0,0.54)',
  chartTooltipBg: 'rgba(3,8,40,0.64)',  // ThingsBoard tooltip

  // ThingsBoard primary — $tb-primary-color: #305680 (Indigo-based)
  accentTeal: '#305680',

  // Material Indigo derived palette for primary #305680
  accentTealBg: '#e8eaf6',           // indigo.50 — active pill bg
  accentTealBgHover: '#c5cae9',      // indigo.100 — hover states
  accentTealBorder: '#9fa8da',       // indigo.200 — active borders
  accentTealText: '#305680',         // primary dark for icons
  accentTealHover: '#527dad',        // $tb-secondary-color — hover on primary
  accentTealActive: '#283593',       // indigo.800 — pressed

  // ThingsBoard accent — Deep Orange
  accent: '#FF5722',
  accentLight: '#FF8A65',

  // Gradient — ThingsBoard primary toolbar
  gradientStart: '#305680',
  gradientEnd: '#527dad',
} as const;

export const Spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 48,
  massive: 64,
} as const;

export const BorderRadius = {
  xs: 2,
  sm: 4,       // ThingsBoard standard (most components use 4px)
  md: 4,
  lg: 8,
  xl: 12,
  xxl: 16,
  round: 999,
} as const;

export const Typography = {
  // ThingsBoard uses: Roboto, "Helvetica Neue", sans-serif
  // Weights: 400 (regular), 500 (medium/emphasis), 700 (bold, rare)
  display: {
    fontFamily: 'Roboto, "Helvetica Neue", Arial, sans-serif',
    fontSize: 28,
    lineHeight: 36,
    fontWeight: '400' as const,   // TB h1 uses 400
    letterSpacing: -0.5,
  },
  heading1: {
    fontFamily: 'Roboto, "Helvetica Neue", Arial, sans-serif',
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '500' as const,
    letterSpacing: -0.3,
  },
  heading2: {
    fontFamily: 'Roboto, "Helvetica Neue", Arial, sans-serif',
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '500' as const,
    letterSpacing: 0.25,     // TB letter-spacing: 0.25px
  },
  heading3: {
    fontFamily: 'Roboto, "Helvetica Neue", Arial, sans-serif',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500' as const,
    letterSpacing: 0.25,
  },
  body: {
    fontFamily: 'Roboto, "Helvetica Neue", Arial, sans-serif',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400' as const,
    letterSpacing: 0.2,      // TB letter-spacing: 0.2px
  },
  bodySmall: {
    fontFamily: 'Roboto, "Helvetica Neue", Arial, sans-serif',
    fontSize: 12,
    lineHeight: 20,
    fontWeight: '400' as const,
    letterSpacing: 0.2,
  },
  caption: {
    fontFamily: 'Roboto, "Helvetica Neue", Arial, sans-serif',
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '500' as const,   // TB header cells use 500 at 11px
    letterSpacing: 0.25,
  },
  label: {
    fontFamily: 'Roboto, "Helvetica Neue", Arial, sans-serif',
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '500' as const,
    letterSpacing: 0.5,
    textTransform: 'uppercase' as const,
  },

  // Monospace — ThingsBoard uses system monospace
  mono: {
    fontFamily: 'Roboto Mono, Courier New, monospace',
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '400' as const,
    letterSpacing: 0,
  },
  monoSmall: {
    fontFamily: 'Roboto Mono, Courier New, monospace',
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '400' as const,
    letterSpacing: 0,
  },
  monoLarge: {
    fontFamily: 'Roboto Mono, Courier New, monospace',
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '500' as const,
    letterSpacing: -0.3,
  },
} as const;

// Ant Design shadows — boxShadow, boxShadowSecondary, boxShadowTertiary
export const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
  },
  glow: (color: string) => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  }),
} as const;

export const ZIndex = {
  base: 0,
  drawer: 10,
  modal: 20,
  tooltip: 30,
  overlay: 40,
  notification: 50,
} as const;

export const Animation = {
  fast: 150,
  normal: 250,
  slow: 400,
  spring: { damping: 15, stiffness: 150 },
} as const;
