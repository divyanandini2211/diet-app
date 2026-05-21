import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Modal, Alert, Animated } from 'react-native';
import axios from 'axios';
import * as ImagePicker from 'expo-image-picker';

export default function PatientDashboard({ route, navigation }) {
  const { user } = route.params || {}; 
  const myRealId = user?._id || user?.id || user?.user?._id || user?.user?.id;

  const [dietPlan, setDietPlan] = useState(null);
  const [newWeight, setNewWeight] = useState('');
  const [analyzing, setAnalyzing] = useState(false); 
  const [aiResult, setAiResult] = useState(null);
  const [todaysMacros, setTodaysMacros] = useState({ calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 });
  
  // Animation values for macro bars
  const proteinAnim = useRef(new Animated.Value(0)).current;
  const carbsAnim = useRef(new Animated.Value(0)).current;
  const fatAnim = useRef(new Animated.Value(0)).current;
  const fiberAnim = useRef(new Animated.Value(0)).current;

  // 👉 REPLACE WITH YOUR HOTSPOT IP
  const API_URL = "http://10.49.211.37:5000"; 

  useEffect(() => { fetchMyData(); }, []);

  useEffect(() => {
    // Add listener to refresh data whenever screen is focused
    const unsubscribe = navigation.addListener('focus', () => {
      fetchMyData();
    });
    return unsubscribe;
  }, [navigation]);

  const fetchMyData = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/patient/my-diet/${myRealId}`);
      console.log('📋 Fetched Diet Plan:', res.data?.dailyGoals);
      setDietPlan(res.data);
      // Fetch today's logged meals to calculate totals
      fetchTodaysLogs();
    } catch (e) { console.log("Error fetching diet plan"); }
  };

  const fetchTodaysLogs = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const res = await axios.get(`${API_URL}/api/patient/${myRealId}/today-logs/${today}`);
      if (res.data && Array.isArray(res.data)) {
        let totals = { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };
        res.data.forEach(log => {
          if (log.actualMacros) {
            totals.calories += log.actualMacros.calories || 0;
            totals.protein += log.actualMacros.protein || 0;
            totals.carbs += log.actualMacros.carbs || 0;
            totals.fat += log.actualMacros.fat || 0;
            totals.fiber += log.actualMacros.fiber || 0;
          }
        });
        setTodaysMacros(totals);
        
        // Animate bars filling
        const proteinPercent = Math.min(100, (totals.protein / (dietPlan?.dailyGoals?.proteinTarget || 100)) * 100);
        const carbsPercent = Math.min(100, (totals.carbs / (dietPlan?.dailyGoals?.carbsTarget || 250)) * 100);
        const fatPercent = Math.min(100, (totals.fat / (dietPlan?.dailyGoals?.fatTarget || 65)) * 100);
        const fiberPercent = Math.min(100, (totals.fiber / (dietPlan?.dailyGoals?.fiberTarget || 30)) * 100);
        
        Animated.timing(proteinAnim, { toValue: proteinPercent, duration: 600, useNativeDriver: false }).start();
        Animated.timing(carbsAnim, { toValue: carbsPercent, duration: 600, useNativeDriver: false }).start();
        Animated.timing(fatAnim, { toValue: fatPercent, duration: 600, useNativeDriver: false }).start();
        Animated.timing(fiberAnim, { toValue: fiberPercent, duration: 600, useNativeDriver: false }).start();
      }
    } catch (e) { console.log("No logs yet for today"); }
  };

  const submitWeight = async () => {
    try {
      await axios.post(`${API_URL}/api/patient/update-weight`, { patientId: myRealId, weight: newWeight });
      alert("Weight updated!");
      setNewWeight('');
    } catch (e) { alert("Error updating weight"); }
  };

  // 🌟 NEW: This function asks the user if they want Camera or Gallery
  const handleLogMeal = (sessionName) => {
    Alert.alert(
      `Log ${sessionName}`,
      "Where is the photo?",
      [
        { text: "Take Photo (Camera)", onPress: () => processImage(sessionName, 'camera') },
        { text: "Upload from Gallery", onPress: () => processImage(sessionName, 'gallery') },
        { text: "Cancel", style: "cancel" }
      ]
    );
  };

  // 🌟 NEW: Handles BOTH Camera and Gallery!
  const processImage = async (sessionName, source) => {
    let result;
    
    if (source === 'camera') {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) return alert("Camera access needed!");
      result = await ImagePicker.launchCameraAsync({ allowsEditing: true, quality: 0.3, base64: true });
    } else {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) return alert("Gallery access needed!");
      result = await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, quality: 0.3, base64: true });
    }

    if (!result.canceled) {
      setAnalyzing(true);
      try {
        const today = new Date().toISOString().split('T')[0];
        const res = await axios.post(`${API_URL}/api/patient/${myRealId}/analyze-meal`, {
          sessionName: sessionName, date: today, imageBase64: result.assets[0].base64
        });
        console.log('✅ Meal analyzed:', res.data);
        setAiResult(res.data);
        
        // Refresh logs immediately so bars animate
        setTimeout(() => {
          fetchTodaysLogs();
        }, 500);
      } catch (error) {
        console.log('❌ Error analyzing meal:', error.message);
        alert("Error analyzing meal. Check console for details.");
      } finally {
        setAnalyzing(false);
      }
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#F4F7FA' }}>
      <ScrollView style={styles.container}>
        <View style={styles.welcomeRow}>
          <Text style={styles.welcome}>Welcome, {user?.name || "Patient"}</Text>
          <TouchableOpacity 
            style={styles.profileBtn}
            onPress={() => navigation.navigate('PatientProfile', { user })}
          >
            <Text style={styles.profileBtnText}>👤 Profile</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.alertCard}>
          <Text style={styles.alertTitle}>Foods to Avoid</Text>
          <Text style={styles.alertText}>{dietPlan?.avoidables || "No specific restrictions set."}</Text>
        </View>

        {/* DAILY PROGRESS CARD */}
        <View style={styles.progressCard}>
          <Text style={styles.progressTitle}>📈 Daily Progress</Text>
          
          {/* Circular Progress + Calorie Count */}
          <View style={styles.calorieRow}>
            {/* Circular Progress */}
            <View style={styles.circularProgressContainer}>
              <View style={[styles.circularProgress, {
                borderColor: '#E0E0E0',
                borderTopColor: '#FF9800',
                borderRightColor: '#FF9800',
                borderBottomColor: '#FF9800',
                borderLeftColor: '#E0E0E0'
              }]}>
                <Text style={styles.circularLabel}>CALORIES</Text>
              </View>
            </View>
            
            {/* Calorie Count Text */}
            <View style={styles.calorieTextColumn}>
              <Text style={styles.calorieCount}>{Math.round(todaysMacros.calories)}</Text>
              <Text style={styles.calorieTarget}>/ {dietPlan?.dailyGoals?.calorieTarget || 2000}</Text>
              <Text style={styles.calorieUnit}>KCAL</Text>
            </View>
          </View>
          
          {/* Macro Bars */}
          <View style={styles.macroBarContainer}>
            {/* Protein Bar */}
            <View style={styles.macroBarRow}>
              <Text style={styles.macroBarLabel}>Protein</Text>
              <View style={styles.barBackground}>
                <Animated.View style={[styles.barFill, {
                  width: proteinAnim.interpolate({
                    inputRange: [0, 100],
                    outputRange: ['0%', '100%']
                  }),
                  backgroundColor: '#4CAF50'
                }]} />
              </View>
              <Text style={styles.macroBarValue}>{Math.round(todaysMacros.protein)}g / {dietPlan?.dailyGoals?.proteinTarget || 100}g</Text>
            </View>
            
            {/* Carbs Bar */}
            <View style={styles.macroBarRow}>
              <Text style={styles.macroBarLabel}>Carbs</Text>
              <View style={styles.barBackground}>
                <Animated.View style={[styles.barFill, {
                  width: carbsAnim.interpolate({
                    inputRange: [0, 100],
                    outputRange: ['0%', '100%']
                  }),
                  backgroundColor: '#2196F3'
                }]} />
              </View>
              <Text style={styles.macroBarValue}>{Math.round(todaysMacros.carbs)}g / {dietPlan?.dailyGoals?.carbsTarget || 250}g</Text>
            </View>
            
            {/* Fat Bar */}
            <View style={styles.macroBarRow}>
              <Text style={styles.macroBarLabel}>Fat</Text>
              <View style={styles.barBackground}>
                <Animated.View style={[styles.barFill, {
                  width: fatAnim.interpolate({
                    inputRange: [0, 100],
                    outputRange: ['0%', '100%']
                  }),
                  backgroundColor: '#9C27B0'
                }]} />
              </View>
              <Text style={styles.macroBarValue}>{Math.round(todaysMacros.fat)}g / {dietPlan?.dailyGoals?.fatTarget || 65}g</Text>
            </View>
            
            {/* Fiber Bar */}
            <View style={styles.macroBarRow}>
              <Text style={styles.macroBarLabel}>Fiber</Text>
              <View style={styles.barBackground}>
                <Animated.View style={[styles.barFill, {
                  width: fiberAnim.interpolate({
                    inputRange: [0, 100],
                    outputRange: ['0%', '100%']
                  }),
                  backgroundColor: '#9C27B0'
                }]} />
              </View>
              <Text style={styles.macroBarValue}>{Math.round(todaysMacros.fiber)}g / {dietPlan?.dailyGoals?.fiberTarget || 30}g</Text>
            </View>
          </View>
        </View>

        <View style={styles.aiSection}>
          <Text style={styles.aiTitle}>Log Your Meal</Text>
          {analyzing ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color="#005BB5" />
              <Text style={styles.loadingText}>AI is analyzing your meal...</Text>
            </View>
          ) : (
            <View style={styles.mealButtons}>
              {/* 👉 BUTTONS NOW CALL THE POPUP MENU FIRST */}
              <TouchableOpacity style={styles.aiBtn} onPress={() => handleLogMeal("Breakfast")}><Text style={styles.aiBtnText}>📸 Breakfast</Text></TouchableOpacity>
              <TouchableOpacity style={styles.aiBtn} onPress={() => handleLogMeal("Lunch")}><Text style={styles.aiBtnText}>📸 Lunch</Text></TouchableOpacity>
              <TouchableOpacity style={styles.aiBtn} onPress={() => handleLogMeal("Dinner")}><Text style={styles.aiBtnText}>📸 Dinner</Text></TouchableOpacity>
            </View>
          )}
        </View>

        <TouchableOpacity style={styles.dietBtn} onPress={() => navigation.navigate('PatientDietView', { patientId: myRealId })}>
          <Text style={styles.dietBtnText}>📋 View Your Diet Plan</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* 🟦 PURE BLUE & WHITE MODAL */}
      <Modal visible={aiResult !== null} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            
            <View style={styles.modalHeader}>
              <Text style={styles.statusBadge}>Status: {aiResult?.status || 'UNKNOWN'}</Text>
            </View>

            <Text style={[styles.feedbackText, aiResult?.feedback?.includes('WARNING') && { color: '#D32F2F', fontWeight: 'bold' }]}>
              {aiResult?.feedback || 'No feedback available'}
            </Text>

            <Text style={styles.detectedTitle}>Food Detected:</Text>
            <Text style={styles.detectedItems}>{aiResult?.aiDetectedItems?.join(', ') || "None"}</Text>

            <View style={styles.macroTable}>
              <View style={styles.macroCol}>
                <Text style={styles.macroHeader}>Macro</Text>
                <Text style={styles.macroLabel}>Calories</Text>
                <Text style={styles.macroLabel}>Protein</Text>
                <Text style={styles.macroLabel}>Carbs</Text>
              </View>
              <View style={styles.macroCol}>
                <Text style={styles.macroHeader}>Target</Text>
                <Text style={styles.macroValue}>{aiResult?.prescribedMacros?.calories || 0}</Text>
                <Text style={styles.macroValue}>{aiResult?.prescribedMacros?.protein || 0}g</Text>
                <Text style={styles.macroValue}>{aiResult?.prescribedMacros?.carbs || 0}g</Text>
              </View>
              <View style={styles.macroCol}>
                <Text style={styles.macroHeader}>Actual</Text>
                <Text style={[styles.macroValue, styles.actualValue]}>{aiResult?.actualMacros?.calories || 0}</Text>
                <Text style={[styles.macroValue, styles.actualValue]}>{aiResult?.actualMacros?.protein || 0}g</Text>
                <Text style={[styles.macroValue, styles.actualValue]}>{aiResult?.actualMacros?.carbs || 0}g</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.closeBtn} onPress={() => setAiResult(null)}>
              <Text style={styles.closeBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  welcomeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, gap: 12 },
  welcome: { flex: 1, fontSize: 26, fontWeight: '800', color: '#002244', letterSpacing: 0.5 },
  alertCard: { backgroundColor: '#FFFFFF', padding: 18, borderRadius: 12, borderLeftWidth: 5, borderLeftColor: '#005BB5', marginBottom: 20, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  alertTitle: { color: '#003366', fontWeight: 'bold', fontSize: 16 },
  alertText: { color: '#333333', marginTop: 5, fontSize: 14 },
  
  progressCard: { backgroundColor: '#F0F8FF', padding: 18, borderRadius: 12, borderLeftWidth: 5, borderLeftColor: '#FF9800', marginBottom: 20, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  progressTitle: { color: '#003366', fontWeight: '800', fontSize: 16, marginBottom: 15 },
  calorieRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  circularProgressContainer: { alignItems: 'center', justifyContent: 'center' },
  circularProgress: { width: 120, height: 120, borderRadius: 100, borderWidth: 8, justifyContent: 'center', alignItems: 'center' },
  circularLabel: { fontSize: 12, fontWeight: '700', color: '#666', textAlign: 'center' },
  calorieTextColumn: { alignItems: 'flex-end' },
  calorieCount: { fontSize: 28, fontWeight: '800', color: '#FF9800' },
  calorieTarget: { fontSize: 16, fontWeight: '600', color: '#666', marginTop: 2 },
  calorieUnit: { fontSize: 11, fontWeight: '700', color: '#999', marginTop: 4 },
  macroBarContainer: { gap: 12 },
  macroBarRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  macroBarLabel: { width: 60, fontWeight: '600', color: '#333', fontSize: 13 },
  barBackground: { flex: 1, height: 8, backgroundColor: '#E0E0E0', borderRadius: 4, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 4 },
  macroBarValue: { minWidth: 85, textAlign: 'right', fontWeight: '600', color: '#333', fontSize: 11 },
  
  dietBtn: { backgroundColor: '#003366', padding: 18, borderRadius: 12, alignItems: 'center', marginTop: 20, shadowColor: '#003366', shadowOpacity: 0.2, shadowRadius: 6, elevation: 4 },
  dietBtnText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 16 },
  aiSection: { backgroundColor: '#FFFFFF', padding: 20, borderRadius: 12, marginBottom: 10, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  aiTitle: { fontSize: 18, fontWeight: '700', color: '#003366', marginBottom: 15, textAlign: 'center' },
  mealButtons: { flexDirection: 'row', justifyContent: 'space-between' },
  aiBtn: { backgroundColor: '#005BB5', padding: 14, borderRadius: 8, width: '31%', alignItems: 'center' },
  aiBtnText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 12 },
  loadingBox: { alignItems: 'center', padding: 10 },
  loadingText: { marginTop: 10, color: '#005BB5', fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,34,68,0.6)', justifyContent: 'center', alignItems: 'center' },
  modalCard: { width: '90%', backgroundColor: '#FFFFFF', borderRadius: 16, padding: 24, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 15, elevation: 10 },
  modalHeader: { alignItems: 'center', marginBottom: 15 },
  statusBadge: { backgroundColor: '#E6F0FA', color: '#005BB5', paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20, fontWeight: '800', fontSize: 16, overflow: 'hidden' },
  feedbackText: { fontStyle: 'italic', color: '#444', textAlign: 'center', marginBottom: 20, fontSize: 15, lineHeight: 22 },
  detectedTitle: { fontWeight: '700', color: '#002244', fontSize: 15 },
  detectedItems: { color: '#005BB5', marginBottom: 20, fontSize: 15, fontWeight: '500' },
  macroTable: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#F4F7FA', padding: 15, borderRadius: 12, marginBottom: 25 },
  macroCol: { alignItems: 'center' },
  macroHeader: { fontWeight: '800', color: '#003366', marginBottom: 10, fontSize: 13, textTransform: 'uppercase' },
  macroLabel: { color: '#555', marginBottom: 6, fontWeight: '600' },
  macroValue: { color: '#333', marginBottom: 6 },
  actualValue: { fontWeight: '800', color: '#005BB5' },
  closeBtn: { backgroundColor: '#003366', padding: 15, borderRadius: 10, alignItems: 'center' },
  closeBtnText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 16 },

  profileBtn: {
    backgroundColor: '#005BB5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  profileBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
});