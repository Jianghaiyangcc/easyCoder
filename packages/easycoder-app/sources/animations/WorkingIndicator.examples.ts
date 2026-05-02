/**
 * WorkingIndicator Usage Examples
 * 
 * This file demonstrates various ways to use the WorkingIndicator component
 */

console.log('=== WorkingIndicator Usage Examples ===\n');

const example1 = `
// Basic usage - default medium size
<WorkingIndicator />
`;

const example2 = `
// Small size for compact spaces
<WorkingIndicator size="small" />
`;

const example3 = `
// Large size for prominent display
<WorkingIndicator size="large" />
`;

const example4 = `
// Custom color
<WorkingIndicator color="#007AFF" />
`;

const example5 = `
// With theme color
<WorkingIndicator color={theme.colors.accent} />
`;

const example6 = `
// In a loading state
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
`;

const example7 = `
// In a message bubble
function MessageBubble({ isTyping }) {
  const { theme } = useStyles();
  
  return (
    <View style={styles.messageBubble}>
      {isTyping ? (
        <WorkingIndicator 
          size="small" 
          color={theme.colors.foregroundMuted} 
        />
      ) : (
        <Text style={styles.messageText}>Hello!</Text>
      )}
    </View>
  );
}
`;

const example8 = `
// In a status bar
function StatusBar({ status }) {
  const { theme } = useStyles();
  
  return (
    <View style={styles.statusBar}>
      <Text style={styles.statusText}>{status}</Text>
      {status === 'loading' && (
        <WorkingIndicator 
          size="small" 
          color={theme.colors.accent} 
        />
      )}
    </View>
  );
}
`;

const example9 = `
// With custom styling
function CustomLoadingIndicator() {
  return (
    <View style={styles.customContainer}>
      <WorkingIndicator 
        size="large"
        color="#FF6B6B"
        style={styles.indicator}
      />
      <Text style={styles.loadingText}>Loading...</Text>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  customContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.margins.md,
    padding: theme.spacing.margins.lg,
    backgroundColor: theme.colors.surface2,
    borderRadius: theme.spacing.borderRadius.lg,
  },
  indicator: {
    marginRight: theme.spacing.margins.sm,
  },
  loadingText: {
    color: theme.colors.foreground,
    fontSize: 16,
  },
}));
`;

const example10 = `
// In a card with loading state
function DataCard({ data, isLoading }) {
  const { theme } = useStyles();
  
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>Data</Text>
        {isLoading && (
          <WorkingIndicator 
            size="small" 
            color={theme.colors.accent} 
          />
        )}
      </View>
      
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <WorkingIndicator size="medium" />
          <Text style={styles.loadingText}>Loading data...</Text>
        </View>
      ) : (
        <Text style={styles.cardContent}>{data}</Text>
      )}
    </View>
  );
}
`;

console.log('1. Basic Usage:');
console.log(example1);

console.log('\n2. Small Size:');
console.log(example2);

console.log('\n3. Large Size:');
console.log(example3);

console.log('\n4. Custom Color:');
console.log(example4);

console.log('\n5. Theme Color:');
console.log(example5);

console.log('\n6. Loading Button:');
console.log(example6);

console.log('\n7. Message Bubble:');
console.log(example7);

console.log('\n8. Status Bar:');
console.log(example8);

console.log('\n9. Custom Styling:');
console.log(example9);

console.log('\n10. Data Card:');
console.log(example10);

console.log('\n=== Key Features ===');
console.log('✓ Three sizes: small, medium, large');
console.log('✓ Customizable color');
console.log('✓ Smooth animation with Reanimated');
console.log('✓ Performance optimized (useNativeDriver)');
console.log('✓ Cleanup on unmount');
console.log('✓ TypeScript support');
console.log('✓ Test ID support');

console.log('\n=== Animation Details ===');
console.log('- Cycle duration: 1200ms');
console.log('- Dot offsets: [0, 0.125, 0.25]');
console.log('- Opacity range: 0.3 to 1.0');
console.log('- Translation: varies by size');
console.log('- Easing: linear for smooth looping');

console.log('\n=== Best Practices ===');
console.log('1. Use small size in compact spaces (buttons, badges)');
console.log('2. Use medium size for general loading states');
console.log('3. Use large size for prominent loading displays');
console.log('4. Always provide meaningful text alongside the indicator');
console.log('5. Use theme colors for consistency');
console.log('6. Test on both light and dark themes');
console.log('7. Ensure accessibility with appropriate labels');

console.log('\n=== Performance Tips ===');
console.log('✓ Uses Reanimated for 60fps performance');
console.log('✓ Automatic cleanup on unmount');
console.log('✓ Minimal re-renders with useAnimatedStyle');
console.log('✓ Memoized styles with useMemo');
console.log('✓ No JavaScript thread blocking');
