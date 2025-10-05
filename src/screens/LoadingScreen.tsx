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
  Dimensions,
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

const { width } = Dimensions.get('window');
const isSmallDevice = width < 375;
const isMediumDevice = width >= 375 && width < 768;

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
      if (!isScanning && !isUploading && files.length === 0) {
        initializeApp();
      }
    }, [])
  );

  const initializeApp = async () => {
    try {
      setIsScanning(true);
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

      await new Promise(resolve => setTimeout(resolve, 1000));
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

  if (isScanning) {
    return (
      <SafeAreaView style={globalStyles.safeArea}>
        <View style={styles.scanningContainer}>
          <View style={styles.scanningIconContainer}>
            <Text style={styles.scanningIcon}>🔍</Text>
          </View>
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
          <View style={styles.subtitleContainer}>
            <View style={styles.fileCountBadge}>
              <Text style={styles.fileCountText}>{files.length}</Text>
            </View>
            <Text style={styles.subtitle}>
              files found • Ready to upload
            </Text>
          </View>
        </View>

        {!isUploading ? (
          <>
            <FlatList
              data={files}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View style={styles.fileCard}>
                  <View style={[styles.fileTypeIndicator, { backgroundColor: getFileTypeColor(item.type) }]}>
                    <Text style={styles.fileTypeText}>{item.type.toUpperCase()}</Text>
                  </View>
                  <View style={styles.fileDetails}>
                    <Text style={styles.fileName} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={styles.fileInfo}>
                      {item.type.toUpperCase()} • {Math.round(item.size / 1024)} KB
                    </Text>
                  </View>
                </View>
              )}
              style={styles.filesList}
              contentContainerStyle={styles.filesListContent}
              showsVerticalScrollIndicator={false}
            />

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.addFilesButton}
                onPress={handleAddFiles}
                activeOpacity={0.85}
              >
                <Text style={styles.addFilesIcon}>+</Text>
                <Text style={styles.addFilesButtonText}>
                  Add More Files
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.uploadButton}
                onPress={handleUploadFiles}
                activeOpacity={0.85}
              >
                <Text style={styles.uploadIcon}>↑</Text>
                <Text style={styles.uploadButtonText}>
                  Upload & Process Files
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.skipButton}
                onPress={handleSkipToSearch}
                activeOpacity={0.7}
              >
                <Text style={styles.skipButtonText}>
                  Skip to Search →
                </Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <View style={styles.uploadingContainer}>
            <View style={styles.uploadingHeader}>
              <View style={styles.uploadingIconContainer}>
                <Text style={styles.uploadingIcon}>⬆️</Text>
              </View>
              <Text style={styles.uploadingTitle}>Uploading Files</Text>
              <Text style={styles.uploadingSubtitle}>
                Your files are being uploaded and processed...
              </Text>
            </View>

            <FlatList
              data={Object.values(uploadProgress)}
              keyExtractor={(item) => item.fileId}
              renderItem={({ item }) => <ProgressCard progress={item} />}
              style={styles.progressList}
              contentContainerStyle={styles.progressListContent}
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
    backgroundColor: '#F5F5F5',
  },
  scanningContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: isSmallDevice ? 24 : isMediumDevice ? 32 : 40,
  },
  scanningIconContainer: {
    width: isSmallDevice ? 80 : 96,
    height: isSmallDevice ? 80 : 96,
    borderRadius: isSmallDevice ? 40 : 48,
    backgroundColor: '#FEF3E7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  scanningIcon: {
    fontSize: isSmallDevice ? 36 : 42,
  },
  scanningDescription: {
    fontSize: isSmallDevice ? 14 : 15,
    color: '#6B6B6B',
    textAlign: 'center',
    marginTop: 16,
    lineHeight: isSmallDevice ? 20 : 22,
    maxWidth: isMediumDevice ? '90%' : '80%',
  },
  header: {
    paddingHorizontal: isSmallDevice ? 20 : isMediumDevice ? 24 : 28,
    paddingTop: isSmallDevice ? 20 : 24,
    paddingBottom: isSmallDevice ? 16 : 20,
    backgroundColor: '#F5F5F5',
  },
  title: {
    fontSize: isSmallDevice ? 26 : isMediumDevice ? 28 : 30,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 10,
    letterSpacing: -0.5,
  },
  subtitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  fileCountBadge: {
    backgroundColor: '#7C3AED',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 28,
    alignItems: 'center',
  },
  fileCountText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: isSmallDevice ? 14 : 15,
    color: '#6B6B6B',
    fontWeight: '500',
  },
  filesList: {
    flex: 1,
  },
  filesListContent: {
    paddingHorizontal: isSmallDevice ? 20 : isMediumDevice ? 24 : 28,
    paddingBottom: 16,
  },
  fileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: isSmallDevice ? 14 : 16,
    marginBottom: isSmallDevice ? 10 : 12,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  fileTypeIndicator: {
    width: isSmallDevice ? 40 : 44,
    height: isSmallDevice ? 40 : 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: isSmallDevice ? 12 : 14,
  },
  fileTypeText: {
    fontSize: isSmallDevice ? 9 : 10,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  fileDetails: {
    flex: 1,
  },
  fileName: {
    fontSize: isSmallDevice ? 15 : 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 3,
    letterSpacing: -0.2,
  },
  fileInfo: {
    fontSize: isSmallDevice ? 12 : 13,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  buttonContainer: {
    paddingHorizontal: isSmallDevice ? 20 : isMediumDevice ? 24 : 28,
    paddingBottom: isSmallDevice ? 20 : 24,
    gap: isSmallDevice ? 12 : 14,
    backgroundColor: '#F5F5F5',
  },
  addFilesButton: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#7C3AED',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  addFilesIcon: {
    fontSize: 20,
    color: '#7C3AED',
    fontWeight: '700',
    marginRight: 8,
  },
  addFilesButtonText: {
    fontSize: 16,
    color: '#7C3AED',
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  uploadButton: {
    flexDirection: 'row',
    backgroundColor: '#7C3AED',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  uploadIcon: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '700',
    marginRight: 8,
  },
  uploadButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  skipButtonText: {
    fontSize: 15,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  uploadingContainer: {
    flex: 1,
    paddingHorizontal: isSmallDevice ? 20 : isMediumDevice ? 24 : 28,
  },
  uploadingHeader: {
    alignItems: 'center',
    paddingTop: isSmallDevice ? 24 : 32,
    paddingBottom: isSmallDevice ? 20 : 24,
  },
  uploadingIconContainer: {
    width: isSmallDevice ? 70 : 80,
    height: isSmallDevice ? 70 : 80,
    borderRadius: isSmallDevice ? 35 : 40,
    backgroundColor: '#E0E7FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  uploadingIcon: {
    fontSize: isSmallDevice ? 32 : 36,
  },
  uploadingTitle: {
    fontSize: isSmallDevice ? 22 : isMediumDevice ? 24 : 26,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  uploadingSubtitle: {
    fontSize: isSmallDevice ? 14 : 15,
    color: '#6B6B6B',
    textAlign: 'center',
    lineHeight: isSmallDevice ? 20 : 22,
  },
  progressList: {
    flex: 1,
  },
  progressListContent: {
    paddingBottom: 24,
  },
});

export default LoadingScreen;