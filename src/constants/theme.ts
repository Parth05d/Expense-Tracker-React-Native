export const DarkTheme = {
  background: '#0B0D12',
  surface: '#151821',
  surfaceElevated: '#1E222D',
  secondary: '#232733',
  border: '#272B38',
  borderSubtle: 'rgba(255, 255, 255, 0.08)',

  text: '#F8FAFC',
  textMuted: '#A0AEC0',
  textDim: '#64748B',

  primary: '#10B981', // Emerald green
  primaryLight: '#34D399',
  primaryDim: 'rgba(16, 185, 129, 0.18)',

  accentBlue: '#3B82F6',
  accentBlueDim: 'rgba(59, 130, 246, 0.18)',

  accentOrange: '#F97316',
  accentOrangeDim: 'rgba(249, 115, 22, 0.18)',

  accentAmber: '#F59E0B',
  accentAmberDim: 'rgba(245, 158, 11, 0.18)',

  accentPurple: '#8B5CF6',
  accentPurpleDim: 'rgba(139, 92, 246, 0.18)',

  destructive: '#FB7185', // Soft coral red
  destructiveDim: 'rgba(251, 113, 133, 0.18)',

  // Frosted Glass Specific Tokens
  cardGlass: 'rgba(21, 24, 33, 0.55)',
  glassHighlightTop: 'rgba(255, 255, 255, 0.22)',
  glassHighlightLeft: 'rgba(255, 255, 255, 0.14)',
  glassShadow: 'rgba(0, 0, 0, 0.35)',
};

export const LightTheme = {
  background: '#F1F5F9', // Crisp Slate-100 background for vibrant depth
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  secondary: '#F8FAFC',
  border: '#E2E8F0',
  borderSubtle: 'rgba(0, 0, 0, 0.06)',

  text: '#0F172A', // Slate-900 deep high-contrast text
  textMuted: '#475569', // Slate-600 clear readable labels
  textDim: '#94A3B8', // Slate-400

  primary: '#10B981',
  primaryLight: '#059669',
  primaryDim: 'rgba(16, 185, 129, 0.14)',

  accentBlue: '#2563EB',
  accentBlueDim: 'rgba(37, 99, 235, 0.14)',

  accentOrange: '#EA580C',
  accentOrangeDim: 'rgba(234, 88, 12, 0.14)',

  accentAmber: '#D97706',
  accentAmberDim: 'rgba(217, 119, 6, 0.14)',

  accentPurple: '#7C3AED',
  accentPurpleDim: 'rgba(124, 58, 237, 0.14)',

  destructive: '#F43F5E',
  destructiveDim: 'rgba(244, 63, 94, 0.14)',

  // Frosted Glass Specific Tokens (Light Mode)
  cardGlass: 'rgba(255, 255, 255, 0.90)',
  glassHighlightTop: 'rgba(255, 255, 255, 1.0)',
  glassHighlightLeft: 'rgba(255, 255, 255, 0.85)',
  glassShadow: 'rgba(15, 23, 42, 0.08)',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 22,
  xxl: 28,
  round: 9999,
};

export const ShadowPresets = {
  glass: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.10,
    shadowRadius: 12,
    elevation: 4,
  },
  glowPrimary: {
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 5,
  },
  subtle: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
};
