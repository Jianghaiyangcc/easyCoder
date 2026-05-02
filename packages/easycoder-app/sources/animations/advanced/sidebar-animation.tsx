/**
 * Sidebar Animation Component
 * 
 * Advanced sidebar animations for smooth open/close transitions
 * and width adjustments. Supports both desktop and mobile platforms.
 * 
 * Usage:
 * ```tsx
 * import { SidebarAnimation } from '@/animations/advanced';
 * 
 * <SidebarAnimation 
 *   isOpen={isOpen} 
 *   width={sidebarWidth}
 *   onClose={handleClose}
 * >
 *   <SidebarContent />
 * </SidebarAnimation>
 * ```
 */

import React, { useEffect, useRef, useMemo } from 'react';
import {
  View,
  Pressable,
  Platform,
  PanResponder,
  type PanResponderGestureState,
  type GestureResponderEvent,
  type ViewStyle,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import { StyleSheet as UnistylesStyleSheet } from 'react-native-unistyles';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SIDEBAR } from '../constants';

//
// Types
//

export interface SidebarAnimationProps {
  /**
   * Whether the sidebar is open
   */
  isOpen: boolean;
  
  /**
   * Current sidebar width
   */
  width: number;
  
  /**
   * Callback when sidebar is closed
   */
  onClose: () => void;
  
  /**
   * Minimum sidebar width
   * @default 240
   */
  minWidth?: number;
  
  /**
   * Maximum sidebar width
   * @default 400
   */
  maxWidth?: number;
  
  /**
   * Whether to show backdrop overlay (mobile only)
   * @default true on mobile, false on desktop
   */
  showBackdrop?: boolean;
  
  /**
   * Children content
   */
  children: React.ReactNode;
  
  /**
   * Custom style for sidebar
   */
  style?: ViewStyle;
  
  /**
   * Whether sidebar is resizable (desktop only)
   * @default true on desktop, false on mobile
   */
  resizable?: boolean;
  
  /**
   * Callback when width changes
   */
  onWidthChange?: (width: number) => void;
}

//
// Components
//

/**
 * Sidebar Animation Component
 * 
 * Provides smooth sidebar animations for both desktop and mobile platforms.
 * - Desktop: Fixed sidebar with width adjustment
 * - Mobile: Overlay sidebar with backdrop and swipe gestures
 */
export function SidebarAnimation({
  isOpen,
  width,
  onClose,
  minWidth = SIDEBAR.WIDTH.MIN,
  maxWidth = SIDEBAR.WIDTH.MAX,
  showBackdrop,
  children,
  style,
  resizable = Platform.OS === 'web',
  onWidthChange,
}: SidebarAnimationProps) {
  const insets = useSafeAreaInsets();
  const isMobile = !resizable;

  // Animation values
  const translateX = useSharedValue(0);
  const opacity = useSharedValue(0);
  const sidebarWidth = useSharedValue(width);
  
  // For desktop: controlled by isOpen prop
  // For mobile: controlled by swipe gesture and isOpen prop
  useEffect(() => {
    if (isMobile) {
      // Mobile: animate in/out
      if (isOpen) {
        translateX.value = withTiming(0, {
          duration: SIDEBAR.DURATION,
          easing: SIDEBAR.EASING,
        });
        opacity.value = withTiming(1, {
          duration: SIDEBAR.DURATION,
          easing: SIDEBAR.EASING,
        });
      } else {
        translateX.value = withTiming(-width, {
          duration: SIDEBAR.DURATION,
          easing: SIDEBAR.EASING,
        });
        opacity.value = withTiming(0, {
          duration: SIDEBAR.DURATION,
          easing: SIDEBAR.EASING,
        });
      }
    }
  }, [isOpen, width, isMobile, translateX, opacity]);

  // Sync width prop with animation value (desktop)
  useEffect(() => {
    if (!isMobile) {
      sidebarWidth.value = withSpring(width, {
        damping: 15,
        stiffness: 150,
      });
    }
  }, [width, isMobile, sidebarWidth]);

  // Animated styles
  const sidebarAnimatedStyle = useAnimatedStyle(() => {
    return {
      width: isMobile ? width : sidebarWidth.value,
      transform: [{ translateX: translateX.value }],
    };
  });

  const backdropAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
    };
  });

  // Handle backdrop press
  const handleBackdropPress = () => {
    onClose();
  };

  // Handle width change end
  const handleWidthChangeEnd = () => {
    if (onWidthChange) {
      onWidthChange(sidebarWidth.value);
    }
  };

  // Desktop: Render fixed sidebar
  if (!isMobile) {
    return (
      <Animated.View
        style={[
          styles.desktopSidebar,
          sidebarAnimatedStyle,
          style,
          { paddingTop: insets.top },
        ]}
      >
        {children}
      </Animated.View>
    );
  }

  // Mobile: Render overlay sidebar with backdrop
  const actualShowBackdrop = showBackdrop !== undefined ? showBackdrop : true;
  const effectiveShowBackdrop = isMobile && actualShowBackdrop;

  return (
    <>
      {/* Backdrop overlay */}
      {effectiveShowBackdrop && (
        <AnimatedPressable
          style={[styles.backdrop, backdropAnimatedStyle]}
          onPress={handleBackdropPress}
        />
      )}
      
      {/* Mobile sidebar */}
      <Animated.View
        style={[
          styles.mobileSidebar,
          sidebarAnimatedStyle,
          style,
          {
            paddingTop: insets.top,
            paddingBottom: insets.bottom,
          },
        ]}
      >
        {children}
      </Animated.View>
    </>
  );
}

//
// Desktop Sidebar with Resize Handle
//

export interface ResizableSidebarProps extends Omit<SidebarAnimationProps, 'resizable'> {
  /**
   * Minimum width for resize
   * @default 240
   */
  minWidth?: number;
  
  /**
   * Maximum width for resize
   * @default 400
   */
  maxWidth?: number;
}

/**
 * Resizable Sidebar Component (Desktop Only)
 * 
 * Sidebar with drag handle for width adjustment on desktop.
 */
export function ResizableSidebar({
  width,
  onWidthChange,
  minWidth = SIDEBAR.WIDTH.MIN,
  maxWidth = SIDEBAR.WIDTH.MAX,
  ...rest
}: ResizableSidebarProps) {
  const sidebarWidth = useSharedValue(width);
  const startWidthRef = useRef(width);
  const latestWidthRef = useRef(width);
  
  const clampWidth = (nextWidth: number) => {
    return Math.max(minWidth, Math.min(maxWidth, nextWidth));
  };
  
  // Sync width prop with animation value
  useEffect(() => {
    const clamped = clampWidth(width);
    latestWidthRef.current = clamped;
    sidebarWidth.value = withSpring(clamped, {
      damping: 15,
      stiffness: 150,
    });
  }, [width, sidebarWidth]);

  const updateWidth = (_event: GestureResponderEvent, gestureState: PanResponderGestureState) => {
    const candidate = startWidthRef.current + gestureState.dx;
    const clamped = clampWidth(candidate);
    latestWidthRef.current = clamped;
    sidebarWidth.value = clamped;
  };

  const panResponder = useMemo(
    () => PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dx) > 2,
      onPanResponderGrant: () => {
        startWidthRef.current = latestWidthRef.current;
      },
      onPanResponderMove: updateWidth,
      onPanResponderRelease: () => {
        onWidthChange?.(latestWidthRef.current);
      },
      onPanResponderTerminate: () => {
        onWidthChange?.(latestWidthRef.current);
      },
    }),
    [onWidthChange, minWidth, maxWidth]
  );

  const sidebarAnimatedStyle = useAnimatedStyle(() => {
    return {
      width: sidebarWidth.value,
    };
  });

  return (
    <Animated.View style={[styles.resizableSidebarContainer, sidebarAnimatedStyle]}>
      <SidebarAnimation
        {...rest}
        width={latestWidthRef.current}
        onWidthChange={onWidthChange}
        resizable={true}
      />

      {/* Resize handle */}
      <View
        style={styles.resizeHandle}
        {...panResponder.panHandlers}
      />
    </Animated.View>
  );
}

//
// Backdrop Pressable
//

interface AnimatedPressableProps {
  style: any;
  onPress: () => void;
  children?: React.ReactNode;
}

function AnimatedPressable({ style, onPress, children }: AnimatedPressableProps) {
  return (
    <Pressable style={style} onPress={onPress}>
      {children}
    </Pressable>
  );
}

//
// Styles
//

const styles = UnistylesStyleSheet.create((theme) => ({
  // Desktop sidebar
  desktopSidebar: {
    position: 'relative' as const,
    backgroundColor: theme.colors.surfaceSidebar,
    borderRightWidth: 1,
    borderRightColor: theme.colors.border,
    height: '100%',
    overflow: 'hidden' as const,
  },

  // Mobile sidebar
  mobileSidebar: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    bottom: 0,
    backgroundColor: theme.colors.surfaceSidebar,
    borderRightWidth: 1,
    borderRightColor: theme.colors.border,
    shadowColor: 'rgba(0, 0, 0, 0.25)',
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    shadowOpacity: 1,
    elevation: 8,
    zIndex: 1000,
  },

  // Backdrop
  backdrop: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 999,
  },

  // Resizable container
  resizableSidebarContainer: {
    position: 'relative' as const,
    height: '100%',
    overflow: 'hidden' as const,
  },

  // Resize handle
  resizeHandle: {
    position: 'absolute' as const,
    right: -5,
    top: 0,
    bottom: 0,
    width: 10,
    zIndex: 10,
  },
}));
