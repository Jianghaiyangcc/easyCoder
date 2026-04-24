/**
 * Dark Theme Variants
 * 
 * Multiple dark theme variants with different color tints
 * Each variant provides a unique visual experience while maintaining consistency
 */

import { buildDarkTheme } from './dark-builder';

/**
 * Default Dark Theme (Paseo-style)
 * Subtle teal-green tint
 */
export const darkThemeV2 = buildDarkTheme('dark', {
  surface0: '#181B1A',
  surface1: '#1E2120',
  surface2: '#272A29',
  surface3: '#434645',
  surface4: '#595B5B',
  surfaceDiffEmpty: '#252827',
  surfaceSidebar: '#141716',
  surfaceSidebarHover: '#1c1f1e',
  foregroundMuted: '#A1A5A4',
  scrollbarHandle: '#717574',
  border: '#252B2A',
  borderAccent: '#2F3534',
  accent: '#20744A',
  accentBright: '#7ccba0',
});

/**
 * Zinc Dark Theme
 * Neutral gray, no tint
 */
export const darkZincThemeV2 = buildDarkTheme('zinc', {
  surface0: '#18181b',
  surface1: '#1f1f22',
  surface2: '#27272a',
  surface3: '#3f3f46',
  surface4: '#52525b',
  surfaceDiffEmpty: '#242427',
  surfaceSidebar: '#131316',
  surfaceSidebarHover: '#1b1b1e',
  foregroundMuted: '#a1a1aa',
  scrollbarHandle: '#71717a',
  border: '#27272a',
  borderAccent: '#303036',
  accent: '#20744A',
  accentBright: '#7ccba0',
});

/**
 * Midnight Dark Theme
 * Subtle blue tint
 */
export const darkMidnightThemeV2 = buildDarkTheme('midnight', {
  surface0: '#161820',
  surface1: '#1c1e27',
  surface2: '#252731',
  surface3: '#3c3e4c',
  surface4: '#535564',
  surfaceDiffEmpty: '#222430',
  surfaceSidebar: '#121420',
  surfaceSidebarHover: '#1a1c28',
  foregroundMuted: '#9a9db0',
  scrollbarHandle: '#6b6e82',
  border: '#242636',
  borderAccent: '#2e3040',
  accent: '#3b6fcf',
  accentBright: '#7eaaeb',
});

/**
 * Claude Dark Theme
 * Warm neutral with subtle orange undertone
 */
export const darkClaudeThemeV2 = buildDarkTheme('claude', {
  surface0: '#1f1f1e',
  surface1: '#262523',
  surface2: '#2f2d2b',
  surface3: '#4a4745',
  surface4: '#605d5b',
  surfaceDiffEmpty: '#2a2826',
  surfaceSidebar: '#1a1918',
  surfaceSidebarHover: '#222120',
  foregroundMuted: '#ada9a5',
  scrollbarHandle: '#78746f',
  border: '#2c2a27',
  borderAccent: '#36332f',
  accent: '#d97757',
  accentBright: '#e89a7f',
});
