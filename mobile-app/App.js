import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import LoginScreen from './screens/LoginScreen';
import PatientNavigation from './screens/PatientNavigation'; // 👈 THE NEW TABS WRAPPER
import PatientDashboard from './screens/PatientDashboard';
import DietitianDashboard from './screens/DietitianDashboard';
import PatientProfileScreen from './screens/PatientProfileScreen';
import DietitianProfileScreen from './screens/DietitianProfileScreen';
import PatientDietView from './screens/PatientDietView';
import DietDetailScreen from './screens/DietDetailScreen';
import ChatScreen from './screens/ChatScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        
        {/* 👇 THIS IS THE TABS SCREEN! */}
        <Stack.Screen name="PatientNavigation" component={PatientNavigation} />
        
        <Stack.Screen name="PatientDashboard" component={PatientDashboard} />
        <Stack.Screen name="DietitianDashboard" component={DietitianDashboard} />
        <Stack.Screen name="PatientProfile" component={PatientProfileScreen} />
        <Stack.Screen name="DietitianProfile" component={DietitianProfileScreen} />
        <Stack.Screen name="PatientDietView" component={PatientDietView} />
        <Stack.Screen name="DietDetail" component={DietDetailScreen} />
        <Stack.Screen name="Chat" component={ChatScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
