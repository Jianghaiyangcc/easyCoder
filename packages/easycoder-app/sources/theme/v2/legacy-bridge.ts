/**
 * Legacy Color Bridge
 * 
 * This file bridges the new layer-based theme system with the legacy color system
 * to maintain backward compatibility during the migration period.
 */

import { Platform } from 'react-native';
import type { ThemeColors } from './types';

interface LegacyColorBridgeOptions {
  dark: boolean;
  semanticColors: {
    surface0: string;
    surface1: string;
    surface2: string;
    surface3: string;
    surfaceSidebar: string;
    surfaceSidebarHover: string;
    foregroundMuted: string;
    border: string;
    accent: string;
    accentBright: string;
    statusSuccess: string;
    statusDanger: string;
    statusWarning: string;
    terminal: any;
  };
}

/**
 * Creates legacy color definitions from the new semantic colors
 * This maintains backward compatibility with existing components
 */
export function createLegacyColorBridge(options: LegacyColorBridgeOptions): Omit<ThemeColors, 'surface0' | 'surface1' | 'surface2' | 'surface3' | 'surface4' | 'surfaceDiffEmpty' | 'surfaceSidebar' | 'surfaceSidebarHover' | 'surfaceWorkspace' | 'foreground' | 'foregroundMuted' | 'scrollbarHandle' | 'border' | 'borderAccent' | 'accent' | 'accentBright' | 'accentForeground' | 'destructive' | 'destructiveForeground' | 'success' | 'successForeground' | 'background' | 'popover' | 'popoverForeground' | 'primary' | 'primaryForeground' | 'secondary' | 'secondaryForeground' | 'muted' | 'mutedForeground' | 'accentBorder' | 'input' | 'ring' | 'diffAddition' | 'diffDeletion' | 'statusSuccess' | 'statusDanger' | 'statusWarning' | 'statusMerged' | 'terminal'> {
  const { dark, semanticColors } = options;
  
  // Map surface layers to legacy color names
  const surface = semanticColors.surface0;
  const surfaceHigh = semanticColors.surface1;
  const surfaceHighest = semanticColors.surface2;
  const surfacePressed = semanticColors.surfaceSidebarHover;
  
  return {
    // Legacy text colors
    text: dark ? '#ffffff' : '#000000',
    textDestructive: Platform.select({ 
      ios: dark ? '#FF453A' : '#FF3B30', 
      default: dark ? '#F48FB1' : '#F44336' 
    }),
    textSecondary: Platform.select({ 
      ios: '#8E8E93', 
      default: dark ? '#CAC4D0' : '#49454F' 
    }),
    textLink: semanticColors.accentBright,
    deleteAction: '#FF6B6B',
    warningCritical: dark ? '#FF453A' : '#FF3B30',
    warning: '#8E8E93',
    successLegacy: dark ? '#32D74B' : '#34C759',
    
    // Legacy surface colors
    surfaceRipple: dark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
    surfacePressed,
    surfaceSelected: surfacePressed,
    surfacePressedOverlay: Platform.select({ 
      ios: surfacePressed, 
      default: 'transparent' 
    }),
    surfaceHigh,
    surfaceHighest,
    divider: semanticColors.border,
    
    // Legacy shadow
    shadow: {
      color: Platform.select({ 
        default: '#000000', 
        web: 'rgba(0, 0, 0, 0.1)' 
      }),
      opacity: 0.1,
    },
    
    // Legacy component colors
    header: {
      background: surface,
      tint: dark ? '#ffffff' : '#18171C'
    },
    switch: {
      track: {
        active: Platform.select({ ios: '#34C759', default: '#1976D2' }),
        inactive: dark ? '#3a393f' : '#dddddd',
      },
      thumb: {
        active: '#FFFFFF',
        inactive: '#767577',
      },
    },
    groupped: {
      background: Platform.select({ 
        ios: dark ? '#1C1C1E' : '#F2F2F7', 
        default: dark ? '#1e1e1e' : '#F5F5F5' 
      }),
      chevron: Platform.select({ 
        ios: dark ? '#48484A' : '#C7C7CC', 
        default: dark ? '#CAC4D0' : '#49454F' 
      }),
      sectionTitle: semanticColors.foregroundMuted,
    },
    fab: {
      background: dark ? '#FFFFFF' : '#000000',
      backgroundPressed: dark ? '#f0f0f0' : '#1a1a1a',
      icon: dark ? '#000000' : '#FFFFFF',
    },
    radio: {
      active: Platform.select({ ios: dark ? '#0A84FF' : '#007AFF', default: dark ? '#0A84FF' : '#007AFF' }),
      inactive: dark ? '#48484A' : '#C0C0C0',
      dot: Platform.select({ ios: dark ? '#0A84FF' : '#007AFF', default: dark ? '#0A84FF' : '#007AFF' }),
    },
    modal: {
      border: dark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
    },
    button: {
      primary: {
        background: '#000000',
        tint: '#FFFFFF',
        disabled: '#C0C0C0',
      },
      secondary: {
        tint: dark ? '#8E8E93' : '#666666',
      },
    },
    input: {
      background: surfaceHigh,
      text: dark ? '#FFFFFF' : '#000000',
      placeholder: '#8E8E93',
    },
    box: {
      warning: {
        background: dark ? 'rgba(255, 159, 10, 0.15)' : '#FFF8F0',
        border: dark ? '#FF9F0A' : '#FF9500',
        text: dark ? '#FFAB00' : '#FF9500',
      },
      error: {
        background: dark ? 'rgba(255, 69, 58, 0.15)' : '#FFF0F0',
        border: dark ? '#FF453A' : '#FF3B30',
        text: dark ? '#FF6B6B' : '#FF3B30',
      },
    },
    status: {
      connected: '#34C759',
      connecting: dark ? '#FFFFFF' : '#007AFF',
      disconnected: '#8E8E93',
      error: dark ? '#FF453A' : '#FF3B30',
      default: '#8E8E93',
    },
    permission: {
      default: '#8E8E93',
      acceptEdits: dark ? '#0A84FF' : '#007AFF',
      bypass: dark ? '#FF9F0A' : '#FF9500',
      plan: semanticColors.statusSuccess,
      readOnly: dark ? '#98989D' : '#8B8B8D',
      safeYolo: dark ? '#FF7A4C' : '#FF6B35',
      yolo: dark ? '#FF453A' : '#DC143C',
    },
    permissionButton: {
      allow: {
        background: dark ? '#32D74B' : '#34C759',
        text: '#FFFFFF',
      },
      deny: {
        background: dark ? '#FF453A' : '#FF3B30',
        text: '#FFFFFF',
      },
      allowAll: {
        background: dark ? '#0A84FF' : '#007AFF',
        text: '#FFFFFF',
      },
      inactive: {
        background: dark ? '#2C2C2E' : '#E5E5EA',
        border: dark ? '#38383A' : '#D1D1D6',
        text: '#8E8E93',
      },
      selected: {
        background: dark ? '#1C1C1E' : '#F2F2F7',
        border: dark ? '#38383A' : '#D1D1D6',
        text: dark ? '#FFFFFF' : '#3C3C43',
      },
    },
    diff: {
      outline: dark ? '#30363D' : '#E0E0E0',
      success: dark ? '#3FB950' : '#28A745',
      error: dark ? '#F85149' : '#DC3545',
      addedBg: dark ? '#0D2E1F' : '#E6FFED',
      addedBorder: dark ? '#3FB950' : '#34D058',
      addedText: dark ? '#C9D1D9' : '#24292E',
      removedBg: dark ? '#3F1B23' : '#FFEEF0',
      removedBorder: dark ? '#F85149' : '#D73A49',
      removedText: dark ? '#C9D1D9' : '#24292E',
      contextBg: dark ? '#161B22' : '#F6F8FA',
      contextText: dark ? '#8B949E' : '#586069',
      lineNumberBg: dark ? '#161B22' : '#F6F8FA',
      lineNumberText: dark ? '#6E7681' : '#959DA5',
      hunkHeaderBg: dark ? '#161B22' : '#F1F8FF',
      hunkHeaderText: dark ? '#58A6FF' : '#005CC5',
      leadingSpaceDot: dark ? '#2A2A2A' : '#E8E8E8',
      inlineAddedBg: dark ? '#2A5A2A' : '#ACFFA6',
      inlineAddedText: dark ? '#7AFF7A' : '#0A3F0A',
      inlineRemovedBg: dark ? '#5A2A2A' : '#FFCECB',
      inlineRemovedText: dark ? '#FF7A7A' : '#5A0A05',
    },
    userMessageBackground: dark ? '#2C2C2E' : '#f0eee6',
    userMessageText: dark ? '#FFFFFF' : '#000000',
    agentMessageText: dark ? '#FFFFFF' : '#000000',
    agentEventText: dark ? '#8E8E93' : '#666666',
    
    // Syntax highlighting colors
    syntaxKeyword: dark ? '#569CD6' : '#1d4ed8',
    syntaxString: dark ? '#CE9178' : '#059669',
    syntaxComment: dark ? '#6A9955' : '#6b7280',
    syntaxNumber: dark ? '#B5CEA8' : '#0891b2',
    syntaxFunction: dark ? '#DCDCAA' : '#9333ea',
    syntaxBracket1: dark ? '#FFD700' : '#ff6b6b',
    syntaxBracket2: dark ? '#DA70D6' : '#4ecdc4',
    syntaxBracket3: dark ? '#179FFF' : '#45b7d1',
    syntaxBracket4: dark ? '#FF8C00' : '#f7b731',
    syntaxBracket5: dark ? '#00FF00' : '#5f27cd',
    syntaxDefault: dark ? '#D4D4D4' : '#374151',
    
    // Git status colors
    gitBranchText: dark ? '#8E8E93' : '#6b7280',
    gitFileCountText: dark ? '#8E8E93' : '#6b7280',
    gitAddedText: dark ? '#34C759' : '#22c55e',
    gitRemovedText: dark ? '#FF453A' : '#ef4444',
  };
}
