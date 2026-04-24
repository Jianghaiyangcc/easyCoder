import { StyleSheet, UnistylesRuntime } from 'react-native-unistyles';
import { darkClaudeTheme, darkMidnightTheme, darkTheme, darkZincTheme, lightTheme } from './theme';
import { loadThemePreference } from './sync/persistence';
import { Appearance } from 'react-native';
import * as SystemUI from 'expo-system-ui';

//
// Theme
//

const appThemes = {
    light: lightTheme,
    dark: darkTheme,
    zinc: darkZincTheme,
    midnight: darkMidnightTheme,
    claude: darkClaudeTheme,
};

type AppThemeKey = keyof typeof appThemes;

const breakpoints = {
    xs: 0, // <-- make sure to register one breakpoint with value 0
    sm: 300,
    md: 500,
    lg: 800,
    xl: 1200
    // use as many breakpoints as you need
};

// Load theme preference from storage
const themePreference = loadThemePreference();

// Determine initial theme and adaptive settings
const getInitialTheme = (): AppThemeKey => {
    if (themePreference === 'adaptive') {
        const systemTheme = Appearance.getColorScheme();
        return systemTheme === 'dark' ? 'dark' : 'light';
    }
    return themePreference;
};

const settings = themePreference === 'adaptive'
    ? {
        // When adaptive, let Unistyles handle theme switching automatically
        adaptiveThemes: true,
        CSSVars: true, // Enable CSS variables for web
    }
    : {
        // When fixed theme, set the initial theme explicitly
        initialTheme: getInitialTheme(),
        CSSVars: true, // Enable CSS variables for web
    };

//
// Bootstrap
//

type AppThemes = typeof appThemes
type AppBreakpoints = typeof breakpoints

declare module 'react-native-unistyles' {
    export interface UnistylesThemes extends AppThemes { }
    export interface UnistylesBreakpoints extends AppBreakpoints { }
}

StyleSheet.configure({
    settings,
    breakpoints,
    themes: appThemes,
})

// Set initial root view background color based on theme
const resolveAdaptiveTheme = (): AppThemeKey => {
    const systemTheme = Appearance.getColorScheme();
    return systemTheme === 'dark' ? 'dark' : 'light';
};

const getRootBackgroundColor = (themeKey: AppThemeKey) => {
    return appThemes[themeKey].colors.groupped.background;
};

const setRootBackgroundColor = () => {
    if (themePreference === 'adaptive') {
        const color = getRootBackgroundColor(resolveAdaptiveTheme());
        UnistylesRuntime.setRootViewBackgroundColor(color);
        SystemUI.setBackgroundColorAsync(color);
    } else {
        const color = getRootBackgroundColor(themePreference);
        UnistylesRuntime.setRootViewBackgroundColor(color);
        SystemUI.setBackgroundColorAsync(color);
    }
};

// Set initial background color
setRootBackgroundColor();
