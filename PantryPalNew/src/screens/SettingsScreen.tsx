// src/screens/SettingsScreen.tsx
import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Switch, View, Linking, Alert } from 'react-native';
import { List, Divider, useTheme as usePaperTheme } from 'react-native-paper';
import { useTheme as useNavTheme } from '@react-navigation/native';
import { useThemeContext } from '../theme/ThemeProvider';
import { useAuth } from '../auth/AuthProvider';
import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DrawerScreenProps } from '@react-navigation/drawer';
import { RootDrawerParamList } from '../navigation/types';
import { colors, spacing, typography } from '../utils/theme';
import { auth } from '../firebaseConfig';

type SettingsScreenProps = DrawerScreenProps<RootDrawerParamList, 'Settings'>;

export default function SettingsScreen({ navigation }: SettingsScreenProps) {
  const { colors: navColors } = useNavTheme();
  const { isDark, toggleTheme } = useThemeContext();
  const { logout } = useAuth();
  const [notifications, setNotifications] = React.useState(true);
  const [biometricAuth, setBiometricAuth] = React.useState(false);

  React.useEffect(() => {
    const getSettings = async () => {
      try {
        const storedBio = await AsyncStorage.getItem('biometricAuth');
        if (storedBio !== null) setBiometricAuth(storedBio === 'true');
      } catch (e) {
        console.error('Failed to load settings:', e);
      }
    };
    getSettings();
  }, []);

  const handleToggleDarkMode = () => {
    toggleTheme();
  };

  const handleToggleNotifications = () => {
    setNotifications(prev => !prev);
    Alert.alert('Notifications', 'Notification settings are a placeholder. Full implementation would involve subscribing/unsubscribing to push notifications.');
  };

  const handleToggleBiometricAuth = async () => {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    
    if (hasHardware && isEnrolled) {
      if (!biometricAuth) {
        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: 'Enable biometric authentication',
          cancelLabel: 'Cancel',
        });
        if (result.success) {
          await AsyncStorage.setItem('biometricAuth', 'true');
          setBiometricAuth(true);
        }
      } else {
        await AsyncStorage.setItem('biometricAuth', 'false');
          setBiometricAuth(false);
      }
    } else {
      Alert.alert(
        'Biometrics Not Available',
        'Your device does not support biometric authentication or it is not enrolled.'
      );
    }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to log out?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', onPress: () => logout() }
    ]);
  };

  const handleChangePassword = () => {
    navigation.navigate('ChangePassword');
  };
  
  const handleHelpCenter = () => {
    Linking.openURL('https://support.google.com/');
  };

  const handleContactUs = () => {
    Alert.alert(
      'Contact Us',
      'For support, please email us at support@pantrypal.com',
      [
        { text: 'Copy Email', onPress: () => Linking.openURL('mailto:support@pantrypal.com') },
        { text: 'OK' }
      ]
    );
  };
  
  const handleAboutApp = () => {
    Alert.alert('About PantryPal', 'Version 1.0.0\n© 2025 PantryPal Inc.');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: navColors.background }]}>
      <ScrollView>
        <List.Section>
          <List.Subheader style={{ color: navColors.primary }}>App Preferences</List.Subheader>
          <List.Item
            title="Dark Mode"
            titleStyle={{ color: navColors.text }}
            left={() => <List.Icon icon="brightness-4" color={navColors.primary} />}
            right={() => (
              <Switch
                value={isDark}
                onValueChange={handleToggleDarkMode}
                thumbColor={navColors.primary}
                trackColor={{ true: navColors.primary, false: navColors.border }}
              />
            )}
          />
          <Divider />
          <List.Item
            title="Notifications"
            titleStyle={{ color: navColors.text }}
            left={() => <List.Icon icon="bell" color={navColors.primary} />}
            right={() => (
              <Switch
                value={notifications}
                onValueChange={handleToggleNotifications}
                thumbColor={navColors.primary}
                trackColor={{ true: navColors.primary, false: navColors.border }}
              />
            )}
          />
        </List.Section>

        <List.Section>
          <List.Subheader style={{ color: navColors.primary }}>Security</List.Subheader>
          <List.Item
            title="Biometric Authentication"
            titleStyle={{ color: navColors.text }}
            description="Use fingerprint or face recognition"
            descriptionStyle={{ color: colors.lightText }}
            left={() => <List.Icon icon="fingerprint" color={navColors.primary} />}
            right={() => (
              <Switch
                value={biometricAuth}
                onValueChange={handleToggleBiometricAuth}
                thumbColor={navColors.primary}
                trackColor={{ true: navColors.primary, false: navColors.border }}
              />
            )}
          />
          <Divider />
          <List.Item
            title="Change Password"
            titleStyle={{ color: navColors.text }}
            left={() => <List.Icon icon="lock" color={navColors.primary} />}
            onPress={handleChangePassword}
          />
        </List.Section>

        <List.Section>
          <List.Subheader style={{ color: navColors.primary }}>Support</List.Subheader>
          <List.Item
            title="Help Center"
            titleStyle={{ color: navColors.text }}
            left={() => <List.Icon icon="help-circle" color={navColors.primary} />}
            onPress={handleHelpCenter}
          />
          <Divider />
          <List.Item
            title="Contact Us"
            titleStyle={{ color: navColors.text }}
            left={() => <List.Icon icon="email" color={navColors.primary} />}
            onPress={handleContactUs}
          />
          <Divider />
          <List.Item
            title="About App"
            titleStyle={{ color: navColors.text }}
            left={() => <List.Icon icon="information" color={navColors.primary} />}
            onPress={handleAboutApp}
          />
        </List.Section>

        <List.Section>
          <List.Subheader style={{ color: navColors.primary }}>Account</List.Subheader>
          <List.Item
            title="Logout"
            titleStyle={{ color: '#d32f2f' }}
            left={() => <List.Icon icon="logout" color="#d32f2f" />}
            onPress={handleLogout}
          />
        </List.Section>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});