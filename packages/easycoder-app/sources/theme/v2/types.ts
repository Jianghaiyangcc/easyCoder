/**
 * Theme System v2 - Layer-Based Design System
 * 
 * This new theme system implements a modern layer-based color architecture
 * inspired by the Paseo project, providing better visual hierarchy and consistency.
 * 
 * Key Improvements:
 * - Surface0-4: Clear visual hierarchy for different elevation levels
 * - Semantic status colors: Consistent signaling across the app
 * - Enhanced shadow system: Three-level shadows for depth
 * - Terminal ANSI colors: Integrated terminal color schemes
 */

import { Platform } from 'react-native';

//
// Type Definitions
//

export type ThemeName = 'light' | 'dark' | 'zinc' | 'midnight' | 'claude';

export type ColorScheme = 'light' | 'dark';

/**
 * Terminal ANSI colors for code highlighting and terminal output
 */
export interface TerminalColors {
  background: string;
  foreground: string;
  cursor: string;
  cursorAccent: string;
  selectionBackground: string;
  selectionForeground: string;
  
  // Standard ANSI colors
  black: string;
  red: string;
  green: string;
  yellow: string;
  blue: string;
  magenta: string;
  cyan: string;
  white: string;
  
  // Bright ANSI colors
  brightBlack: string;
  brightRed: string;
  brightGreen: string;
  brightYellow: string;
  brightBlue: string;
  brightMagenta: string;
  brightCyan: string;
  brightWhite: string;
}

/**
 * Shadow configuration for elevation effects
 */
export interface ShadowConfig {
  shadowColor: string;
  shadowOffset: { width: number; height: number };
  shadowRadius: number;
  elevation: number;
}

/**
 * Main shadow system with three levels
 */
export interface ShadowSystem {
  sm: ShadowConfig;
  md: ShadowConfig;
  lg: ShadowConfig;
}

/**
 * Complete color palette for a theme
 */
export interface ThemeColors {
  // Surface layers (elevation hierarchy)
  surface0: string;  // App background
  surface1: string;  // Subtle hover
  surface2: string;  // Elevated: badges, inputs, sheets
  surface3: string;  // Highest elevation
  surface4: string;  // Extra emphasis
  surfaceDiffEmpty: string;
  surfaceSidebar: string;
  surfaceSidebarHover: string;
  surfaceWorkspace: string;
  
  // Text colors
  foreground: string;
  foregroundMuted: string;
  
  // Controls
  scrollbarHandle: string;
  
  // Borders
  border: string;
  borderAccent: string;
  
  // Brand colors
  accent: string;
  accentBright: string;
  accentForeground: string;
  
  // Semantic status colors
  destructive: string;
  destructiveForeground: string;
  success: string;
  successForeground: string;
  
  // Legacy aliases (for gradual migration)
  background: string;
  surface: string;  // Legacy alias for surface0
  popover: string;
  popoverForeground: string;
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  muted: string;
  mutedForeground: string;
  accentBorder: string;
  input: string;
  ring: string;
  
  // Diff colors
  diffAddition: string;
  diffDeletion: string;
  
  // Status colors (for signaling)
  statusSuccess: string;
  statusDanger: string;
  statusWarning: string;
  statusMerged: string;
  
  // Terminal colors
  terminal: TerminalColors;
  
  // Legacy component colors (preserved for compatibility)
  text: string;
  textSecondary: string;
  textLink: string;
  textDestructive: string;
  deleteAction: string;
  warningCritical: string;
  warning: string;
  successLegacy: string;
  surfaceRipple: string;
  surfacePressed: string;
  surfaceSelected: string;
  surfacePressedOverlay: string;
  surfaceHigh: string;
  surfaceHighest: string;
  divider: string;
  shadow: {
    color: string;
    opacity: number;
  };
  header: {
    background: string;
    tint: string;
  };
  switch: {
    track: {
      active: string;
      inactive: string;
    };
    thumb: {
      active: string;
      inactive: string;
    };
  };
  groupped: {
    background: string;
    chevron: string;
    sectionTitle: string;
  };
  fab: {
    background: string;
    backgroundPressed: string;
    icon: string;
  };
  radio: {
    active: string;
    inactive: string;
    dot: string;
  };
  modal: {
    border: string;
  };
  button: {
    primary: {
      background: string;
      tint: string;
      disabled: string;
    };
    secondary: {
      tint: string;
    };
  };
  input: {
    background: string;
    text: string;
    placeholder: string;
  };
  box: {
    warning: {
      background: string;
      border: string;
      text: string;
    };
    error: {
      background: string;
      border: string;
      text: string;
    };
  };
  status: {
    connected: string;
    connecting: string;
    disconnected: string;
    error: string;
    default: string;
  };
  permission: {
    default: string;
    acceptEdits: string;
    bypass: string;
    plan: string;
    readOnly: string;
    safeYolo: string;
    yolo: string;
  };
  permissionButton: {
    allow: {
      background: string;
      text: string;
    };
    deny: {
      background: string;
      text: string;
    };
    allowAll: {
      background: string;
      text: string;
    };
    inactive: {
      background: string;
      border: string;
      text: string;
    };
    selected: {
      background: string;
      border: string;
      text: string;
    };
  };
  diff: {
    outline: string;
    success: string;
    error: string;
    addedBg: string;
    addedBorder: string;
    addedText: string;
    removedBg: string;
    removedBorder: string;
    removedText: string;
    contextBg: string;
    contextText: string;
    lineNumberBg: string;
    lineNumberText: string;
    hunkHeaderBg: string;
    hunkHeaderText: string;
    leadingSpaceDot: string;
    inlineAddedBg: string;
    inlineAddedText: string;
    inlineRemovedBg: string;
    inlineRemovedText: string;
  };
  userMessageBackground: string;
  userMessageText: string;
  agentMessageText: string;
  agentEventText: string;
  syntaxKeyword: string;
  syntaxString: string;
  syntaxComment: string;
  syntaxNumber: string;
  syntaxFunction: string;
  syntaxBracket1: string;
  syntaxBracket2: string;
  syntaxBracket3: string;
  syntaxBracket4: string;
  syntaxBracket5: string;
  syntaxDefault: string;
  gitBranchText: string;
  gitFileCountText: string;
  gitAddedText: string;
  gitRemovedText: string;
}

/**
 * Spacing scale system
 */
export interface SpacingScale {
  margins: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
  };
  borderRadius: {
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
  };
  iconSize: {
    small: number;
    medium: number;
    large: number;
    xlarge: number;
  };
}

/**
 * Complete theme definition
 */
export interface ThemeV2 {
  name: ThemeName;
  dark: boolean;
  colors: ThemeColors;
  shadow: ShadowSystem;
  spacing: SpacingScale;
}

/**
 * Configuration for building dark theme variants
 */
export interface DarkThemeConfig {
  surface0: string;
  surface1: string;
  surface2: string;
  surface3: string;
  surface4: string;
  surfaceDiffEmpty: string;
  surfaceSidebar: string;
  surfaceSidebarHover: string;
  foregroundMuted: string;
  scrollbarHandle: string;
  border: string;
  borderAccent: string;
  accent: string;
  accentBright: string;
  terminalTint?: string; // Optional terminal color tint
}
