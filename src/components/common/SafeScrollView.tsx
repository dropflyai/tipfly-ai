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
