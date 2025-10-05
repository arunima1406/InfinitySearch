import React from 'react';
import {
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { UploadProgress } from '../services/fileService';
import { borderRadius, colors, spacing, typography } from '../utils/styles';

interface ProgressCardProps {
  progress: UploadProgress;
}

const ProgressCard: React.FC<ProgressCardProps> = ({ progress }) => {
  const getStatusColor = () => {
    switch (progress.status) {
      case 'completed':
        return colors.success;
      case 'error':
        return colors.error;
      default:
        return colors.primary;
    }
  };

  const getStatusText = () => {
    switch (progress.status) {
      case 'completed':
        return 'Completed';
      case 'error':
        return 'Failed';
      case 'uploading':
        return `${progress.progress}%`;
      default:
        return 'Processing...';
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.fileName} numberOfLines={1}>
          {progress.fileName}
        </Text>
        <Text style={[styles.status, { color: getStatusColor() }]}>
          {getStatusText()}
        </Text>
      </View>
      
      {progress.status === 'uploading' && (
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${progress.progress}%`,
                  backgroundColor: getStatusColor(),
                },
              ]}
            />
          </View>
        </View>
      )}
    </View>
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
    alignItems: 'center',
  },
  fileName: {
    ...typography.body,
    color: colors.text,
    flex: 1,
    marginRight: spacing.sm,
  },
  status: {
    ...typography.bodySecondary,
    fontWeight: '600',
  },
  progressContainer: {
    marginTop: spacing.sm,
  },
  progressBar: {
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
});

export default ProgressCard;