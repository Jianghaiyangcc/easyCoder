/**
 * Message Flow Animations
 * 
 * Advanced animations for message display with different effects
 * for different message types. Supports staggered entry and smooth transitions.
 * 
 * Usage:
 * ```tsx
 * import { MessageFlowAnimation, getMessageAnimation } from '@/animations/advanced';
 * 
 * <MessageFlowAnimation type="user">
 *   <MessageContent />
 * </MessageFlowAnimation>
 * 
 * <MessageFlowAnimation type="assistant">
 *   <AssistantContent />
 * </MessageFlowAnimation>
 * ```
 */

import React, { useMemo } from 'react';
import { View } from 'react-native';
import Animated, {
  FadeInUp,
  FadeIn,
  SlideInLeft,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { StyleSheet as UnistylesStyleSheet, useUnistyles } from 'react-native-unistyles';
import { MESSAGE_FLOW } from '../constants';

//
// Types
//

export type MessageAnimationType = 
  | 'user' 
  | 'assistant' 
  | 'tool' 
  | 'thought' 
  | 'permission';

export interface MessageFlowAnimationProps {
  /**
   * Type of message (determines animation)
   */
  type: MessageAnimationType;
  
  /**
   * Whether this is the first in a group
   */
  isFirstInGroup?: boolean;
  
  /**
   * Whether this is the last in a group
   */
  isLastInGroup?: boolean;
  
  /**
   * Custom animation duration
   */
  duration?: number;
  
  /**
   * Children content
   */
  children: React.ReactNode;
  
  /**
   * Custom style
   */
  style?: any;
  
  /**
   * Index in the message list (for staggered animation)
   */
  index?: number;
  
  /**
   * Whether to enable staggered animation
   * @default false
   */
  staggered?: boolean;
}

//
// Animation Configuration
//

/**
 * Get animation configuration by message type
 */
function getMessageAnimation(type: MessageAnimationType, duration?: number) {
  const animDuration = duration ?? MESSAGE_FLOW.DURATION[type] ?? MESSAGE_FLOW.DURATION.assistant;
  const easing = Easing.out(Easing.cubic);

  switch (type) {
    case 'user':
      return FadeInUp.duration(animDuration).easing(easing);
    
    case 'assistant':
      return FadeIn.duration(animDuration).easing(easing);
    
    case 'tool':
      return SlideInLeft.duration(animDuration).easing(easing);
    
    case 'thought':
      return FadeIn.duration(animDuration).easing(easing);
    
    case 'permission':
      return FadeIn.duration(animDuration).easing(easing);
    
    default:
      return FadeInUp.duration(animDuration).easing(easing);
  }
}

/**
 * Get stagger delay for message index
 */
function getStaggerDelay(index: number): number {
  return index * MESSAGE_FLOW.STAGGER_DELAY;
}

//
// Components
//

/**
 * Message Flow Animation Component
 * 
 * Provides appropriate animations for different message types.
 * Supports staggered animation for sequential message entry.
 */
export function MessageFlowAnimation({
  type,
  isFirstInGroup,
  isLastInGroup,
  duration,
  children,
  style,
  index = 0,
  staggered = false,
}: MessageFlowAnimationProps) {
  const { theme } = useUnistyles();

  // Calculate animation
  const animation = useMemo(() => {
    const baseAnimation = getMessageAnimation(type, duration);
    
    if (staggered && index > 0) {
      const delay = getStaggerDelay(index);
      return baseAnimation.delay(delay);
    }
    
    return baseAnimation;
  }, [type, duration, staggered, index]);

  // Calculate margin based on group position
  const marginBottom = useMemo(() => {
    const gap = theme.spacing.margins.md;
    
    if (isFirstInGroup && isLastInGroup) {
      return gap;
    }
    
    if (isFirstInGroup) {
      return gap;
    }
    
    if (isLastInGroup) {
      return gap;
    }
    
    return gap;
  }, [isFirstInGroup, isLastInGroup, theme.spacing.margins.md]);

  const containerStyle = useMemo(
    () => [
      styles.container,
      { marginBottom },
      style,
    ],
    [marginBottom, style]
  );

  return (
    <Animated.View
      style={containerStyle}
      entering={animation}
    >
      {children}
    </Animated.View>
  );
}

//
// Message List with Flow Animations
//

export interface MessageListProps {
  /**
   * Array of message items
   */
  messages: Array<{
    id: string;
    type: MessageAnimationType;
    isFirstInGroup?: boolean;
    isLastInGroup?: boolean;
    content: React.ReactNode;
  }>;
  
  /**
   * Whether to enable staggered animation
   * @default true
   */
  staggered?: boolean;
  
  /**
   * Custom style for container
   */
  style?: any;
}

/**
 * Message List Component
 * 
 * Renders a list of messages with appropriate flow animations.
 * Automatically handles grouping and staggered entry.
 */
export function MessageList({
  messages,
  staggered = true,
  style,
}: MessageListProps) {
  return (
    <View style={[styles.messageList, style]}>
      {messages.map((message, index) => (
        <MessageFlowAnimation
          key={message.id}
          type={message.type}
          isFirstInGroup={message.isFirstInGroup}
          isLastInGroup={message.isLastInGroup}
          index={index}
          staggered={staggered}
        >
          {message.content}
        </MessageFlowAnimation>
      ))}
    </View>
  );
}

//
// Grouped Messages Animation
//

export interface MessageGroupProps {
  /**
   * Group of messages (same type, consecutive)
   */
  messages: Array<{
    id: string;
    content: React.ReactNode;
  }>;
  
  /**
   * Type of messages in the group
   */
  type: MessageAnimationType;
  
  /**
   * Group identifier
   */
  groupId: string;
  
  /**
   * Custom style
   */
  style?: any;
}

/**
 * Message Group Component
 * 
 * Renders a group of consecutive messages of the same type
 * with compact spacing and shared animation.
 */
export function MessageGroup({
  messages,
  type,
  groupId,
  style,
}: MessageGroupProps) {
  const { theme } = useUnistyles();

  const containerStyle = useMemo(
    () => [
      styles.group,
      style,
    ],
    [style]
  );

  return (
    <Animated.View
      style={containerStyle}
      entering={getMessageAnimation(type)}
    >
      {messages.map((message, index) => {
        const isLast = index === messages.length - 1;
        const itemStyle = {
          marginBottom: isLast ? 0 : theme.spacing.margins.sm,
        };
        
        return (
          <View key={message.id} style={itemStyle}>
            {message.content}
          </View>
        );
      })}
    </Animated.View>
  );
}

//
// Message Input Animation
//

export interface MessageInputAnimationProps {
  /**
   * Children content
   */
  children: React.ReactNode;
  
  /**
   * Whether to show animation
   * @default true
   */
  animate?: boolean;
  
  /**
   * Custom style
   */
  style?: any;
}

/**
 * Message Input Animation Component
 * 
 * Provides subtle animation for message input area
 * when new messages are being sent.
 */
export function MessageInputAnimation({
  children,
  animate = true,
  style,
}: MessageInputAnimationProps) {
  const scale = useSharedValue(1);

  const handleAnimateIn = () => {
    scale.value = withTiming(1.02, {
      duration: 150,
      easing: Easing.out(Easing.cubic),
    });
    
    setTimeout(() => {
      scale.value = withTiming(1, {
        duration: 150,
        easing: Easing.out(Easing.cubic),
      });
    }, 150);
  };

  // Trigger animation when children change
  React.useEffect(() => {
    if (animate) {
      handleAnimateIn();
    }
  }, [children, animate]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  return (
    <Animated.View style={[animatedStyle, style]}>
      {children}
    </Animated.View>
  );
}

//
// Message Action Animation
//

export interface MessageActionProps {
  /**
   * Children content (typically action buttons)
   */
  children: React.ReactNode;
  
  /**
   * Whether actions are visible
   */
  visible: boolean;
  
  /**
   * Custom style
   */
  style?: any;
}

/**
 * Message Action Animation Component
 * 
 * Provides fade-in animation for message actions (copy, edit, delete, etc.)
 */
export function MessageAction({
  children,
  visible,
  style,
}: MessageActionProps) {
  const opacity = useSharedValue(visible ? 1 : 0);

  React.useEffect(() => {
    opacity.value = withTiming(visible ? 1 : 0, {
      duration: 200,
      easing: Easing.out(Easing.cubic),
    });
  }, [visible, opacity]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
    };
  });

  return (
    <Animated.View style={[styles.actions, animatedStyle, style]}>
      {children}
    </Animated.View>
  );
}

//
// Styles
//

const styles = UnistylesStyleSheet.create((theme) => ({
  container: {
    width: '100%',
  },
  messageList: {
    width: '100%',
  },
  group: {
    width: '100%',
    marginBottom: theme.spacing.margins.md,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.margins.sm,
  },
}));
