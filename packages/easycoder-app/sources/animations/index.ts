/**
 * Animation System - Main Entry Point
 * 
 * This module exports all animation components and constants for the application.
 * 
 * Components:
 * - WorkingIndicator: Three-dot loading animation
 * - PageTransition: Page transition wrapper component
 * - StaggeredChildren: Staggered children animation
 * 
 * Page Transitions:
 * - FadeIn, FadeOut, FadeInUp, FadeOutDown, etc.
 * - SlideInRight, SlideOutLeft, SlideInLeft, SlideOutRight
 * - PageTransitionPresets: Pre-configured transitions
 * - createFadeTransition, createSlideRightTransition, etc.
 * 
 * Constants:
 * - Animation timing and configuration values
 * - Easing functions
 * - Helper functions
 * 
 * Usage:
 * ```typescript
 * import { 
 *   WorkingIndicator, 
 *   PageTransition, 
 *   StaggeredChildren,
 *   FadeInUp,
 *   WORKING_INDICATOR,
 *   PAGE_TRANSITION,
 * } from '@/animations';
 * 
 * <WorkingIndicator size="medium" />
 * <PageTransition type="fade-up">
 *   <Content />
 * </PageTransition>
 * <StaggeredChildren>
 *   <Item1 />
 *   <Item2 />
 * </StaggeredChildren>
 * console.log(WORKING_INDICATOR.CYCLE_MS);
 * console.log(PAGE_TRANSITION.DURATION);
 * ```
 */

// Export components
export { WorkingIndicator } from './WorkingIndicator';
export { 
  PageTransition, 
  StaggeredChildren,
  PageTransitionPresets,
  createFadeTransition,
  createFadeUpTransition,
  createSlideRightTransition,
  createSlideLeftTransition,
  getPlatformTransition,
} from './page-transitions';

// Export Reanimated transitions
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
} from './page-transitions';

// Export constants
export {
  WORKING_INDICATOR,
  PAGE_TRANSITION,
  SKELETON,
  MICRO_INTERACTIONS,
  SIDEBAR,
  MESSAGE_FLOW,
  GESTURE,
  EASING,
  DURATION,
} from './constants';

// Export helper functions
export {
  calculateAnimationStrength,
  createSpringConfig,
  createTimingConfig,
} from './constants';

// Export types
export type { 
  WorkingIndicatorProps, 
  WorkingIndicatorSize 
} from './WorkingIndicator';

export type { 
  PageTransitionProps,
  StaggeredChildrenProps,
} from './page-transitions';

// Export skeleton components
export { 
  Skeleton,
  SkeletonText,
  SkeletonAvatar,
  SkeletonCard,
  SkeletonList,
  SkeletonRect,
  SkeletonCircle,
} from './skeleton';

export type {
  SkeletonProps,
  SkeletonTextProps,
  SkeletonAvatarProps,
  SkeletonCardProps,
  SkeletonListProps,
  SkeletonRectProps,
  SkeletonCircleProps,
} from './skeleton';

// Export advanced animations
export * from './advanced';
