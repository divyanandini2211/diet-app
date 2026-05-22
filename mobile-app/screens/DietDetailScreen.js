import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Image, Alert, Modal, FlatList } from 'react-native';
import axios from 'axios';

export default function DietDetailScreen({ route, navigation }) {
  const { patient } = route.params || {};
  
  const [activeTab, setActiveTab] = useState('plan'); 
  const [dietPlan, setDietPlan] = useState(null); 
  const [dailyGoals, setDailyGoals] = useState({
    calorieTarget: 2000,
    proteinTarget: 100,
    carbsTarget: 250,
    fatTarget: 65,
    fiberTarget: 30
  });
  const [avoidables, setAvoidables] = useState('');
  const [aiLogs, setAiLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Food search modal state
  const [showFoodModal, setShowFoodModal] = useState(false);
  const [foodSearchQuery, setFoodSearchQuery] = useState('');
  const [selectedSessionForFood, setSelectedSessionForFood] = useState(null);
  const [allFoods, setAllFoods] = useState([]);
  
  const API_URL = process.env.EXPO_PUBLIC_API_URL;

  useEffect(() => {
    loadAvailableFoods();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => { fetchData(); });
    fetchData();
    
    // Auto-refresh AI Monitor tab every 5 seconds
    let refreshInterval;
    if (activeTab === 'monitor') {
      refreshInterval = setInterval(() => {
        fetchData();
      }, 5000);
    }
    
    return () => {
      unsubscribe();
      if (refreshInterval) clearInterval(refreshInterval);
    };
  }, [activeTab, navigation]);

  const loadAvailableFoods = async () => {
    try {
      const masterDietData = require('../data/masterDietData.js');
      const data = masterDietData.default || masterDietData;
      const foods = [];
      data.sessions.forEach(session => {
        session.items.forEach(item => {
          foods.push({
            categoryName: item.categoryName,
            options: item.options,
            quantityValue: item.quantityValue || "1",
            unit: item.unit || "portion"
          });
        });
      });
      setAllFoods(foods);
    } catch (e) {
      console.log("Could not load master diet data:", e.message);
      setAllFoods([]);
    }
  };

  const fetchData = async () => {
    if (!patient?._id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      if (activeTab === 'plan') {
        const res = await axios.get(`${API_URL}/api/dietitian/patient/${patient._id}/diet`);
        console.log('📋 Fetched Plan:', res.data);
        console.log('📊 Daily Goals from server:', res.data?.dailyGoals);
        setDietPlan(res.data);
        setDailyGoals(res.data?.dailyGoals || {
          calorieTarget: 2000,
          proteinTarget: 100,
          carbsTarget: 250,
          fatTarget: 65,
          fiberTarget: 30
        });
        setAvoidables(res.data?.avoidables || '');
      } else {
        const res = await axios.get(`${API_URL}/api/dietitian/patient/${patient._id}/all-logs`);
        setAiLogs(res.data);
      }
    } catch (e) {
      console.error("Error fetching data:", e.message);
      Alert.alert("Error", "Could not fetch data from the server.");
    } finally {
      setLoading(false);
    }
  };

  const updateGoal = (field, value) => {
    const newGoals = { ...dailyGoals, [field]: parseInt(value) || 0 };
    console.log(`📊 Updated ${field} to ${value}, new goals:`, newGoals);
    setDailyGoals(newGoals);
  };

  const updateQuantity = (sIndex, iIndex, value) => {
    const updatedPlan = { ...dietPlan };
    updatedPlan.sessions[sIndex].items[iIndex].quantityValue = value;
    setDietPlan(updatedPlan);
  };

  const updateUnit = (sIndex, iIndex, value) => {
    const updatedPlan = { ...dietPlan };
    updatedPlan.sessions[sIndex].items[iIndex].unit = value;
    setDietPlan(updatedPlan);
  };

  const addFoodToSession = (food) => {
    if (!selectedSessionForFood) return;
    const updatedPlan = { ...dietPlan };
    const sIndex = updatedPlan.sessions.findIndex(s => s.sessionName === selectedSessionForFood);
    
    updatedPlan.sessions[sIndex].items.push({
      categoryName: food.categoryName,
      options: food.options,
      quantityValue: food.quantityValue,
      unit: food.unit,
      targetNutrition: { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
    });
    
    setDietPlan(updatedPlan);
    setShowFoodModal(false);
    setFoodSearchQuery('');
  };

  const addCustomFood = (sessionName) => {
    const updatedPlan = { ...dietPlan };
    const sIndex = updatedPlan.sessions.findIndex(s => s.sessionName === sessionName);
    
    updatedPlan.sessions[sIndex].items.push({
      categoryName: "New Item",
      options: ["Option 1"],
      quantityValue: "1",
      unit: "Unit",
      targetNutrition: { calories: 100, protein: 5, carbs: 15, fat: 3, fiber: 2 }
    });
    
    setDietPlan(updatedPlan);
  };

  const updateCategoryName = (sIndex, iIndex, value) => {
    const updatedPlan = { ...dietPlan };
    updatedPlan.sessions[sIndex].items[iIndex].categoryName = value;
    setDietPlan(updatedPlan);
  };

  const updateItemOptions = (sIndex, iIndex, value) => {
    const updatedPlan = { ...dietPlan };
    // Split by comma to allow multiple options
    updatedPlan.sessions[sIndex].items[iIndex].options = value.split(',').map(opt => opt.trim()).filter(opt => opt.length > 0);
    setDietPlan(updatedPlan);
  };

  const handleRemoveItem = (sessionIndex, itemIndex) => {
    Alert.alert("Remove Item", "Remove this item from the plan?", [
      { text: "Cancel", style: "cancel" },
      { text: "Remove", style: "destructive", onPress: () => {
          const updatedPlan = { ...dietPlan };
          updatedPlan.sessions[sessionIndex].items.splice(itemIndex, 1);
          setDietPlan(updatedPlan);
        }
      }
    ]);
  };

  const filteredFoods = allFoods.filter(food =>
    food.categoryName.toLowerCase().includes(foodSearchQuery.toLowerCase())
  );

  const saveDietPlan = async () => {
    if (!patient?._id) {
      Alert.alert("Error", "Patient information not loaded. Please go back and try again.");
      return;
    }
    setLoading(true);
    try {
      console.log('💾 Saving Diet Plan with Goals:', dailyGoals);
      // Save the plan as-is with items and quantities
      const response = await axios.put(`${API_URL}/api/dietitian/patient/${patient._id}/diet-full`, { 
        sessions: dietPlan.sessions,
        avoidables: avoidables,
        dailyGoals: dailyGoals
      });
      console.log('✅ Save Response:', response.data);
      Alert.alert("Success", "Diet Plan Saved to Database!");
      // Go BACK to patient list, NOT to patient view
      navigation.goBack();
    } catch (e) { 
      console.error("Save Error:", e);
      Alert.alert("Error", "Could not save the diet plan. " + e.message); 
    } finally {
      setLoading(false);
    }
  };

  // --- RENDER PLAN EDITOR ---
  const renderPlanEditor = () => {
    return (
      <View style={styles.contentPad}>
        {/* GOAL SETTING SECTION */}
        <Text style={styles.sectionTitle}>📊 Daily Nutrition Goal</Text>
        <View style={styles.goalsGrid}>
          <View style={styles.goalInput}>
            <Text style={styles.goalLabel}>Calories</Text>
            <TextInput
              style={styles.goalField}
              keyboardType="numeric"
              value={String(dailyGoals?.calorieTarget || 2000)}
              onChangeText={(val) => updateGoal('calorieTarget', val)}
            />
            <Text style={styles.goalUnit}>kcal</Text>
          </View>
          <View style={styles.goalInput}>
            <Text style={styles.goalLabel}>Protein</Text>
            <TextInput
              style={styles.goalField}
              keyboardType="numeric"
              value={String(dailyGoals?.proteinTarget || 100)}
              onChangeText={(val) => updateGoal('proteinTarget', val)}
            />
            <Text style={styles.goalUnit}>g</Text>
          </View>
          <View style={styles.goalInput}>
            <Text style={styles.goalLabel}>Carbs</Text>
            <TextInput
              style={styles.goalField}
              keyboardType="numeric"
              value={String(dailyGoals?.carbsTarget || 250)}
              onChangeText={(val) => updateGoal('carbsTarget', val)}
            />
            <Text style={styles.goalUnit}>g</Text>
          </View>
          <View style={styles.goalInput}>
            <Text style={styles.goalLabel}>Fat</Text>
            <TextInput
              style={styles.goalField}
              keyboardType="numeric"
              value={String(dailyGoals?.fatTarget || 65)}
              onChangeText={(val) => updateGoal('fatTarget', val)}
            />
            <Text style={styles.goalUnit}>g</Text>
          </View>
          <View style={styles.goalInput}>
            <Text style={styles.goalLabel}>Fiber</Text>
            <TextInput
              style={styles.goalField}
              keyboardType="numeric"
              value={String(dailyGoals?.fiberTarget || 30)}
              onChangeText={(val) => updateGoal('fiberTarget', val)}
            />
            <Text style={styles.goalUnit}>g</Text>
          </View>
        </View>

        {/* RESTRICTED FOODS */}
        <Text style={styles.sectionTitle}>🚫 Restricted Foods</Text>
        <TextInput
          style={styles.avoidInput}
          multiline
          numberOfLines={2}
          placeholder="e.g., Sugar, Sweets, Deep Fried..."
          value={avoidables}
          onChangeText={setAvoidables}
        />

        {/* MEAL SESSIONS (3 meals) */}
        <Text style={styles.sectionTitle}>🍽️ Meal Sessions</Text>
        {dietPlan?.sessions?.map((session, sIndex) => (
          <View key={sIndex} style={styles.sessionCard}>
            <Text style={styles.sessionTitle}>{session.sessionName} • {session.time}</Text>
            
            {/* Search & Add Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity 
                style={styles.searchBtn}
                onPress={() => {
                  setSelectedSessionForFood(session.sessionName);
                  setShowFoodModal(true);
                }}
              >
                <Text style={styles.searchBtnText}>🔍 Search Food</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.customBtn}
                onPress={() => addCustomFood(session.sessionName)}
              >
                <Text style={styles.customBtnText}>+ Add Custom</Text>
              </TouchableOpacity>
            </View>
            
            {/* Food Items */}
            {session.items.map((item, iIndex) => (
              <View key={iIndex} style={styles.foodItemBox}>
                <View style={styles.categoryRow}>
                  <TextInput 
                    style={styles.categoryNameInput}
                    value={item.categoryName}
                    onChangeText={(val) => updateCategoryName(sIndex, iIndex, val)}
                    placeholder="Item name"
                  />
                  <TouchableOpacity onPress={() => handleRemoveItem(sIndex, iIndex)} style={styles.deleteIconBox}>
                    <Text style={styles.deleteIcon}>−</Text>
                  </TouchableOpacity>
                </View>
                
                <Text style={styles.optionsLabel}>Options (comma separated):</Text>
                <TextInput 
                  style={styles.optionsInput}
                  value={item.options.join(', ')}
                  onChangeText={(val) => updateItemOptions(sIndex, iIndex, val)}
                  placeholder="e.g., Rice, Wheat, Bread"
                  multiline
                />
                
                <View style={styles.qtySection}>
                  <TextInput 
                    style={styles.qtyInputField}
                    keyboardType="numeric"
                    value={String(item.quantityValue)}
                    onChangeText={(val) => updateQuantity(sIndex, iIndex, val)}
                  />
                  <TextInput 
                    style={styles.unitInputField}
                    value={item.unit}
                    onChangeText={(val) => updateUnit(sIndex, iIndex, val)}
                  />
                </View>
              </View>
            ))}
          </View>
        ))}

        <TouchableOpacity style={styles.saveBtn} onPress={saveDietPlan}>
          <Text style={styles.saveBtnText}>💾 Save Plan</Text>
        </TouchableOpacity>

        {/* FOOD SEARCH MODAL */}
        <Modal visible={showFoodModal} transparent={true} animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Food Item</Text>
                <TouchableOpacity onPress={() => setShowFoodModal(false)}>
                  <Text style={styles.closeBtn}>✕</Text>
                </TouchableOpacity>
              </View>
              
              <TextInput
                style={styles.searchInput}
                placeholder="Search foods..."
                value={foodSearchQuery}
                onChangeText={setFoodSearchQuery}
              />

              <FlatList
                data={filteredFoods}
                keyExtractor={(item, idx) => idx.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity 
                    style={styles.foodOption}
                    onPress={() => addFoodToSession(item)}
                  >
                    <Text style={styles.foodName}>{item.categoryName}</Text>
                    <Text style={styles.foodQty}>{item.quantityValue} {item.unit}</Text>
                  </TouchableOpacity>
                )}
              />
            </View>
          </View>
        </Modal>
      </View>
    );
  };

  const renderAiMonitor = () => (
    <View style={styles.contentPad}>
      {aiLogs.length === 0 ? (
        <Text style={styles.emptyText}>No meal logs yet</Text>
      ) : (
        aiLogs.map((log) => (
          <View key={log._id} style={styles.logCard}>
            <View style={styles.logHeader}>
              <Text style={styles.logDate}>{new Date(log.date).toLocaleDateString()} • {log.sessionName}</Text>
              <Text style={[styles.statusBadge, log.status === 'EXCEEDED' ? styles.badBadge : log.status === 'DEFICIENT' ? styles.warningBadge : styles.goodBadge]}>
                {log.status}
              </Text>
            </View>
            
            {log.imageUrl && <Image source={{ uri: log.imageUrl }} style={styles.foodImage} />}
            
            <View style={styles.logDetails}>
              <Text style={styles.detectedTitle}>🔍 AI Detected:</Text>
              <Text style={styles.detectedItems}>{log.aiDetectedItems?.join(', ')}</Text>
              
              {/* ALL 5 MACROS TABLE */}
              <View style={styles.macroTable}>
                <View style={styles.macroHeaderRow}>
                  <Text style={[styles.macroCell, { fontWeight: 'bold' }]}>Macro</Text>
                  <Text style={[styles.macroCell, { fontWeight: 'bold' }]}>Target</Text>
                  <Text style={[styles.macroCell, { fontWeight: 'bold' }]}>Actual</Text>
                </View>
                
                <View style={styles.macroDataRow}>
                  <Text style={styles.macroCell}>Calories</Text>
                  <Text style={styles.macroCell}>{log.prescribedMacros?.calories || 0}</Text>
                  <Text style={[styles.macroCell, styles.actualValue]}>{log.actualMacros?.calories || 0}</Text>
                </View>
                
                <View style={styles.macroDataRow}>
                  <Text style={styles.macroCell}>Protein</Text>
                  <Text style={styles.macroCell}>{log.prescribedMacros?.protein || 0}g</Text>
                  <Text style={[styles.macroCell, styles.actualValue]}>{log.actualMacros?.protein || 0}g</Text>
                </View>
                
                <View style={styles.macroDataRow}>
                  <Text style={styles.macroCell}>Carbs</Text>
                  <Text style={styles.macroCell}>{log.prescribedMacros?.carbs || 0}g</Text>
                  <Text style={[styles.macroCell, styles.actualValue]}>{log.actualMacros?.carbs || 0}g</Text>
                </View>
                
                <View style={styles.macroDataRow}>
                  <Text style={styles.macroCell}>Fat</Text>
                  <Text style={styles.macroCell}>{log.prescribedMacros?.fat || 0}g</Text>
                  <Text style={[styles.macroCell, styles.actualValue]}>{log.actualMacros?.fat || 0}g</Text>
                </View>
                
                <View style={styles.macroDataRow}>
                  <Text style={styles.macroCell}>Fiber</Text>
                  <Text style={styles.macroCell}>{log.prescribedMacros?.fiber || 0}g</Text>
                  <Text style={[styles.macroCell, styles.actualValue]}>{log.actualMacros?.fiber || 0}g</Text>
                </View>
              </View>

              {log.feedback && (
                <View style={[styles.feedbackBox, log.feedback.includes('WARNING') && styles.warningBox]}>
                  <Text style={styles.feedbackTitle}>💬 Feedback:</Text>
                  <Text style={styles.feedbackText}>{log.feedback}</Text>
                </View>
              )}
            </View>
          </View>
        ))
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>‹</Text>
        </TouchableOpacity>
        <View>
          <Text style={styles.patientName}>{patient.name}</Text>
          <Text style={styles.patientSub}>OP/IP: {patient.opId || 'N/A'} | Weight: {patient.weight || '--'}kg</Text>
        </View>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity style={[styles.tab, activeTab === 'plan' && styles.activeTab]} onPress={() => setActiveTab('plan')}>
          <Text style={[styles.tabText, activeTab === 'plan' && styles.activeTabText]}>Edit Plan</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'monitor' && styles.activeTab]} onPress={() => setActiveTab('monitor')}>
          <Text style={[styles.tabText, activeTab === 'monitor' && styles.activeTabText]}>AI Monitor</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={{ flex: 1 }}>
        {loading ? <ActivityIndicator size="large" color="#005BB5" style={{ marginTop: 50 }} /> : (activeTab === 'plan' ? renderPlanEditor() : renderAiMonitor())}
      </ScrollView>
    </View>
  );
}

// --- STYLES ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  header: { backgroundColor: '#003366', padding: 20, paddingTop: 50, flexDirection: 'row', alignItems: 'center' },
  backButton: { marginRight: 15, padding: 10 },
  backButtonText: { color: '#FFF', fontSize: 28, fontWeight: 'bold' },
  patientName: { color: '#FFF', fontSize: 22, fontWeight: '800' },
  patientSub: { color: '#B0C4DE', fontSize: 12, marginTop: 3 },
  
  tabContainer: { flexDirection: 'row', padding: 15, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E0E0E0' },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 3, borderBottomColor: 'transparent' },
  activeTab: { borderBottomColor: '#005BB5' },
  tabText: { color: '#999', fontWeight: '700', fontSize: 14 },
  activeTabText: { color: '#005BB5', fontWeight: '800' },
  
  contentPad: { padding: 20, paddingBottom: 40 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#003366', marginBottom: 12, marginTop: 15 },
  
  // Goals Grid
  goalsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 20 },
  goalInput: { width: '48%', backgroundColor: '#FFF', borderRadius: 8, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: '#E5E5E5' },
  goalLabel: { fontSize: 12, fontWeight: '700', color: '#666', marginBottom: 5 },
  goalField: { borderWidth: 1, borderColor: '#005BB5', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 8, fontSize: 16, fontWeight: 'bold', color: '#005BB5', marginBottom: 5 },
  goalUnit: { fontSize: 11, color: '#999' },
  
  // Running Totals
  progressCard: { backgroundColor: '#FFF', borderRadius: 10, padding: 15, marginBottom: 20, borderWidth: 1, borderColor: '#E5E5E5' },
  progressRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  progressLabel: { width: '70px', fontSize: 12, fontWeight: '700', color: '#333' },
  progressBarContainer: { flex: 1, height: 6, backgroundColor: '#EEE', borderRadius: 3, marginHorizontal: 10, overflow: 'hidden' },
  progressBar: { height: '100%', borderRadius: 3 },
  progressValue: { width: '80px', fontSize: 11, fontWeight: '700', color: '#005BB5', textAlign: 'right' },
  
  avoidInput: { backgroundColor: '#FFF', padding: 15, borderRadius: 8, borderWidth: 1, borderColor: '#DDD', textAlignVertical: 'top', fontSize: 14, marginBottom: 20 },
  
  sessionCard: { backgroundColor: '#FFF', padding: 15, borderRadius: 10, marginBottom: 15, borderWidth: 1, borderColor: '#E5E5E5' },
  sessionTitle: { fontSize: 16, fontWeight: '800', color: '#005BB5', marginBottom: 15, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  
  foodItemBox: { backgroundColor: '#F8F9FB', padding: 15, borderRadius: 8, marginBottom: 12, borderLeftWidth: 4, borderLeftColor: '#005BB5' },
  categoryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  categoryName: { fontSize: 16, fontWeight: '800', color: '#003366' },
  deleteIconBox: { padding: 8 },
  deleteIcon: { fontSize: 20, color: '#EF4444', fontWeight: 'bold' },
  optionsText: { fontSize: 12, color: '#999', marginBottom: 10, fontStyle: 'italic' },
  qtySection: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  qtyInputField: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#005BB5', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 8, width: 70, fontWeight: '700', color: '#005BB5', fontSize: 14 },
  unitInputField: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#999', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 8, flex: 1, fontSize: 13 },
  
  addBtn: { backgroundColor: '#E3F2FD', paddingVertical: 10, borderRadius: 6, alignItems: 'center', marginTop: 5 },
  addBtnText: { color: '#005BB5', fontWeight: '700', fontSize: 13 },
  
  actionButtons: { flexDirection: 'row', gap: 10, marginBottom: 15 },
  searchBtn: { flex: 1, backgroundColor: '#E3F2FD', paddingVertical: 10, borderRadius: 6, alignItems: 'center' },
  searchBtnText: { color: '#005BB5', fontWeight: '700', fontSize: 13 },
  customBtn: { flex: 1, backgroundColor: '#F0F0F0', paddingVertical: 10, borderRadius: 6, alignItems: 'center' },
  customBtnText: { color: '#333', fontWeight: '700', fontSize: 13 },
  
  // Food Search Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', paddingTop: 100 },
  modalContent: { flex: 1, backgroundColor: '#FFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingTop: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 15 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#003366' },
  closeBtn: { fontSize: 28, color: '#999', fontWeight: 'bold' },
  searchInput: { marginHorizontal: 20, paddingHorizontal: 15, paddingVertical: 12, backgroundColor: '#F5F5F5', borderRadius: 8, borderWidth: 1, borderColor: '#DDD', fontSize: 14, marginBottom: 15 },
  foodOption: { paddingHorizontal: 20, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#EEE' },
  foodName: { fontSize: 15, fontWeight: '700', color: '#003366', marginBottom: 4 },
  foodQty: { fontSize: 12, color: '#999' },
  
  saveBtn: { backgroundColor: '#003366', paddingVertical: 14, borderRadius: 8, alignItems: 'center', marginTop: 20, marginBottom: 10 },
  saveBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 15 },
  
  emptyText: { textAlign: 'center', color: '#999', marginTop: 40, fontSize: 15 },
  logCard: { backgroundColor: '#FFF', borderRadius: 10, marginBottom: 20, overflow: 'hidden', borderWidth: 1, borderColor: '#E5E5E5' },
  logHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, backgroundColor: '#F8F9FB', borderBottomWidth: 1, borderBottomColor: '#E5E5E5' },
  logDate: { fontWeight: '700', color: '#333', fontSize: 14 },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, fontSize: 12, fontWeight: 'bold' },
  goodBadge: { backgroundColor: '#C8E6C9', color: '#2E7D32' },
  badBadge: { backgroundColor: '#FFCDD2', color: '#C62828' },
  warningBadge: { backgroundColor: '#FFF9C4', color: '#F57F17' },
  
  foodImage: { width: '100%', height: 200, backgroundColor: '#EEE' },
  logDetails: { padding: 15 },
  detectedTitle: { fontWeight: '700', color: '#003366', fontSize: 13, marginBottom: 5 },
  detectedItems: { color: '#555', fontSize: 13, marginBottom: 15 },
  
  macroTable: { borderRadius: 8, borderWidth: 1, borderColor: '#DDD', overflow: 'hidden', marginBottom: 15 },
  macroHeaderRow: { flexDirection: 'row', backgroundColor: '#F0F0F0', paddingVertical: 10 },
  macroDataRow: { flexDirection: 'row', paddingVertical: 8, borderTopWidth: 1, borderTopColor: '#EEE' },
  macroCell: { flex: 1, textAlign: 'center', fontSize: 12, color: '#333' },
  actualValue: { fontWeight: '700', color: '#005BB5' },
  
  feedbackBox: { backgroundColor: '#E8F5E9', padding: 12, borderRadius: 8, borderLeftWidth: 4, borderLeftColor: '#4CAF50' },
  warningBox: { backgroundColor: '#FFF3E0', borderLeftColor: '#FF9800' },
  feedbackTitle: { fontWeight: '700', color: '#333', fontSize: 12, marginBottom: 5 },
  feedbackText: { color: '#555', fontSize: 12, lineHeight: 18 },

  // Editable input styles
  categoryNameInput: { fontSize: 16, fontWeight: '800', color: '#003366', borderWidth: 1, borderColor: '#005BB5', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 8, flex: 1 },
  optionsLabel: { fontSize: 12, fontWeight: '700', color: '#666', marginTop: 10, marginBottom: 5 },
  optionsInput: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#DDD', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 8, fontSize: 13, marginBottom: 10, minHeight: 60, textAlignVertical: 'top' }
});