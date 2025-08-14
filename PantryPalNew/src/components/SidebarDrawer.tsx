// PantryPalNew/src/components/SidebarDrawer.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { DrawerContentScrollView } from '@react-navigation/drawer';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../auth/AuthProvider';

export default function SidebarDrawer(props: any) {
  const { user, logout, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6D98BA" />
      </View>
    );
  }

  return (
    <DrawerContentScrollView {...props} contentContainerStyle={styles.container}>
      {user ? (
        // Authenticated user menu
        <>
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => props.navigation.navigate('Profile')}
          >
            <Ionicons name="person" size={20} color="#2A3D45" style={styles.icon} />
            <Text style={styles.link}>Profile</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => props.navigation.navigate('Settings')}
          >
            <Ionicons name="settings" size={20} color="#2A3D45" style={styles.icon} />
            <Text style={styles.link}>Settings</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={logout}
            disabled={loading}
          >
            <Ionicons name="log-out" size={20} color="red" style={styles.icon} />
            <Text style={[styles.link, { color: 'red' }]}>Logout</Text>
          </TouchableOpacity>
        </>
      ) : (
        // Guest user menu
        <>
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => props.navigation.navigate('Login')}
          >
            <Ionicons name="log-in" size={20} color="#2A3D45" style={styles.icon} />
            <Text style={styles.link}>Login</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => props.navigation.navigate('Register')}
          >
            <Ionicons name="person-add" size={20} color="#2A3D45" style={styles.icon} />
            <Text style={styles.link}>Register</Text>
          </TouchableOpacity>
        </>
      )}
    </DrawerContentScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  icon: {
    marginRight: 15,
    width: 24,
  },
  link: {
    fontSize: 18,
    fontFamily: 'Poppins_400Regular',
    color: '#2A3D45',
  },
});