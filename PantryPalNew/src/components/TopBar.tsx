import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { RootDrawerParamList } from '../navigation/types';

interface TopBarProps {
  title: string;
  navigation: DrawerNavigationProp<RootDrawerParamList>;
}

const TopBar: React.FC<TopBarProps> = ({ title, navigation }) => {
  const handleNotificationsPress = () => {
    // Add your notifications navigation logic here
    console.log('Notifications pressed');
    // navigation.navigate('Notifications'); // Uncomment if you have a notifications screen
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => navigation.toggleDrawer()}
        >
          <Ionicons name="menu" size={24} color="#000100" />
        </TouchableOpacity>
        
        <Text style={styles.title}>{title}</Text>
        
        <TouchableOpacity 
          style={styles.notificationsButton}
          onPress={handleNotificationsPress}
        >
          <Ionicons name="notifications-outline" size={24} color="#696D7D" />
          {/* Optional notification badge */}
          {/* <View style={styles.badge}>
            <Text style={styles.badgeText}>3</Text>
          </View> */}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#FBFEF9',
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FBFEF9',
    borderBottomWidth: 1,
    borderBottomColor: '#696D7D',
  },
  menuButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000100',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  notificationsButton: {
    padding: 8,
    position: 'relative', // For badge positioning
  },
  // Optional badge styles
  badge: {
    position: 'absolute',
    right: 2,
    top: 2,
    backgroundColor: '#C84630',
    borderRadius: 10,
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
});

export default TopBar;