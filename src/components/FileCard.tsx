import React from 'react';
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SearchResult } from '../services/SearchService';
import { borderRadius, colors, spacing, typography } from '../utils/styles';

interface FileCardProps {
  result: SearchResult;
  onPress: (result: SearchResult) => void;
}

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
    return typeColors[fileType] || colors.textMuted;
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
          <View style={[styles.fileTypeIndicator, { backgroundColor: getFileTypeColor(result.fileType) }]}>
            <Text style={styles.fileTypeText}>{result.fileType.toUpperCase()}</Text>
          </View>
          <View style={styles.titleContainer}>
            <Text style={styles.fileName} numberOfLines={1}>
              {result.fileName}
            </Text>
            <Text style={styles.metadata}>
              {formatFileSize(result.metadata.fileSize)} • {formatDate(result.metadata.uploadDate)}
              {result.metadata.pageCount && ` • ${result.metadata.pageCount} pages`}
            </Text>
          </View>
        </View>
        <View style={styles.scoreContainer}>
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
          <Text style={styles.highlightLabel}>Match:</Text>
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
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginVertical: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  fileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  fileTypeIndicator: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: spacing.sm,
  },
  fileTypeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: 0.5,
  },
  titleContainer: {
    flex: 1,
  },
  fileName: {
    ...typography.body,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  metadata: {
    ...typography.caption,
    color: colors.textMuted,
  },
  scoreContainer: {
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: 12,
  },
  relevanceScore: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.background,
  },
  snippet: {
    ...typography.bodySecondary,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: spacing.sm,
  },
  highlightContainer: {
    backgroundColor: colors.background,
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  highlightLabel: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  highlightText: {
    ...typography.bodySecondary,
    color: colors.text,
    fontStyle: 'italic',
  },
});

export default FileCard;