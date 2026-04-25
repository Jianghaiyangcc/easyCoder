# Animation System

Modern animation system inspired by the Paseo project, providing smooth, performant animations throughout the application.

## Overview

The animation system includes:

- **WorkingIndicator**: Three-dot loading animation with smooth pulsing
- **PageTransition**: Page transition animations (fade, slide)
- **Skeleton**: Enhanced skeleton loading components
- **Animation Constants**: Centralized configuration for all animations
- **Helper Functions**: Utilities for creating animation configurations
- **Type Safety**: Full TypeScript support

## Components

### WorkingIndicator

A three-dot loading animation that pulses in sequence to indicate loading or processing state.

#### Props

```typescript
interface WorkingIndicatorProps {
  size?: 'small' | 'medium' | 'large';  // Default: 'medium'
  color?: string;                       // Optional custom color
  style?: any;                          // Optional custom style
  testID?: string;                      // For testing
}
```

#### Usage

```typescript
import { WorkingIndicator } from '@/animations';

// Basic usage
<WorkingIndicator />

// Different sizes
<WorkingIndicator size="small" />
<WorkingIndicator size="medium" />
<WorkingIndicator size="large" />

// Custom color
<WorkingIndicator color="#007AFF" />

// With theme color
<WorkingIndicator color={theme.colors.accent} />
```

#### In a Loading State

```typescript
function LoadingButton({ isLoading, onPress }) {
  return (
    <Pressable onPress={onPress} disabled={isLoading}>
      {isLoading ? (
        <WorkingIndicator size="small" />
      ) : (
        <Text>Submit</Text>
      )}
    </Pressable>
  );
}
```

## Constants

### WORKING_INDICATOR

Configuration for the working indicator animation.

```typescript
import { WORKING_INDICATOR } from '@/animations';

WORKING_INDICATOR.CYCLE_MS        // 1200 - Duration of one cycle
WORKING_INDICATOR.OFFSETS        // [0, 0.125, 0.25] - Dot time offsets
WORKING_INDICATOR.SIZES          // Size configurations
WORKING_INDICATOR.OPACITY        // Opacity range (0.3 to 1.0)
```

### PageTransition

Page transition animation component with multiple effects.

```typescript
import { PageTransition, StaggeredChildren } from '@/animations';

// Basic usage
<PageTransition type="fade-up">
  <PageContent />
</PageTransition>

// Different types
<PageTransition type="fade" />
<PageTransition type="fade-up" />
<PageTransition type="fade-down" />
<PageTransition type="slide-right" />
<PageTransition type="slide-left" />

// Staggered children
<StaggeredChildren staggerDelay={50} duration={200}>
  <Item1 />
  <Item2 />
  <Item3 />
</StaggeredChildren>

// Platform-specific (automatic)
import { getPlatformTransition } from '@/animations';
const transition = getPlatformTransition();
```

#### Props

```typescript
interface PageTransitionProps {
  type?: 'fade' | 'fade-up' | 'fade-down' | 'slide-right' | 'slide-left';
  duration?: number;  // Default: 200
  style?: AnimatedStyleProp<ViewStyle>;
  enabled?: boolean;  // Default: true
}
```

#### Usage in Navigation

```typescript
function MyScreen() {
  return (
    <PageTransition type="slide-right">
      <ScreenContent />
    </PageTransition>
  );
}
```

### Skeleton

Enhanced skeleton loading components with multiple variants.

```typescript
import { 
  Skeleton,
  SkeletonText,
  SkeletonAvatar,
  SkeletonCard,
  SkeletonList,
  SkeletonRect,
  SkeletonCircle,
} from '@/animations';

// Basic skeleton
<Skeleton width={100} height={20} />

// Text skeleton
<SkeletonText lines={3} />

// Avatar skeleton
<SkeletonAvatar size={40} />

// Card skeleton
<SkeletonCard />

// List skeleton
<SkeletonList items={5} />

// Rect skeleton (images/videos)
<SkeletonRect width="100%" height={200} />

// Circle skeleton (icons/badges)
<SkeletonCircle size={24} />
```

#### Props

```typescript
// Skeleton
interface SkeletonProps {
  width?: number | string;  // Default: '100%'
  height?: number;          // Default: 20
  borderRadius?: number;    // Default: 4
  style?: ViewStyle;
  duration?: number;
}

// SkeletonText
interface SkeletonTextProps {
  lines?: number;           // Default: 3
  lineHeight?: number;      // Default: 16
  gap?: number;             // Default: 8
  lastLineWidth?: number | string;
  style?: ViewStyle;
  duration?: number;
}

// SkeletonAvatar
interface SkeletonAvatarProps {
  size?: number;            // Default: 40
  style?: ViewStyle;
  duration?: number;
}

// SkeletonCard
interface SkeletonCardProps {
  style?: ViewStyle;
  showAvatar?: boolean;     // Default: true
  showTitle?: boolean;      // Default: true
  showDescription?: boolean;// Default: true
  duration?: number;
}

// SkeletonList
interface SkeletonListProps {
  items?: number;           // Default: 5
  style?: ViewStyle;
  ItemComponent?: React.ComponentType<any>;
  itemProps?: Record<string, any>;
}
```

#### Loading States

```typescript
// User profile loading
function UserProfileSkeleton() {
  return (
    <View>
      <SkeletonAvatar size={80} />
      <Skeleton width={150} height={24} />
      <SkeletonText lines={2} />
    </View>
  );
}

// Message list loading
function MessageListSkeleton() {
  return <SkeletonList items={5} />;
}

// Card grid loading
function CardGridSkeleton() {
  return (
    <View style={styles.grid}>
      {[1, 2, 3, 4].map((index) => (
        <SkeletonCard 
          key={index}
          showAvatar={false}
        />
      ))}
    </View>
  );
}
```

### PAGE_TRANSITION

Page transition configuration.

```typescript
import { PAGE_TRANSITION } from '@/animations';

PAGE_TRANSITION.DURATION    // 200 - Default duration
PAGE_TRANSITION.EASING     // 'easeInOut' - Easing function
PAGE_TRANSITION.TYPE        // Transition types
```

### SKELETON

Skeleton loading animation configuration.

```typescript
import { SKELETON } from '@/animations';

SKELETON.SHIMMER_DURATION  // 1500 - Shimmer cycle duration
SKELETON.OPACITY           // Opacity range
SKELETON.DIRECTION         // 'right' - Shimmer direction
```

### MICRO_INTERACTIONS

Micro-interaction configurations for buttons, inputs, and cards.

```typescript
import { MICRO_INTERACTIONS } from '@/animations';

MICRO_INTERACTIONS.BUTTON      // Button hover/scale animation
MICRO_INTERACTIONS.INPUT       // Input focus animation
MICRO_INTERACTIONS.CARD        // Card hover animation
```

### SIDEBAR

Sidebar animation configuration.

```typescript
import { SIDEBAR } from '@/animations';

SIDEBAR.DURATION      // 300 - Open/close duration
SIDEBAR.EASING       // 'easeInOut' - Easing function
SIDEBAR.WIDTH        // Width configuration
```

### MESSAGE_FLOW

Message flow animation configuration.

```typescript
import { MESSAGE_FLOW } from '@/animations';

MESSAGE_FLOW.DURATION       // Duration for different message types
MESSAGE_FLOW.EASING        // Easing for different message types
MESSAGE_FLOW.STAGGER_DELAY // 50 - Delay between consecutive messages
```

### GESTURE

Gesture animation configuration.

```typescript
import { GESTURE } from '@/animations';

GESTURE.DISMISS_THRESHOLD   // 0.3 - Swipe to dismiss threshold
GESTURE.VELOCITY_THRESHOLD   // 500 - Swipe velocity threshold
GESTURE.SPRING              // Spring configuration
```

## Helper Functions

### calculateAnimationStrength

Calculates the strength of an animation based on progress.

```typescript
import { calculateAnimationStrength } from '@/animations';

const strength = calculateAnimationStrength(0.5, 0.125);
// Returns a value between 0 and 1
```

### createSpringConfig

Creates a spring animation configuration.

```typescript
import { createSpringConfig } from '@/animations';

const spring = createSpringConfig(150, 15, 0.5);
// Returns { stiffness: 150, damping: 15, mass: 0.5 }
```

### createTimingConfig

Creates a timing animation configuration.

```typescript
import { createTimingConfig } from '@/animations';

const timing = createTimingConfig(200, 'easeOut');
// Returns { duration: 200, easing: 'easeOut' }
```

## Easing Functions

Common easing functions for animations.

```typescript
import { EASING } from '@/animations';

EASING.linear    // Linear easing
EASING.easeIn    // Ease in
EASING.easeOut   // Ease out
EASING.easeInOut // Ease in and out
```

## Duration Constants

Common duration values.

```typescript
import { DURATION } from '@/animations';

DURATION.instant  // 0
DURATION.fast     // 150
DURATION.normal   // 200
DURATION.slow     // 300
DURATION.slower   // 500
```

## Performance

All animations are optimized for 60fps performance:

- **Reanimated**: Uses React Native Reanimated for smooth animations
- **useNativeDriver**: Animations run on the native thread
- **Memoization**: Styles are memoized to prevent unnecessary re-renders
- **Cleanup**: Animations are properly cleaned up on unmount

## Best Practices

1. **Use Appropriate Sizes**
   - Small: Compact spaces (buttons, badges)
   - Medium: General loading states
   - Large: Prominent loading displays

2. **Provide Context**
   - Always include meaningful text alongside indicators
   - Use proper accessibility labels

3. **Use Theme Colors**
   - Maintain consistency across the app
   - Support both light and dark themes

4. **Test Performance**
   - Monitor animation frame rate
   - Test on different devices
   - Check for jank or stuttering

5. **Cleanup Properly**
   - Components automatically cleanup animations
   - For custom animations, use useEffect cleanup

## Page Transition Examples

### Navigation Screens

```typescript
function DetailScreen() {
  return (
    <PageTransition type="slide-right">
      <View>
        <BackButton />
        <DetailContent />
      </View>
    </PageTransition>
  );
}

function BackScreen() {
  return (
    <PageTransition type="slide-left">
      <ListContent />
    </PageTransition>
  );
}
```

### Modal Transitions

```typescript
function MyModal({ visible, onClose, children }) {
  if (!visible) return null;
  
  return (
    <Modal visible={visible} onRequestClose={onClose}>
      <PageTransition type="fade">
        <View style={styles.modalContent}>
          {children}
        </View>
      </PageTransition>
    </Modal>
  );
}
```

### Staggered Lists

```typescript
function CardList({ cards }) {
  return (
    <StaggeredChildren 
      staggerDelay={30}
      duration={200}
      type="fade-up"
    >
      {cards.map((card, index) => (
        <Card key={card.id} data={card} />
      ))}
    </StaggeredChildren>
  );
}
```

### Tab Content

```typescript
function TabContent({ activeTab, children }) {
  return (
    <PageTransition key={activeTab} type="fade-up">
      {children}
    </PageTransition>
  );
}
```

## Skeleton Examples

### User Profile Loading

```typescript
function UserProfileSkeleton() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <SkeletonAvatar size={80} style={styles.avatar} />
        <Skeleton width={150} height={24} borderRadius={4} />
      </View>
      <View style={styles.content}>
        <SkeletonText lines={2} />
        <SkeletonRect width="100%" height={150} style={styles.image} />
        <SkeletonText lines={4} />
      </View>
    </View>
  );
}
```

### Message List Loading

```typescript
function MessageListSkeleton() {
  return (
    <View style={styles.container}>
      <SkeletonList items={5} />
    </View>
  );
}
```

### Card Grid Loading

```typescript
function CardGridSkeleton() {
  return (
    <View style={styles.grid}>
      {[1, 2, 3, 4, 5, 6].map((index) => (
        <SkeletonCard 
          key={index} 
          style={styles.gridItem}
          showAvatar={false}
        />
      ))}
    </View>
  );
}
```

### Settings Page Loading

```typescript
function SettingsSkeleton() {
  return (
    <View style={styles.container}>
      <Skeleton width={200} height={28} style={styles.title} />
      <SkeletonText lines={1} style={styles.description} />
      
      <View style={styles.section}>
        {Array.from({ length: 4 }).map((_, index) => (
          <View key={index} style={styles.settingItem}>
            <SkeletonAvatar size={32} style={styles.icon} />
            <View style={styles.settingContent}>
              <Skeleton width={150} height={16} />
              <Skeleton width={200} height={14} style={styles.subtitle} />
            </View>
            <SkeletonCircle size={24} style={styles.toggle} />
          </View>
        ))}
      </View>
    </View>
  );
}
```

### Dashboard Loading

```typescript
function DashboardSkeleton() {
  return (
    <View style={styles.container}>
      {/* Stats cards */}
      <View style={styles.statsRow}>
        {[1, 2, 3, 4].map((index) => (
          <View key={index} style={styles.statCard}>
            <SkeletonCircle size={32} />
            <Skeleton width={80} height={24} style={styles.statValue} />
            <Skeleton width={100} height={14} style={stats.statLabel} />
          </View>
        ))}
      </View>
      
      {/* Chart */}
      <View style={styles.chartContainer}>
        <Skeleton width={150} height={20} style={styles.chartTitle} />
        <SkeletonRect width="100%" height={250} />
      </View>
      
      {/* Recent activity */}
      <View style={styles.activityContainer}>
        <Skeleton width={150} height={20} style={styles.activityTitle} />
        <SkeletonList items={3} itemProps={{ showAvatar: true }} />
      </View>
    </View>
  );
}
```

## Examples

### Loading Button

```typescript
function SubmitButton({ isLoading, onPress }) {
  const { theme } = useStyles();
  
  return (
    <Pressable
      onPress={onPress}
      disabled={isLoading}
      style={({ pressed }) => [
        styles.button,
        pressed && styles.buttonPressed,
        isLoading && styles.buttonDisabled,
      ]}
    >
      {isLoading ? (
        <WorkingIndicator 
          size="small" 
          color={theme.colors.surface0} 
        />
      ) : (
        <Text style={styles.buttonText}>Submit</Text>
      )}
    </Pressable>
  );
}
```

### Status Bar

```typescript
function StatusBar({ status, message }) {
  const { theme } = useStyles();
  
  return (
    <View style={styles.container}>
      <Text style={styles.message}>{message}</Text>
      {status === 'loading' && (
        <WorkingIndicator 
          size="small" 
          color={theme.colors.accent} 
        />
      )}
    </View>
  );
}
```

### Card Loading State

```typescript
function DataCard({ data, isLoading }) {
  const { theme } = useStyles();
  
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>Data</Text>
        {isLoading && (
          <WorkingIndicator 
            size="small" 
            color={theme.colors.accent} 
          />
        )}
      </View>
      
      <View style={styles.content}>
        {isLoading ? (
          <View style={styles.loadingState}>
            <WorkingIndicator size="medium" />
            <Text style={styles.loadingText}>Loading data...</Text>
          </View>
        ) : (
          <Text style={styles.data}>{data}</Text>
        )}
      </View>
    </View>
  );
}
```

## Advanced Animations

### SidebarAnimation

Sidebar with smooth open/close animations for both mobile and desktop.

```typescript
import { SidebarAnimation, ResizableSidebar } from '@/animations';

// Basic sidebar
<SidebarAnimation 
  isOpen={isOpen} 
  width={280}
  onClose={handleClose}
>
  <SidebarContent />
</SidebarAnimation>

// Resizable sidebar (desktop)
<ResizableSidebar
  isOpen={isOpen}
  width={sidebarWidth}
  onClose={onClose}
  onWidthChange={handleWidthChange}
  minWidth={240}
  maxWidth={400}
>
  <SidebarContent />
</ResizableSidebar>
```

#### Features
- Mobile: Overlay with backdrop and swipe gestures
- Desktop: Fixed sidebar with width adjustment
- Smooth 300ms transitions
- Spring-based width adjustment
- Platform-aware behavior

### Message Flow Animations

Different animations for different message types.

```typescript
import { 
  MessageFlowAnimation,
  MessageList,
  MessageGroup,
} from '@/animations';

// Individual message animation
<MessageFlowAnimation type="user">
  <UserMessage text="Hello!" />
</MessageFlowAnimation>

<MessageFlowAnimation type="assistant">
  <AssistantMessage text="Hi there!" />
</MessageFlowAnimation>

<MessageFlowAnimation type="tool">
  <ToolCall name="read_file" />
</MessageFlowAnimation>

// Message list with staggered animation
<MessageList 
  messages={messages}
  staggered={true}
/>

// Grouped messages (same type, consecutive)
<MessageGroup
  groupId="group-1"
  type="assistant"
  messages={[
    { id: '1', content: <AssistantMessage text="Part 1" /> },
    { id: '2', content: <AssistantMessage text="Part 2" /> },
  ]}
/>
```

#### Message Types
- `user`: FadeInUp (from bottom)
- `assistant`: FadeIn (in place)
- `tool`: SlideInLeft (from left)
- `thought`: FadeIn (subtle)
- `permission`: ScaleIn (with bounce)

### Micro-Interactions

Subtle animations for interactive components.

```typescript
import { 
  PressableButton,
  AnimatedInput,
  HoverableCard,
  AnimatedSwitch,
  CopySuccessAnimation,
} from '@/animations';

// Animated button
<PressableButton onPress={handleSubmit}>
  <Text>Submit</Text>
</PressableButton>

// Animated input
<AnimatedInput
  placeholder="Type here..."
  animateFocus={true}
/>

// Hoverable card
<HoverableCard onPress={handleCardPress}>
  <CardContent />
</HoverableCard>

// Animated switch
<AnimatedSwitch
  value={isEnabled}
  onValueChange={setIsEnabled}
/>

// Copy success animation
<CopySuccessAnimation show={copied} />
```

#### Component Features
- **PressableButton**: Scale animation on press (0.98)
- **AnimatedInput**: Border and shadow animation on focus
- **HoverableCard**: Lift effect on hover (-2px Y)
- **AnimatedSwitch**: Smooth thumb animation with scale
- **CopySuccessAnimation**: Checkmark zoom and fade

### Advanced Examples

#### Complete Chat Interface

```typescript
function ChatInterface() {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  
  const handleSend = () => {
    const userMessage = {
      id: Date.now().toString(),
      type: 'user' as const,
      content: <UserMessage text={inputText} />,
    };
    
    setMessages([...messages, userMessage]);
    setInputText('');
    setIsSending(true);
    
    setTimeout(() => {
      const assistantMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant' as const,
        content: <AssistantMessage text="Response!" />,
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      setIsSending(false);
    }, 1000);
  };
  
  return (
    <View style={styles.container}>
      <MessageList messages={messages} staggered={true} />
      
      <View style={styles.inputArea}>
        <AnimatedInput
          value={inputText}
          onChangeText={setInputText}
          placeholder="Type a message..."
          multiline
          style={styles.input}
        />
        
        <PressableButton onPress={handleSend}>
          {isSending ? (
            <WorkingIndicator size="small" color="#fff" />
          ) : (
            <Icon name="send" color="#fff" />
          )}
        </PressableButton>
      </View>
    </View>
  );
}
```

#### Dashboard with Hoverable Cards

```typescript
function Dashboard() {
  return (
    <View style={styles.dashboard}>
      <View style={styles.statsRow}>
        {stats.map((stat, index) => (
          <HoverableCard
            key={index}
            onPress={() => handleStatPress(stat)}
            style={styles.statCard}
          >
            <StatIcon name={stat.icon} />
            <StatValue>{stat.value}</StatValue>
            <StatLabel>{stat.label}</StatLabel>
          </HoverableCard>
        ))}
      </View>
    </View>
  );
}
```

## Migration Guide

If you're migrating from old loading indicators:

1. **Replace Old Components**
   ```typescript
   // Old
   <ActivityIndicator />
   
   // New
   <WorkingIndicator />
   ```

2. **Update Sizes**
   ```typescript
   // Old
   size="small" | "large"
   
   // New
   size="small" | "medium" | "large"
   ```

3. **Use Theme Colors**
   ```typescript
   // Old
   color="#999"
   
   // New
   color={theme.colors.foregroundMuted}
   ```

## Future Enhancements

Planned additions to the animation system:

- [x] Page transition components ✅
- [x] Enhanced skeleton screen animations ✅
- [x] Sidebar animation component ✅
- [x] Message flow animations ✅
- [x] Micro-interaction components ✅
- [ ] Gesture animation utilities (partially done in sidebar)
- [ ] Animation presets
- [ ] Performance monitoring tools

## Support

For questions or issues:
1. Check this README for usage examples
2. Review the component source code
3. Consult the animation constants
4. Test on different devices and themes
