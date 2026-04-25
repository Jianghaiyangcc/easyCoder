/**
 * Page Transition Animations
 * 
 * Reusable page transition animations for smooth navigation.
 * Supports fade and slide effects with customizable timing.
 * 
 * Usage:
 * ```tsx
 * import { FadeInUp, FadeOutDown } from '@/animations/page-transitions';
 * 
 * <Animated.View entering={FadeInUp} exiting={FadeOutDown}>
 *   <PageContent />
 * </Animated.View>
 * ```
 */

import Animated, {
  FadeIn,
  FadeOut,
  FadeInUp,
  FadeOutDown,
  FadeInDown,
  FadeOutUp,
  SlideInRight,
  SlideOutLeft,
  SlideInLeft,
  SlideOutRight,
  type AnimatedStyleProp,
  type ViewStyle,
} from 'react-native-reanimated';
import { Platform } from 'react-native';

//
// Configuration
//

const DEFAULT_DURATION = 200;
const DEFAULT_EASING = 'easeInOut' as const;

/**
 * Page transition presets
 */
export const PageTransitionPresets = {
  // Fade transitions
  fadeIn: FadeIn.duration(DEFAULT_DURATION),
  fadeOut: FadeOut.duration(DEFAULT_DURATION),
  fadeInUp: FadeInUp.duration(DEFAULT_DURATION),
  fadeOutDown: FadeOutDown.duration(DEFAULT_DURATION),
  fadeInDown: FadeInDown.duration(DEFAULT_DURATION),
  fadeOutUp: FadeOutUp.duration(DEFAULT_DURATION),

  // Slide transitions
  slideInRight: SlideInRight.duration(DEFAULT_DURATION),
  slideOutLeft: SlideOutLeft.duration(DEFAULT_DURATION),
  slideInLeft: SlideInLeft.duration(DEFAULT_DURATION),
  slideOutRight: SlideOutRight.duration(DEFAULT_DURATION),
} as const;

//
// Custom Transitions
//

/**
 * Creates a custom fade transition with specified duration
 */
export function createFadeTransition(duration = DEFAULT_DURATION) {
  return {
    entering: FadeIn.duration(duration),
    exiting: FadeOut.duration(duration),
  };
}

/**
 * Creates a custom fade-up transition
 */
export function createFadeUpTransition(duration = DEFAULT_DURATION) {
  return {
    entering: FadeInUp.duration(duration),
    exiting: FadeOutDown.duration(duration),
  };
}

/**
 * Creates a custom slide-right transition (for forward navigation)
 */
export function createSlideRightTransition(duration = DEFAULT_DURATION) {
  return {
    entering: SlideInRight.duration(duration),
    exiting: SlideOutLeft.duration(duration),
  };
}

/**
 * Creates a custom slide-left transition (for backward navigation)
 */
export function createSlideLeftTransition(duration = DEFAULT_DURATION) {
  return {
    entering: SlideInLeft.duration(duration),
    exiting: SlideOutRight.duration(duration),
  };
}

//
// Platform-specific Transitions
//

/**
 * Returns appropriate transition based on platform
 * Desktop: slide transitions
 * Mobile: fade transitions
 */
export function getPlatformTransition() {
  if (Platform.OS === 'web') {
    return createSlideRightTransition(DEFAULT_DURATION);
  }
  return createFadeUpTransition(DEFAULT_DURATION);
}

//
// Transition Components
//

interface PageTransitionProps {
  children: React.ReactNode;
  /**
   * Transition type
   * @default 'fade-up'
   */
  type?: 'fade' | 'fade-up' | 'fade-down' | 'slide-right' | 'slide-left';
  /**
   * Animation duration in milliseconds
   * @default 200
   */
  duration?: number;
  /**
   * Custom style for the container
   */
  style?: AnimatedStyleProp<ViewStyle>;
  /**
   * Whether to enable the transition
   * @default true
   */
  enabled?: boolean;
}

/**
 * Page Transition Component
 * 
 * Wraps content with smooth page transition animations.
 * Automatically selects appropriate transition based on platform.
 */
export function PageTransition({
  children,
  type = 'fade-up',
  duration = DEFAULT_DURATION,
  style,
  enabled = true,
}: PageTransitionProps) {
  if (!enabled) {
    return <Animated.View style={style}>{children}</Animated.View>;
  }

  const transition = getTransitionByType(type, duration);

  return (
    <Animated.View
      style={style}
      entering={transition.entering}
      exiting={transition.exiting}
    >
      {children}
    </Animated.View>
  );
}

/**
 * Gets transition by type
 */
function getTransitionByType(type: PageTransitionProps['type'], duration: number) {
  switch (type) {
    case 'fade':
      return createFadeTransition(duration);
    case 'fade-up':
      return createFadeUpTransition(duration);
    case 'fade-down':
      return {
        entering: FadeInDown.duration(duration),
        exiting: FadeOutUp.duration(duration),
      };
    case 'slide-right':
      return createSlideRightTransition(duration);
    case 'slide-left':
      return createSlideLeftTransition(duration);
    default:
      return createFadeUpTransition(duration);
  }
}

//
// Staggered Children Animation
//

interface StaggeredChildrenProps {
  children: React.ReactNode;
  /**
   * Delay between each child animation
   * @default 50
   */
  staggerDelay?: number;
  /**
   * Animation duration
   * @default 200
   */
  duration?: number;
  /**
   * Animation type
   * @default 'fade-up'
   */
  type?: 'fade' | 'fade-up' | 'fade-down';
  /**
   * Style for container
   */
  style?: AnimatedStyleProp<ViewStyle>;
}

/**
 * Staggered Children Animation
 * 
 * Animates children in sequence with a staggered delay.
 * Useful for lists, cards, or any grouped content.
 */
export function StaggeredChildren({
  children,
  staggerDelay = 50,
  duration = DEFAULT_DURATION,
  type = 'fade-up',
  style,
}: StaggeredChildrenProps) {
  const childArray = React.Children.toArray(children);

  return (
    <Animated.View style={style}>
      {childArray.map((child, index) => (
        <Animated.View
          key={index}
          entering={getStaggeredEntering(index, staggerDelay, duration, type)}
        >
          {child}
        </Animated.View>
      ))}
    </Animated.View>
  );
}

/**
 * Gets staggered entering animation
 */
function getStaggeredEntering(
  index: number,
  delay: number,
  duration: number,
  type: StaggeredChildrenProps['type']
) {
  const actualDelay = index * delay;

  switch (type) {
    case 'fade':
      return FadeIn.delay(actualDelay).duration(duration);
    case 'fade-up':
      return FadeInUp.delay(actualDelay).duration(duration);
    case 'fade-down':
      return FadeInDown.delay(actualDelay).duration(duration);
    default:
      return FadeInUp.delay(actualDelay).duration(duration);
  }
}

//
// Export All
//

export {
  FadeIn,
  FadeOut,
  FadeInUp,
  FadeOutDown,
  FadeInDown,
  FadeOutUp,
  SlideInRight,
  SlideOutLeft,
  SlideInLeft,
  SlideOutRight,
};
