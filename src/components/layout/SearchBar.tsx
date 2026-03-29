// ============================================================
// Exposure2Tumor — Search Bar with autocomplete
// ============================================================

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  FlatList,
} from 'react-native';
import { Colors, Spacing, BorderRadius, Typography } from '../../theme';
import { SvgIcon } from '../SvgIcon';
import { useGeoLookup, useDebounce } from '../../hooks';
import { useAppStore } from '../../store';
import type { GeoIdentifier } from '../../types';

interface Props {
  onSelect?: (geo: GeoIdentifier) => void;
  placeholder?: string;
}

export function SearchBar({ onSelect, placeholder }: Props) {
  const [query, setQuery] = useState('');
  const [showResults, setShowResults] = useState(false);
  const debouncedQuery = useDebounce(query, 300);
  const { search, results, loading } = useGeoLookup();
  const { setCurrentGeo, setEvidencePanelOpen } = useAppStore();

  React.useEffect(() => {
    if (debouncedQuery.length >= 2) {
      search(debouncedQuery);
      setShowResults(true);
    } else {
      setShowResults(false);
    }
  }, [debouncedQuery, search]);

  const handleSelect = useCallback((geo: GeoIdentifier) => {
    setCurrentGeo(geo);
    setEvidencePanelOpen(true);
    setQuery(geo.name);
    setShowResults(false);
    onSelect?.(geo);
  }, [setCurrentGeo, setEvidencePanelOpen, onSelect]);

  return (
    <View style={styles.container}>
      <View style={styles.inputRow}>
        <SvgIcon name="search" size={16} color={Colors.textMuted} />
        <TextInput
          style={styles.input}
          value={query}
          onChangeText={setQuery}
          placeholder={placeholder ?? 'Search county, city, ZIP...'}
          placeholderTextColor={Colors.textMuted}
          onFocus={() => query.length >= 2 && setShowResults(true)}
        />
        {loading && <Text style={styles.spinner}></Text>}
        {query.length > 0 && (
          <Pressable onPress={() => { setQuery(''); setShowResults(false); }}>
            <Text style={styles.clearBtn}>×</Text>
          </Pressable>
        )}
      </View>

      {showResults && results.length > 0 && (
        <View style={styles.dropdown}>
          <FlatList
            data={results}
            keyExtractor={(item) => item.fips}
            renderItem={({ item }) => (
              <Pressable style={styles.resultItem} onPress={() => handleSelect(item)}>
                <Text style={styles.resultName}>{item.name}</Text>
                <Text style={styles.resultDetail}>
                  {item.county && `${item.county}, `}{item.state} · FIPS {item.fips}
                </Text>
              </Pressable>
            )}
            keyboardShouldPersistTaps="handled"
            style={styles.resultsList}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 100,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceHighlight,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    height: 44,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  icon: {
    fontSize: 16,
    marginRight: Spacing.sm,
  },
  input: {
    flex: 1,
    ...Typography.body,
    color: Colors.textPrimary,
    padding: 0,
  },
  spinner: {
    fontSize: 14,
    marginLeft: Spacing.sm,
  },
  clearBtn: {
    ...Typography.body,
    color: Colors.textMuted,
    paddingHorizontal: Spacing.sm,
  },
  dropdown: {
    position: 'absolute',
    top: 48,
    left: 0,
    right: 0,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    maxHeight: 200,
    zIndex: 1000,
  },
  resultsList: {
    maxHeight: 200,
  },
  resultItem: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
  },
  resultName: {
    ...Typography.body,
    color: Colors.textPrimary,
  },
  resultDetail: {
    ...Typography.caption,
    color: Colors.textMuted,
    marginTop: 2,
  },
});
