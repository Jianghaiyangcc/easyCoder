/**
 * Theme System v2 - Tests
 * 
 * Basic validation tests for the new theme system
 */

import { describe, it, expect } from 'vitest';
import {
  lightThemeV2,
  darkThemeV2,
  darkZincThemeV2,
  darkMidnightThemeV2,
  darkClaudeThemeV2,
  getThemeV2,
  isDarkThemeV2,
  getThemeDisplayName,
  themesV2,
  themeNamesV2,
} from './index';

describe('Theme System v2', () => {
  describe('Theme Structure', () => {
    it('should have required properties on light theme', () => {
      expect(lightThemeV2).toHaveProperty('name');
      expect(lightThemeV2).toHaveProperty('dark');
      expect(lightThemeV2).toHaveProperty('colors');
      expect(lightThemeV2).toHaveProperty('shadow');
      expect(lightThemeV2).toHaveProperty('spacing');
    });

    it('should have required properties on dark themes', () => {
      const darkThemes = [darkThemeV2, darkZincThemeV2, darkMidnightThemeV2, darkClaudeThemeV2];
      
      darkThemes.forEach(theme => {
        expect(theme).toHaveProperty('name');
        expect(theme).toHaveProperty('dark');
        expect(theme).toHaveProperty('colors');
        expect(theme).toHaveProperty('shadow');
        expect(theme).toHaveProperty('spacing');
      });
    });
  });

  describe('Surface Layers', () => {
    it('should have all surface layers defined', () => {
      const themes = [lightThemeV2, darkThemeV2, darkZincThemeV2, darkMidnightThemeV2, darkClaudeThemeV2];
      
      themes.forEach(theme => {
        expect(theme.colors).toHaveProperty('surface0');
        expect(theme.colors).toHaveProperty('surface1');
        expect(theme.colors).toHaveProperty('surface2');
        expect(theme.colors).toHaveProperty('surface3');
        expect(theme.colors).toHaveProperty('surface4');
      });
    });

    it('should have correct visual hierarchy (lighter to darker for light theme)', () => {
      // Surface0 should be lighter than surface1, etc.
      const colors = lightThemeV2.colors;
      expect(colors.surface0).toBe('#ffffff');
      expect(colors.surface1).toBe('#fafafa');
      expect(colors.surface2).toBe('#f4f4f5');
    });
  });

  describe('Semantic Status Colors', () => {
    it('should have all status colors defined', () => {
      const themes = [lightThemeV2, darkThemeV2, darkZincThemeV2];
      
      themes.forEach(theme => {
        expect(theme.colors).toHaveProperty('statusSuccess');
        expect(theme.colors).toHaveProperty('statusDanger');
        expect(theme.colors).toHaveProperty('statusWarning');
        expect(theme.colors).toHaveProperty('statusMerged');
      });
    });

    it('should have different colors for different status types', () => {
      const { colors } = lightThemeV2;
      
      expect(colors.statusSuccess).not.toBe(colors.statusDanger);
      expect(colors.statusDanger).not.toBe(colors.statusWarning);
      expect(colors.statusWarning).not.toBe(colors.statusMerged);
    });
  });

  describe('Shadow System', () => {
    it('should have three shadow levels', () => {
      const themes = [lightThemeV2, darkThemeV2, darkZincThemeV2];
      
      themes.forEach(theme => {
        expect(theme.shadow).toHaveProperty('sm');
        expect(theme.shadow).toHaveProperty('md');
        expect(theme.shadow).toHaveProperty('lg');
      });
    });

    it('should have increasing shadow radius', () => {
      const { shadow } = darkThemeV2;
      
      expect(shadow.sm.shadowRadius).toBeLessThan(shadow.md.shadowRadius);
      expect(shadow.md.shadowRadius).toBeLessThan(shadow.lg.shadowRadius);
    });
  });

  describe('Terminal Colors', () => {
    it('should have all terminal ANSI colors defined', () => {
      const themes = [lightThemeV2, darkThemeV2];
      
      themes.forEach(theme => {
        const { terminal } = theme.colors;
        
        expect(terminal).toHaveProperty('background');
        expect(terminal).toHaveProperty('foreground');
        expect(terminal).toHaveProperty('red');
        expect(terminal).toHaveProperty('green');
        expect(terminal).toHaveProperty('blue');
        expect(terminal).toHaveProperty('yellow');
        expect(terminal).toHaveProperty('magenta');
        expect(terminal).toHaveProperty('cyan');
        expect(terminal).toHaveProperty('white');
        expect(terminal).toHaveProperty('brightRed');
        expect(terminal).toHaveProperty('brightGreen');
        expect(terminal).toHaveProperty('brightBlue');
        expect(terminal).toHaveProperty('brightYellow');
        expect(terminal).toHaveProperty('brightMagenta');
        expect(terminal).toHaveProperty('brightCyan');
        expect(terminal).toHaveProperty('brightWhite');
      });
    });
  });

  describe('Helper Functions', () => {
    it('should get theme by name', () => {
      const theme = getThemeV2('dark');
      expect(theme).toBe(darkThemeV2);
      expect(theme.name).toBe('dark');
    });

    it('should check if theme is dark', () => {
      expect(isDarkThemeV2('light')).toBe(false);
      expect(isDarkThemeV2('dark')).toBe(true);
      expect(isDarkThemeV2('zinc')).toBe(true);
      expect(isDarkThemeV2('midnight')).toBe(true);
      expect(isDarkThemeV2('claude')).toBe(true);
    });

    it('should get theme display name', () => {
      expect(getThemeDisplayName('light')).toBe('Light');
      expect(getThemeDisplayName('dark')).toBe('Dark');
      expect(getThemeDisplayName('zinc')).toBe('Zinc Dark');
      expect(getThemeDisplayName('midnight')).toBe('Midnight Dark');
      expect(getThemeDisplayName('claude')).toBe('Claude Dark');
    });
  });

  describe('Theme Registry', () => {
    it('should have all themes registered', () => {
      expect(themesV2).toHaveProperty('light');
      expect(themesV2).toHaveProperty('dark');
      expect(themesV2).toHaveProperty('zinc');
      expect(themesV2).toHaveProperty('midnight');
      expect(themesV2).toHaveProperty('claude');
    });

    it('should have all theme names listed', () => {
      expect(themeNamesV2).toContain('light');
      expect(themeNamesV2).toContain('dark');
      expect(themeNamesV2).toContain('zinc');
      expect(themeNamesV2).toContain('midnight');
      expect(themeNamesV2).toContain('claude');
      expect(themeNamesV2).toHaveLength(5);
    });
  });

  describe('Backward Compatibility', () => {
    it('should maintain legacy color names', () => {
      const themes = [lightThemeV2, darkThemeV2];
      
      themes.forEach(theme => {
        const { colors } = theme;
        
        // Check legacy color names exist
        expect(colors).toHaveProperty('text');
        expect(colors).toHaveProperty('textSecondary');
        expect(colors).toHaveProperty('surface');
        expect(colors).toHaveProperty('surfaceHigh');
        expect(colors).toHaveProperty('surfaceHighest');
        expect(colors).toHaveProperty('header');
        expect(colors).toHaveProperty('button');
        expect(colors).toHaveProperty('input');
        expect(colors).toHaveProperty('switch');
      });
    });
  });

  describe('Theme Distinctiveness', () => {
    it('should have different accent colors for different dark themes', () => {
      expect(darkThemeV2.colors.accent).toBe('#20744A'); // Teal-green
      expect(darkZincThemeV2.colors.accent).toBe('#20744A'); // Same base
      expect(darkMidnightThemeV2.colors.accent).toBe('#3b6fcf'); // Blue
      expect(darkClaudeThemeV2.colors.accent).toBe('#d97757'); // Orange
    });

    it('should have different surface colors for different themes', () => {
      expect(darkThemeV2.colors.surface0).toBe('#181B1A');
      expect(darkZincThemeV2.colors.surface0).toBe('#18181b');
      expect(darkMidnightThemeV2.colors.surface0).toBe('#161820');
      expect(darkClaudeThemeV2.colors.surface0).toBe('#1f1f1e');
    });
  });

  describe('Spacing System', () => {
    it('should have consistent spacing across themes', () => {
      const themes = [lightThemeV2, darkThemeV2, darkZincThemeV2];
      
      themes.forEach(theme => {
        const { spacing } = theme;
        
        expect(spacing.margins).toEqual({
          xs: 4,
          sm: 8,
          md: 12,
          lg: 16,
          xl: 20,
          xxl: 24,
        });
        
        expect(spacing.borderRadius).toEqual({
          sm: 4,
          md: 8,
          lg: 10,
          xl: 12,
          xxl: 16,
        });
        
        expect(spacing.iconSize).toEqual({
          small: 12,
          medium: 16,
          large: 20,
          xlarge: 24,
        });
      });
    });
  });
});
