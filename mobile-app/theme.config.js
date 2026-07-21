/** @type {const} */
const themeColors = {
  // Amber/yellow — CB radio feel, primary brand color
  primary: { light: '#D97706', dark: '#F59E0B' },
  // Dark navy background — night-driving friendly
  background: { light: '#0F172A', dark: '#0F172A' },
  // Slightly lighter navy for cards/surfaces
  surface: { light: '#1E293B', dark: '#1E293B' },
  // Near-white text
  foreground: { light: '#F8FAFC', dark: '#F8FAFC' },
  // Muted slate text
  muted: { light: '#94A3B8', dark: '#94A3B8' },
  // Subtle border
  border: { light: '#334155', dark: '#334155' },
  // Channel green — Public Nearby
  success: { light: '#22C55E', dark: '#4ADE80' },
  // Warning amber
  warning: { light: '#F59E0B', dark: '#FBBF24' },
  // Emergency red
  error: { light: '#EF4444', dark: '#F87171' },
  // Channel blue — Custom Groups
  info: { light: '#3B82F6', dark: '#60A5FA' },
};

module.exports = { themeColors };
