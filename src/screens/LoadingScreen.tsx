import { useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RootStackParamList } from '../utils/type';
import LoadingIndicator from '../components/LoadingIndicator';
import ProgressCard from '../components/ProgressCard';
import { fileService, LocalFile, UploadProgress } from '../services/fileService';
import { colors, globalStyles, spacing, typography } from '../utils/styles';

type LoadingScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Loading'>;

interface LoadingScreenProps {
  navigation: LoadingScreenNavigationProp;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ navigation }) => {
  const [isScanning, setIsScanning] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [files, setFiles] = useState<LocalFile[]>([]);
  const [uploadProgress, setUploadProgress] = useState<Record<string, UploadProgress>>({});
  const [scanComplete, setScanComplete] = useState(false);

  useEffect(() => {
    initializeApp();
  }, []);

  useFocusEffect(
  React.useCallback(() => {
    // Reset state when screen comes into focus
    if (!isScanning && !isUploading && files.length === 0) {
      initializeApp();
    }
  }, [])
);

  const initializeApp = async () => {
    try {
      setIsScanning(true);
      
      // Simulate scanning delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const scannedFiles = await fileService.scanLocalFiles();
      setFiles(scannedFiles);
      setScanComplete(true);
      setIsScanning(false);
    } catch (error) {
      console.error('Error scanning files:', error);
      Alert.alert('Error', 'Failed to scan local files. Please try again.');
      setIsScanning(false);
    }
  };

  const handleAddFiles = async () => {
    try {
      const pickedFiles = await fileService.pickMultipleFiles();
      if (pickedFiles.length > 0) {
        setFiles(prev => [...prev, ...pickedFiles]);
      }
    } catch (error) {
      console.error('Error picking files:', error);
      Alert.alert('Error', 'Failed to add files. Please try again.');
    }
  };

  const handleUploadFiles = async () => {
    if (files.length === 0) {
      Alert.alert('No Files', 'No files to upload. Please add some files first.');
      return;
    }

    setIsUploading(true);
    setUploadProgress({});

    try {
      await fileService.uploadFiles(files, 'placeholder-user-id', undefined, (progress) => {
        setUploadProgress(prev => ({
          ...prev,
          [progress.fileId]: progress,
        }));
      });

      // Wait a moment to show completion
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Navigate to search screen
      navigation.replace('Search');
    } catch (error) {
      console.error('Error uploading files:', error);
      Alert.alert('Upload Error', 'Some files failed to upload. Please try again.');
      setIsUploading(false);
    }
  };

  const handleSkipToSearch = () => {
    navigation.replace('Search');
  };

  if (isScanning) {
    return (
      <SafeAreaView style={globalStyles.safeArea}>
        <View style={globalStyles.centerContent}>
          <LoadingIndicator message="Scanning local files..." />
          <Text style={styles.scanningDescription}>
            Looking for PDF, TXT, DOCX, XLSX and other supported files on your device
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={globalStyles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>File Processing</Text>
          <Text style={styles.subtitle}>
            {files.length} files found • Ready to upload and process
          </Text>
        </View>

        {!isUploading ? (
          <>
            <FlatList
              data={files}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View style={globalStyles.card}>
                  <Text style={styles.fileName} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={styles.fileInfo}>
                    {item.type.toUpperCase()} • {Math.round(item.size / 1024)} KB
                  </Text>
                </View>
              )}
              style={styles.filesList}
              showsVerticalScrollIndicator={false}
            />

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[globalStyles.button, styles.secondaryButton]}
                onPress={handleAddFiles}
              >
                <Text style={[globalStyles.buttonText, styles.secondaryButtonText]}>
                  Add More Files
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={globalStyles.button}
                onPress={handleUploadFiles}
              >
                <Text style={globalStyles.buttonText}>
                  Upload & Process Files
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.skipButton}
                onPress={handleSkipToSearch}
              >
                <Text style={styles.skipButtonText}>
                  Skip to Search
                </Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <View style={styles.uploadingContainer}>
            <Text style={styles.uploadingTitle}>Uploading Files</Text>
            <Text style={styles.uploadingSubtitle}>
              Your files are being uploaded and processed...
            </Text>

            <FlatList
              data={Object.values(uploadProgress)}
              keyExtractor={(item) => item.fileId}
              renderItem={({ item }) => <ProgressCard progress={item} />}
              style={styles.progressList}
              showsVerticalScrollIndicator={false}
            />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.md,
  },
  header: {
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.h1,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.bodySecondary,
    color: colors.textSecondary,
  },
  scanningDescription: {
    ...typography.bodySecondary,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  filesList: {
    flex: 1,
    marginBottom: spacing.lg,
  },
  fileName: {
    ...typography.body,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  fileInfo: {
    ...typography.caption,
    color: colors.textMuted,
  },
  buttonContainer: {
    gap: spacing.md,
  },
  secondaryButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  secondaryButtonText: {
    color: colors.primary,
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  skipButtonText: {
    ...typography.body,
    color: colors.textMuted,
  },
  uploadingContainer: {
    flex: 1,
  },
  uploadingTitle: {
    ...typography.h2,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  uploadingSubtitle: {
    ...typography.bodySecondary,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  progressList: {
    flex: 1,
  },
});

export default LoadingScreen;