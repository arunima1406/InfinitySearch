import { StackNavigationProp } from '@react-navigation/stack';
import React, { useState } from 'react';
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RootStackParamList } from '../../App';
import FileCard from '../components/FileCard';
import LoadingIndicator from '../components/LoadingIndicator';
import SearchBar from '../components/SearchBar';
import { useSearch } from '../hooks/useSearch';
import { SearchResult } from '../services/SearchService';
import { colors, globalStyles, spacing, typography } from '../utils/styles';

type SearchScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Search'>;

interface SearchScreenProps {
  navigation: SearchScreenNavigationProp;
}

const SearchScreen: React.FC<SearchScreenProps> = ({ navigation }) => {
  const [currentQuery, setCurrentQuery] = useState('');
  const {
    results,
    isLoading,
    error,
    search,
    clearResults,
    clearError,
  } = useSearch();

  const handleSearch = async (query: string) => {
    setCurrentQuery(query);
    try {
      await search(query);
    } catch (err) {
      Alert.alert('Search Error', 'Failed to perform search. Please try again.');
    }
  };

  const handleFilePress = (result: SearchResult) => {
    navigation.navigate('FilePreview', {
      fileId: result.id,
      fileName: result.fileName,
      fileType: result.fileType,
    });
  };

  const renderEmptyState = () => {
    if (isLoading) {
      return <LoadingIndicator message="Searching files..." />;
    }

    if (error) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateTitle}>Search Error</Text>
          <Text style={styles.emptyStateText}>{error}</Text>
          <TouchableOpacity
            style={[globalStyles.button, styles.retryButton]}
            onPress={() => {
              clearError();
              if (currentQuery) {
                handleSearch(currentQuery);
              }
            }}
          >
            <Text style={globalStyles.buttonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (currentQuery && results.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateTitle}>No Results Found</Text>
          <Text style={styles.emptyStateText}>
            No files match your search query "{currentQuery}".
            Try using different keywords or check your spelling.
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyStateTitle}>Welcome to Semantic Search</Text>
        <Text style={styles.emptyStateText}>
          Search through your uploaded documents using natural language.
          Try searching for concepts, topics, or specific content.
        </Text>
      </View>
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <SearchBar
        onSearch={handleSearch}
        isLoading={isLoading}
      />
      {results.length > 0 && (
        <View style={styles.resultsInfo}>
          <Text style={styles.resultsCount}>
            {results.length} result{results.length !== 1 ? 's' : ''} found
            {currentQuery && ` for "${currentQuery}"`}
          </Text>
            <TouchableOpacity onPress={clearResults}>
              <Text style={styles.clearResults}>Clear</Text>
            </TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={globalStyles.safeArea}>
      <View style={styles.container}>
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <FileCard result={item} onPress={handleFilePress} />
          )}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={renderEmptyState}
          style={styles.list}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: spacing.md,
    paddingBottom: 0,
  },
  list: {
    flex: 1,
    paddingHorizontal: spacing.md,
  },
  resultsInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  resultsCount: {
    ...typography.bodySecondary,
    color: colors.textSecondary,
  },
  clearResults: {
    ...typography.bodySecondary,
    color: colors.primary,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.lg,
  },
  emptyStateTitle: {
    ...typography.h2,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  emptyStateText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  retryButton: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.xl,
  },
  recentSearchesContainer: {
    marginTop: spacing.lg,
    alignItems: 'center',
  },
  recentSearchesTitle: {
    ...typography.bodySecondary,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  recentSearchItem: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    marginVertical: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  recentSearchText: {
    ...typography.bodySecondary,
    color: colors.textSecondary,
  },
});

export default SearchScreen;