import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator, Alert, TextInput } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';


export default function LogMealScreen({ route, navigation }) {
  const { patientId } = route.params || {};
  const [analyzing, setAnalyzing] = useState(false);
  const [history, setHistory] = useState([]); 

  const [step, setStep] = useState(1); 
  const [currentImageBase64, setCurrentImageBase64] = useState(null);
  const [currentImageUri, setCurrentImageUri] = useState(null);
  const [capturedAt, setCapturedAt] = useState(null);
  const [displayTime, setDisplayTime] = useState("");
  const [detectedItems, setDetectedItems] = useState([]); 

  const API_URL = process.env.EXPO_PUBLIC_API_URL;

  useEffect(() => {
    if (patientId) fetchHistory();
    const unsubscribe = navigation.addListener('focus', () => { 
      if (patientId) fetchHistory(); 
    });
    return unsubscribe;
  }, [navigation, patientId]);

  const fetchHistory = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/dietitian/patient/${patientId}/all-logs`);
      if (Array.isArray(res.data)) {
        setHistory(res.data);
      } else {
        setHistory([]); 
      }
    } catch (e) { 
      console.log("Error fetching history"); 
      setHistory([]); 
    }
  };

  const handleLogMeal = (source) => {
    if (!patientId) return Alert.alert("Error", "Session expired.");
    Alert.alert("Log Meal", "Where is the photo?", [
      { text: "Camera", onPress: () => processImage(source, 'camera') },
      { text: "Gallery", onPress: () => processImage(source, 'gallery') },
      { text: "Cancel", style: "cancel" }
    ]);
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
      const base64 = result.assets[0].base64;
      const imageUri = result.assets[0].uri;

      setCurrentImageBase64(base64);
      setCurrentImageUri(imageUri);
      const extractedCapturedAt = new Date();

      const extractedDisplayTime = new Date(extractedCapturedAt)
        .toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        });

      setCapturedAt(extractedCapturedAt);
      setDisplayTime(extractedDisplayTime);

      try {
        const res = await axios.post(`${API_URL}/api/patient/${patientId}/detect-items`, { imageBase64: base64 });
        const formattedItems = (res.data.items || []).map(item => ({ name: item, quantity: "1" }));
        setDetectedItems(formattedItems);
        setStep(2); 
      } catch (error) {
        Alert.alert("Error", "Could not detect food. Please try again.");
      } finally {
        setAnalyzing(false);
      }
    }
  };

  const updateItem = (index, field, value) => {
    const newItems = [...detectedItems];
    newItems[index][field] = value;
    setDetectedItems(newItems);
  };

  const addNewItem = () => setDetectedItems([...detectedItems, { name: "", quantity: "1" }]);
  const removeItem = (index) => { const newItems = [...detectedItems]; newItems.splice(index, 1); setDetectedItems(newItems); };

  const submitToDietitian = async () => {
    const validItems = detectedItems.filter(item => item.name.trim() !== "");
    if (validItems.length === 0) return Alert.alert("Error", "Please add at least one food item.");

    setAnalyzing(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      await axios.post(`${API_URL}/api/patient/${patientId}/analyze-and-save`, {
      date: today, imageBase64: currentImageBase64, finalizedItems: validItems, capturedAt, displayTime
      });
      
      Alert.alert("Sent to Dietitian!", "Your meal has been sent for professional review.");
      setStep(1); 
      setCurrentImageBase64(null);
      setDetectedItems([]);
      fetchHistory(); 
    } catch (error) {
      Alert.alert("Error", "Failed to save the meal.");
    } finally {
      setAnalyzing(false);
    }
  };

  const safeHistory = Array.isArray(history) ? history : [];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{step === 1 ? "Log a Meal" : "Confirm Quantities"}</Text>
      </View>

      <ScrollView style={{ flex: 1 }}>
        {step === 1 && (
          <>
            <View style={styles.cameraCard}>
              
              <Text style={styles.label}>Snap Photo</Text>
              {analyzing ? (
                 <View style={styles.loadingBox}><ActivityIndicator size="large" color="#005BB5" /><Text style={styles.loadingText}>AI is scanning your food...</Text></View>
              ) : (
                 <TouchableOpacity style={styles.cameraActionBtn} onPress={handleLogMeal}>
                   <Text style={styles.cameraActionText}>📸 Log Meal</Text>
                 </TouchableOpacity>
              )}
            </View>

            <Text style={styles.historyTitle}>Your History</Text>
            {safeHistory.length === 0 ? (
              <Text style={styles.emptyText}>No meals logged yet.</Text>
            ) : (
              safeHistory.map((log) => (
                <View key={log._id || Math.random().toString()} style={styles.historyCard}>
                  {log.imageUrl && <Image source={{ uri: log.imageUrl }} style={styles.historyImg} />}
                  <View style={styles.historyContent}>
                    <View style={styles.historyTop}>
                      <Text style={styles.historyDate}>{log.date ? new Date(log.date).toLocaleDateString() : "Date"} • {log.displayTime || log.sessionName}</Text>
                    </View>
                    
                    <Text style={styles.detectedTitle}>{log.aiDetectedItems?.join(', ') || "Unknown"}</Text>

                    {/* 🛑 LOGIC: Show Pending OR Final Macros + Feedback */}
                    {log.approvalStatus === 'PENDING' ? (
                      <View style={styles.pendingBox}>
                        <Text style={styles.pendingText}>⏳ Pending Dietitian Review</Text>
                      </View>
                    ) : (
                      <View style={{marginTop: 5}}>
                        <Text style={[styles.badge, log.status === 'EXCEEDED' ? styles.badBadge : styles.goodBadge]}>
                          {log.status || "GOOD"}
                        </Text>
                        <Text style={styles.macroText}>
                          🔥 {log.actualMacros?.calories || 0} kcal  |  🥩 {log.actualMacros?.protein || 0}g
                        </Text>
                        
                        {/* ✅ PATIENT SEES FEEDBACK AFTER APPROVAL */}
                        {log.feedback && (
                          <View style={styles.patientFeedbackBox}>
                            <Text style={styles.patientFeedbackText}>💬 {log.feedback}</Text>
                          </View>
                        )}
                      </View>
                    )}
                  </View>
                </View>
              ))
            )}
          </>
        )}

        {step === 2 && (
          <View style={styles.confirmCard}>
             <Image source={{ uri: currentImageUri }} style={styles.previewImg} />
             <Text style={styles.instructionText}>AI detected these items. Please confirm or edit the quantities before sending to your Dietitian.</Text>
             
             {detectedItems.map((item, index) => (
                <View key={index} style={styles.itemRow}>
                  <TextInput style={[styles.input, {flex: 2, marginRight: 10}]} value={item.name} onChangeText={(text) => updateItem(index, 'name', text)} placeholder="Food Name" />
                  <TextInput style={[styles.input, {flex: 1}]} value={item.quantity} onChangeText={(text) => updateItem(index, 'quantity', text)} placeholder="Qty" />
                  <TouchableOpacity onPress={() => removeItem(index)} style={styles.removeBtn}><Text style={styles.removeBtnText}>✕</Text></TouchableOpacity>
                </View>
             ))}

             <TouchableOpacity style={styles.addBtn} onPress={addNewItem}><Text style={styles.addBtnText}>+ Add Missing Item</Text></TouchableOpacity>

             {analyzing ? (
               <View style={styles.loadingBox}><ActivityIndicator size="large" color="#005BB5" /><Text style={styles.loadingText}>Calculating & Sending...</Text></View>
             ) : (
               <View style={{flexDirection: 'row', justifyContent: 'space-between', marginTop: 20}}>
                 <TouchableOpacity style={[styles.submitActionBtn, {backgroundColor: '#666', width: '30%'}]} onPress={() => setStep(1)}><Text style={styles.submitActionText}>Cancel</Text></TouchableOpacity>
                 <TouchableOpacity style={[styles.submitActionBtn, {width: '65%'}]} onPress={submitToDietitian}><Text style={styles.submitActionText}>Submit to Dietitian</Text></TouchableOpacity>
               </View>
             )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F7FA' },
  header: { backgroundColor: '#003366', padding: 20, paddingTop: 50, paddingBottom: 20, borderBottomLeftRadius: 15, borderBottomRightRadius: 15 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#FFF' },
  
  cameraCard: { backgroundColor: '#FFF', margin: 20, padding: 20, borderRadius: 12, elevation: 3 },
  label: { fontSize: 15, fontWeight: '700', color: '#003366', marginBottom: 10 },
  cameraActionBtn: { backgroundColor: '#003366', padding: 15, borderRadius: 10, alignItems: 'center' },
  cameraActionText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  
  historyTitle: { marginHorizontal: 20, fontSize: 18, fontWeight: '800', color: '#002244', marginBottom: 10 },
  emptyText: { marginHorizontal: 20, color: '#666', fontStyle: 'italic' },
  historyCard: { backgroundColor: '#FFF', marginHorizontal: 20, marginBottom: 15, borderRadius: 12, overflow: 'hidden', elevation: 2 },
  historyImg: { width: '100%', height: 150, backgroundColor: '#E0E0E0' },
  historyContent: { padding: 15 },
  historyTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 },
  historyDate: { fontWeight: '700', color: '#333' },
  detectedTitle: { color: '#005BB5', fontSize: 14, fontWeight: '600', marginBottom: 5 },
  macroText: { color: '#333', fontWeight: '800', fontSize: 13, marginTop: 4 },
  
  pendingBox: { backgroundColor: '#FFF3E0', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, marginTop: 5, alignSelf: 'flex-start' },
  pendingText: { color: '#E65100', fontWeight: '700', fontSize: 12 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, fontSize: 10, fontWeight: 'bold', overflow: 'hidden', alignSelf: 'flex-start' },
  goodBadge: { backgroundColor: '#E8F5E9', color: '#2E7D32' },
  badBadge: { backgroundColor: '#FFEBEE', color: '#C62828' },
  
  patientFeedbackBox: { backgroundColor: '#E8F5E9', padding: 10, borderRadius: 8, marginTop: 10, borderLeftWidth: 3, borderLeftColor: '#4CAF50' },
  patientFeedbackText: { color: '#2E7D32', fontSize: 13, fontStyle: 'italic' },

  loadingBox: { alignItems: 'center', padding: 10 },
  loadingText: { marginTop: 10, color: '#005BB5', fontWeight: 'bold' },

  confirmCard: { backgroundColor: '#FFF', margin: 20, padding: 20, borderRadius: 12, elevation: 3 },
  previewImg: { width: '100%', height: 180, borderRadius: 8, marginBottom: 15 },
  instructionText: { color: '#666', fontSize: 13, marginBottom: 15, fontStyle: 'italic' },
  itemRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  input: { backgroundColor: '#FAFAFA', borderWidth: 1, borderColor: '#E0E0E0', padding: 12, borderRadius: 8, color: '#333' },
  removeBtn: { padding: 10, marginLeft: 5 },
  removeBtnText: { color: '#EF4444', fontSize: 18, fontWeight: 'bold' },
  addBtn: { marginVertical: 10, alignSelf: 'flex-start' },
  addBtnText: { color: '#005BB5', fontWeight: 'bold', fontSize: 15 },
  submitActionBtn: { backgroundColor: '#005BB5', padding: 15, borderRadius: 10, alignItems: 'center' },
  submitActionText: { color: '#FFF', fontWeight: 'bold', fontSize: 15 },
});