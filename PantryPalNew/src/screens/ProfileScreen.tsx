// src/screens/ProfileScreen.tsx
import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ActivityIndicator, 
  SafeAreaView,
  Alert,
  ScrollView
} from 'react-native';
import { List, Divider } from 'react-native-paper'; // ⬅️ FIX: Added List and Divider
import { useAuth } from '../auth/AuthProvider';
import { usePantryData } from '../hooks/usePantryData';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@react-navigation/native';
import { useThemeContext } from '../theme/ThemeProvider';
import { colors, spacing, typography } from '../utils/theme';
import { DrawerScreenProps } from '@react-navigation/drawer';
import { RootDrawerParamList } from '../navigation/types';

type ProfileScreenProps = DrawerScreenProps<RootDrawerParamList, 'Profile'>;

export default function ProfileScreen({ navigation }: ProfileScreenProps) {
  const { user, logout, loading } = useAuth();
  const { stats, loading: statsLoading } = usePantryData();
  const { theme } = useThemeContext();

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to log out?', [
        { text: 'Cancel', style: 'cancel' },
        { 
            text: 'Logout', 
            onPress: async () => {
                try {
                    await logout();
                    // Navigation handled by the AppRouter's user state listener
                } catch (error) {
                    Alert.alert('Logout Error', 'Failed to logout. Please try again.');
                }
            } 
        }
    ]);
  };
  
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning,';
    if (hour < 17) return 'Good afternoon,';
    return 'Good evening,';
  };

  const getStatusColor = (value: number, threshold: number) => {
    if (value === 0) return theme.colors.text;
    if (value <= threshold) return theme.colors.warning;
    return theme.colors.error;
  };
  
  const getFirstName = (name: string | null | undefined): string | null => {
    if (!name) return null;
    return name.split(' ')[0] || null;
  };

  const getLastName = (name: string | null | undefined): string | null => {
    if (!name) return null;
    const parts = name.split(' ');
    return parts.length > 1 ? parts.slice(1).join(' ') : null;
  };

  const getInitials = (name: string | null | undefined): string => {
    if (!name) return 'U';
    const parts = name.split(' ');
    if (parts.length > 1) {
      return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
    }
    return parts[0].charAt(0).toUpperCase();
  };

  if (loading || statsLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {user ? (
          <>
            {/* Profile Header */}
            <View style={styles.profileHeader}>
              <View style={[styles.avatar, { backgroundColor: theme.colors.primary }]}>
                  <Text style={styles.avatarText}>
                    {getInitials(user.displayName)}
                  </Text>
              </View>
              <View style={styles.headerText}>
                <Text style={[styles.greetingText, { color: theme.colors.text }]}>
                  {getGreeting()}
                </Text>
                <Text style={[styles.userName, { color: theme.colors.text }]}>
                  {user.displayName || user.email?.split('@')[0]}
                </Text>
              </View>
            </View>

            {/* User Details */}
            <View style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
                <List.Section>
                    <List.Item
                        title="First Name"
                        description={getFirstName(user.displayName) || '-'}
                        left={() => <List.Icon icon="account" color={theme.colors.primary} />}
                    />
                    <Divider />
                    <List.Item
                        title="Last Name"
                        description={getLastName(user.displayName) || '-'}
                        left={() => <List.Icon icon="account" color={theme.colors.primary} />}
                    />
                    <Divider />
                    <List.Item
                        title="Email"
                        description={user.email || '-'}
                        left={() => <List.Icon icon="email" color={theme.colors.primary} />}
                    />
                </List.Section>
            </View>

            {/* Stats Overview */}
            <View style={styles.statsContainer}>
              <View style={[styles.statCard, { backgroundColor: theme.colors.card }]}>
                <Text style={[styles.statNumber, { color: theme.colors.text }]}>
                  {stats.totalItems}
                </Text>
                <Text style={[styles.statLabel, { color: theme.colors.text }]}>
                  Total Items
                </Text>
              </View>
              <View style={[styles.statCard, { backgroundColor: theme.colors.card }]}>
                <Text style={[styles.statNumber, { color: getStatusColor(stats.expiredCount, 0) }]}>
                  {stats.expiredCount}
                </Text>
                <Text style={[styles.statLabel, { color: theme.colors.text }]}>
                  Expired
                </Text>
              </View>
              <View style={[styles.statCard, { backgroundColor: theme.colors.card }]}>
                <Text style={[styles.statNumber, { color: getStatusColor(stats.expiringSoonCount, 3) }]}>
                  {stats.expiringSoonCount}
                </Text>
                <Text style={[styles.statLabel, { color: theme.colors.text }]}>
                  Expiring
                </Text>
              </View>
            </View>

            {/* Account Actions */}
            <View style={styles.actionsContainer}>
                <TouchableOpacity 
                    style={[styles.actionButton, { backgroundColor: theme.colors.card }]}
                    onPress={() => navigation.navigate('ChangePassword')}
                >
                    <Ionicons name="lock-closed-outline" size={20} color={theme.colors.primary} />
                    <Text style={[styles.actionText, { color: theme.colors.text }]}>Change Password</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={[styles.actionButton, { backgroundColor: theme.colors.card }]}
                    onPress={handleLogout}
                >
                    <Ionicons name="log-out-outline" size={20} color={colors.error} />
                    <Text style={[styles.actionText, { color: theme.colors.text }]}>Logout</Text>
                </TouchableOpacity>
            </View>
          </>
        ) : (
          <View style={styles.guestContainer}>
            <Text style={styles.guestText}>You are not logged in</Text>
            <TouchableOpacity
              style={[styles.authButton, { backgroundColor: theme.colors.primary }]}
              onPress={() => navigation.navigate('Login')}
            >
              <Text style={[styles.buttonText, { color: theme.colors.white }]}>Login</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.authButton, styles.registerButton, { borderColor: theme.colors.primary }]}
              onPress={() => navigation.navigate('Register')}
            >
              <Text style={[styles.buttonText, styles.registerText, { color: theme.colors.primary }]}>Register</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: spacing.md,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
    padding: spacing.md,
    justifyContent: 'center',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  avatarText: {
    ...typography.h1,
    color: colors.white,
    fontWeight: 'bold',
  },
  headerText: {
    flex: 1,
  },
  greetingText: {
    ...typography.body,
  },
  userName: {
    ...typography.h2,
    fontWeight: 'bold',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
    flexWrap: 'wrap',
  },
  statCard: {
    width: '48%',
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.sm,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    ...typography.h2,
    fontWeight: 'bold',
  },
  statLabel: {
    ...typography.body,
  },
  actionsContainer: {
    paddingHorizontal: spacing.md,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.sm,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  actionText: {
    marginLeft: spacing.md,
    ...typography.body,
    fontWeight: '600',
  },
  guestContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  guestText: {
    ...typography.h3,
    color: colors.lightText,
    marginBottom: spacing.lg,
  },
  authButton: {
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: 8,
    width: '80%',
    alignItems: 'center',
    marginVertical: spacing.sm,
  },
  registerButton: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  buttonText: {
    color: colors.white,
    ...typography.body,
    fontWeight: '600',
  },
  registerText: {
    color: colors.primary,
  },
  card: {
    borderRadius: 12,
    padding: spacing.sm,
    marginBottom: spacing.lg,
    borderWidth: 1,
  }
});