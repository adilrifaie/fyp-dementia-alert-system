export const lightColors = {
  background: '#F0F4F8',
  card: '#FFFFFF',
  cardBorder: '#E2E8F0',
  text: '#1A202C',
  subtext: '#718096',
  header: '#1A202C',
  headerText: '#FFFFFF',
};

export const darkColors = {
  background: '#0F1117',
  card: '#1A1D2E',
  cardBorder: '#2D3148',
  text: '#F7FAFC',
  subtext: '#A0AEC0',
  header: '#1A1D2E',
  headerText: '#F7FAFC',
};

export const riskColors = {
  safe: {
    primary: '#10B981',
    background: '#D1FAE5',
    darkBackground: '#064E3B',
    text: '#065F46',
    darkText: '#6EE7B7',
  },
  watch: {
    primary: '#F59E0B',
    background: '#FEF3C7',
    darkBackground: '#78350F',
    text: '#92400E',
    darkText: '#FCD34D',
  },
  alert: {
    primary: '#EF4444',
    background: '#FEE2E2',
    darkBackground: '#7F1D1D',
    text: '#991B1B',
    darkText: '#FCA5A5',
  },
};

export const getRiskLevel = (score) => {
  if (score < 0.13) return 'safe';
  if (score < 0.5) return 'watch';
  return 'alert';
};

export const getRiskLabel = (score) => {
  if (score < 0.13) return 'Safe';
  if (score < 0.5) return 'Watch';
  return 'Alert';
};