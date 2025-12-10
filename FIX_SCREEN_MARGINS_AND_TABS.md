# Fix Screen Margins and Tab Bar Positioning

## Issues to Fix:
1. ✅ Tab bar too close to bottom edge - hard to tap
2. ✅ Content hidden behind top camera notch
3. ✅ Screens need proper margins for full scrollability
4. ✅ FAB button needs to be repositioned with new tab bar

## Changes Required:

### 1. MainTabNavigator.tsx - Raise Tab Bar

**File**: `src/navigation/MainTabNavigator.tsx`

**Line 34-42** - Update tabBarStyle:
```typescript
tabBarStyle: {
  position: 'absolute',
  backgroundColor: Platform.OS === 'ios' ? 'transparent' : Colors.backgroundSecondary,
  borderTopWidth: 1,
  borderTopColor: Colors.border,
  elevation: 0,
  height: 70,  // WAS: 60
  paddingBottom: Platform.OS === 'ios' ? 20 : 12,  // WAS: 8
  paddingTop: 8,
  bottom: Platform.OS === 'ios' ? 0 : 8,  // ADD THIS LINE
},
```

**Line 129** - Update FAB bottom position:
```typescript
fab: {
  position: 'absolute',
  bottom: Platform.OS === 'ios' ? 90 : 90,  // WAS: 80
  right: 20,
  // ... rest stays the same
},
```

### 2. Add Safe Area Wrapper Component

**Create new file**: `src/components/common/SafeScrollView.tsx`

```typescript
import React, { ReactNode } from 'react';
import { ScrollView, ScrollViewProps, StyleSheet, Platform } from 'react-native';
import { SafeAreaView, Edge } from 'react-native-safe-area-context';

interface SafeScrollViewProps extends ScrollViewProps {
  children: ReactNode;
  edges?: Edge[];
}

/**
 * Wrapper component that ensures content is properly:
 * - Below the top camera notch/status bar
 * - Above the bottom tab bar
 * - Fully scrollable with proper padding
 */
export default function SafeScrollView({
  children,
  edges = ['top'],
  contentContainerStyle,
  ...props
}: SafeScrollViewProps) {
  return (
    <SafeAreaView
      style={styles.container}
      edges={edges}
    >
      <ScrollView
        {...props}
        contentContainerStyle={[
          styles.contentContainer,
          contentContainerStyle,
        ]}
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: Platform.OS === 'ios' ? 100 : 110, // Space for tab bar + FAB
    paddingHorizontal: 0, // Let child screens control horizontal padding
  },
});
```

### 3. Update All Main Screens to Use SafeScrollView

#### DashboardScreen.tsx

**Change**:
```typescript
// OLD:
return (
  <ScrollView style={styles.container} refreshControl={...}>
    {/* content */}
  </ScrollView>
);

// NEW:
import SafeScrollView from '../../components/common/SafeScrollView';

return (
  <SafeScrollView
    style={styles.container}
    refreshControl={...}
    edges={['top']} // Safe area only at top
  >
    {/* content */}
  </SafeScrollView>
);
```

**Update styles** - Remove/adjust container padding:
```typescript
container: {
  flex: 1,
  backgroundColor: Colors.background,
  // Remove any paddingTop/paddingBottom
},
```

#### StatsScreen.tsx

Same pattern as DashboardScreen:
```typescript
import SafeScrollView from '../../components/common/SafeScrollView';

return (
  <SafeScrollView edges={['top']}>
    {/* content */}
  </SafeScrollView>
);
```

#### TeamsScreen.tsx

```typescript
import SafeScrollView from '../../components/common/SafeScrollView';

return (
  <SafeScrollView edges={['top']}>
    {/* content */}
  </SafeScrollView>
);
```

#### SettingsScreen.tsx

```typescript
import SafeScrollView from '../../components/common/SafeScrollView';

return (
  <SafeScrollView edges={['top']}>
    {/* content */}
  </SafeScrollView>
);
```

#### AddTipScreen.tsx (Modal)

For the Add Tip modal, use full safe area:
```typescript
import { SafeAreaView } from 'react-native-safe-area-context';

return (
  <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* content */}
    </ScrollView>
  </SafeAreaView>
);

// Add to styles:
scrollContent: {
  paddingBottom: 40, // Extra space for comfortable scrolling
},
```

### 4. Update All Navigated Screens

For screens opened via navigation (not in tabs), use SafeAreaView with top/bottom edges:

#### TaxTrackingScreen.tsx, GoalsScreen.tsx, ExportReportsScreen.tsx, etc.

```typescript
import { SafeAreaView } from 'react-native-safe-area-context';

return (
  <SafeAreaView style={styles.container} edges={['bottom']}>
    {/* headerShown: true screens only need bottom edge */}
    <ScrollView contentContainerStyle={styles.content}>
      {/* content */}
    </ScrollView>
  </SafeAreaView>
);
```

For screens with `headerShown: false`:
```typescript
import { SafeAreaView } from 'react-native-safe-area-context';

return (
  <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
    <ScrollView contentContainerStyle={styles.content}>
      {/* content */}
    </ScrollView>
  </SafeAreaView>
);
```

### 5. Testing Checklist

After applying changes, test:

- [ ] **Tab bar visibility** - Can easily tap all tabs without stretching
- [ ] **FAB accessibility** - Floating action button is easy to reach
- [ ] **Top content visibility** - Nothing hidden behind status bar/notch
- [ ] **Scroll to bottom** - Can scroll to see all content
- [ ] **iOS vs Android** - Test both platforms (or use Platform.OS checks)
- [ ] **Different screen sizes** - Test on various device simulators

### 6. Quick Apply Script

I'll create a script to automatically apply these changes.

