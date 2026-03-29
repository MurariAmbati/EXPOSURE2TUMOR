// ============================================================
// RefreshableScroll — Pull-to-refresh ScrollView wrapper
// Consistent refresh UX across all data-heavy screens
// ============================================================

import React, { useState, useCallback } from 'react';
import { ScrollView, RefreshControl, StyleSheet, ScrollViewProps } from 'react-native';
import { Colors } from '../../theme';

interface RefreshableScrollProps extends ScrollViewProps {
  onRefresh: () => void | Promise<void>;
  children: React.ReactNode;
}

export function RefreshableScroll({ onRefresh, children, style, contentContainerStyle, ...rest }: RefreshableScrollProps) {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setRefreshing(false);
    }
  }, [onRefresh]);

  return (
    <ScrollView
      style={style}
      contentContainerStyle={contentContainerStyle}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor={Colors.accentTeal}
          colors={[Colors.accentTeal]}
          progressBackgroundColor={Colors.surface}
        />
      }
      {...rest}
    >
      {children}
    </ScrollView>
  );
}
