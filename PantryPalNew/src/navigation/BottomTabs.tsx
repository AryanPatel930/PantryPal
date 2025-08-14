import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
import HomeScreen from '../screens/Home';
import AddItemScreen from '../screens/AddItem';
import InventoryScreen from '../screens/Inventory';
import { BottomTabParamList } from './types';
import TopBar from '../components/TopBar';

const Tab = createBottomTabNavigator<BottomTabParamList>();

export default function BottomTabs({ navigation, route }: { navigation: any, route: any }) {
  const routeName = getFocusedRouteNameFromRoute(route) ?? 'Home';
  
  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={({ route }) => ({
        header: () => (
          <TopBar
            title={route.name}
            navigation={navigation}
          />
        ),
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: any;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'AddItem') {
            iconName = focused ? 'add-circle' : 'add-circle-outline';
          } else if (route.name === 'Inventory') {
            iconName = focused ? 'cube' : 'cube-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#6D98BA',
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: {
          paddingBottom: 6,
          height: 60,
        },
        tabBarShowLabel: true, // ⬅️ FIX: Changed to true to show labels
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen} 
        options={{ title: 'Home' }}
      />
      <Tab.Screen 
        name="AddItem" 
        component={AddItemScreen} 
        options={{ title: 'Add Item' }}
      />
      <Tab.Screen 
        name="Inventory" 
        component={InventoryScreen} 
        options={{ title: 'Inventory' }}
      />
    </Tab.Navigator>
  );
}