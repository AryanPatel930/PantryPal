import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useCallback, useState, useEffect } from 'react';
import { ActivityIndicator, View, StyleSheet, Text } from 'react-native';
import { AuthProvider, useAuth } from './src/auth/AuthProvider';
import { colors, PantryPalTheme } from './src/utils/theme';
import { Provider as PaperProvider } from 'react-native-paper';
import { ThemeProvider, useThemeContext } from './src/theme/ThemeProvider';
import './src/firebaseConfig';
import BottomTabs from './src/navigation/BottomTabs';
import SettingsScreen from './src/screens/SettingsScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import ChangePasswordScreen from './src/screens/ChangePasswordScreen';
import TopBar from './src/components/TopBar';
import { RootDrawerParamList } from './src/navigation/types';

SplashScreen.preventAutoHideAsync();

const Drawer = createDrawerNavigator<RootDrawerParamList>();

function AppRouter() {
  const { user, loading, error } = useAuth();
  const { theme } = useThemeContext();

  if (loading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (user && error) {
    console.error('An unexpected auth error occurred with a logged-in user:', error);
  }

  function getScreenTitle(routeName: keyof RootDrawerParamList): string {
    const titleMap: Record<keyof RootDrawerParamList, string> = {
      MainTabs: 'Home',
      Settings: 'Settings',
      Profile: 'Profile',
      Login: 'Login',
      Register: 'Register',
      ChangePassword: 'Change Password',
    };
    return titleMap[routeName];
  }

  return (
    <Drawer.Navigator
      initialRouteName={user ? 'MainTabs' : 'Login'}
      screenOptions={({ route, navigation }) => ({
        // ⬇️ FIX: The header is now always visible and uses TopBar
        header: () => (
          <TopBar
            navigation={navigation}
            title={getScreenTitle(route.name as keyof RootDrawerParamList)}
          />
        ),
        drawerPosition: 'left',
        drawerStyle: {
          backgroundColor: theme.colors.background,
          width: 280,
        },
        drawerActiveTintColor: theme.colors.primary,
        drawerInactiveTintColor: theme.colors.text,
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
              title: 'Home',
              headerShown: false, // ⬅️ HIDE THE DRAWER HEADER for nested screens
            }}
          />
          <Drawer.Screen 
            name="Profile" 
            component={ProfileScreen}
            options={{
              drawerLabel: 'Profile',
              title: 'Profile'
            }}
          />
          <Drawer.Screen 
            name="Settings" 
            component={SettingsScreen}
            options={{
              drawerLabel: 'Settings',
              title: 'Settings'
            }}
          />
          <Drawer.Screen
            name="ChangePassword"
            component={ChangePasswordScreen}
            options={{
              drawerLabel: 'Change Password',
              title: 'Change Password',
              drawerItemStyle: { display: 'none' }
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
              title: 'Login',
              drawerItemStyle: { display: 'none' },
              swipeEnabled: false,
              headerLeft: () => null,
            }}
          />
          <Drawer.Screen 
            name="Register" 
            component={RegisterScreen}
            options={{
              drawerLabel: 'Register',
              title: 'Register',
              drawerItemStyle: { display: 'none' },
              swipeEnabled: false,
              headerLeft: () => null,
            }}
          />
        </>
      )}
    </Drawer.Navigator>
  );
}

function AppWithTheme({ onLayoutRootView }: { onLayoutRootView: () => void }) {
  const { theme } = useThemeContext();

  return (
    <NavigationContainer theme={theme} onReady={onLayoutRootView}>
      <StatusBar style="dark" />
      <AppRouter />
    </NavigationContainer>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    Poppins: require('./assets/fonts/Poppins-Regular.ttf'),
    'Poppins-Bold': require('./assets/fonts/Poppins-Bold.ttf'),
  });

  const [appReady, setAppReady] = useState(false);

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) {
      await SplashScreen.hideAsync();
      setAppReady(true);
    }
  }, [fontsLoaded]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (fontsLoaded && !appReady) {
        setAppReady(true);
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, [fontsLoaded, appReady]);

  if (!fontsLoaded || !appReady) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <AuthProvider>
      <PaperProvider theme={PantryPalTheme}>
        <ThemeProvider>
          <AppWithTheme onLayoutRootView={onLayoutRootView} />
        </ThemeProvider>
      </PaperProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FBFEF9',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
    textAlign: 'center',
    marginBottom: 10,
  },
  errorSubtext: {
    fontSize: 14,
    color: colors.accent,
    textAlign: 'center',
  },
});

// Note: This file is the main entry point for the PantryPal app.
// It sets up the navigation, theming, and authentication context for the app.