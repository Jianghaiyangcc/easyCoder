/**
 * Animation Constants
 * 
 * Centralized animation configuration values used throughout the application.
 * Maintains consistency and makes it easy to tweak animation timing and values.
 */

import { Easing } from 'react-native-reanimated';

//
// Working Indicator
//

export const WORKING_INDICATOR = {
  /** Duration of one complete animation cycle in milliseconds */
  CYCLE_MS: 1200,
  
  /** Time offsets for each dot to create wave effect */
  OFFSETS: [0, 0.125, 0.25] as const,
  
  /** Size configurations for different variants */
  SIZES: {
    small: {
      dotSize: 4,
      gap: 4,
      translateDistance: -1,
    },
    medium: {
      dotSize: 6,
      gap: 6,
      translateDistance: -2,
    },
    large: {
      dotSize: 8,
      gap: 8,
      translateDistance: -3,
    },
  } as const,
  
  /** Opacity range for animation (min to max) */
  OPACITY: {
    min: 0.3,
    max: 1.0,
  },
} as const;

//
// Page Transitions
//

export const PAGE_TRANSITION = {
  /** Default duration for page transitions */
  DURATION: 200,
  
  /** Easing function for smooth transitions */
  EASING: 'easeInOut' as const,
  
  /** Transition types */
  TYPE: {
    fade: 'fade',
    slide: 'slide',
    scale: 'scale',
  } as const,
} as const;

//
// Skeleton Loading
//

export const SKELETON = {
  /** Duration of one shimmer cycle */
  SHIMMER_DURATION: 1500,
  
  /** Opacity range for shimmer effect */
  OPACITY: {
    min: 0.4,
    max: 0.8,
  },
  
  /** Shimmer direction */
  DIRECTION: 'right' as const,
} as const;

//
// Micro-interactions
//

export const MICRO_INTERACTIONS = {
  /** Button hover/scale animation */
  BUTTON: {
    scale: {
      pressed: 0.98,
      hovered: 1.02,
    },
    duration: {
      fast: 150,
      normal: 200,
    },
  },
  
  /** Input focus animation */
  INPUT: {
    border: {
      duration: 200,
      easing: 'easeOut' as const,
    },
    shadow: {
      duration: 300,
      easing: 'easeOut' as const,
    },
  },
  
  /** Card hover animation */
  CARD: {
    translateY: {
      hovered: -2,
    },
    shadow: {
      duration: 300,
    },
  },
} as const;

//
// Sidebar Animations
//

export const SIDEBAR = {
  /** Duration of sidebar open/close animation */
  DURATION: 300,
  
  /** Easing function for sidebar */
  EASING: Easing.out(Easing.cubic),
  
  /** Width animation configuration */
  WIDTH: {
    MIN: 240,
    MAX: 400,
    DEFAULT: 280,
  },
} as const;

//
// Message Flow Animations
//

export const MESSAGE_FLOW = {
  /** Duration for message appearance */
  DURATION: {
    user: 200,
    assistant: 200,
    tool: 250,
    thought: 200,
    permission: 300,
  },
  
  /** Easing for different message types */
  EASING: {
    fade: 'easeOut' as const,
    slide: 'easeOut' as const,
    scale: 'easeOut' as const,
  },
  
  /** Stagger delay for consecutive messages */
  STAGGER_DELAY: 50,
} as const;

//
// Gesture Animations
//

export const GESTURE = {
  /** Swipe to dismiss threshold (percentage of width) */
  DISMISS_THRESHOLD: 0.3,
  
  /** Swipe velocity threshold */
  VELOCITY_THRESHOLD: 500,
  
  /** Spring configuration for gesture animations */
  SPRING: {
    damping: 15,
    stiffness: 150,
    mass: 0.5,
  },
} as const;

//
// Common Easing Functions
//

export const EASING = {
  linear: 'linear' as const,
  easeIn: 'easeIn' as const,
  easeOut: 'easeOut' as const,
  easeInOut: 'easeInOut' as const,
  
  // Reanimated easing functions
  in: (t: number) => t * t,
  out: (t: number) => t * (2 - t),
  inOut: (t: number) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
} as const;

//
// Common Durations
//

export const DURATION = {
  instant: 0,
  fast: 150,
  normal: 200,
  slow: 300,
  slower: 500,
} as const;

//
// Helper Functions
//

/**
 * Calculates the strength of an animation based on progress
 * @param progress - Animation progress (0 to 1)
 * @param offset - Time offset for staggering
 * @returns Strength value (0 to 1)
 */
export function calculateAnimationStrength(
  progress: number,
  offset: number
): number {
  const adjustedProgress = (progress - offset + 1) % 1;
  return Math.sin(adjustedProgress * Math.PI);
}

/**
 * Creates a spring animation configuration
 * @param stiffness - Spring stiffness
 * @param damping - Spring damping
 * @param mass - Spring mass
 * @returns Spring configuration object
 */
export function createSpringConfig(
  stiffness = 150,
  damping = 15,
  mass = 0.5
) {
  return {
    stiffness,
    damping,
    mass,
  };
}

/**
 * Creates a timing animation configuration
 * @param duration - Animation duration in ms
 * @param easing - Easing function
 * @returns Timing configuration object
 */
export function createTimingConfig(
  duration = 200,
  easing: keyof typeof EASING = 'easeOut'
) {
  return {
    duration,
    easing: EASING[easing],
  };
}
