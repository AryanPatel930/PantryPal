import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { Ionicons } from '@expo/vector-icons';
import BottomTabs from './BottomTabs';
import SettingsScreen from '../screens/SettingsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import TopBar from '../components/TopBar';
import { RootDrawerParamList } from './types';
import { useAuth } from '../auth/AuthProvider';

const Drawer = createDrawerNavigator<RootDrawerParamList>();

const RootNavigator = () => {
  const { user } = useAuth();

  return (
    <Drawer.Navigator
      initialRouteName={user ? 'MainTabs' : 'Login'}
      screenOptions={({ route, navigation }) => ({
        // ⬇️ FIX: Hide the header on the Drawer Navigator
        headerShown: false,
        drawerPosition: 'left',
        drawerStyle: {
          backgroundColor: '#FBFEF9',
          width: 280,
        },
        drawerActiveTintColor: '#C84630',
        drawerInactiveTintColor: '#696D7D',
        drawerLabelStyle: {
          fontFamily: 'Poppins',
          fontSize: 16,
        },
      })}
    >
      {user ? (
        <>
          <Drawer.Screen 
            name="MainTabs" 
            component={BottomTabs}
            options={{
              drawerLabel: 'Home',
              drawerIcon: ({ color }) => (
                <Ionicons name="home" size={20} color={color} />
              )
            }}
          />
          <Drawer.Screen 
            name="Settings" 
            component={SettingsScreen}
            options={{
              drawerLabel: 'Settings',
              drawerIcon: ({ color }) => (
                <Ionicons name="settings" size={20} color={color} />
              )
            }}
          />
          <Drawer.Screen 
            name="Profile" 
            component={ProfileScreen}
            options={{
              drawerLabel: 'Logout',
              drawerIcon: ({ color }) => (
                <Ionicons name="log-out" size={20} color={color} />
              )
            }}
          />
        </>
      ) : (
        <>
          <Drawer.Screen 
            name="Login" 
            component={LoginScreen}
            options={{
              drawerLabel: 'Login',
              drawerIcon: ({ color }) => (
                <Ionicons name="log-in" size={20} color={color} />
              )
            }}
          />
          <Drawer.Screen 
            name="Register" 
            component={RegisterScreen}
            options={{
              drawerLabel: 'Register',
              drawerIcon: ({ color }) => (
                <Ionicons name="person-add" size={20} color={color} />
              )
            }}
          />
        </>
      )}
    </Drawer.Navigator>
  );
};

// FIX: This function is no longer needed since BottomTabs handles its own header
// function getScreenTitle(routeName: string): string {
//   const titleMap: Record<string, string> = {
//     Home: 'Home',
//     AddItem: 'Add Item',
//     Inventory: 'Inventory',
//     Settings: 'Settings',
//     Profile: 'Profile',
//     Login: 'Login',
//     Register: 'Register',
//     ChangePassword: 'Change Password'
//   };
//   return titleMap[routeName] || 'PantryPal';
// }

export default RootNavigator;