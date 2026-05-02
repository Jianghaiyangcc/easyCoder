/**
 * Advanced Animations - Main Entry Point
 * 
 * This module exports all advanced animation components for the application.
 * 
 * Components:
 * - SidebarAnimation: Sidebar with open/close animations
 * - ResizableSidebar: Desktop sidebar with resize handle
 * - MessageFlowAnimation: Message entry animations
 * - MessageList: List with staggered message animations
 * - MessageGroup: Grouped messages with compact spacing
 * - MessageInputAnimation: Input area animation
 * - MessageAction: Action buttons fade-in animation
 * - PressableButton: Button with scale animation
 * - AnimatedInput: Input with focus animation
 * - HoverableCard: Card with hover lift effect
 * - AnimatedSwitch: Toggle switch with smooth animation
 * - CopySuccessAnimation: Checkmark animation for copy success
 * 
 * Usage:
 * ```typescript
 * import { 
 *   SidebarAnimation,
 *   MessageFlowAnimation,
 *   PressableButton,
 *   AnimatedInput,
 *   HoverableCard,
 * } from '@/animations/advanced';
 * 
 * <SidebarAnimation isOpen={isOpen} onClose={onClose} width={width}>
 *   <SidebarContent />
 * </SidebarAnimation>
 * 
 * <MessageFlowAnimation type="user">
 *   <MessageContent />
 * </MessageFlowAnimation>
 * ```
 */

// Export sidebar components
export { SidebarAnimation, ResizableSidebar } from './sidebar-animation';
export type { SidebarAnimationProps, ResizableSidebarProps } from './sidebar-animation';

// Export message flow components
export { 
  MessageFlowAnimation,
  MessageList,
  MessageGroup,
  MessageInputAnimation,
  MessageAction,
} from './message-flow';
export type { 
  MessageFlowAnimationProps,
  MessageListProps,
  MessageGroupProps,
  MessageInputAnimationProps,
  MessageActionProps,
} from './message-flow';

// Export micro-interaction components
export { 
  PressableButton,
  AnimatedInput,
  HoverableCard,
  AnimatedSwitch,
  CopySuccessAnimation,
} from './micro-interactions';
export type { 
  PressableButtonProps,
  AnimatedInputProps,
  HoverableCardProps,
  AnimatedSwitchProps,
  CopySuccessAnimationProps,
} from './micro-interactions';
