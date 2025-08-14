import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useAuth } from '../auth/AuthProvider';
import { useTheme } from '@react-navigation/native';
import { DrawerScreenProps } from '@react-navigation/drawer';
import { RootDrawerParamList } from '../navigation/types';
import { colors, spacing, typography } from '../utils/theme';

type LoginScreenProps = DrawerScreenProps<RootDrawerParamList, 'Login'>;

export default function LoginScreen({ navigation }: LoginScreenProps) {
  const { login, loading, error } = useAuth();
  const { colors: navColors } = useTheme();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    try {
      await login(email, password);
    } catch (err) {
      // The error is now handled and stored by the AuthProvider, so we don't need to do it here.
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: navColors.background }]}>
      <Text style={[styles.title, { color: navColors.text }]}>Login</Text>
      
      {error && <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>}
      
      <TextInput
        style={[styles.input, { borderColor: navColors.border, color: navColors.text }]}
        placeholder="Email"
        placeholderTextColor={colors.lightText}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      
      <TextInput
        style={[styles.input, { borderColor: navColors.border, color: navColors.text }]}
        placeholder="Password"
        placeholderTextColor={colors.lightText}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      
      <TouchableOpacity
        style={[styles.button, { backgroundColor: navColors.primary }]}
        onPress={handleLogin}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color={colors.white} />
        ) : (
          <Text style={[styles.buttonText, { color: colors.white }]}>Login</Text>
        )}
      </TouchableOpacity>
      
      <TouchableOpacity onPress={() => navigation.navigate('Register')}>
        <Text style={[styles.linkText, { color: navColors.primary }]}>Don't have an account? Register</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#FBFEF9',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#000100',
    marginBottom: 20,
    textAlign: 'center',
    fontFamily: 'Poppins-Bold',
  },
  input: {
    height: 50,
    borderColor: '#696D7D',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 15,
    fontFamily: 'Poppins',
  },
  button: {
    backgroundColor: '#6D98BA',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 15,
  },
  buttonText: {
    color: 'white',
    fontFamily: 'Poppins',
    fontSize: 16,
    fontWeight: '600',
  },
  linkText: {
    color: '#6D98BA',
    textAlign: 'center',
    fontFamily: 'Poppins',
  },
  errorText: {
    color: '#C84630',
    marginBottom: 15,
    textAlign: 'center',
    fontFamily: 'Poppins',
  },
});