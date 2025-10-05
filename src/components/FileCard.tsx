import React from 'react';
import {
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SearchResult } from '../services/SearchService';

interface FileCardProps {
  result: SearchResult;
  onPress: (result: SearchResult) => void;
}

const { width } = Dimensions.get('window');
const isSmallDevice = width < 375;
const isMediumDevice = width >= 375 && width < 768;

const FileCard: React.FC<FileCardProps> = ({ result, onPress }) => {
  const getFileTypeColor = (fileType: string): string => {
    const typeColors: Record<string, string> = {
      pdf: '#FF5722',
      txt: '#4CAF50',
      docx: '#2196F3',
      doc: '#2196F3',
      xlsx: '#FF9800',
      xls: '#FF9800',
      csv: '#9C27B0',
    };
    return typeColors[fileType] || '#6B7280';
  };

   const getFileTypeGradient = (fileType: string): string => {
    const gradients: Record<string, string> = {
      pdf: '#FEE2E2',
      txt: '#D1FAE5',
      docx: '#DBEAFE',
      doc: '#DBEAFE',
      xlsx: '#FEF3C7',
      xls: '#FEF3C7',
      csv: '#EDE9FE',
    };
    return gradients[fileType] || '#F3F4F6';
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress(result)}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={styles.fileInfo}>
          <View style={[styles.fileTypeIndicator, { backgroundColor: getFileTypeColor(result.fileType),borderColor: getFileTypeColor(result.fileType) }]}>
            <Text style={[styles.fileTypeText, { color: getFileTypeColor(result.fileType) }]}>{result.fileType ? result.fileType.toUpperCase() : ''}</Text>
          </View>
          <View style={styles.titleContainer}>
            <Text style={styles.fileName} numberOfLines={1}>
              {result.fileName}
            </Text>
            <Text style={styles.metadata}>
  {result.metadata
    ? `${formatFileSize(result.metadata.fileSize || 0)} • ${formatDate(result.metadata.uploadDate || new Date().toISOString())}${
        result.metadata.pageCount ? ` • ${result.metadata.pageCount} pages` : ''
      }`
    : 'Metadata unavailable'}
</Text>
          </View>
        </View>
        <View style={[styles.scoreContainer,{ backgroundColor: result.relevanceScore > 0.7 ? '#10B981' : result.relevanceScore > 0.5 ? '#F59E0B' : '#6B7280'} ]}>
          <Text style={styles.relevanceScore}>
            {Math.round(result.relevanceScore * 100)}%
          </Text>
        </View>
      </View>

      <Text style={styles.snippet} numberOfLines={2}>
        {result.snippet}
      </Text>

      {result.highlightedText && (
        <View style={styles.highlightContainer}>
           <View style={styles.highlightHeader}>
            <View style={styles.matchDot} />
          <Text style={styles.highlightLabel}>Match Found</Text>
          </View>
          <Text style={styles.highlightText} numberOfLines={1}>
            {result.highlightedText.replace(/\*\*(.*?)\*\*/g, '$1')}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
   backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: isSmallDevice ? 14 : isMediumDevice ? 16 : 18,
    marginVertical: isSmallDevice ? 6 : 8,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: isSmallDevice ? 10 : 12,
  },
  fileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  fileTypeIndicator: {
    paddingHorizontal: isSmallDevice ? 8 : 10,
    paddingVertical: isSmallDevice ? 5 : 6,
    borderRadius: 8,
    marginRight: isSmallDevice ? 10 : 12,
    borderWidth: 1.5,
  },
  fileTypeText: {
    fontSize: isSmallDevice ? 9 : 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  titleContainer: {
    flex: 1,
  },
  fileName: {
    fontSize: isSmallDevice ? 15 : 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 3,
    letterSpacing: -0.2,
  },
  metadata: {
    fontSize: isSmallDevice ? 12 : 13,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  scoreContainer: {
    paddingHorizontal: isSmallDevice ? 9 : 10,
    paddingVertical: isSmallDevice ? 4 : 5,
    borderRadius: 10,
    marginLeft: 8,
  },
  relevanceScore: {
    fontSize: isSmallDevice ? 11 : 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  snippet: {
    fontSize: isSmallDevice ? 14 : 15,
    color: '#6B7280',
    lineHeight: isSmallDevice ? 20 : 22,
    marginBottom: isSmallDevice ? 10 : 12,
    fontWeight: '400',
  },
  highlightContainer: {
    backgroundColor: '#F0F9FF',
    padding: isSmallDevice ? 10 : 12,
    borderRadius: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#0EA5E9',
  },
  highlightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  matchDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#0EA5E9',
    marginRight: 6,
  },
  highlightLabel: {
    fontSize: isSmallDevice ? 11 : 12,
    color: '#0369A1',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  highlightText: {
    fontSize: isSmallDevice ? 13 : 14,
    color: '#0C4A6E',
    fontWeight: '500',
    fontStyle: 'italic',
  },
});

export default FileCard;