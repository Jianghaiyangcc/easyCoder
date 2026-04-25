# Theme System v2

Modern layer-based design system inspired by the Paseo project.

## Overview

The new theme system provides:

- **Surface0-4**: Clear visual hierarchy for different elevation levels
- **Semantic status colors**: Consistent signaling across the app (success, danger, warning, merged)
- **Enhanced shadow system**: Three-level shadows (sm, md, lg) for depth
- **Terminal ANSI colors**: Integrated terminal color schemes for each theme
- **Backward compatibility**: Legacy color names maintained for gradual migration

## Color Layers

```
Surface0: App background (lowest elevation)
Surface1: Subtle hover effects
Surface2: Elevated elements (badges, inputs, sheets)
Surface3: Highest elevation (cards, modals)
Surface4: Extra emphasis (active states, highlights)
```

## Usage

### Basic Usage

```typescript
import { StyleSheet, useStyles } from 'react-native-unistyles';
import { lightThemeV2, darkThemeV2 } from '@/theme/v2';

const styles = StyleSheet.create((theme) => ({
  container: {
    backgroundColor: theme.colors.surface0, // New surface layer
    padding: theme.spacing.margins.lg,
  },
  card: {
    backgroundColor: theme.colors.surface2, // Elevated element
    borderRadius: theme.spacing.borderRadius.lg,
    // Use new shadow system
    ...theme.shadow.md,
  },
  button: {
    backgroundColor: theme.colors.accent,
    color: theme.colors.accentForeground,
  },
  status: {
    backgroundColor: theme.colors.statusSuccess, // Semantic status color
  },
}));
```

### Status Colors

```typescript
// Success state
<Text style={{ color: theme.colors.statusSuccess }}>Success</Text>

// Danger state
<Text style={{ color: theme.colors.statusDanger }}>Error</Text>

// Warning state
<Text style={{ color: theme.colors.statusWarning }}>Warning</Text>

// Merged state
<Text style={{ color: theme.colors.statusMerged }}>Merged</Text>
```

### Shadow System

```typescript
// Small shadow for subtle elevation
<View style={theme.shadow.sm}>...</View>

// Medium shadow for cards
<View style={theme.shadow.md}>...</View>

// Large shadow for modals
<View style={theme.shadow.lg}>...</View>
```

### Terminal Colors

```typescript
// Access terminal colors for code highlighting
const terminalColors = theme.colors.terminal;
// terminalColors.background, foreground, red, green, blue, etc.
```

## Migration Guide

### Step 1: Update Imports

```typescript
// Old
import { lightTheme, darkTheme } from '@/theme';

// New
import { lightThemeV2, darkThemeV2 } from '@/theme/v2';
```

### Step 2: Use New Surface Layers

```typescript
// Old
backgroundColor: theme.colors.surface

// New - Choose appropriate surface level
backgroundColor: theme.colors.surface0  // Background
backgroundColor: theme.colors.surface1  // Hover
backgroundColor: theme.colors.surface2  // Elevated
backgroundColor: theme.colors.surface3  // Highest
```

### Step 3: Use Semantic Status Colors

```typescript
// Old
color: theme.colors.success
color: theme.colors.error

// New - More semantic and consistent
color: theme.colors.statusSuccess
color: theme.colors.statusDanger
color: theme.colors.statusWarning
color: theme.colors.statusMerged
```

### Step 4: Use New Shadow System

```typescript
// Old
shadowColor: theme.colors.shadow.color,
shadowOpacity: theme.colors.shadow.opacity,

// New - Pre-configured shadow levels
...theme.shadow.sm
...theme.shadow.md
...theme.shadow.lg
```

## Available Themes

- `lightThemeV2` - Light theme with clean design
- `darkThemeV2` - Dark theme with teal-green accent (Paseo-style)
- `darkZincThemeV2` - Neutral gray dark theme
- `darkMidnightThemeV2` - Dark theme with blue accent
- `darkClaudeThemeV2` - Dark theme with warm orange accent

## Helper Functions

```typescript
import { 
  getThemeV2, 
  isDarkThemeV2, 
  getThemeDisplayName 
} from '@/theme/v2';

// Get theme by name
const theme = getThemeV2('dark');

// Check if theme is dark
const isDark = isDarkThemeV2('zinc'); // true

// Get display name
const name = getThemeDisplayName('midnight'); // "Midnight Dark"
```

## Backward Compatibility

The new theme system maintains all legacy color names for backward compatibility:

- `theme.colors.text`, `textSecondary`, `textLink`, etc.
- `theme.colors.surface`, `surfaceHigh`, `surfaceHighest`, etc.
- `theme.colors.header`, `switch`, `button`, etc.

You can gradually migrate components to use the new surface layers and semantic colors at your own pace.

## Design Principles

1. **Visual Hierarchy**: Use surface levels to create clear elevation hierarchy
2. **Semantic Colors**: Use status colors for consistent signaling
3. **Accessibility**: Maintain proper contrast ratios across all themes
4. **Consistency**: Use semantic colors instead of arbitrary colors
5. **Performance**: Pre-configured shadows are more efficient than custom shadows

## Future Enhancements

Planned improvements for the theme system:

- [ ] Color palette generator for custom themes
- [ ] Theme preview component
- [ ] Color contrast checker
- [ ] Theme migration script
- [ ] Theme customization API
