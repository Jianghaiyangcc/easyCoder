/**
 * Enhanced Skeleton Components
 * 
 * Enhanced skeleton loading components with multiple variants and improved animations.
 * Builds upon the existing ShimmerView component.
 * 
 * Usage:
 * ```tsx
 * import { Skeleton } from '@/animations/skeleton';
 * 
 * <Skeleton width={100} height={20} />
 * <Skeleton.Text lines={3} />
 * <Skeleton.Avatar size={40} />
 * <Skeleton.Card />
 * <Skeleton.List items={5} />
 * ```
 */

import React from 'react';
import { View, StyleSheet, type ViewStyle } from 'react-native';
import { ShimmerView } from '@/components/ShimmerView';
import { StyleSheet as UnistylesStyleSheet, useUnistyles } from 'react-native-unistyles';

//
// Basic Skeleton
//

export interface SkeletonProps {
  /**
   * Width of the skeleton
   * @default '100%'
   */
  width?: number | string;
  
  /**
   * Height of the skeleton
   * @default 20
   */
  height?: number;
  
  /**
   * Border radius
   * @default 4
   */
  borderRadius?: number;
  
  /**
   * Custom style
   */
  style?: ViewStyle;
  
  /**
   * Shimmer duration in milliseconds
   */
  duration?: number;
}

/**
 * Basic Skeleton Component
 * 
 * A simple skeleton loader with shimmer effect.
 */
export function Skeleton({
  width = '100%',
  height = 20,
  borderRadius = 4,
  style,
  duration,
}: SkeletonProps) {
  const { theme } = useUnistyles();

  const skeletonStyle = {
    width: typeof width === 'number' ? width : undefined,
    height,
    borderRadius,
  };

  const containerStyle = StyleSheet.flatten([
    styles.skeleton,
    skeletonStyle,
    style,
    width === '100%' ? { width: '100%' } : undefined,
  ]) as ViewStyle;

  return (
    <ShimmerView 
      style={containerStyle} 
      duration={duration}
      shimmerColors={[
        theme.colors.surface2,
        theme.colors.surface3,
        theme.colors.surface2,
      ]}
    >
      <View style={containerStyle} />
    </ShimmerView>
  );
}

//
// Text Skeleton
//

export interface SkeletonTextProps {
  /**
   * Number of lines to show
   * @default 3
   */
  lines?: number;
  
  /**
   * Height of each line
   * @default 16
   */
  lineHeight?: number;
  
  /**
   * Gap between lines
   * @default 8
   */
  gap?: number;
  
  /**
   * Width of the last line (can be smaller for variety)
   * @default '70%'
   */
  lastLineWidth?: number | string;
  
  /**
   * Custom style
   */
  style?: ViewStyle;
  
  /**
   * Shimmer duration
   */
  duration?: number;
}

/**
 * Skeleton Text Component
 * 
 * Skeleton loader for text content with multiple lines.
 */
export function SkeletonText({
  lines = 3,
  lineHeight = 16,
  gap = 8,
  lastLineWidth = '70%',
  style,
  duration,
}: SkeletonTextProps) {
  const { theme } = useUnistyles();

  return (
    <View style={[styles.textContainer, style]}>
      {Array.from({ length: lines }).map((_, index) => {
        const isLast = index === lines - 1;
        return (
          <Skeleton
            key={index}
            height={lineHeight}
            width={isLast ? lastLineWidth : '100%'}
            borderRadius={4}
            style={{ marginBottom: isLast ? 0 : gap }}
            duration={duration}
          />
        );
      })}
    </View>
  );
}

//
// Avatar Skeleton
//

export interface SkeletonAvatarProps {
  /**
   * Size of the avatar
   * @default 40
   */
  size?: number;
  
  /**
   * Custom style
   */
  style?: ViewStyle;
  
  /**
   * Shimmer duration
   */
  duration?: number;
}

/**
 * Skeleton Avatar Component
 * 
 * Skeleton loader for avatar or circular images.
 */
export function SkeletonAvatar({
  size = 40,
  style,
  duration,
}: SkeletonAvatarProps) {
  const containerStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
  };

  return (
    <Skeleton
      width={size}
      height={size}
      borderRadius={size / 2}
      style={StyleSheet.flatten([containerStyle, style])}
      duration={duration}
    />
  );
}

//
// Card Skeleton
//

export interface SkeletonCardProps {
  /**
   * Custom style
   */
  style?: ViewStyle;
  
  /**
   * Whether to show avatar
   * @default true
   */
  showAvatar?: boolean;
  
  /**
   * Whether to show title
   * @default true
   */
  showTitle?: boolean;
  
  /**
   * Whether to show description
   * @default true
   */
  showDescription?: boolean;
  
  /**
   * Shimmer duration
   */
  duration?: number;
}

/**
 * Skeleton Card Component
 * 
 * Skeleton loader for card components with avatar, title, and description.
 */
export function SkeletonCard({
  style,
  showAvatar = true,
  showTitle = true,
  showDescription = true,
  duration,
}: SkeletonCardProps) {
  const { theme } = useUnistyles();

  return (
    <View style={[styles.cardContainer, style]}>
      {showAvatar && (
        <SkeletonAvatar 
          size={40} 
          style={styles.cardAvatar} 
          duration={duration}
        />
      )}
      <View style={styles.cardContent}>
        {showTitle && (
          <Skeleton
            width={120}
            height={20}
            borderRadius={4}
            style={styles.cardTitle}
            duration={duration}
          />
        )}
        {showDescription && (
          <SkeletonText
            lines={2}
            lineHeight={14}
            gap={6}
            lastLineWidth={100}
            style={styles.cardDescription}
            duration={duration}
          />
        )}
      </View>
    </View>
  );
}

//
// List Skeleton
//

export interface SkeletonListProps {
  /**
   * Number of items in the list
   * @default 5
   */
  items?: number;
  
  /**
   * Custom style
   */
  style?: ViewStyle;
  
  /**
   * Item component to render
   * @default SkeletonCard
   */
  ItemComponent?: React.ComponentType<any>;
  
  /**
   * Props to pass to each item
   */
  itemProps?: Record<string, any>;
}

/**
 * Skeleton List Component
 * 
 * Skeleton loader for list components with multiple items.
 */
export function SkeletonList({
  items = 5,
  style,
  ItemComponent = SkeletonCard,
  itemProps = {},
}: SkeletonListProps) {
  return (
    <View style={style}>
      {Array.from({ length: items }).map((_, index) => (
        <ItemComponent 
          key={index} 
          style={styles.listItem}
          {...itemProps}
        />
      ))}
    </View>
  );
}

//
// Rect Skeleton
//

export interface SkeletonRectProps {
  /**
   * Width
   */
  width?: number | string;
  
  /**
   * Height
   */
  height?: number;
  
  /**
   * Custom style
   */
  style?: ViewStyle;
  
  /**
   * Shimmer duration
   */
  duration?: number;
}

/**
 * Skeleton Rect Component
 * 
 * Skeleton loader for rectangular content (images, videos, etc.).
 */
export function SkeletonRect({
  width = '100%',
  height = 200,
  style,
  duration,
}: SkeletonRectProps) {
  const containerStyle = {
    width: typeof width === 'number' ? width : undefined,
    height,
  };

  return (
    <Skeleton
      width={width}
      height={height}
      borderRadius={8}
      style={StyleSheet.flatten([containerStyle, style])}
      duration={duration}
    />
  );
}

//
// Circle Skeleton
//

export interface SkeletonCircleProps {
  /**
   * Diameter
   */
  size?: number;
  
  /**
   * Custom style
   */
  style?: ViewStyle;
  
  /**
   * Shimmer duration
   */
  duration?: number;
}

/**
 * Skeleton Circle Component
 * 
 * Skeleton loader for circular content (icons, badges, etc.).
 */
export function SkeletonCircle({
  size = 24,
  style,
  duration,
}: SkeletonCircleProps) {
  const containerStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
  };

  return (
    <Skeleton
      width={size}
      height={size}
      borderRadius={size / 2}
      style={StyleSheet.flatten([containerStyle, style])}
      duration={duration}
    />
  );
}

//
// Styles
//

const styles = UnistylesStyleSheet.create((theme) => ({
  skeleton: {
    backgroundColor: theme.colors.surface2,
    overflow: 'hidden',
  },
  textContainer: {
    width: '100%',
  },
  cardContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: theme.spacing.margins.lg,
    backgroundColor: theme.colors.surface1,
    borderRadius: theme.spacing.borderRadius.lg,
    marginBottom: theme.spacing.margins.md,
    ...theme.shadow.sm,
  },
  cardAvatar: {
    marginRight: theme.spacing.margins.md,
    flexShrink: 0,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    marginBottom: theme.spacing.margins.sm,
  },
  cardDescription: {
    marginTop: 0,
  },
  listItem: {
    marginBottom: theme.spacing.margins.md,
  },
}));
