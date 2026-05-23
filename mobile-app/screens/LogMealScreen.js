import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Modal, ActivityIndicator, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';

export default function LogMealScreen({ route, navigation }) {
  const { patientId } = route.params || {};
  const [session, setSession] = useState('Lunch');
  const [analyzing, setAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [history, setHistory] = useState([]); // Must always remain an array!

  const API_URL = process.env.EXPO_PUBLIC_API_URL;

  useEffect(() => {
    // CRASH FIX 1: Only fetch if patientId actually exists!
    if (patientId) {
      fetchHistory();
    }
    const unsubscribe = navigation.addListener('focus', () => { 
      if (patientId) fetchHistory(); 
    });
    return unsubscribe;
  }, [navigation, patientId]);

  const fetchHistory = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/dietitian/patient/${patientId}/all-logs`);
      // CRASH FIX 2: Force it to be an array so .map() never crashes
      if (Array.isArray(res.data)) {
        setHistory(res.data);
      } else {
        setHistory([]); 
      }
    } catch (e) { 
      console.log("Error fetching history"); 
      setHistory([]); // Fallback to empty array on error
    }
  };

  const handleLogMeal = (source) => {
    if (!patientId) {
      Alert.alert("Error", "Session expired. Please log out and log back in.");
      return;
    }

    Alert.alert(
      `Log ${session}`, "Where is the photo?",
      [
        { text: "Camera", onPress: () => processImage(source, 'camera') },
        { text: "Gallery", onPress: () => processImage(source, 'gallery') },
        { text: "Cancel", style: "cancel" }
      ]
    );
  };

  const processImage = async (source, type) => {
    let result;
    if (type === 'camera') {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') return alert("Camera access needed!");
      result = await ImagePicker.launchCameraAsync({ allowsEditing: true, quality: 0.1, base64: true });
    } else {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') return alert("Gallery access needed!");
      result = await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, quality: 0.1, base64: true });
    }

    if (!result.canceled) {
      setAnalyzing(true);
      try {
        const today = new Date().toISOString().split('T')[0];
        const res = await axios.post(`${API_URL}/api/patient/${patientId}/analyze-meal`, {
          sessionName: session, date: today, imageBase64: result.assets[0].base64
        });
        setAiResult(res.data);
        fetchHistory(); // Refresh history list!
      } catch (error) {
        alert("Error analyzing meal.");
      } finally {
        setAnalyzing(false);
      }
    }
  };

  // CRASH FIX 3: Safe fallback if history is somehow undefined
  const safeHistory = Array.isArray(history) ? history : [];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Log a Meal</Text>
      </View>

      <ScrollView style={{ flex: 1 }}>
        {/* CAMERA SECTION */}
        <View style={styles.cameraCard}>
          <Text style={styles.label}>1. Select Session</Text>
          <View style={styles.sessionRow}>
            {['Breakfast', 'Lunch', 'Dinner'].map((s) => (
              <TouchableOpacity key={s} style={[styles.sessionBtn, session === s && styles.sessionBtnActive]} onPress={() => setSession(s)}>
                <Text style={[styles.sessionText, session === s && styles.sessionTextActive]}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>
          
          <Text style={styles.label}>2. Snap Photo</Text>
          {analyzing ? (
             <View style={styles.loadingBox}>
               <ActivityIndicator size="large" color="#005BB5" />
               <Text style={styles.loadingText}>AI is analyzing...</Text>
             </View>
          ) : (
             <TouchableOpacity style={styles.cameraActionBtn} onPress={handleLogMeal}>
               <Text style={styles.cameraActionText}>📸 Log {session}</Text>
             </TouchableOpacity>
          )}
        </View>

        {/* HISTORY SECTION */}
        <Text style={styles.historyTitle}>Your History</Text>
        {safeHistory.length === 0 ? (
          <Text style={styles.emptyText}>No meals logged yet.</Text>
        ) : (
          safeHistory.map((log) => (
            <View key={log._id || Math.random().toString()} style={styles.historyCard}>
              {log.imageUrl && <Image source={{ uri: log.imageUrl }} style={styles.historyImg} />}
              <View style={styles.historyContent}>
                <View style={styles.historyTop}>
                  <Text style={styles.historyDate}>
                    {log.date ? new Date(log.date).toLocaleDateString() : "Date"} • {log.sessionName}
                  </Text>
                  <Text style={[styles.badge, log.status === 'EXCEEDED' ? styles.badBadge : styles.goodBadge]}>
                    {log.status || "GOOD"}
                  </Text>
                </View>
                <Text style={styles.detectedTitle}>Detected: {log.aiDetectedItems?.join(', ') || "Unknown"}</Text>
                <Text style={styles.macroText}>🔥 {log.actualMacros?.calories || 0} kcal  |  🥩 {log.actualMacros?.protein || 0}g</Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* SUCCESS POPUP MODAL */}
      <Modal visible={aiResult !== null} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
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
                <Text style={styles.macroLabel}>Fat</Text>
                <Text style={styles.macroLabel}>Fiber</Text>
              </View>
              <View style={styles.macroCol}>
                <Text style={styles.macroHeader}>Target</Text>
                <Text style={styles.macroValue}>{aiResult?.prescribedMacros?.calories || 0}</Text>
                <Text style={styles.macroValue}>{aiResult?.prescribedMacros?.protein || 0}g</Text>
                <Text style={styles.macroValue}>{aiResult?.prescribedMacros?.carbs || 0}g</Text>
                <Text style={styles.macroValue}>{aiResult?.prescribedMacros?.fat || 0}g</Text>
                <Text style={styles.macroValue}>{aiResult?.prescribedMacros?.fiber || 0}g</Text>
              </View>
              <View style={styles.macroCol}>
                <Text style={styles.macroHeader}>Actual</Text>
                <Text style={[styles.macroValue, styles.actualValue]}>{aiResult?.actualMacros?.calories || 0}</Text>
                <Text style={[styles.macroValue, styles.actualValue]}>{aiResult?.actualMacros?.protein || 0}g</Text>
                <Text style={[styles.macroValue, styles.actualValue]}>{aiResult?.actualMacros?.carbs || 0}g</Text>
                <Text style={[styles.macroValue, styles.actualValue]}>{aiResult?.actualMacros?.fat || 0}g</Text>
                <Text style={[styles.macroValue, styles.actualValue]}>{aiResult?.actualMacros?.fiber || 0}g</Text>
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
  container: { flex: 1, backgroundColor: '#F4F7FA' },
  header: { backgroundColor: '#003366', padding: 20, paddingTop: 50, paddingBottom: 20, borderBottomLeftRadius: 15, borderBottomRightRadius: 15 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#FFF' },
  cameraCard: { backgroundColor: '#FFF', margin: 20, padding: 20, borderRadius: 12, elevation: 3, borderTopWidth: 4, borderTopColor: '#005BB5' },
  label: { fontSize: 15, fontWeight: '700', color: '#003366', marginBottom: 10 },
  sessionRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 25 },
  sessionBtn: { flex: 1, paddingVertical: 10, marginHorizontal: 4, borderRadius: 8, borderWidth: 1, borderColor: '#DDD', alignItems: 'center' },
  sessionBtnActive: { backgroundColor: '#005BB5', borderColor: '#005BB5' },
  sessionText: { color: '#666', fontWeight: '700', fontSize: 13 },
  sessionTextActive: { color: '#FFF' },
  cameraActionBtn: { backgroundColor: '#003366', padding: 15, borderRadius: 10, alignItems: 'center' },
  cameraActionText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  loadingBox: { alignItems: 'center', padding: 10 },
  loadingText: { marginTop: 10, color: '#005BB5', fontWeight: 'bold' },
  historyTitle: { marginHorizontal: 20, fontSize: 18, fontWeight: '800', color: '#002244', marginBottom: 10 },
  emptyText: { marginHorizontal: 20, color: '#666', fontStyle: 'italic' },
  historyCard: { backgroundColor: '#FFF', marginHorizontal: 20, marginBottom: 15, borderRadius: 12, overflow: 'hidden', elevation: 2 },
  historyImg: { width: '100%', height: 150, backgroundColor: '#E0E0E0' },
  historyContent: { padding: 15 },
  historyTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 },
  historyDate: { fontWeight: '700', color: '#333' },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, fontSize: 10, fontWeight: 'bold', overflow: 'hidden' },
  goodBadge: { backgroundColor: '#E8F5E9', color: '#2E7D32' },
  badBadge: { backgroundColor: '#FFEBEE', color: '#C62828' },
  detectedTitle: { color: '#666', fontSize: 13, marginBottom: 5 },
  macroText: { color: '#005BB5', fontWeight: '800', fontSize: 13 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,34,68,0.6)', justifyContent: 'center', alignItems: 'center' },
  modalCard: { width: '90%', backgroundColor: '#FFFFFF', borderRadius: 16, padding: 24, elevation: 10 },
  modalHeader: { alignItems: 'center', marginBottom: 15 },
  statusBadge: { backgroundColor: '#E6F0FA', color: '#005BB5', paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20, fontWeight: '800', fontSize: 16, overflow: 'hidden' },
  feedbackText: { fontStyle: 'italic', color: '#444', textAlign: 'center', marginBottom: 20, fontSize: 15 },
  detectedItems: { color: '#005BB5', marginBottom: 20, fontSize: 15, fontWeight: '500' },
  macroTable: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#F4F7FA', padding: 15, borderRadius: 12, marginBottom: 25 },
  macroCol: { alignItems: 'center' },
  macroHeader: { fontWeight: '800', color: '#003366', marginBottom: 10, fontSize: 13 },
  macroLabel: { color: '#555', marginBottom: 6, fontWeight: '600' },
  macroValue: { color: '#333', marginBottom: 6 },
  actualValue: { fontWeight: '800', color: '#005BB5' },
  closeBtn: { backgroundColor: '#003366', padding: 15, borderRadius: 10, alignItems: 'center' },
  closeBtnText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 16 }
});