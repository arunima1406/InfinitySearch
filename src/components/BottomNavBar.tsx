import React from 'react';
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, typography } from '../utils/styles';

interface BottomNavBarProps {
  currentRoute: string;
  onNavigate: (route: string) => void;
}

const BottomNavBar: React.FC<BottomNavBarProps> = ({ currentRoute, onNavigate }) => {
  const insets = useSafeAreaInsets();

  const navItems = [
    { key: 'Loading', label: 'Files', icon: '📁' },
    { key: 'Search', label: 'Search', icon: '🔍' },
  ];

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      {navItems.map((item) => (
        <TouchableOpacity
          key={item.key}
          style={[
            styles.navItem,
            currentRoute === item.key && styles.activeNavItem,
          ]}
          onPress={() => onNavigate(item.key)}
        >
          <Text style={styles.navIcon}>{item.icon}</Text>
          <Text
            style={[
              styles.navLabel,
              currentRoute === item.key && styles.activeNavLabel,
            ]}
          >
            {item.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  activeNavItem: {
    backgroundColor: colors.background,
    borderRadius: spacing.sm,
    marginHorizontal: spacing.xs,
  },
  navIcon: {
    fontSize: 24,
    marginBottom: spacing.xs,
  },
  navLabel: {
    ...typography.caption,
    color: colors.textMuted,
  },
  activeNavLabel: {
    color: colors.primary,
    fontWeight: '600',
  },
});

export default BottomNavBar;