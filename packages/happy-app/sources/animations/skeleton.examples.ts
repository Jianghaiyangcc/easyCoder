/**
 * Skeleton Components - Usage Examples
 * 
 * This file demonstrates various ways to use the skeleton loading components
 */

console.log('=== Skeleton Components Usage Examples ===\n');

const example1 = `
// Basic skeleton
import { Skeleton } from '@/animations/skeleton';

<Skeleton width={100} height={20} />
<Skeleton width="100%" height={20} />
<Skeleton width={200} height={100} borderRadius={8} />
`;

const example2 = `
// Text skeleton with multiple lines
import { SkeletonText } from '@/animations/skeleton';

<SkeletonText lines={3} />
<SkeletonText lines={5} lineHeight={18} gap={10} />
<SkeletonText 
  lines={2} 
  lineHeight={14} 
  lastLineWidth="50%" 
/>
`;

const example3 = `
// Avatar skeleton
import { SkeletonAvatar } from '@/animations/skeleton';

<SkeletonAvatar size={40} />
<SkeletonAvatar size={60} />
<SkeletonAvatar size={24} />
`;

const example4 = `
// Card skeleton
import { SkeletonCard } from '@/animations/skeleton';

<SkeletonCard />
<SkeletonCard showAvatar={false} />
<SkeletonCard showDescription={false} />
<SkeletonCard showAvatar={false} showTitle={false} />
`;

const example5 = `
// List skeleton
import { SkeletonList } from '@/animations/skeleton';

<SkeletonList items={5} />
<SkeletonList items={3} itemProps={{ showAvatar: false }} />
`;

const example6 = `
// Rect skeleton (for images/videos)
import { SkeletonRect } from '@/animations/skeleton';

<SkeletonRect width="100%" height={200} />
<SkeletonRect width={300} height={200} borderRadius={12} />
`;

const example7 = `
// Circle skeleton (for icons/badges)
import { SkeletonCircle } from '@/animations/skeleton';

<SkeletonCircle size={24} />
<SkeletonCircle size={16} />
<SkeletonCircle size={32} />
`;

const example8 = `
// User profile loading state
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
`;

const example9 = `
// Message list loading state
function MessageListSkeleton() {
  return (
    <View style={styles.container}>
      <SkeletonList items={5} />
    </View>
  );
}
`;

const example10 = `
// Card grid loading state
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
`;

const example11 = `
// Feed loading state
function FeedSkeleton() {
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <SkeletonAvatar size={40} style={styles.headerAvatar} />
        <Skeleton width={120} height={16} />
      </View>
      
      {/* Image */}
      <SkeletonRect width="100%" height={300} style={styles.image} />
      
      {/* Actions */}
      <View style={styles.actions}>
        <SkeletonCircle size={24} />
        <SkeletonCircle size={24} />
        <SkeletonCircle size={24} />
      </View>
      
      {/* Caption */}
      <SkeletonText lines={2} style={styles.caption} />
    </View>
  );
}
`;

const example12 = `
// Settings page loading state
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
`;

const example13 = `
// Dashboard loading state
function DashboardSkeleton() {
  return (
    <View style={styles.container}>
      {/* Stats cards */}
      <View style={styles.statsRow}>
        {[1, 2, 3, 4].map((index) => (
          <View key={index} style={styles.statCard}>
            <SkeletonCircle size={32} />
            <Skeleton width={80} height={24} style={styles.statValue} />
            <Skeleton width={100} height={14} style={styles.statLabel} />
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
`;

const example14 = `
// Table loading state
function TableSkeleton() {
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.tableHeader}>
        {[1, 2, 3, 4].map((index) => (
          <Skeleton 
            key={index} 
            width={100} 
            height={20} 
            style={styles.headerCell} 
          />
        ))}
      </View>
      
      {/* Rows */}
      {Array.from({ length: 5 }).map((_, rowIndex) => (
        <View key={rowIndex} style={styles.tableRow}>
          {[1, 2, 3, 4].map((_, cellIndex) => (
            <Skeleton 
              key={cellIndex} 
              width={80} 
              height={16} 
              style={styles.tableCell} 
            />
          ))}
        </View>
      ))}
    </View>
  );
}
`;

const example15 = `
// Form loading state
function FormSkeleton() {
  return (
    <View style={styles.container}>
      <Skeleton width={200} height={28} style={styles.title} />
      <SkeletonText lines={1} style={styles.description} />
      
      <View style={styles.form}>
        {/* Input fields */}
        <View style={styles.field}>
          <Skeleton width={100} height={14} style={styles.label} />
          <Skeleton width="100%" height={40} borderRadius={4} />
        </View>
        
        <View style={styles.field}>
          <Skeleton width={80} height={14} style={styles.label} />
          <Skeleton width="100%" height={40} borderRadius={4} />
        </View>
        
        <View style={styles.field}>
          <Skeleton width={120} height={14} style={styles.label} />
          <Skeleton width="100%" height={100} borderRadius={4} />
        </View>
        
        {/* Submit button */}
        <Skeleton width={120} height={40} borderRadius={4} />
      </View>
    </View>
  );
}
`;

console.log('1. Basic Skeleton:');
console.log(example1);

console.log('\n2. Text Skeleton:');
console.log(example2);

console.log('\n3. Avatar Skeleton:');
console.log(example3);

console.log('\n4. Card Skeleton:');
console.log(example4);

console.log('\n5. List Skeleton:');
console.log(example5);

console.log('\n6. Rect Skeleton:');
console.log(example6);

console.log('\n7. Circle Skeleton:');
console.log(example7);

console.log('\n8. User Profile:');
console.log(example8);

console.log('\n9. Message List:');
console.log(example9);

console.log('\n10. Card Grid:');
console.log(example10);

console.log('\n11. Feed:');
console.log(example11);

console.log('\n12. Settings Page:');
console.log(example12);

console.log('\n13. Dashboard:');
console.log(example13);

console.log('\n14. Table:');
console.log(example14);

console.log('\n15. Form:');
console.log(example15);

console.log('\n=== Key Features ===');
console.log('✓ Multiple skeleton variants');
console.log('✓ Text, Avatar, Card, List, Rect, Circle');
console.log('✓ Customizable dimensions');
console.log('✓ Smooth shimmer animation');
console.log('✓ Theme-aware colors');
console.log('✓ Easy to compose complex layouts');
console.log('✓ Performance optimized');
console.log('✓ TypeScript support');

console.log('\n=== Best Practices ===');
console.log('1. Match skeleton dimensions to actual content');
console.log('2. Use appropriate skeleton type for content');
console.log('3. Keep animation duration between 1000-2000ms');
console.log('4. Provide meaningful loading state text');
console.log('5. Test on both light and dark themes');
console.log('6. Replace with actual content when loaded');
console.log('7. Use skeleton for initial load, not for updates');

console.log('\n=== Component Selection Guide ===');
console.log('Text content: SkeletonText');
console.log('User avatars: SkeletonAvatar');
console.log('Cards: SkeletonCard');
console.log('Lists: SkeletonList');
console.log('Images/Videos: SkeletonRect');
console.log('Icons/Badges: SkeletonCircle');
console.log('Simple rectangles: Skeleton');

console.log('\n=== Performance Tips ===');
console.log('✓ Uses Reanimated for smooth animation');
console.log('✓ Minimal re-renders');
console.log('✓ Proper cleanup on unmount');
console.log('✓ Memoized components where appropriate');
console.log('✓ Efficient layout calculations');
