/**
 * Working Indicator Animation Component
 * 
 * A three-dot loading animation inspired by Paseo project.
 * Shows a working state with animated dots that pulse in sequence.
 * 
 * Usage:
 * ```tsx
 * <WorkingIndicator size="small" />
 * <WorkingIndicator size="medium" />
 * <WorkingIndicator size="large" />
 * ```
 */

import React, { useEffect, useRef, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';

// Animation configuration
const WORKING_INDICATOR_CYCLE_MS = 1200;
const WORKING_INDICATOR_OFFSETS = [0, 0.125, 0.25] as const;

type WorkingIndicatorSize = 'small' | 'medium' | 'large';

interface WorkingIndicatorProps {
  /**
   * Size of the indicator dots
   * @default 'medium'
   */
  size?: WorkingIndicatorSize;
  
  /**
   * Color of the dots (uses theme's foregroundMuted by default)
   */
  color?: string;
  
  /**
   * Custom style for the container
   */
  style?: any;
  
  /**
   * Test ID for testing
   */
  testID?: string;
}

/**
 * Calculates the strength of a dot's animation based on progress
 * Strength ranges from 0 to 1, representing opacity and translation
 */
function getWorkingIndicatorDotStrength(
  progress: number,
  offset: number
): number {
  // Create a wave pattern where each dot peaks at different times
  const adjustedProgress = (progress - offset + 1) % 1;
  
  // Use a sine wave to create smooth pulsing
  // Peak at 0.5 (fully opaque and raised)
  // Trough at 0 and 1 (faded and lowered)
  return Math.sin(adjustedProgress * Math.PI);
}

/**
 * Working Indicator Component
 * 
 * Displays three animated dots that pulse in sequence to indicate
 * loading or processing state.
 */
export function WorkingIndicator({
  size = 'medium',
  color,
  style,
  testID,
}: WorkingIndicatorProps) {
  const progress = useSharedValue(0);

  // Start animation on mount
  useEffect(() => {
    progress.value = 0;
    progress.value = withRepeat(
      withTiming(1, {
        duration: WORKING_INDICATOR_CYCLE_MS,
        easing: Easing.linear,
      }),
      -1, // Infinite repeat
      false // Don't reverse
    );

    // Cleanup animation on unmount
    return () => {
      cancelAnimation(progress);
      progress.value = 0;
    };
  }, [progress]);

  // Size configuration
  const sizeConfig = useMemo(() => {
    switch (size) {
      case 'small':
        return {
          dotSize: 4,
          gap: 4,
          translateDistance: -1,
        };
      case 'large':
        return {
          dotSize: 8,
          gap: 8,
          translateDistance: -3,
        };
      case 'medium':
      default:
        return {
          dotSize: 6,
          gap: 6,
          translateDistance: -2,
        };
    }
  }, [size]);

  // Animated styles for each dot
  const dotOneStyle = useAnimatedStyle(() => {
    const strength = getWorkingIndicatorDotStrength(progress.value, WORKING_INDICATOR_OFFSETS[0]);
    return {
      opacity: 0.3 + strength * 0.7,
      transform: [{ translateY: strength * sizeConfig.translateDistance }],
    };
  });

  const dotTwoStyle = useAnimatedStyle(() => {
    const strength = getWorkingIndicatorDotStrength(progress.value, WORKING_INDICATOR_OFFSETS[1]);
    return {
      opacity: 0.3 + strength * 0.7,
      transform: [{ translateY: strength * sizeConfig.translateDistance }],
    };
  });

  const dotThreeStyle = useAnimatedStyle(() => {
    const strength = getWorkingIndicatorDotStrength(progress.value, WORKING_INDICATOR_OFFSETS[2]);
    return {
      opacity: 0.3 + strength * 0.7,
      transform: [{ translateY: strength * sizeConfig.translateDistance }],
    };
  });

  const dotOneCombinedStyle = useMemo(
    () => [styles.dot, { width: sizeConfig.dotSize, height: sizeConfig.dotSize, backgroundColor: color }, dotOneStyle],
    [sizeConfig.dotSize, color, dotOneStyle]
  );

  const dotTwoCombinedStyle = useMemo(
    () => [styles.dot, { width: sizeConfig.dotSize, height: sizeConfig.dotSize, backgroundColor: color }, dotTwoStyle],
    [sizeConfig.dotSize, color, dotTwoStyle]
  );

  const dotThreeCombinedStyle = useMemo(
    () => [styles.dot, { width: sizeConfig.dotSize, height: sizeConfig.dotSize, backgroundColor: color }, dotThreeStyle],
    [sizeConfig.dotSize, color, dotThreeStyle]
  );

  const containerStyle = useMemo(
    () => [
      styles.container,
      {
        gap: sizeConfig.gap,
      },
      style,
    ],
    [sizeConfig.gap, style]
  );

  return (
    <View style={containerStyle} testID={testID}>
      <Animated.View style={dotOneCombinedStyle} />
      <Animated.View style={dotTwoCombinedStyle} />
      <Animated.View style={dotThreeCombinedStyle} />
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    borderRadius: 999, // Fully rounded
    backgroundColor: theme.colors.foregroundMuted,
  },
}));
