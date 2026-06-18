import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, Alert } from 'react-native';
import axios from 'axios';
import CircularProgress from 'react-native-circular-progress-indicator'; 
import { Ionicons } from '@expo/vector-icons'; 

export default function PatientDashboard({ route, navigation }) {
  const { user } = route.params || {}; 
  const myRealId = user?._id || user?.id || user?.user?._id || user?.user?.id;

  const [dietPlan, setDietPlan] = useState(null);
  const [todaysMacros, setTodaysMacros] = useState({ calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 });
  const [hasUnread, setHasUnread] = useState(false); 
  
  const proteinAnim = useRef(new Animated.Value(0)).current;
  const carbsAnim = useRef(new Animated.Value(0)).current;
  const fatAnim = useRef(new Animated.Value(0)).current;
  const fiberAnim = useRef(new Animated.Value(0)).current;

  const API_URL = process.env.EXPO_PUBLIC_API_URL;

  useEffect(() => {
    fetchMyData();
    checkUnreadMessages();

    const unsubscribe = navigation.addListener('focus', () => { 
      fetchMyData(); 
      checkUnreadMessages(); 
    });
    
    return unsubscribe;
  }, [navigation, myRealId]);

  // ✅ FIX: Use the exact same history-based logic as the Dietitian Dashboard
  const checkUnreadMessages = async () => {
    if (!myRealId) return; 
    try {
      // 1. Get the dietitian's details to obtain their ID
      const dietitianRes = await axios.get(`${API_URL}/api/chat/get-dietitian`);
      if (dietitianRes.data && dietitianRes.data._id) {
        const dietitianId = dietitianRes.data._id;
        
        // 2. Fetch the actual chat history between this patient and dietitian
        const chatRes = await axios.get(`${API_URL}/api/chat/history/${myRealId}/${dietitianId}`);
        const history = chatRes.data;
        
        if (history && history.length > 0) {
          const lastMsg = history[history.length - 1];
          
          // 3. Only show red dot if the last message was sent BY the dietitian, and is UNREAD
          if (lastMsg.senderId === dietitianId && lastMsg.read === false) {
            setHasUnread(true);
            return;
          }
        }
      }
      // Default to false if no messages or the last message was read/sent by patient
      setHasUnread(false);
    } catch (e) { 
      console.log("Error checking unread messages on patient side:", e); 
    }
  };

  const fetchMyData = async () => {
    if (!myRealId) return;
    try {
      const res = await axios.get(`${API_URL}/api/patient/my-diet/${myRealId}`);
      setDietPlan(res.data);
      fetchTodaysLogs(res.data); 
    } catch (e) { 
      console.log("Error fetching diet plan"); 
    }
  };

  const fetchTodaysLogs = async (currentDietPlan) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const res = await axios.get(`${API_URL}/api/patient/${myRealId}/today-logs/${today}`);
      if (res.data && Array.isArray(res.data)) {
        let totals = { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };
        
        res.data.forEach(log => {
          if (log.actualMacros && log.approvalStatus === 'APPROVED') {
            totals.calories += log.actualMacros.calories || 0;
            totals.protein += log.actualMacros.protein || 0;
            totals.carbs += log.actualMacros.carbs || 0;
            totals.fat += log.actualMacros.fat || 0;
            totals.fiber += log.actualMacros.fiber || 0;
          }
        });
        
        setTodaysMacros(totals);
        
        const safePlan = currentDietPlan || dietPlan;
        const pPercent = Math.min(100, (totals.protein / (safePlan?.dailyGoals?.proteinTarget || 100)) * 100);
        const cPercent = Math.min(100, (totals.carbs / (safePlan?.dailyGoals?.carbsTarget || 250)) * 100);
        const fPercent = Math.min(100, (totals.fat / (safePlan?.dailyGoals?.fatTarget || 65)) * 100);
        const fiPercent = Math.min(100, (totals.fiber / (safePlan?.dailyGoals?.fiberTarget || 30)) * 100);
        
        Animated.timing(proteinAnim, { toValue: pPercent, duration: 600, useNativeDriver: false }).start();
        Animated.timing(carbsAnim, { toValue: cPercent, duration: 600, useNativeDriver: false }).start();
        Animated.timing(fatAnim, { toValue: fPercent, duration: 600, useNativeDriver: false }).start();
        Animated.timing(fiberAnim, { toValue: fiPercent, duration: 600, useNativeDriver: false }).start();
      }
    } catch (e) { 
      console.log("No logs yet for today"); 
    }
  };

  const getMacroColor = (actual, target) => {
    if (!target || target === 0) return '#005BB5';
    return actual >= target ? '#D32F2F' : '#005BB5'; 
  };

  const calTarget = dietPlan?.dailyGoals?.calorieTarget || 2000;
  const proTarget = dietPlan?.dailyGoals?.proteinTarget || 100;
  const carbTarget = dietPlan?.dailyGoals?.carbsTarget || 250;
  const fatTarget = dietPlan?.dailyGoals?.fatTarget || 65;
  const fiberTarget = dietPlan?.dailyGoals?.fiberTarget || 30;

  const calColor = getMacroColor(todaysMacros.calories, calTarget);
  const proColor = getMacroColor(todaysMacros.protein, proTarget);
  const carbColor = getMacroColor(todaysMacros.carbs, carbTarget);
  const fatColor = getMacroColor(todaysMacros.fat, fatTarget);
  const fiberColor = getMacroColor(todaysMacros.fiber, fiberTarget);

  const openChatWithDietitian = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/chat/get-dietitian`);
      if (res.data) {
        
        // Instant visual feedback
        setHasUnread(false); 

        navigation.navigate('Chat', { 
          currentUserId: myRealId, 
          receiverId: res.data._id, 
          receiverName: "My Dietitian" 
        });
      } else {
        Alert.alert("Error", "No dietitian found in the system yet.");
      }
    } catch (e) { 
      Alert.alert("Error", "Could not connect to chat.");
      console.log(e); 
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#F4F7FA' }}>
      <ScrollView style={styles.container}>
        <View style={styles.welcomeRow}>
          <Text style={styles.welcome}>Welcome, {user?.name || "Patient"}</Text>
          <TouchableOpacity style={styles.profileBtn} onPress={() => navigation.navigate('PatientProfile', { user })}>
            <Ionicons name="person-circle" size={18} color="#FFF" style={{ marginRight: 6 }} />
            <Text style={styles.profileBtnText}>Profile</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.alertCard}>
          <View style={styles.cardHeaderRow}>
            <Ionicons name="warning" size={20} color="#005BB5" />
            <Text style={styles.alertTitle}>Foods to Avoid</Text>
          </View>
          <Text style={styles.alertText}>{dietPlan?.avoidables || "No specific restrictions set."}</Text>
        </View>

        <View style={styles.progressCard}>
          <View style={styles.cardHeaderRow}>
            <Ionicons name="stats-chart" size={20} color="#003366" />
            <Text style={styles.progressTitle}>Daily Progress</Text>
          </View>
          
          <View style={styles.calorieRow}>
            <View style={styles.circularProgressContainer}>
              <CircularProgress
                value={Math.round(todaysMacros.calories)}
                radius={55}
                maxValue={calTarget}
                activeStrokeColor={calColor}
                inActiveStrokeColor={'#E0E0E0'}
                activeStrokeWidth={10}
                inActiveStrokeWidth={10}
                showProgressValue={false} 
                title={"CALORIES"}        
                titleColor={'#666'}
                titleStyle={{ fontWeight: '700', fontSize: 12 }}
              />
            </View>
            <View style={styles.calorieTextColumn}>
              <Text style={[styles.calorieCount, { color: calColor }]}>{Math.round(todaysMacros.calories)}</Text>
              <Text style={styles.calorieTarget}>/ {calTarget}</Text>
              <Text style={styles.calorieUnit}>KCAL</Text>
            </View>
          </View>
          
          <View style={styles.macroBarContainer}>
            <View style={styles.macroBarRow}>
              <Text style={styles.macroBarLabel}>Protein</Text>
              <View style={styles.barBackground}>
                <Animated.View style={[styles.barFill, { width: proteinAnim.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }), backgroundColor: proColor }]} />
              </View>
              <Text style={[styles.macroBarValue, { color: proColor }]}>{Math.round(todaysMacros.protein)}g / {proTarget}g</Text>
            </View>
            
            <View style={styles.macroBarRow}>
              <Text style={styles.macroBarLabel}>Carbs</Text>
              <View style={styles.barBackground}>
                <Animated.View style={[styles.barFill, { width: carbsAnim.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }), backgroundColor: carbColor }]} />
              </View>
              <Text style={[styles.macroBarValue, { color: carbColor }]}>{Math.round(todaysMacros.carbs)}g / {carbTarget}g</Text>
            </View>
            
            <View style={styles.macroBarRow}>
              <Text style={styles.macroBarLabel}>Fat</Text>
              <View style={styles.barBackground}>
                <Animated.View style={[styles.barFill, { width: fatAnim.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }), backgroundColor: fatColor }]} />
              </View>
              <Text style={[styles.macroBarValue, { color: fatColor }]}>{Math.round(todaysMacros.fat)}g / {fatTarget}g</Text>
            </View>
            
            <View style={styles.macroBarRow}>
              <Text style={styles.macroBarLabel}>Fiber</Text>
              <View style={styles.barBackground}>
                <Animated.View style={[styles.barFill, { width: fiberAnim.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }), backgroundColor: fiberColor }]} />
              </View>
              <Text style={[styles.macroBarValue, { color: fiberColor }]}>{Math.round(todaysMacros.fiber)}g / {fiberTarget}g</Text>
            </View>
          </View>
        </View>

      </ScrollView>

      {/* FLOATING CHAT BUTTON */}
      <TouchableOpacity style={styles.floatingChatBtn} onPress={openChatWithDietitian}>
        <Ionicons name="chatbubbles" size={28} color="#FFF" />
        {hasUnread && <View style={styles.redDot} />}
      </TouchableOpacity>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, paddingTop: 50 },
  welcomeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  welcome: { flex: 1, fontSize: 26, fontWeight: '800', color: '#002244' },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  alertCard: { backgroundColor: '#FFFFFF', padding: 18, borderRadius: 12, borderLeftWidth: 5, borderLeftColor: '#005BB5', marginBottom: 35, elevation: 2 },
  alertTitle: { color: '#003366', fontWeight: 'bold', fontSize: 16, marginLeft: 8 },
  alertText: { color: '#333333', marginTop: 5, fontSize: 14, marginLeft: 28 },
  progressCard: { backgroundColor: '#FFFFFF', padding: 20, borderRadius: 12, elevation: 3, marginBottom: 80 }, 
  progressTitle: { color: '#003366', fontWeight: '800', fontSize: 16, marginLeft: 8 },
  calorieRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 25, marginTop: 10 },
  circularProgressContainer: { alignItems: 'center', justifyContent: 'center' },
  calorieTextColumn: { alignItems: 'flex-end' },
  calorieCount: { fontSize: 32, fontWeight: '800' },
  calorieTarget: { fontSize: 16, fontWeight: '600', color: '#666' },
  calorieUnit: { fontSize: 11, fontWeight: '700', color: '#999', marginTop: 4 },
  macroBarContainer: { gap: 14 },
  macroBarRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  macroBarLabel: { width: 60, fontWeight: '600', color: '#333', fontSize: 13 },
  barBackground: { flex: 1, height: 8, backgroundColor: '#E0E0E0', borderRadius: 4, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 4 },
  macroBarValue: { minWidth: 85, textAlign: 'right', fontWeight: '700', fontSize: 12 },
  profileBtn: { flexDirection: 'row', backgroundColor: '#005BB5', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  profileBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },
  floatingChatBtn: { 
    position: 'absolute', bottom: 30, right: 25, backgroundColor: '#005BB5', width: 65, height: 65, borderRadius: 35, 
    justifyContent: 'center', alignItems: 'center', elevation: 8, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 5, shadowOffset: { width: 0, height: 4 } 
  },
  redDot: { 
    position: 'absolute', top: 12, right: 14, backgroundColor: '#EF4444', width: 14, height: 14, borderRadius: 7, borderWidth: 2, borderColor: '#005BB5' 
  }
});