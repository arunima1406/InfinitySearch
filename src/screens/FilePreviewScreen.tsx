import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Dimensions,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LoadingIndicator from '../components/LoadingIndicator';
import { fileService } from '../services/fileService';
import { globalStyles } from '../utils/styles';
import { RootStackParamList } from '../utils/type';

type FilePreviewScreenNavigationProp = StackNavigationProp<RootStackParamList, 'FilePreview'>;
type FilePreviewScreenRouteProp = RouteProp<RootStackParamList, 'FilePreview'>;

interface FilePreviewScreenProps {
  navigation: FilePreviewScreenNavigationProp;
  route: FilePreviewScreenRouteProp;
}

const { width } = Dimensions.get('window');
const isSmallDevice = width < 375;
const isMediumDevice = width >= 375 && width < 768;

const FilePreviewScreen: React.FC<FilePreviewScreenProps> = ({ navigation, route }) => {
  const { fileId, fileName, fileType } = route.params;
  const [content, setContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    navigation.setOptions({
      title: fileName,
      headerRight: () => (
        <TouchableOpacity
          style={styles.headerButton}
          onPress={handleShare}
          disabled={isLoading || !!error}
        >
          <Text style={styles.headerButtonText}>Share</Text>
        </TouchableOpacity>
      ),
    });

    loadFileContent();
  }, [fileId, fileName, navigation]);

  const loadFileContent = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const fileContent = await fileService.getFileContent(fileId, fileType);
      setContent(fileContent);
    } catch (err) {
      console.error('Error loading file content:', err);
      setError(err instanceof Error ? err.message : 'Failed to load file content');
    } finally {
      setIsLoading(false);
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `${fileName}\n\n${content}`,
        title: fileName,
      });
    } catch (err) {
      console.error('Error sharing file:', err);
      Alert.alert('Share Error', 'Failed to share file content.');
    }
  };

  const handleRetry = () => {
    loadFileContent();
  };

  const getFileTypeColor = (type: string): string => {
    const typeColors: Record<string, string> = {
      pdf: '#EF4444',
      txt: '#10B981',
      docx: '#3B82F6',
      doc: '#3B82F6',
      xlsx: '#F59E0B',
      xls: '#F59E0B',
      csv: '#8B5CF6',
    };
    return typeColors[type] || '#6B7280';
  };

  const getFileTypeGradient = (type: string): string => {
    const gradients: Record<string, string> = {
      pdf: '#FEE2E2',
      txt: '#D1FAE5',
      docx: '#DBEAFE',
      doc: '#DBEAFE',
      xlsx: '#FEF3C7',
      xls: '#FEF3C7',
      csv: '#EDE9FE',
    };
    return gradients[type] || '#F3F4F6';
  };

  if (isLoading) {
    return (
      <SafeAreaView style={globalStyles.safeArea}>
        <View style={styles.loadingContainer}>
          <View style={styles.loadingIconContainer}>
            <Text style={styles.loadingIcon}>📄</Text>
          </View>
          <LoadingIndicator message="Loading file content..." />
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={globalStyles.safeArea}>
        <View style={styles.errorContainer}>
          <View style={styles.errorIconContainer}>
            <Text style={styles.errorIcon}>⚠️</Text>
          </View>
          <Text style={styles.errorTitle}>Unable to Load File</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={handleRetry}
            activeOpacity={0.85}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={globalStyles.safeArea}>
      <View style={styles.container}>
        <View style={styles.fileHeader}>
          <View style={styles.fileInfo}>
            <View style={[
              styles.fileTypeIndicator, 
              { 
                backgroundColor: getFileTypeGradient(fileType),
                borderColor: getFileTypeColor(fileType),
              }
            ]}>
              <Text style={[styles.fileTypeText, { color: getFileTypeColor(fileType) }]}>
                {fileType? fileType.toUpperCase():''}
              </Text>
            </View>
            <View style={styles.fileDetails}>
              <Text style={styles.fileName} numberOfLines={2}>
                {fileName}
              </Text>
              <Text style={styles.fileMetadata}>
                {fileType ? `${fileType.toUpperCase()} Document • Preview Mode` : 'Document • Preview Mode'}
              </Text>
            </View>
          </View>
        </View>

        <ScrollView
          style={styles.contentContainer}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.contentScrollContainer}
        >
          <View style={styles.contentCard}>
            <Text style={styles.content}>{content}</Text>
          </View>
        </ScrollView>

        <View style={styles.actionBar}>
          <TouchableOpacity
            style={styles.shareButton}
            onPress={handleShare}
            activeOpacity={0.85}
          >
            <Text style={styles.shareIcon}>↗</Text>
            <Text style={styles.shareButtonText}>Share Content</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  headerButton: {
    paddingHorizontal: isSmallDevice ? 12 : 16,
    paddingVertical: isSmallDevice ? 6 : 8,
  },
  headerButtonText: {
    fontSize: isSmallDevice ? 15 : 16,
    color: '#7C3AED',
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  loadingIconContainer: {
    width: isSmallDevice ? 80 : 96,
    height: isSmallDevice ? 80 : 96,
    borderRadius: isSmallDevice ? 40 : 48,
    backgroundColor: '#E0E7FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  loadingIcon: {
    fontSize: isSmallDevice ? 36 : 42,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: isSmallDevice ? 24 : isMediumDevice ? 32 : 40,
    backgroundColor: '#F5F5F5',
  },
  errorIconContainer: {
    width: isSmallDevice ? 80 : 96,
    height: isSmallDevice ? 80 : 96,
    borderRadius: isSmallDevice ? 40 : 48,
    backgroundColor: '#FFEBEE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  errorIcon: {
    fontSize: isSmallDevice ? 36 : 42,
  },
  errorTitle: {
    fontSize: isSmallDevice ? 22 : isMediumDevice ? 24 : 26,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  errorMessage: {
    fontSize: isSmallDevice ? 15 : 16,
    color: '#6B6B6B',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: isSmallDevice ? 22 : 24,
    maxWidth: isMediumDevice ? '90%' : '85%',
  },
  retryButton: {
    backgroundColor: '#EC4899',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    shadowColor: '#EC4899',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  fileHeader: {
    backgroundColor: '#FFFFFF',
    padding: isSmallDevice ? 16 : isMediumDevice ? 18 : 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  fileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fileTypeIndicator: {
    paddingHorizontal: isSmallDevice ? 10 : 12,
    paddingVertical: isSmallDevice ? 8 : 10,
    borderRadius: 10,
    marginRight: isSmallDevice ? 12 : 16,
    borderWidth: 1.5,
  },
  fileTypeText: {
    fontSize: isSmallDevice ? 11 : 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  fileDetails: {
    flex: 1,
  },
  fileName: {
    fontSize: isSmallDevice ? 16 : 17,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  fileMetadata: {
    fontSize: isSmallDevice ? 13 : 14,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  contentContainer: {
    flex: 1,
  },
  contentScrollContainer: {
    padding: isSmallDevice ? 16 : isMediumDevice ? 20 : 24,
  },
  contentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: isSmallDevice ? 18 : isMediumDevice ? 22 : 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    minHeight: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  content: {
    fontSize: isSmallDevice ? 15 : 16,
    color: '#374151',
    lineHeight: isSmallDevice ? 24 : 26,
    fontWeight: '400',
  },
  actionBar: {
    padding: isSmallDevice ? 16 : isMediumDevice ? 18 : 20,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 3,
  },
  shareButton: {
    flexDirection: 'row',
    backgroundColor: '#059669',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  shareIcon: {
    fontSize: 18,
    color: '#FFFFFF',
    marginRight: 8,
    fontWeight: '700',
  },
  shareButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});

export default FilePreviewScreen;