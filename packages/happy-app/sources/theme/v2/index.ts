/**
 * Theme System v2 - Main Entry Point
 * 
 * This module exports the new layer-based theme system with Surface0-4
 * color architecture, semantic status colors, enhanced shadow system,
 * and terminal ANSI color support.
 * 
 * Migration Guide:
 * 1. Import from this file instead of old theme file
 * 2. The new themes maintain backward compatibility with legacy color names
 * 3. Gradually migrate components to use new surface layers and semantic colors
 * 
 * Usage:
 * ```typescript
 * import { lightThemeV2, darkThemeV2, darkZincThemeV2 } from '@/theme/v2';
 * ```
 */

import { lightThemeV2 } from './light';
import {
  darkThemeV2,
  darkZincThemeV2,
  darkMidnightThemeV2,
  darkClaudeThemeV2,
} from './dark-variants';
import type { ThemeName, ThemeV2 } from './types';

// Export all theme definitions
export { lightThemeV2 };
export {
  darkThemeV2,
  darkZincThemeV2,
  darkMidnightThemeV2,
  darkClaudeThemeV2,
};

// Export types for type safety
export type { 
  ThemeV2, 
  ThemeName, 
  ColorScheme,
  ThemeColors,
  TerminalColors,
  ShadowConfig,
  ShadowSystem,
  SpacingScale,
  DarkThemeConfig,
} from './types';

// Export builder function for creating custom dark themes
export { buildDarkTheme } from './dark-builder';

// Export palette for reference
export { baseColors } from './palette';

// Export legacy bridge for compatibility
export { createLegacyColorBridge } from './legacy-bridge';

/**
 * Theme registry for easy theme lookup
 */
export const themesV2 = {
  light: lightThemeV2,
  dark: darkThemeV2,
  zinc: darkZincThemeV2,
  midnight: darkMidnightThemeV2,
  claude: darkClaudeThemeV2,
} as const;

export type ThemeKey = keyof typeof themesV2;

/**
 * Get theme by name
 */
export function getThemeV2(name: ThemeKey): ThemeV2 {
  return themesV2[name];
}

/**
 * List all available theme names
 */
export const themeNamesV2: ThemeName[] = Object.keys(themesV2) as ThemeName[];

/**
 * Check if a theme is dark
 */
export function isDarkThemeV2(name: ThemeKey): boolean {
  return themesV2[name].dark;
}

/**
 * Get theme display name
 */
export function getThemeDisplayName(name: ThemeKey): string {
  const displayNames: Record<ThemeKey, string> = {
    light: 'Light',
    dark: 'Dark',
    zinc: 'Zinc Dark',
    midnight: 'Midnight Dark',
    claude: 'Claude Dark',
  };
  return displayNames[name];
}
