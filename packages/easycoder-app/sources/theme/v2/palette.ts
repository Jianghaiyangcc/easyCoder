/**
 * Base color palette
 * Shared color scales used across all themes
 */

export const baseColors = {
  // Base colors
  white: '#ffffff',
  black: '#000000',

  // Zinc scale (primary gray palette)
  zinc: {
    50: '#fafafa',
    100: '#f4f4f5',
    200: '#e4e4e7',
    300: '#d4d4d8',
    400: '#a1a1aa',
    500: '#71717a',
    600: '#52525b',
    700: '#3f3f46',
    800: '#27272a',
    850: '#1a1a1d',
    900: '#18181b',
    950: '#121214',
  },

  // Gray scale
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  },

  // Slate scale
  slate: {
    200: '#e2e8f0',
  },

  // Blue scale
  blue: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
    950: '#172554',
  },

  // Green scale
  green: {
    100: '#dcfce7',
    200: '#bbf7d0',
    400: '#4ade80',
    500: '#22c55e',
    600: '#16a34a',
    800: '#166534',
    900: '#14532d',
  },

  // Red scale
  red: {
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    500: '#ef4444',
    600: '#dc2626',
    800: '#991b1b',
    900: '#7f1d1d',
  },

  // Teal scale
  teal: {
    200: '#99f6e4',
  },

  // Amber scale
  amber: {
    500: '#f59e0b',
    700: '#b45309',
  },

  // Yellow scale
  yellow: {
    400: '#fbbf24',
  },

  // Purple scale
  purple: {
    500: '#a855f7',
    600: '#9333ea',
  },

  // Orange scale
  orange: {
    500: '#f97316',
    600: '#ea580c',
  },
} as const;

// Diff stat colors
export const lightDiffColors = {
  diffAddition: '#15803d', // green-700
  diffDeletion: '#b91c1c', // red-700
};

export const darkDiffColors = {
  diffAddition: '#4ade80', // green-400
  diffDeletion: '#ef4444', // red-500
};

// Status colors for signaling
export const lightStatusColors = {
  statusSuccess: '#15803d', // green-700
  statusDanger: '#b91c1c', // red-700
  statusWarning: '#d97706', // amber-600
  statusMerged: '#7c3aed', // purple-600
};

export const darkStatusColors = {
  statusSuccess: '#16a34a', // green-600
  statusDanger: '#dc2626', // red-600
  statusWarning: '#f59e0b', // amber-500
  statusMerged: '#9333ea', // purple-600
};

// Terminal ANSI colors for light theme
export const lightTerminalAnsi: Omit<import('./types').TerminalColors, 'background' | 'foreground' | 'cursor' | 'cursorAccent' | 'selectionBackground' | 'selectionForeground'> = {
  black: '#1a1a1e',
  red: '#dc2626',
  green: '#16a34a',
  yellow: '#ca8a04',
  blue: '#2563eb',
  magenta: '#9333ea',
  cyan: '#0891b2',
  white: '#ffffff',
  brightBlack: '#3f3f46',
  brightRed: '#ef4444',
  brightGreen: '#22c55e',
  brightYellow: '#f59e0b',
  brightBlue: '#3b82f6',
  brightMagenta: '#a855f7',
  brightCyan: '#06b6d4',
  brightWhite: '#fafafa',
};

// Terminal ANSI colors for dark theme
export const darkTerminalAnsi: Omit<import('./types').TerminalColors, 'background' | 'foreground' | 'cursor' | 'cursorAccent' | 'selectionBackground' | 'selectionForeground'> = {
  red: '#e07070',
  green: '#5dba80',
  yellow: '#d4a44a',
  blue: '#6a9de0',
  magenta: '#b07ad0',
  cyan: '#4aabb8',
  white: '#d4d4d8',
  brightRed: '#e89090',
  brightGreen: '#7ecf9a',
  brightYellow: '#e0be6e',
  brightBlue: '#8ab4e8',
  brightMagenta: '#c49ae0',
  brightCyan: '#6ec2cc',
  brightWhite: '#f0f0f2',
};
