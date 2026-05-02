/**
 * Page Transitions - Usage Examples
 * 
 * This file demonstrates various ways to use the page transition animations
 */

console.log('=== Page Transitions Usage Examples ===\n');

const example1 = `
// Basic fade-up transition (default)
import { PageTransition } from '@/animations';

<PageTransition>
  <PageContent />
</PageTransition>
`;

const example2 = `
// Different transition types
<PageTransition type="fade">
  <PageContent />
</PageTransition>

<PageTransition type="fade-up">
  <PageContent />
</PageTransition>

<PageTransition type="fade-down">
  <PageContent />
</PageTransition>

<PageTransition type="slide-right">
  <PageContent />
</PageTransition>

<PageTransition type="slide-left">
  <PageContent />
</PageTransition>
`;

const example3 = `
// Custom duration
<PageTransition duration={300}>
  <PageContent />
</PageTransition>
`;

const example4 = `
// Disabled transition
<PageTransition enabled={false}>
  <PageContent />
</PageTransition>
`;

const example5 = `
// Platform-specific transition (automatic)
import { getPlatformTransition } from '@/animations';

// On web: slide transition
// On mobile: fade transition
const transition = getPlatformTransition();
`;

const example6 = `
// Staggered children animation
import { StaggeredChildren } from '@/animations';

<StaggeredChildren staggerDelay={50} duration={200}>
  <Card>Item 1</Card>
  <Card>Item 2</Card>
  <Card>Item 3</Card>
  <Card>Item 4</Card>
</StaggeredChildren>
`;

const example7 = `
// Using with navigation screens
import { PageTransition } from '@/animations';

function MyScreen() {
  return (
    <PageTransition type="slide-right">
      <ScreenContent />
    </PageTransition>
  );
}
`;

const example8 = `
// Card list with staggered animation
function CardList({ items }) {
  const { theme } = useStyles();
  
  return (
    <StaggeredChildren 
      staggerDelay={30}
      duration={200}
      type="fade-up"
      style={styles.container}
    >
      {items.map((item, index) => (
        <Card key={index} data={item} />
      ))}
    </StaggeredChildren>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    padding: theme.spacing.margins.md,
    gap: theme.spacing.margins.md,
  },
}));
`;

const example9 = `
// Modal with fade transition
import { PageTransition } from '@/animations';

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
`;

const example10 = `
// Custom transition configuration
import { 
  createFadeTransition,
  createSlideRightTransition,
} from '@/animations';

// Custom fade transition
const customFade = createFadeTransition(300);

// Custom slide transition
const customSlide = createSlideRightTransition(250);

// Usage
<Animated.View entering={customFade.entering} exiting={customFade.exiting}>
  <Content />
</Animated.View>
`;

const example11 = `
// Using presets directly
import { PageTransitionPresets } from '@/animations';

<Animated.View entering={PageTransitionPresets.fadeInUp}>
  <Content />
</Animated.View>
`;

const example12 = `
// Backward navigation with slide-left
function BackButton({ onPress }) {
  return (
    <Pressable onPress={onPress}>
      <Icon name="arrow-left" />
    </Pressable>
  );
}

function DetailScreen({ onBack }) {
  return (
    <PageTransition type="slide-left">
      <View>
        <BackButton onPress={onBack} />
        <DetailContent />
      </View>
    </PageTransition>
  );
}
`;

const example13 = `
// Loading state with transition
function LoadingScreen({ isLoading, children }) {
  return (
    <PageTransition type="fade" enabled={!isLoading}>
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <WorkingIndicator size="large" />
          <Text>Loading...</Text>
        </View>
      ) : (
        children
      )}
    </PageTransition>
  );
}
`;

const example14 = `
// Tab content transitions
function TabContent({ activeTab, children }) {
  return (
    <PageTransition key={activeTab} type="fade-up">
      {children}
    </PageTransition>
  );
}

// In tabs component
<TabView>
  <TabContent activeTab={activeTab}>
    <Tab1Content />
  </TabContent>
  <TabContent activeTab={activeTab}>
    <Tab2Content />
  </TabContent>
</TabView>
`;

const example15 = `
// List items with staggered animation
function MessageList({ messages }) {
  return (
    <StaggeredChildren 
      staggerDelay={40}
      duration={200}
      type="fade-up"
    >
      {messages.map((msg, index) => (
        <MessageBubble 
          key={msg.id}
          message={msg}
          isOwn={msg.isOwn}
        />
      ))}
    </StaggeredChildren>
  );
}
`;

console.log('1. Basic Usage:');
console.log(example1);

console.log('\n2. Different Transition Types:');
console.log(example2);

console.log('\n3. Custom Duration:');
console.log(example3);

console.log('\n4. Disabled Transition:');
console.log(example4);

console.log('\n5. Platform-Specific Transition:');
console.log(example5);

console.log('\n6. Staggered Children Animation:');
console.log(example6);

console.log('\n7. Navigation Screens:');
console.log(example7);

console.log('\n8. Card List:');
console.log(example8);

console.log('\n9. Modal with Fade:');
console.log(example9);

console.log('\n10. Custom Transition Configuration:');
console.log(example10);

console.log('\n11. Using Presets:');
console.log(example11);

console.log('\n12. Backward Navigation:');
console.log(example12);

console.log('\n13. Loading State:');
console.log(example13);

console.log('\n14. Tab Content:');
console.log(example14);

console.log('\n15. Message List:');
console.log(example15);

console.log('\n=== Key Features ===');
console.log('✓ Multiple transition types (fade, slide)');
console.log('✓ Platform-specific transitions (automatic)');
console.log('✓ Customizable duration');
console.log('✓ Staggered children animation');
console.log('✓ Easy to use with PageTransition component');
console.log('✓ Direct access to Reanimated animations');
console.log('✓ Performance optimized (native driver)');
console.log('✓ TypeScript support');

console.log('\n=== Best Practices ===');
console.log('1. Use slide transitions for navigation (web)');
console.log('2. Use fade transitions for modals and overlays');
console.log('3. Use staggered animations for lists and cards');
console.log('4. Keep duration short (150-300ms) for snappy feel');
console.log('5. Disable transitions for sensitive operations');
console.log('6. Test on both light and dark themes');
console.log('7. Ensure accessibility with proper labels');

console.log('\n=== Performance Tips ===');
console.log('✓ Uses Reanimated for 60fps performance');
console.log('✓ Native driver for transform and opacity');
console.log('✓ Minimal re-renders');
console.log('✓ Proper cleanup on unmount');
console.log('✓ No JavaScript thread blocking');

console.log('\n=== Transition Guidelines ===');
console.log('Forward navigation: slide-right');
console.log('Backward navigation: slide-left');
console.log('Modals: fade');
console.log('Lists: fade-up with stagger');
console.log('Tabs: fade-up');
console.log('Loading: fade');
