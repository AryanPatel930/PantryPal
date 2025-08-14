// src/screens/RegisterScreen.tsx
import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator,
  Alert
} from 'react-native';
import { useAuth } from '../auth/AuthProvider';
import { useTheme } from '@react-navigation/native';
import { DrawerScreenProps } from '@react-navigation/drawer';
import { RootDrawerParamList } from '../navigation/types';
import { colors, spacing, typography } from '../utils/theme';

type RegisterScreenProps = DrawerScreenProps<RootDrawerParamList, 'Register'>;

export default function RegisterScreen({ navigation }: RegisterScreenProps) {
  const { register, loading, error } = useAuth();
  const { colors: navColors } = useTheme();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState(''); // ⬅️ NEW: Confirm password state

  const handleRegister = async () => {
    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      Alert.alert('Validation Error', 'Please fill in all fields.');
      return;
    }

    if (password !== confirmPassword) { // ⬅️ NEW: Check if passwords match
      Alert.alert('Validation Error', 'Passwords do not match.');
      return;
    }

    try {
      const fullName = `${firstName} ${lastName}`;
      await register(email, password, fullName);
      Alert.alert('Success', 'Registration successful! You have been logged in.');
      navigation.navigate('Profile');
    } catch (err: any) {
      Alert.alert('Registration Error', err.message);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: navColors.background }]}>
      <Text style={[styles.title, { color: navColors.text }]}>Create an Account</Text>
      
      {error && <Text style={styles.errorText}>{error}</Text>}

      <TextInput
        style={[styles.input, { borderColor: navColors.border, color: navColors.text }]}
        placeholder="First Name"
        placeholderTextColor={navColors.text}
        value={firstName}
        onChangeText={setFirstName}
      />
      <TextInput
        style={[styles.input, { borderColor: navColors.border, color: navColors.text }]}
        placeholder="Last Name"
        placeholderTextColor={navColors.text}
        value={lastName}
        onChangeText={setLastName}
      />
      <TextInput
        style={[styles.input, { borderColor: navColors.border, color: navColors.text }]}
        placeholder="Email"
        placeholderTextColor={navColors.text}
        keyboardType="email-address"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={[styles.input, { borderColor: navColors.border, color: navColors.text }]}
        placeholder="Password"
        placeholderTextColor={navColors.text}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <TextInput // ⬅️ NEW: Confirm password input
        style={[styles.input, { borderColor: navColors.border, color: navColors.text }]}
        placeholder="Confirm Password"
        placeholderTextColor={navColors.text}
        secureTextEntry
        value={confirmPassword}
        onChangeText={setConfirmPassword}
      />

      <TouchableOpacity
        style={[styles.button, { backgroundColor: navColors.primary }]}
        onPress={handleRegister}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={[styles.buttonText, { color: navColors.text }]}>Register</Text>
        )}
      </TouchableOpacity>
      
      <TouchableOpacity onPress={() => navigation.navigate('Login')}>
        <Text style={[styles.loginText, { color: navColors.text }]}>
          Already have an account? Login
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  title: {
    ...typography.h1,
    fontWeight: 'bold',
    marginBottom: spacing.md,
  },
  input: {
    width: '100%',
    padding: spacing.md,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: spacing.md,
  },
  button: {
    width: '100%',
    padding: spacing.md,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  buttonText: {
    ...typography.body,
    fontWeight: 'bold',
  },
  errorText: {
    ...typography.body,
    color: colors.error,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  loginText: {
    ...typography.body,
    marginTop: spacing.md,
  }
});