import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons'; 

// 👇 Fixed relative paths!
import PatientDashboard from './PatientDashboard'; 
import LogMealScreen from './LogMealScreen'; 
import PatientDietView from './PatientDietView'; 

const Tab = createBottomTabNavigator();

export default function PatientNavigation({ route }) {
  // Grab the user passed from the Login screen
  const { user } = route.params || {};
  const patientId = user?._id || user?.id || user?.user?._id || user?.user?.id;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Home') iconName = focused ? 'home' : 'home-outline';
          else if (route.name === 'Log') iconName = focused ? 'camera' : 'camera-outline';
          else if (route.name === 'Plan') iconName = focused ? 'document-text' : 'document-text-outline';
          
          return <Ionicons name={iconName} size={size + 2} color={color} />;
        },
        tabBarActiveTintColor: '#005BB5',
        tabBarInactiveTintColor: '#94A3B8',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E2E8F0',
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: { fontSize: 12, fontWeight: 'bold' },
        headerShown: false, 
      })}
    >
      <Tab.Screen name="Home" component={PatientDashboard} initialParams={{ user }} />
      <Tab.Screen name="Log" component={LogMealScreen} initialParams={{ patientId }} />
      <Tab.Screen name="Plan" component={PatientDietView} initialParams={{ patientId }} />
    </Tab.Navigator>
  );
}