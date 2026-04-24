/**
 * Light Theme - Layer-based color system
 */

import { Platform } from 'react-native';
import { baseColors, lightDiffColors, lightStatusColors, lightTerminalAnsi } from './palette';
import type { ThemeV2, ThemeColors } from './types';
import { createLegacyColorBridge } from './legacy-bridge';

/**
 * Light theme semantic colors with surface layers
 */
const lightSemanticColors = {
  // Surfaces (layers) - visual hierarchy
  surface0: '#ffffff', // App background
  surface1: '#fafafa', // Subtle hover
  surface2: '#f4f4f5', // Elevated: badges, inputs, sheets
  surface3: '#e4e4e7', // Highest elevation
  surface4: '#d4d4d8', // Extra emphasis
  surfaceDiffEmpty: '#f6f6f6', // Empty side of split diff rows
  surfaceSidebar: '#f4f4f5', // Sidebar background
  surfaceSidebarHover: '#e9e9ec', // Sidebar hover
  surfaceWorkspace: '#ffffff', // Workspace main background

  // Text
  foreground: '#1a1a1e',
  foregroundMuted: '#71717a',

  // Controls
  scrollbarHandle: '#3f3f46',

  // Borders
  border: '#e4e4e7',
  borderAccent: '#ececf1',

  // Brand
  accent: '#20744A', // Paseo green
  accentBright: '#239956',
  accentForeground: '#ffffff',

  // Semantic
  destructive: '#dc2626',
  destructiveForeground: '#ffffff',
  success: '#20744A',
  successForeground: '#ffffff',

  // Legacy aliases (for gradual migration)
  background: '#ffffff',
  surface: '#ffffff',  // Alias for surface0
  popover: '#ffffff',
  popoverForeground: '#1a1a1e',
  primary: '#18181b',
  primaryForeground: '#fafafa',
  secondary: '#f4f4f5',
  secondaryForeground: '#1a1a1e',
  muted: '#f4f4f5',
  mutedForeground: '#71717a',
  accentBorder: '#ececf1',
  input: '#f4f4f5',
  ring: '#18181b',

  ...lightDiffColors,
  ...lightStatusColors,

  // Terminal colors
  terminal: {
    background: '#ffffff',
    foreground: '#1a1a1e',
    cursor: '#1a1a1e',
    cursorAccent: '#ffffff',
    selectionBackground: 'rgba(0, 0, 0, 0.15)',
    selectionForeground: '#1a1a1e',
    ...lightTerminalAnsi,
  },
} as const satisfies Omit<ThemeColors, 'text' | 'textSecondary' | 'textLink' | 'textDestructive' | 'deleteAction' | 'warningCritical' | 'warning' | 'successLegacy' | 'surfaceRipple' | 'surfacePressed' | 'surfaceSelected' | 'surfacePressedOverlay' | 'surfaceHigh' | 'surfaceHighest' | 'divider' | 'shadow' | 'header' | 'switch' | 'groupped' | 'fab' | 'radio' | 'modal' | 'button' | 'input' | 'box' | 'status' | 'permission' | 'permissionButton' | 'diff' | 'userMessageBackground' | 'userMessageText' | 'agentMessageText' | 'agentEventText' | 'syntaxKeyword' | 'syntaxString' | 'syntaxComment' | 'syntaxNumber' | 'syntaxFunction' | 'syntaxBracket1' | 'syntaxBracket2' | 'syntaxBracket3' | 'syntaxBracket4' | 'syntaxBracket5' | 'syntaxDefault' | 'gitBranchText' | 'gitFileCountText' | 'gitAddedText' | 'gitRemovedText'>;

/**
 * Complete light theme definition
 */
export const lightThemeV2: ThemeV2 = {
  name: 'light',
  dark: false,
  colors: {
    ...lightSemanticColors,
    ...createLegacyColorBridge({
      dark: false,
      semanticColors: lightSemanticColors,
    }),
  },
  shadow: {
    sm: {
      shadowColor: 'rgba(0, 0, 0, 0.02)',
      shadowOffset: { width: 0, height: 2 },
      shadowRadius: 8,
      elevation: 2,
    },
    md: {
      shadowColor: 'rgba(0, 0, 0, 0.04)',
      shadowOffset: { width: 0, height: 4 },
      shadowRadius: 16,
      elevation: 4,
    },
    lg: {
      shadowColor: 'rgba(0, 0, 0, 0.08)',
      shadowOffset: { width: 0, height: 8 },
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
