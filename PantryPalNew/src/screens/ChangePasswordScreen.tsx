import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, SafeAreaView, Alert, ScrollView } from 'react-native';
import { useAuth } from '../auth/AuthProvider';
import { useThemeContext } from '../theme/ThemeProvider';
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword, sendPasswordResetEmail } from 'firebase/auth';
import { colors, spacing, typography } from '../utils/theme';
import { DrawerScreenProps } from '@react-navigation/drawer';
import { RootDrawerParamList } from '../navigation/types';
import { auth } from '../firebaseConfig'; // ⬅️ FIX: Import auth here

type ChangePasswordScreenProps = DrawerScreenProps<RootDrawerParamList, 'ChangePassword'>;

export default function ChangePasswordScreen({ navigation }: ChangePasswordScreenProps) {
  const { user } = useAuth();
  const { theme } = useThemeContext();
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleChangePassword = async () => {
    setError(null);
    setSuccess(null);

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      setError('Please fill in all fields.');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setError('New passwords do not match.');
      return;
    }

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters long.');
      return;
    }

    if (!user || !user.email) {
      setError('User not authenticated.');
      return;
    }
    
    setLoading(true);

    try {
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);

      setSuccess('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');

      Alert.alert('Success', 'Your password has been changed successfully!');

    } catch (e: any) {
      if (e.code === 'auth/wrong-password') {
        setError('The current password you entered is incorrect.');
      } else if (e.code === 'auth/weak-password') {
        setError('The new password is too weak. Please choose a stronger one.');
      } else {
        setError('Failed to change password. Please try again.');
        console.error('Password change error:', e);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    Alert.prompt(
        "Forgot Password?",
        "Please enter the email address for your account.",
        async (email) => {
            if (email && email.trim() !== '') {
                try {
                    await sendPasswordResetEmail(auth, email);
                    Alert.alert('Success', `A password reset link has been sent to ${email}.`);
                } catch (e: any) {
                    if (e.code === 'auth/user-not-found') {
                        Alert.alert('Error', `No user found with that email address.`);
                    } else {
                        Alert.alert('Error', `Failed to send reset email. Please try again.`);
                    }
                    console.error('Forgot password error:', e);
                }
            }
        },
        'plain-text',
        user?.email || ''
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Change Password</Text>
        <Text style={[styles.subtitle, { color: theme.colors.text }]}>
          Enter your current password and a new one to proceed.
        </Text>

        <TextInput
          style={[styles.input, { borderColor: theme.colors.border, color: theme.colors.text }]}
          placeholder="Current Password"
          placeholderTextColor={theme.colors.lightText}
          secureTextEntry
          value={currentPassword}
          onChangeText={setCurrentPassword}
        />
        
        <TextInput
          style={[styles.input, { borderColor: theme.colors.border, color: theme.colors.text }]}
          placeholder="New Password (min 6 characters)"
          placeholderTextColor={theme.colors.lightText}
          secureTextEntry
          value={newPassword}
          onChangeText={setNewPassword}
        />
        
        <TextInput
          style={[styles.input, { borderColor: theme.colors.border, color: theme.colors.text }]}
          placeholder="Confirm New Password"
          placeholderTextColor={theme.colors.lightText}
          secureTextEntry
          value={confirmNewPassword}
          onChangeText={setConfirmNewPassword}
        />

        {error && <Text style={styles.errorText}>{error}</Text>}
        {success && <Text style={styles.successText}>{success}</Text>}

        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.colors.primary }]}
          onPress={handleChangePassword}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={theme.colors.white} />
          ) : (
            <Text style={[styles.buttonText, { color: theme.colors.white }]}>Change Password</Text>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.forgotPasswordButton} onPress={handleForgotPassword}>
            <Text style={[styles.forgotPasswordText, { color: theme.colors.primary }]}>Forgot Password?</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
    alignItems: 'center',
  },
  title: {
    ...typography.h2,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  input: {
    width: '100%',
    padding: spacing.md,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: spacing.md,
    ...typography.body,
  },
  button: {
    width: '100%',
    padding: spacing.md,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  buttonText: {
    ...typography.body,
    fontWeight: 'bold',
  },
  errorText: {
    ...typography.body,
    color: colors.error,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  successText: {
    ...typography.body,
    color: colors.success,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  forgotPasswordButton: {
    marginTop: spacing.sm,
    padding: spacing.xs,
  },
  forgotPasswordText: {
    ...typography.body,
    fontWeight: 'bold',
  }
});