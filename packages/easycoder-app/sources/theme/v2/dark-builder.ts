/**
 * Dark Theme Builder
 * 
 * Utility function to build dark theme variants with layer-based color system
 */

import { darkDiffColors, darkStatusColors, darkTerminalAnsi } from './palette';
import type { ThemeV2, DarkThemeConfig } from './types';
import { createLegacyColorBridge } from './legacy-bridge';

/**
 * Builds dark theme semantic colors from configuration
 */
function buildDarkSemanticColors(config: DarkThemeConfig) {
  return {
    // Surfaces (layers)
    surface0: config.surface0,
    surface1: config.surface1,
    surface2: config.surface2,
    surface3: config.surface3,
    surface4: config.surface4,
    surfaceDiffEmpty: config.surfaceDiffEmpty,
    surfaceSidebar: config.surfaceSidebar,
    surfaceSidebarHover: config.surfaceSidebarHover,
    surfaceWorkspace: config.surface1,

    // Text
    foreground: '#fafafa',
    foregroundMuted: config.foregroundMuted,

    // Controls
    scrollbarHandle: config.scrollbarHandle,

    // Borders
    border: config.border,
    borderAccent: config.borderAccent,

    // Brand
    accent: config.accent,
    accentBright: config.accentBright,
    accentForeground: '#ffffff',

    // Semantic
    destructive: '#ef4444',
    destructiveForeground: '#ffffff',
    success: config.accent,
    successForeground: '#ffffff',

    // Legacy aliases
    background: config.surface0,
    surface: config.surface0,  // Alias for surface0
    popover: config.surface2,
    popoverForeground: '#fafafa',
    primary: '#fafafa',
    primaryForeground: config.surface0,
    secondary: config.surface2,
    secondaryForeground: '#fafafa',
    muted: config.surface2,
    mutedForeground: config.foregroundMuted,
    accentBorder: config.borderAccent,
    ring: '#d4d4d8',

    ...darkDiffColors,
    ...darkStatusColors,

    // Terminal colors
    terminal: {
      background: config.surface0,
      foreground: '#fafafa',
      prompt: config.accent,
      command: '#E0E0E0',
      stdout: '#E0E0E0',
      stderr: '#FFB86C',
      error: '#FF6B6B',
      emptyOutput: '#7B7B93',
      cursor: '#fafafa',
      cursorAccent: config.surface0,
      selectionBackground: 'rgba(255, 255, 255, 0.2)',
      selectionForeground: '#fafafa',
      black: config.surfaceSidebar,
      ...darkTerminalAnsi,
      brightBlack: config.surface3,
    },
  };
}

/**
 * Builds a complete dark theme from configuration
 */
export function buildDarkTheme(
  name: ThemeV2['name'],
  config: DarkThemeConfig
): ThemeV2 {
  const semanticColors = buildDarkSemanticColors(config);

  return {
    name,
    dark: true,
    colors: {
      ...semanticColors,
      ...createLegacyColorBridge({
        dark: true,
        semanticColors,
      }),
    },
    shadow: {
      sm: {
        shadowColor: 'rgba(0, 0, 0, 0.25)',
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 4,
        elevation: 2,
      },
      md: {
        shadowColor: 'rgba(0, 0, 0, 0.20)',
        shadowOffset: { width: 0, height: 4 },
        shadowRadius: 8,
        elevation: 8,
      },
      lg: {
        shadowColor: 'rgba(0, 0, 0, 0.40)',
        shadowOffset: { width: 0, height: 12 },
        shadowRadius: 24,
        elevation: 8,
      },
    },
    spacing: {
      margins: {
        xs: 4,
        sm: 8,
        md: 12,
        lg: 16,
        xl: 20,
        xxl: 24,
      },
      borderRadius: {
        sm: 4,
        md: 8,
        lg: 10,
        xl: 12,
        xxl: 16,
      },
      iconSize: {
        small: 12,
        medium: 16,
        large: 20,
        xlarge: 24,
      },
    },
  };
}
