/**
 * Micro-Interaction Animations
 * 
 * Subtle interactive animations for UI components to provide
 * immediate feedback and enhance user experience.
 * 
 * Usage:
 * ```tsx
 * import { 
 *   PressableButton,
 *   AnimatedInput,
 *   HoverableCard,
 *   AnimatedSwitch,
 *   CopySuccessAnimation,
 * } from '@/animations/advanced';
 * 
 * <PressableButton onPress={handlePress}>
 *   <Text>Click Me</Text>
 * </PressableButton>
 * 
 * <AnimatedInput placeholder="Type here..." />
 * 
 * <HoverableCard>
 *   <CardContent />
 * </HoverableCard>
 * ```
 */

import React, { useMemo } from 'react';
import {
  Pressable,
  Text,
  TextInput,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import { StyleSheet as UnistylesStyleSheet, useUnistyles } from 'react-native-unistyles';
import { MICRO_INTERACTIONS } from '../constants';

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

//
// Types
//

export interface PressableButtonProps {
  children: React.ReactNode;
  onPress: () => void;
  /**
   * Disabled state
   * @default false
   */
  disabled?: boolean;
  
  /**
   * Custom style
   */
  style?: ViewStyle;
  
  /**
   * Custom pressed style
   */
  pressedStyle?: ViewStyle;
  
  /**
   * Test ID
   */
  testID?: string;
}

export interface AnimatedInputProps extends TextInputProps {
  /**
   * Whether to show focus animation
   * @default true
   */
  animateFocus?: boolean;
  
  /**
   * Custom style
   */
  style?: TextInputProps['style'];
  
  /**
   * Custom focused style
   */
  focusedStyle?: TextInputProps['style'];
}

export interface HoverableCardProps {
  children: React.ReactNode;
  /**
   * Press handler
   */
  onPress?: () => void;
  
  /**
   * Custom style
   */
  style?: ViewStyle;
  
  /**
   * Custom hover style
   */
  hoveredStyle?: ViewStyle;
  
  /**
   * Custom pressed style
   */
  pressedStyle?: ViewStyle;
}

export interface AnimatedSwitchProps {
  /**
   * Whether switch is on
   */
  value: boolean;
  
  /**
   * On change handler
   */
  onValueChange: (value: boolean) => void;
  
  /**
   * Custom style
   */
  style?: ViewStyle;
  
  /**
   * Track color when on
   */
  trackOnColor?: string;
  
  /**
   * Track color when off
   */
  trackOffColor?: string;
  
  /**
   * Thumb color when on
   */
  thumbOnColor?: string;
  
  /**
   * Thumb color when off
   */
  thumbOffColor?: string;
}

export interface CopySuccessAnimationProps {
  /**
   * Whether to show success animation
   */
  show: boolean;
  
  /**
   * Custom style
   */
  style?: ViewStyle;
}

//
// Components
//

/**
 * Pressable Button with Animation
 * 
 * Button with scale animation on press and optional hover effect.
 */
export function PressableButton({
  children,
  onPress,
  disabled = false,
  style,
  pressedStyle,
  testID,
}: PressableButtonProps) {
  const scale = useSharedValue(1);

  const handlePressIn = () => {
    scale.value = withSpring(
      MICRO_INTERACTIONS.BUTTON.scale.pressed,
      {
        damping: 15,
        stiffness: 150,
      }
    );
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, {
      damping: 15,
      stiffness: 150,
    });
    
    if (onPress) {
      onPress();
    }
  };

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const buttonStyle = useMemo(
    () => [
      styles.button,
      disabled && styles.buttonDisabled,
      animatedStyle,
      style,
    ],
    [disabled, animatedStyle, style]
  );

  return (
    <Pressable
      testID={testID}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      style={buttonStyle}
    >
      {children}
    </Pressable>
  );
}

/**
 * Animated Input with Focus Effect
 * 
 * Input field with smooth border and shadow animation on focus.
 */
export function AnimatedInput({
  animateFocus = true,
  style,
  focusedStyle,
  ...props
}: AnimatedInputProps) {
  const isFocused = useSharedValue(0);
  const [focused, setFocused] = React.useState(false);
  const scale = useSharedValue(1);

  const handleFocus: NonNullable<TextInputProps['onFocus']> = (event) => {
    isFocused.value = 1;
    setFocused(true);
    if (animateFocus) {
      scale.value = withSpring(MICRO_INTERACTIONS.BUTTON.scale.hovered, {
        damping: 15,
        stiffness: 150,
      });
    }
    props.onFocus?.(event);
  };

  const handleBlur: NonNullable<TextInputProps['onBlur']> = (event) => {
    isFocused.value = 0;
    setFocused(false);
    if (animateFocus) {
      scale.value = withSpring(1, {
        damping: 15,
        stiffness: 150,
      });
    }
    props.onBlur?.(event);
  };

  const animatedStyle = useAnimatedStyle(() => {
    const borderWidth = interpolate(
      isFocused.value,
      [0, 1],
      [1, 2]
    );
    
    const shadowOpacity = interpolate(
      isFocused.value,
      [0, 1],
      [0, 0.1]
    );

    return {
      transform: [{ scale: scale.value }],
      borderWidth,
      shadowOpacity,
    };
  });

  const { theme } = useUnistyles();

  const inputStyle = useMemo(
    () => [
      styles.input,
      {
        borderColor: focused ? theme.colors.accent : theme.colors.border,
        shadowColor: focused ? theme.colors.accent : 'transparent',
        shadowRadius: focused ? 8 : 0,
        shadowOffset: {
          width: 0,
          height: focused ? 4 : 0,
        },
      },
      animatedStyle,
      style,
      focusedStyle,
    ],
    [focused, animatedStyle, style, focusedStyle, theme]
  );

  return (
    <AnimatedTextInput
      {...props}
      onFocus={handleFocus}
      onBlur={handleBlur}
      style={inputStyle}
    />
  );
}

/**
 * Hoverable Card with Animation
 * 
 * Card with subtle hover lift effect and press animation.
 */
export function HoverableCard({
  children,
  onPress,
  style,
  hoveredStyle,
  pressedStyle,
}: HoverableCardProps) {
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const isHovered = useSharedValue(false);

  const handleHoverIn = () => {
    isHovered.value = true;
    translateY.value = withTiming(
      MICRO_INTERACTIONS.CARD.translateY.hovered,
      {
        duration: MICRO_INTERACTIONS.CARD.shadow.duration,
        easing: Easing.out(Easing.cubic),
      }
    );
  };

  const handleHoverOut = () => {
    isHovered.value = false;
    translateY.value = withTiming(0, {
      duration: MICRO_INTERACTIONS.CARD.shadow.duration,
      easing: Easing.out(Easing.cubic),
    });
  };

  const handlePressIn = () => {
    scale.value = withSpring(
      MICRO_INTERACTIONS.BUTTON.scale.pressed,
      {
        damping: 15,
        stiffness: 150,
      }
    );
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, {
      damping: 15,
      stiffness: 150,
    });
  };

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateY: translateY.value },
        { scale: scale.value },
      ],
    };
  });

  const { theme } = useUnistyles();

  const cardStyle = useMemo(
    () => [
      styles.card,
      animatedStyle,
      style,
      isHovered.value && hoveredStyle,
    ],
    [animatedStyle, style, isHovered.value, hoveredStyle, theme]
  );

  return (
    <Pressable
      style={cardStyle}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onHoverIn={handleHoverIn}
      onHoverOut={handleHoverOut}
    >
      {children}
    </Pressable>
  );
}

/**
 * Animated Switch Component
 * 
 * Toggle switch with smooth thumb animation.
 */
export function AnimatedSwitch({
  value,
  onValueChange,
  style,
  trackOnColor,
  trackOffColor,
  thumbOnColor,
  thumbOffColor,
}: AnimatedSwitchProps) {
  const translateX = useSharedValue(value ? 20 : 0);
  const scale = useSharedValue(value ? 1.1 : 1);

  const handlePress = () => {
    onValueChange(!value);
  };

  // Animate thumb position and scale
  React.useEffect(() => {
    translateX.value = withSpring(value ? 20 : 0, {
      damping: 15,
      stiffness: 150,
    });
    
    scale.value = withSpring(value ? 1.1 : 1, {
      damping: 15,
      stiffness: 150,
    });
  }, [value, translateX, scale]);

  const thumbAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { scale: scale.value },
      ],
    };
  });

  const { theme } = useUnistyles();

  const containerStyle = useMemo(
    () => [
      styles.switchContainer,
      style,
      {
        backgroundColor: value
          ? (trackOnColor || theme.colors.switch.track.active)
          : (trackOffColor || theme.colors.switch.track.inactive),
      },
    ],
    [value, trackOnColor, trackOffColor, style, theme]
  );

  const thumbStyle = useMemo(
    () => [
      styles.switchThumb,
      thumbAnimatedStyle,
      {
        backgroundColor: value
          ? (thumbOnColor || theme.colors.switch.thumb.active)
          : (thumbOffColor || theme.colors.switch.thumb.inactive),
      },
    ],
    [thumbAnimatedStyle, value, thumbOnColor, thumbOffColor, theme]
  );

  return (
    <Pressable
      style={containerStyle}
      onPress={handlePress}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <Animated.View style={thumbStyle} />
    </Pressable>
  );
}

/**
 * Copy Success Animation
 * 
 * Shows a checkmark animation when content is copied.
 */
export function CopySuccessAnimation({ show, style }: CopySuccessAnimationProps) {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0);

  const showAnimation = () => {
    opacity.value = withTiming(1, {
      duration: 150,
      easing: Easing.out(Easing.cubic),
    });
    
    scale.value = withSpring(1, {
      damping: 15,
      stiffness: 200,
    });
  };

  const hideAnimation = () => {
    opacity.value = withTiming(0, {
      duration: 150,
      easing: Easing.in(Easing.cubic),
    });
    
    scale.value = withSpring(0, {
      damping: 15,
      stiffness: 200,
    });
  };

  React.useEffect(() => {
    if (show) {
      showAnimation();
      setTimeout(hideAnimation, 2000);
    }
  }, [show]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [{ scale: scale.value }],
    };
  });

  const { theme } = useUnistyles();

  return (
    <Animated.View
      style={[
        styles.copySuccess,
        { backgroundColor: theme.colors.statusSuccess },
        animatedStyle,
        style,
      ]}
    >
      <Text style={styles.checkmark}>✓</Text>
    </Animated.View>
  );
}

//
// Styles
//

const styles = UnistylesStyleSheet.create((theme) => ({
  button: {
    paddingVertical: theme.spacing.margins.md,
    paddingHorizontal: theme.spacing.margins.lg,
    borderRadius: theme.spacing.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.accent,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  input: {
    paddingVertical: theme.spacing.margins.md,
    paddingHorizontal: theme.spacing.margins.md,
    borderRadius: theme.spacing.borderRadius.md,
    borderWidth: 1,
    backgroundColor: theme.colors.surface2,
  },
  card: {
    backgroundColor: theme.colors.surface2,
    borderRadius: theme.spacing.borderRadius.lg,
    padding: theme.spacing.margins.lg,
    ...theme.shadow.sm,
  },
  switchContainer: {
    width: 44,
    height: 24,
    borderRadius: 12,
    padding: 2,
    justifyContent: 'center',
  },
  switchThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  copySuccess: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute' as const,
  },
  checkmark: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
    lineHeight: 20,
  },
}));
