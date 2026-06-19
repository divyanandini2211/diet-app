import React, { useState, useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons'; 
import axios from 'axios';

import DietitianDashboard from './DietitianDashboard'; 
import DietitianChatList from './DietitianChatList'; 

const Tab = createBottomTabNavigator();
const API_URL = process.env.EXPO_PUBLIC_API_URL;

export default function DietitianNavigation({ route }) {
  const { user } = route.params || {};
  const dietitianId = user?._id || user?.id;

  const [hasUnread, setHasUnread] = useState(false);

  // Background check to dynamically light up the tab bar red dot
  useEffect(() => {
    if (!dietitianId) return;

    const checkGlobalUnread = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/chat/unread/${dietitianId}`);
        setHasUnread(res.data.unreadCount > 0);
      } catch (e) {
        console.log("Global unread check error:", e);
      }
    };

    checkGlobalUnread();
    const interval = setInterval(checkGlobalUnread, 5000); // Syncs every 5 seconds
    return () => clearInterval(interval);
  }, [dietitianId]);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Home') iconName = focused ? 'home' : 'home-outline';
          else if (route.name === 'Chats') iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
          
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
      <Tab.Screen name="Home" component={DietitianDashboard} initialParams={{ user }} />
      <Tab.Screen 
        name="Chats" 
        component={DietitianChatList} 
        initialParams={{ user }} 
        options={{
          // ✅ NATIVE TAB BADGE: Shows a clean red dot if hasUnread is true
          tabBarBadge: hasUnread ? '' : null,
          tabBarBadgeStyle: { 
            backgroundColor: '#EF4444', 
            minWidth: 10, 
            height: 10, 
            borderRadius: 5,
            marginTop: -4
          }
        }}
      />
    </Tab.Navigator>
  );
}