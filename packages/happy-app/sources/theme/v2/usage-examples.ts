/**
 * Theme System v2 - Usage Example
 * 
 * This file demonstrates how to use the new theme system in a component
 */

// Example 1: Using Surface Layers for visual hierarchy
const exampleStyles1 = `
const styles = StyleSheet.create((theme) => ({
  // Background uses surface0 (lowest elevation)
  container: {
    flex: 1,
    backgroundColor: theme.colors.surface0,
  },

  // Card uses surface2 (elevated element)
  card: {
    backgroundColor: theme.colors.surface2,
    borderRadius: theme.spacing.borderRadius.lg,
    padding: theme.spacing.margins.lg,
    // Apply medium shadow for depth
    ...theme.shadow.md,
  },

  // Button uses accent color
  button: {
    backgroundColor: theme.colors.accent,
    color: theme.colors.accentForeground,
    paddingVertical: theme.spacing.margins.md,
    paddingHorizontal: theme.spacing.margins.lg,
    borderRadius: theme.spacing.borderRadius.md,
  },

  // Hover state uses surface1
  buttonHover: {
    backgroundColor: theme.colors.surface1,
  },
}));
`;

// Example 2: Using Semantic Status Colors
const exampleStyles2 = `
const styles = StyleSheet.create((theme) => ({
  // Success indicator
  successBadge: {
    backgroundColor: theme.colors.statusSuccess,
    color: '#ffffff',
    padding: theme.spacing.margins.sm,
    borderRadius: theme.spacing.borderRadius.sm,
  },

  // Error indicator
  errorBadge: {
    backgroundColor: theme.colors.statusDanger,
    color: '#ffffff',
    padding: theme.spacing.margins.sm,
    borderRadius: theme.spacing.borderRadius.sm,
  },

  // Warning indicator
  warningBadge: {
    backgroundColor: theme.colors.statusWarning,
    color: '#ffffff',
    padding: theme.spacing.margins.sm,
    borderRadius: theme.spacing.borderRadius.sm,
  },
}));
`;

// Example 3: Using Shadow System
const exampleStyles3 = `
const styles = StyleSheet.create((theme) => ({
  // Small shadow for subtle elevation (tooltips, dropdowns)
  tooltip: {
    ...theme.shadow.sm,
    backgroundColor: theme.colors.surface2,
    padding: theme.spacing.margins.sm,
  },

  // Medium shadow for cards and panels
  card: {
    ...theme.shadow.md,
    backgroundColor: theme.colors.surface2,
    padding: theme.spacing.margins.lg,
  },

  // Large shadow for modals and dialogs
  modal: {
    ...theme.shadow.lg,
    backgroundColor: theme.colors.surface0,
    padding: theme.spacing.margins.xxl,
  },
}));
`;

// Example 4: Using Terminal Colors for Code Highlighting
const exampleStyles4 = `
const styles = StyleSheet.create((theme) => ({
  codeBlock: {
    backgroundColor: theme.colors.terminal.background,
    color: theme.colors.terminal.foreground,
    padding: theme.spacing.margins.md,
    borderRadius: theme.spacing.borderRadius.md,
    fontFamily: 'monospace',
  },

  // Syntax highlighting
  keyword: {
    color: theme.colors.terminal.blue,
  },
  string: {
    color: theme.colors.terminal.green,
  },
  comment: {
    color: theme.colors.terminal.brightBlack,
  },
  number: {
    color: theme.colors.terminal.cyan,
  },
}));
`;

// Example 5: Component with Hover States
const exampleComponent = `
import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

const MyCard = ({ title, status }: { title: string; status: 'success' | 'error' | 'warning' }) => {
  const { theme } = useStyles();

  const getStatusColor = () => {
    switch (status) {
      case 'success':
        return theme.colors.statusSuccess;
      case 'error':
        return theme.colors.statusDanger;
      case 'warning':
        return theme.colors.statusWarning;
    }
  };

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        pressed && styles.cardPressed,
      ]}
    >
      <View style={styles.statusDot} />
      <Text style={styles.title}>{title}</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create((theme) => ({
  card: {
    backgroundColor: theme.colors.surface2,
    borderRadius: theme.spacing.borderRadius.lg,
    padding: theme.spacing.margins.lg,
    marginBottom: theme.spacing.margins.md,
    ...theme.shadow.md,
  },
  cardPressed: {
    backgroundColor: theme.colors.surface1,
    transform: [{ scale: 0.98 }],
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.statusSuccess,
    marginBottom: theme.spacing.margins.sm,
  },
  title: {
    color: theme.colors.foreground,
    fontSize: 16,
    fontWeight: '600',
  },
}));
`;

// Example 6: Using Helper Functions
const exampleHelperFunctions = `
import { getThemeV2, isDarkThemeV2, getThemeDisplayName } from '@/theme/v2';

// Get a specific theme
const darkTheme = getThemeV2('dark');

// Check if theme is dark
const isDark = isDarkThemeV2('zinc'); // true

// Get display name for UI
const themeName = getThemeDisplayName('midnight'); // "Midnight Dark"
`;

console.log('=== Theme System v2 Usage Examples ===\n');

console.log('1. Using Surface Layers for Visual Hierarchy:');
console.log(exampleStyles1);

console.log('\n2. Using Semantic Status Colors:');
console.log(exampleStyles2);

console.log('\n3. Using Shadow System:');
console.log(exampleStyles3);

console.log('\n4. Using Terminal Colors for Code Highlighting:');
console.log(exampleStyles4);

console.log('\n5. Complete Component Example:');
console.log(exampleComponent);

console.log('\n6. Using Helper Functions:');
console.log(exampleHelperFunctions);

console.log('\n=== Key Benefits ===');
console.log('✓ Clear visual hierarchy with surface layers');
console.log('✓ Consistent status signaling across the app');
console.log('✓ Pre-configured shadows for better performance');
console.log('✓ Integrated terminal colors for code blocks');
console.log('✓ Backward compatibility with existing code');
console.log('✓ Type-safe with TypeScript');
