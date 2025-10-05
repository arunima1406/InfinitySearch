import { useUser } from '@clerk/clerk-expo';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useState } from 'react';
import {
  Dimensions,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import FileCard from '../components/FileCard';
import LoadingIndicator from '../components/LoadingIndicator';
import SearchBar from '../components/SearchBar';
import { globalStyles } from '../utils/styles';
import { RootStackParamList } from '../utils/type';

type SearchScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'Search'
>;

interface SearchScreenProps {
  navigation: SearchScreenNavigationProp;
}

const { width } = Dimensions.get('window');
const isSmallDevice = width < 375;
const isMediumDevice = width >= 375 && width < 768;

const SearchScreen: React.FC<SearchScreenProps> = ({ navigation }) => {
  const { isLoaded, isSignedIn, user } = useUser();
  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentQuery, setCurrentQuery] = useState('');

  if (!isLoaded) return null;
  if (!isSignedIn) return null;

  const handleResults = (data: any[]) => {
    setResults(data);
  };

  const handleSearchStart = (query: string) => {
    setCurrentQuery(query);
    setIsLoading(true);
  };

  const handleSearchComplete = () => {
    setIsLoading(false);
  };

  const handleFilePress = (result: any) => {
    navigation.navigate('FilePreview', {
      fileId: result.s3_key || result.id,
      fileName: result.file_name || result.fileName,
      fileType: result.fileType || 'file',
    });
  };

  const handleClearResults = () => {
    setResults([]);
    setCurrentQuery('');
  };

  const renderEmptyState = () => {
    if (isLoading) {
      return <LoadingIndicator message="Searching files..." />;
    }

    if (currentQuery && results.length === 0) {
      return (
        <View style={styles.emptyState}>
          <View style={styles.emptyIconContainer}>
            <Text style={styles.emptyIcon}>🔍</Text>
          </View>
          <Text style={styles.emptyStateTitle}>No Results Found</Text>
          <Text style={styles.emptyStateText}>
            No files match your search query "{currentQuery}". Try different
            keywords or check your spelling.
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.emptyState}>
        <View style={styles.welcomeIconContainer}>
          <Text style={styles.welcomeIcon}>📄</Text>
        </View>
        <Text style={styles.welcomeTitle}>Search Your Documents</Text>
        <Text style={styles.welcomeText}>
          Use natural language to find your uploaded files. Example: “Show me
          notes from last week.”
        </Text>
      </View>
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <SearchBar
        onResults={handleResults}
        //onSearchStart={handleSearchStart}
        //onSearchComplete={handleSearchComplete}
      />
      {results.length > 0 && (
        <View style={styles.resultsInfo}>
          <View style={styles.resultsCountContainer}>
            <View style={styles.resultsBadge}>
              <Text style={styles.resultsBadgeText}>{results.length}</Text>
            </View>
            <Text style={styles.resultsCount}>
              result{results.length !== 1 ? 's' : ''} found
            </Text>
          </View>
          <TouchableOpacity
            onPress={handleClearResults}
            style={styles.clearButton}
            activeOpacity={0.7}
          >
            <Text style={styles.clearResults}>Clear all</Text>
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
          keyExtractor={(item, index) => item.id || item.s3_key || index.toString()}
          renderItem={({ item }) => (
            <FileCard result={item} onPress={() => handleFilePress(item)} />
          )}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={renderEmptyState}
          style={styles.list}
          contentContainerStyle={styles.listContent}
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
    backgroundColor: '#F5F5F5',
  },
  header: {
    paddingHorizontal: isSmallDevice ? 16 : isMediumDevice ? 20 : 24,
    paddingTop: isSmallDevice ? 12 : 16,
    backgroundColor: '#F5F5F5',
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: isSmallDevice ? 16 : isMediumDevice ? 20 : 24,
    paddingBottom: 24,
  },
  resultsInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 12,
  },
  resultsCountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  resultsBadge: {
    backgroundColor: '#7C3AED',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 28,
    alignItems: 'center',
  },
  resultsBadgeText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  resultsCount: {
    fontSize: 15,
    color: '#4A4A4A',
    fontWeight: '500',
  },
  clearButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  clearResults: {
    fontSize: 15,
    color: '#7C3AED',
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: isSmallDevice ? 40 : isMediumDevice ? 60 : 80,
    paddingHorizontal: isSmallDevice ? 24 : isMediumDevice ? 32 : 40,
  },
  welcomeIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#F0E7FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  welcomeIcon: {
    fontSize: 42,
  },
  emptyIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#FEF3E7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyIcon: {
    fontSize: 42,
  },
  welcomeTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 12,
    textAlign: 'center',
  },
  welcomeText: {
    fontSize: 16,
    color: '#6B6B6B',
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: '85%',
  },
  emptyStateTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#6B6B6B',
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: '85%',
  },
});

export default SearchScreen;
