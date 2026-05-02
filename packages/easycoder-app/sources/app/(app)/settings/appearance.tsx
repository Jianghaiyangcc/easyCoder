import { AppIcon, type AppIconName } from '@/components/AppIcon';
import { Item } from '@/components/Item';
import { ItemGroup } from '@/components/ItemGroup';
import { ItemList } from '@/components/ItemList';
import { useSettingMutable, useLocalSettingMutable } from '@/sync/storage';
import { useRouter } from 'expo-router';
import * as Localization from 'expo-localization';
import { useUnistyles, UnistylesRuntime } from 'react-native-unistyles';
import { Switch } from '@/components/Switch';
import { Appearance } from 'react-native';
import * as SystemUI from 'expo-system-ui';
import { darkClaudeTheme, darkMidnightTheme, darkTheme, darkZincTheme, lightTheme } from '@/theme';
import { t, getLanguageNativeName, SUPPORTED_LANGUAGES } from '@/text';

// Define known avatar styles for this version of the app
type KnownAvatarStyle = 'pixelated' | 'gradient' | 'brutalist';
type ThemePreference = 'adaptive' | 'light' | 'dark' | 'zinc' | 'midnight' | 'claude';
type SelectableThemePreference = Exclude<ThemePreference, 'adaptive'>;

const selectableThemeBackgrounds: Record<SelectableThemePreference, string> = {
    light: lightTheme.colors.groupped.background,
    dark: darkTheme.colors.groupped.background,
    zinc: darkZincTheme.colors.groupped.background,
    midnight: darkMidnightTheme.colors.groupped.background,
    claude: darkClaudeTheme.colors.groupped.background,
};

const isKnownAvatarStyle = (style: string): style is KnownAvatarStyle => {
    return style === 'pixelated' || style === 'gradient' || style === 'brutalist';
};

export default function AppearanceSettingsScreen() {
    const { theme } = useUnistyles();
    const iconColor = theme.colors.icon ?? {
        primary: theme.colors.text,
        secondary: theme.colors.textSecondary,
        accent: theme.colors.textLink,
        success: theme.colors.status.connected,
        warning: theme.colors.warning,
        danger: theme.colors.textDestructive,
    };
    const router = useRouter();
    const [viewInline, setViewInline] = useSettingMutable('viewInline');
    const [expandTodos, setExpandTodos] = useSettingMutable('expandTodos');
    const [showLineNumbers, setShowLineNumbers] = useSettingMutable('showLineNumbers');
    const [showLineNumbersInToolViews, setShowLineNumbersInToolViews] = useSettingMutable('showLineNumbersInToolViews');
    const [wrapLinesInDiffs, setWrapLinesInDiffs] = useSettingMutable('wrapLinesInDiffs');
    const [alwaysShowContextSize, setAlwaysShowContextSize] = useSettingMutable('alwaysShowContextSize');
    const [avatarStyle, setAvatarStyle] = useSettingMutable('avatarStyle');
    const [showFlavorIcons, setShowFlavorIcons] = useSettingMutable('showFlavorIcons');
    const [compactSessionView, setCompactSessionView] = useSettingMutable('compactSessionView');
    const [themePreference, setThemePreference] = useLocalSettingMutable('themePreference');
    const [preferredLanguage] = useSettingMutable('preferredLanguage');
    
    // Ensure we have a valid style for display, defaulting to gradient for unknown values
    const displayStyle: KnownAvatarStyle = isKnownAvatarStyle(avatarStyle) ? avatarStyle : 'gradient';
    
    // Language display
    const getLanguageDisplayText = () => {
        if (preferredLanguage === null) {
            const deviceLocale = Localization.getLocales()?.[0]?.languageTag ?? 'en-US';
            const deviceLanguage = deviceLocale.split('-')[0].toLowerCase();
            const detectedLanguageName = deviceLanguage in SUPPORTED_LANGUAGES ? 
                                        getLanguageNativeName(deviceLanguage as keyof typeof SUPPORTED_LANGUAGES) : 
                                        getLanguageNativeName('en');
            return `${t('settingsLanguage.automatic')} (${detectedLanguageName})`;
        } else if (preferredLanguage && preferredLanguage in SUPPORTED_LANGUAGES) {
            return getLanguageNativeName(preferredLanguage as keyof typeof SUPPORTED_LANGUAGES);
        }
        return t('settingsLanguage.automatic');
    };

    const applyThemePreference = (nextTheme: ThemePreference) => {
        setThemePreference(nextTheme);

        if (nextTheme === 'adaptive') {
            UnistylesRuntime.setAdaptiveThemes(true);
            const resolvedTheme: SelectableThemePreference = Appearance.getColorScheme() === 'dark' ? 'dark' : 'light';
            const color = selectableThemeBackgrounds[resolvedTheme];
            UnistylesRuntime.setRootViewBackgroundColor(color);
            SystemUI.setBackgroundColorAsync(color);
            return;
        }

        UnistylesRuntime.setAdaptiveThemes(false);
        UnistylesRuntime.setTheme(nextTheme);
        const color = selectableThemeBackgrounds[nextTheme];
        UnistylesRuntime.setRootViewBackgroundColor(color);
        SystemUI.setBackgroundColorAsync(color);
    };

    const themeOptions: {
        key: ThemePreference;
        titleKey:
            | 'settingsAppearance.themeOptions.adaptive'
            | 'settingsAppearance.themeOptions.light'
            | 'settingsAppearance.themeOptions.dark'
            | 'settingsAppearance.themeOptions.zinc'
            | 'settingsAppearance.themeOptions.midnight'
            | 'settingsAppearance.themeOptions.claude';
        subtitleKey:
            | 'settingsAppearance.themeDescriptions.adaptive'
            | 'settingsAppearance.themeDescriptions.light'
            | 'settingsAppearance.themeDescriptions.dark'
            | 'settingsAppearance.themeDescriptions.zinc'
            | 'settingsAppearance.themeDescriptions.midnight'
            | 'settingsAppearance.themeDescriptions.claude';
        icon: AppIconName;
        color: string;
    }[] = [
        {
            key: 'adaptive',
            titleKey: 'settingsAppearance.themeOptions.adaptive',
            subtitleKey: 'settingsAppearance.themeDescriptions.adaptive',
            icon: 'contrast-outline',
            color: iconColor.accent,
        },
        {
            key: 'light',
            titleKey: 'settingsAppearance.themeOptions.light',
            subtitleKey: 'settingsAppearance.themeDescriptions.light',
            icon: 'sunny-outline',
            color: iconColor.warning,
        },
        {
            key: 'dark',
            titleKey: 'settingsAppearance.themeOptions.dark',
            subtitleKey: 'settingsAppearance.themeDescriptions.dark',
            icon: 'moon-outline',
            color: iconColor.success,
        },
        {
            key: 'zinc',
            titleKey: 'settingsAppearance.themeOptions.zinc',
            subtitleKey: 'settingsAppearance.themeDescriptions.zinc',
            icon: 'albums-outline',
            color: iconColor.secondary,
        },
        {
            key: 'midnight',
            titleKey: 'settingsAppearance.themeOptions.midnight',
            subtitleKey: 'settingsAppearance.themeDescriptions.midnight',
            icon: 'water-outline',
            color: iconColor.accent,
        },
        {
            key: 'claude',
            titleKey: 'settingsAppearance.themeOptions.claude',
            subtitleKey: 'settingsAppearance.themeDescriptions.claude',
            icon: 'flame-outline',
            color: iconColor.accent,
        },
    ];

    return (
        <ItemList style={{ paddingTop: 0 }}>

            {/* Theme Settings */}
            <ItemGroup title={t('settingsAppearance.theme')} footer={t('settingsAppearance.themeDescription')}>
                {themeOptions.map((option) => (
                    <Item
                        key={option.key}
                        title={t(option.titleKey)}
                        subtitle={t(option.subtitleKey)}
                        icon={<AppIcon name={option.icon} size={29} color={option.color} />}
                        rightElement={
                            themePreference === option.key
                                ? <AppIcon name="checkmark-circle" size={20} color={theme.colors.status.connected} />
                                : undefined
                        }
                        showChevron={false}
                        onPress={() => applyThemePreference(option.key)}
                    />
                ))}
            </ItemGroup>

            {/* Language Settings */}
            <ItemGroup title={t('settingsLanguage.title')} footer={t('settingsLanguage.description')}>
                <Item
                    title={t('settingsLanguage.currentLanguage')}
                    icon={<AppIcon name="language-outline" size={29} color={iconColor.accent} />}
                    detail={getLanguageDisplayText()}
                    onPress={() => router.push('/settings/language')}
                />
            </ItemGroup>

            {/* Text Settings */}
            {/* <ItemGroup title="Text" footer="Adjust text size and font preferences">
                <Item
                    title="Text Size"
                    subtitle="Make text larger or smaller"
                    icon={<AppIcon name="text-outline" size={29} color={iconColor.warning} />}
                    detail="Default"
                    onPress={() => { }}
                    disabled
                />
                <Item
                    title="Font"
                    subtitle="Choose your preferred font"
                    icon={<AppIcon name="text-outline" size={29} color={iconColor.warning} />}
                    detail="System"
                    onPress={() => { }}
                    disabled
                />
            </ItemGroup> */}

            {/* Display Settings */}
            <ItemGroup title={t('settingsAppearance.display')} footer={t('settingsAppearance.displayDescription')}>
                <Item
                    title={t('settingsAppearance.compactSessionView')}
                    subtitle={t('settingsAppearance.compactSessionViewDescription')}
                    icon={<AppIcon name="albums-outline" size={29} color={iconColor.secondary} />}
                    rightElement={
                        <Switch
                            value={compactSessionView}
                            onValueChange={setCompactSessionView}
                        />
                    }
                />
                <Item
                    title={t('settingsAppearance.inlineToolCalls')}
                    subtitle={t('settingsAppearance.inlineToolCallsDescription')}
                    icon={<AppIcon name="code-slash-outline" size={29} color={iconColor.secondary} />}
                    rightElement={
                        <Switch
                            value={viewInline}
                            onValueChange={setViewInline}
                        />
                    }
                />
                <Item
                    title={t('settingsAppearance.expandTodoLists')}
                    subtitle={t('settingsAppearance.expandTodoListsDescription')}
                    icon={<AppIcon name="checkmark-done-outline" size={29} color={iconColor.secondary} />}
                    rightElement={
                        <Switch
                            value={expandTodos}
                            onValueChange={setExpandTodos}
                        />
                    }
                />
                <Item
                    title={t('settingsAppearance.showLineNumbersInDiffs')}
                    subtitle={t('settingsAppearance.showLineNumbersInDiffsDescription')}
                    icon={<AppIcon name="list-outline" size={29} color={iconColor.secondary} />}
                    rightElement={
                        <Switch
                            value={showLineNumbers}
                            onValueChange={setShowLineNumbers}
                        />
                    }
                />
                <Item
                    title={t('settingsAppearance.showLineNumbersInToolViews')}
                    subtitle={t('settingsAppearance.showLineNumbersInToolViewsDescription')}
                    icon={<AppIcon name="code-working-outline" size={29} color={iconColor.secondary} />}
                    rightElement={
                        <Switch
                            value={showLineNumbersInToolViews}
                            onValueChange={setShowLineNumbersInToolViews}
                        />
                    }
                />
                <Item
                    title={t('settingsAppearance.wrapLinesInDiffs')}
                    subtitle={t('settingsAppearance.wrapLinesInDiffsDescription')}
                    icon={<AppIcon name="return-down-forward-outline" size={29} color={iconColor.secondary} />}
                    rightElement={
                        <Switch
                            value={wrapLinesInDiffs}
                            onValueChange={setWrapLinesInDiffs}
                        />
                    }
                />
                <Item
                    title={t('settingsAppearance.alwaysShowContextSize')}
                    subtitle={t('settingsAppearance.alwaysShowContextSizeDescription')}
                    icon={<AppIcon name="analytics-outline" size={29} color={iconColor.secondary} />}
                    rightElement={
                        <Switch
                            value={alwaysShowContextSize}
                            onValueChange={setAlwaysShowContextSize}
                        />
                    }
                />
                <Item
                    title={t('settingsAppearance.avatarStyle')}
                    subtitle={t('settingsAppearance.avatarStyleDescription')}
                    icon={<AppIcon name="person-circle-outline" size={29} color={iconColor.secondary} />}
                    detail={displayStyle === 'pixelated' ? t('settingsAppearance.avatarOptions.pixelated') : displayStyle === 'brutalist' ? t('settingsAppearance.avatarOptions.brutalist') : t('settingsAppearance.avatarOptions.gradient')}
                    onPress={() => {
                        const currentIndex = displayStyle === 'pixelated' ? 0 : displayStyle === 'gradient' ? 1 : 2;
                        const nextIndex = (currentIndex + 1) % 3;
                        const nextStyle = nextIndex === 0 ? 'pixelated' : nextIndex === 1 ? 'gradient' : 'brutalist';
                        setAvatarStyle(nextStyle);
                    }}
                />
                <Item
                    title={t('settingsAppearance.showFlavorIcons')}
                    subtitle={t('settingsAppearance.showFlavorIconsDescription')}
                    icon={<AppIcon name="apps-outline" size={29} color={iconColor.secondary} />}
                    rightElement={
                        <Switch
                            value={showFlavorIcons}
                            onValueChange={setShowFlavorIcons}
                        />
                    }
                />
                {/* <Item
                    title="Compact Mode"
                    subtitle="Reduce spacing between elements"
                    icon={<AppIcon name="contract-outline" size={29} color={iconColor.secondary} />}
                    disabled
                    rightElement={
                        <Switch
                            value={false}
                            disabled
                        />
                    }
                />
                <Item
                    title="Show Avatars"
                    subtitle="Display user and assistant avatars"
                    icon={<AppIcon name="person-circle-outline" size={29} color={iconColor.secondary} />}
                    disabled
                    rightElement={
                        <Switch
                            value={true}
                            disabled
                        />
                    }
                /> */}
            </ItemGroup>

            {/* Colors */}
            {/* <ItemGroup title="Colors" footer="Customize accent colors and highlights">
                <Item
                    title="Accent Color"
                    subtitle="Choose your accent color"
                    icon={<AppIcon name="color-palette-outline" size={29} color={iconColor.danger} />}
                    detail="Blue"
                    onPress={() => { }}
                    disabled
                />
            </ItemGroup> */}
        </ItemList>
    );
}
