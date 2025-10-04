import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RootStackParamList } from '../utils/type';
import LoadingIndicator from '../components/LoadingIndicator';
import { fileService } from '../services/fileService';
import { colors, globalStyles, spacing, typography } from '../utils/styles';

type FilePreviewScreenNavigationProp = StackNavigationProp<RootStackParamList, 'FilePreview'>;
type FilePreviewScreenRouteProp = RouteProp<RootStackParamList, 'FilePreview'>;

interface FilePreviewScreenProps {
  navigation: FilePreviewScreenNavigationProp;
  route: FilePreviewScreenRouteProp;
}

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
      pdf: '#FF5722',
      txt: '#4CAF50',
      docx: '#2196F3',
      doc: '#2196F3',
      xlsx: '#FF9800',
      xls: '#FF9800',
      csv: '#9C27B0',
    };
    return typeColors[type] || colors.textMuted;
  };

  if (isLoading) {
    return (
      <SafeAreaView style={globalStyles.safeArea}>
        <View style={globalStyles.centerContent}>
          <LoadingIndicator message="Loading file content..." />
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={globalStyles.safeArea}>
        <View style={globalStyles.centerContent}>
          <Text style={styles.errorTitle}>Unable to Load File</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity
            style={[globalStyles.button, styles.retryButton]}
            onPress={handleRetry}
          >
            <Text style={globalStyles.buttonText}>Try Again</Text>
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
            <View style={[styles.fileTypeIndicator, { backgroundColor: getFileTypeColor(fileType) }]}>
              <Text style={styles.fileTypeText}>{fileType.toUpperCase()}</Text>
            </View>
            <View style={styles.fileDetails}>
              <Text style={styles.fileName} numberOfLines={2}>
                {fileName}
              </Text>
              <Text style={styles.fileMetadata}>
                {fileType.toUpperCase()} Document • Preview
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
            style={[globalStyles.button, styles.actionButton]}
            onPress={handleShare}
          >
            <Text style={globalStyles.buttonText}>Share Content</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  headerButtonText: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '600',
  },
  fileHeader: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  fileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fileTypeIndicator: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: spacing.xs,
    marginRight: spacing.md,
  },
  fileTypeText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: 0.5,
  },
  fileDetails: {
    flex: 1,
  },
  fileName: {
    ...typography.body,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  fileMetadata: {
    ...typography.caption,
    color: colors.textMuted,
  },
  contentContainer: {
    flex: 1,
  },
  contentScrollContainer: {
    padding: spacing.md,
  },
  contentCard: {
    backgroundColor: colors.surface,
    borderRadius: spacing.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 200,
  },
  content: {
    ...typography.body,
    color: colors.text,
    lineHeight: 24,
    textAlign: 'justify',
  },
  actionBar: {
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  actionButton: {
    backgroundColor: colors.secondary,
  },
  errorTitle: {
    ...typography.h2,
    textAlign: 'center',
    marginBottom: spacing.md,
    color: colors.error,
  },
  errorMessage: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  retryButton: {
    paddingHorizontal: spacing.xl,
  },
});

export default FilePreviewScreen;