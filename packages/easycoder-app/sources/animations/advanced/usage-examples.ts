/**
 * Advanced Animations - Usage Examples
 * 
 * This file demonstrates various ways to use the advanced animation components
 */

console.log('=== Advanced Animations Usage Examples ===\n');

const example1 = `
// Basic sidebar animation
import { SidebarAnimation } from '@/animations/advanced';

<SidebarAnimation 
  isOpen={isOpen} 
  width={280}
  onClose={handleClose}
>
  <SidebarContent />
</SidebarAnimation>
`;

const example2 = `
// Resizable sidebar (desktop)
import { ResizableSidebar } from '@/animations/advanced';

<ResizableSidebar
  isOpen={isOpen}
  width={sidebarWidth}
  onClose={handleClose}
  onWidthChange={handleWidthChange}
  minWidth={240}
  maxWidth={400}
>
  <SidebarContent />
</ResizableSidebar>
`;

const example3 = `
// Message flow animation
import { MessageFlowAnimation } from '@/animations/advanced';

<MessageFlowAnimation type="user">
  <UserMessage text="Hello!" />
</MessageFlowAnimation>

<MessageFlowAnimation type="assistant">
  <AssistantMessage text="Hi there!" />
</MessageFlowAnimation>

<MessageFlowAnimation type="tool">
  <ToolCall name="read_file" />
</MessageFlowAnimation>

<MessageFlowAnimation type="permission">
  <PermissionRequest />
</MessageFlowAnimation>
`;

const example4 = `
// Message list with staggered animation
import { MessageList } from '@/animations/advanced';

<MessageList 
  messages={messages}
  staggered={true}
/>
`;

const example5 = `
// Grouped messages
import { MessageGroup } from '@/animations/advanced';

<MessageGroup
  groupId="group-1"
  type="assistant"
  messages={[
    { id: '1', content: <AssistantMessage text="Part 1" /> },
    { id: '2', content: <AssistantMessage text="Part 2" /> },
    { id: '3', content: <AssistantMessage text="Part 3" /> },
  ]}
/>
`;

const example6 = `
// Pressable button with animation
import { PressableButton } from '@/animations/advanced';

<PressableButton onPress={handleSubmit}>
  <Text>Submit</Text>
</PressableButton>

<PressableButton 
  onPress={handleDelete}
  style={styles.deleteButton}
>
  <Text>Delete</Text>
</PressableButton>
`;

const example7 = `
// Animated input with focus effect
import { AnimatedInput } from '@/animations/advanced';

<AnimatedInput
  placeholder="Type your message..."
  animateFocus={true}
  style={styles.input}
/>
`;

const example8 = `
// Hoverable card with animation
import { HoverableCard } from '@/animations/advanced';

<HoverableCard onPress={handleCardPress}>
  <CardTitle>Card Title</CardTitle>
  <CardDescription>Card description</CardDescription>
</HoverableCard>
`;

const example9 = `
// Animated switch
import { AnimatedSwitch } from '@/animations/advanced';

<AnimatedSwitch
  value={isEnabled}
  onValueChange={setIsEnabled}
  trackOnColor="#34C759"
  trackOffColor="#3a3a3f"
  thumbOnColor="#ffffff"
  thumbOffColor="#767577"
/>
`;

const example10 = `
// Copy success animation
import { CopySuccessAnimation } from '@/animations/advanced';

function CopyableText({ text }) {
  const [copied, setCopied] = useState(false);
  
  const handleCopy = () => {
    Clipboard.setString(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  return (
    <View style={styles.container}>
      <Text>{text}</Text>
      <Pressable onPress={handleCopy}>
        <Icon name="copy" />
      </Pressable>
      <CopySuccessAnimation show={copied} style={styles.copyBadge} />
    </View>
  );
}
`;

const example11 = `
// Complete chat interface with all animations
import { 
  MessageList,
  MessageFlowAnimation,
  AnimatedInput,
  PressableButton,
} from '@/animations/advanced';

function ChatInterface() {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  
  const handleSend = () => {
    if (!inputText.trim()) return;
    
    const userMessage = {
      id: Date.now().toString(),
      type: 'user' as const,
      content: <UserMessage text={inputText} />,
    };
    
    setMessages([...messages, userMessage]);
    setInputText('');
    setIsSending(true);
    
    // Simulate assistant response
    setTimeout(() => {
      const assistantMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant' as const,
        content: <AssistantMessage text="I received your message!" />,
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      setIsSending(false);
    }, 1000);
  };
  
  return (
    <View style={styles.container}>
      {/* Messages */}
      <MessageList 
        messages={messages}
        staggered={true}
      />
      
      {/* Input area */}
      <View style={styles.inputArea}>
        <AnimatedInput
          value={inputText}
          onChangeText={setInputText}
          placeholder="Type a message..."
          multiline
          style={styles.input}
        />
        
        <PressableButton
          onPress={handleSend}
          disabled={!inputText.trim() || isSending}
          style={styles.sendButton}
        >
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
`;

const example12 = `
// Sidebar with navigation items
function AppSidebar({ isOpen, onClose }) {
  const [width, setWidth] = useState(280);
  
  return (
    <SidebarAnimation
      isOpen={isOpen}
      width={width}
      onClose={onClose}
      onWidthChange={setWidth}
      style={styles.sidebar}
    >
      <SidebarHeader />
      
      <SidebarContent>
        <NavigationItem icon="home" label="Home" />
        <NavigationItem icon="message" label="Messages" />
        <NavigationItem icon="settings" label="Settings" />
      </SidebarContent>
      
      <SidebarFooter />
    </SidebarAnimation>
  );
}
`;

const example13 = `
// Dashboard with hoverable cards
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
            <StatIcon name={stat.icon} size={32} />
            <StatValue>{stat.value}</StatValue>
            <StatLabel>{stat.label}</StatLabel>
          </HoverableCard>
        ))}
      </View>
      
      <HoverableCard style={styles.chartCard}>
        <ChartHeader title="Activity" />
        <ChartContent data={chartData} />
      </HoverableCard>
    </View>
  );
}
`;

const example14 = `
// Settings page with animated inputs and switches
function SettingsPage() {
  return (
    <PageTransition type="fade-up">
      <View style={styles.settings}>
        <SettingsHeader />
        
        <View style={styles.section}>
          <SectionTitle>Appearance</SectionTitle>
          
          <SettingRow>
            <SettingLabel>Dark Mode</SettingLabel>
            <AnimatedSwitch
              value={isDarkMode}
              onValueChange={setIsDarkMode}
            />
          </SettingRow>
          
          <SettingRow>
            <SettingLabel>Compact Mode</SettingLabel>
            <AnimatedSwitch
              value={isCompact}
              onValueChange={setIsCompact}
            />
          </SettingRow>
        </View>
        
        <View style={styles.section}>
          <SectionTitle>Notifications</SectionTitle>
          
          <SettingRow>
            <SettingLabel>Email Notifications</SettingLabel>
            <AnimatedSwitch
              value={emailEnabled}
              onValueChange={setEmailEnabled}
            />
          </SettingRow>
          
          <SettingRow>
            <SettingLabel>Push Notifications</SettingLabel>
            <AnimatedSwitch
              value={pushEnabled}
              onValueChange={setPushEnabled}
            />
          </SettingRow>
        </View>
      </View>
    </PageTransition>
  );
}
`;

const example15 = `
// File list with hoverable items
function FileList({ files }) {
  return (
    <View style={styles.fileList}>
      {files.map((file, index) => (
        <HoverableCard
          key={file.id}
          onPress={() => handleFilePress(file)}
          style={styles.fileItem}
          pressedStyle={styles.fileItemPressed}
        >
          <FileIcon name={file.icon} />
          <FileName>{file.name}</FileName>
          <FileSize>{file.size}</FileSize>
        </HoverableCard>
      ))}
    </View>
  );
}
`;

console.log('1. Basic Sidebar Animation:');
console.log(example1);

console.log('\n2. Resizable Sidebar (Desktop):');
console.log(example2);

console.log('\n3. Message Flow Animation:');
console.log(example3);

console.log('\n4. Message List with Stagger:');
console.log(example4);

console.log('\n5. Grouped Messages:');
console.log(example5);

console.log('\n6. Pressable Button:');
console.log(example6);

console.log('\n7. Animated Input:');
console.log(example7);

console.log('\n8. Hoverable Card:');
console.log(example8);

console.log('\n9. Animated Switch:');
console.log(example9);

console.log('\n10. Copy Success Animation:');
console.log(example10);

console.log('\n11. Complete Chat Interface:');
console.log(example11);

console.log('\n12. Sidebar with Navigation:');
console.log(example12);

console.log('\n13. Dashboard with Hoverable Cards:');
console.log(example13);

console.log('\n14. Settings Page:');
console.log(example14);

console.log('\n15. File List with Hoverable Items:');
console.log(example15);

console.log('\n=== Key Features ===');
console.log('✓ Sidebar with open/close animations');
console.log('✓ Resizable sidebar (desktop)');
console.log('✓ Message flow animations (5 types)');
console.log('✓ Staggered message entry');
console.log('✓ Grouped message support');
console.log('✓ Pressable button with scale');
console.log('✓ Animated input with focus');
console.log('✓ Hoverable card with lift');
console.log('✓ Animated switch with smooth thumb');
console.log('✓ Copy success checkmark');
console.log('✓ Platform-aware (web vs native)');

console.log('\n=== Best Practices ===');
console.log('1. Use appropriate animation type for content');
console.log('2. Keep animations short (100-300ms)');
console.log('3. Provide clear visual feedback');
console.log('4. Test on both light and dark themes');
console.log('5. Ensure accessibility with proper labels');
console.log('6. Use staggered animations for lists');
console.log('7. Balance performance with visual quality');

console.log('\n=== Performance Tips ===');
console.log('✓ All animations use Reanimated');
console.log('✓ Native thread for transforms');
console.log('✓ Minimal re-renders');
console.log('✓ Proper cleanup on unmount');
console.log('✓ Memoized styles and callbacks');
console.log('✓ Efficient layout calculations');

console.log('\n=== Platform Considerations ===');
console.log('Web: Hover effects, resize handles, slide transitions');
console.log('Native: Press effects, tap feedback, fade transitions');
console.log('Desktop: Fixed sidebar, width adjustment');
console.log('Mobile: Overlay sidebar, backdrop, swipe gestures');

console.log('\n=== Animation Guidelines ===');
console.log('Sidebar: Open/close (300ms), width adjustment (spring)');
console.log('Messages: User (fade-up), Assistant (fade), Tool (slide-left)');
console.log('Buttons: Press scale (0.98), Hover scale (1.02)');
console.log('Inputs: Focus border/shadow (200ms)');
console.log('Cards: Hover lift (translateY: -2), press scale (0.98)');
console.log('Switches: Thumb translateX (spring), scale (1.1)');
console.log('Copy: Checkmark zoom (150ms), fade out (2s)');
