import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Image, Alert, Modal, FlatList } from 'react-native';
import axios from 'axios';

export default function DietDetailScreen({ route, navigation }) {
  const { patient } = route.params || {};
  
  const [activeTab, setActiveTab] = useState('plan'); 
  const [dietPlan, setDietPlan] = useState(null); 
  const [dailyGoals, setDailyGoals] = useState({ calorieTarget: 2000, proteinTarget: 100, carbsTarget: 250, fatTarget: 65, fiberTarget: 30 });
  const [avoidables, setAvoidables] = useState('');
  const [aiLogs, setAiLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [showFoodModal, setShowFoodModal] = useState(false);
  const [foodSearchQuery, setFoodSearchQuery] = useState('');
  const [selectedSessionForFood, setSelectedSessionForFood] = useState(null);
  const [allFoods, setAllFoods] = useState([]);

  // ✅ NEW: State for the Full-Screen Image Viewer!
  const [fullScreenImage, setFullScreenImage] = useState(null); 
  
  const API_URL = process.env.EXPO_PUBLIC_API_URL;

  useEffect(() => { loadAvailableFoods(); }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => { fetchData(); });
    fetchData();
    return () => { unsubscribe(); };
  }, [activeTab, navigation]);

  const loadAvailableFoods = async () => {
    try {
      const masterDietData = require('../data/masterDietData.js');
      const data = masterDietData.default || masterDietData;
      const foods = [];
      data.sessions.forEach(session => {
        session.items.forEach(item => {
          foods.push({ categoryName: item.categoryName, options: item.options, quantityValue: item.quantityValue || "1", unit: item.unit || "portion" });
        });
      });
      setAllFoods(foods);
    } catch (e) { setAllFoods([]); }
  };

  const fetchData = async () => {
    if (!patient?._id) { setLoading(false); return; }
    try {
      if (activeTab === 'plan') {
        const res = await axios.get(`${API_URL}/api/dietitian/patient/${patient._id}/diet`);
        setDietPlan(res.data);
        setDailyGoals(res.data?.dailyGoals || { calorieTarget: 2000, proteinTarget: 100, carbsTarget: 250, fatTarget: 65, fiberTarget: 30 });
        setAvoidables(res.data?.avoidables || '');
      } else {
        const res = await axios.get(`${API_URL}/api/dietitian/patient/${patient._id}/all-logs`);
        setAiLogs(res.data);
      }
    } catch (e) { Alert.alert("Error", "Could not fetch data."); } finally { setLoading(false); }
  };

  const handleMacroChange = (logId, macroName, value) => {
    setAiLogs(prevLogs => prevLogs.map(log => {
      if (log._id === logId) {
        return { ...log, actualMacros: { ...log.actualMacros, [macroName]: value } };
      }
      return log;
    }));
  };

  const handleFeedbackChange = (logId, value) => {
    setAiLogs(prevLogs => prevLogs.map(log => {
      if (log._id === logId) return { ...log, feedback: value };
      return log;
    }));
  };

  const approveMeal = async (logId) => {
    const logToApprove = aiLogs.find(l => l._id === logId);
    const safeMacros = {
      calories: parseInt(logToApprove.actualMacros?.calories) || 0,
      protein: parseInt(logToApprove.actualMacros?.protein) || 0,
      carbs: parseInt(logToApprove.actualMacros?.carbs) || 0,
      fat: parseInt(logToApprove.actualMacros?.fat) || 0,
      fiber: parseInt(logToApprove.actualMacros?.fiber) || 0,
    };
    try {
      await axios.put(`${API_URL}/api/dietitian/log/${logId}/approve`, {
        actualMacros: safeMacros,
        feedback: logToApprove.feedback
      });
      Alert.alert("Approved", "Meal has been updated and approved!");
      fetchData(); 
    } catch (e) {
      Alert.alert("Error", "Could not approve meal.");
    }
  };

  const updateGoal = (field, value) => setDailyGoals({ ...dailyGoals, [field]: value }); 
  const updateQuantity = (sIndex, iIndex, value) => { const p = { ...dietPlan }; p.sessions[sIndex].items[iIndex].quantityValue = value; setDietPlan(p); };
  const updateUnit = (sIndex, iIndex, value) => { const p = { ...dietPlan }; p.sessions[sIndex].items[iIndex].unit = value; setDietPlan(p); };
  
  const addFoodToSession = (food) => {
    if (!selectedSessionForFood) return;
    const p = { ...dietPlan };
    const sIndex = p.sessions.findIndex(s => s.sessionName === selectedSessionForFood);
    p.sessions[sIndex].items.push({ ...food, targetNutrition: { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 } });
    setDietPlan(p); setShowFoodModal(false); setFoodSearchQuery('');
  };
  
  const addCustomFood = (sessionName) => {
    const p = { ...dietPlan };
    const sIndex = p.sessions.findIndex(s => s.sessionName === sessionName);
    p.sessions[sIndex].items.push({ categoryName: "New Item", options: ["Option 1"], quantityValue: "1", unit: "Unit", targetNutrition: { calories: 100, protein: 5, carbs: 15, fat: 3, fiber: 2 } });
    setDietPlan(p);
  };
  
  const updateCategoryName = (sIndex, iIndex, value) => { const p = { ...dietPlan }; p.sessions[sIndex].items[iIndex].categoryName = value; setDietPlan(p); };
  const updateItemOptions = (sIndex, iIndex, value) => { const p = { ...dietPlan }; p.sessions[sIndex].items[iIndex].options = value.split(','); setDietPlan(p); };
  
  const handleRemoveItem = (sIndex, iIndex) => {
    Alert.alert("Remove Item", "Remove this item from the plan?", [{ text: "Cancel", style: "cancel" }, { text: "Remove", style: "destructive", onPress: () => { const p = { ...dietPlan }; p.sessions[sIndex].items.splice(iIndex, 1); setDietPlan(p); } }]);
  };
  
  const saveDietPlan = async () => {
    setLoading(true);
    try {
      const safeGoals = {
        calorieTarget: parseInt(dailyGoals.calorieTarget) || 0,
        proteinTarget: parseInt(dailyGoals.proteinTarget) || 0,
        carbsTarget: parseInt(dailyGoals.carbsTarget) || 0,
        fatTarget: parseInt(dailyGoals.fatTarget) || 0,
        fiberTarget: parseInt(dailyGoals.fiberTarget) || 0,
      };
      await axios.put(`${API_URL}/api/dietitian/patient/${patient._id}/diet-full`, { sessions: dietPlan.sessions, avoidables: avoidables, dailyGoals: safeGoals });
      Alert.alert("Success", "Diet Plan Saved!"); navigation.goBack();
    } catch (e) { Alert.alert("Error", "Could not save the diet plan."); } finally { setLoading(false); }
  };
  
  const filteredFoods = allFoods.filter(food => food.categoryName.toLowerCase().includes(foodSearchQuery.toLowerCase()));

  const renderPlanEditor = () => {
    return (
      <View style={styles.contentPad}>
        <Text style={styles.sectionTitle}>📊 Daily Nutrition Goal</Text>
        <View style={styles.goalsGrid}>
          {['calorieTarget', 'proteinTarget', 'carbsTarget', 'fatTarget', 'fiberTarget'].map((goal, idx) => (
            <View key={idx} style={styles.goalInput}>
              <Text style={styles.goalLabel}>{goal.replace('Target', '')}</Text>
              <TextInput style={styles.goalField} keyboardType="numeric" value={dailyGoals?.[goal] !== undefined && dailyGoals?.[goal] !== '' ? String(dailyGoals[goal]) : ''} onChangeText={(val) => updateGoal(goal, val)} />
              <Text style={styles.goalUnit}>{goal === 'calorieTarget' ? 'kcal' : 'g'}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>🚫 Restricted Foods</Text>
        <TextInput style={styles.avoidInput} multiline numberOfLines={2} placeholder="e.g., Sugar, Sweets..." value={avoidables} onChangeText={setAvoidables} />

        <Text style={styles.sectionTitle}>🍽️ Meal Sessions</Text>
        {dietPlan?.sessions?.map((session, sIndex) => (
          <View key={sIndex} style={styles.sessionCard}>
            <Text style={styles.sessionTitle}>{session.sessionName} • {session.time}</Text>
            <View style={styles.actionButtons}>
              <TouchableOpacity style={styles.searchBtn} onPress={() => { setSelectedSessionForFood(session.sessionName); setShowFoodModal(true); }}>
                <Text style={styles.searchBtnText}>🔍 Search Food</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.customBtn} onPress={() => addCustomFood(session.sessionName)}>
                <Text style={styles.customBtnText}>+ Add Custom</Text>
              </TouchableOpacity>
            </View>
            {session.items.map((item, iIndex) => (
              <View key={iIndex} style={styles.foodItemBox}>
                <View style={styles.categoryRow}>
                  <TextInput style={styles.categoryNameInput} value={item.categoryName} onChangeText={(val) => updateCategoryName(sIndex, iIndex, val)} placeholder="Item name" />
                  <TouchableOpacity onPress={() => handleRemoveItem(sIndex, iIndex)} style={styles.deleteIconBox}><Text style={styles.deleteIcon}>−</Text></TouchableOpacity>
                </View>
                <Text style={styles.optionsLabel}>Options (comma separated):</Text>
                <TextInput style={styles.optionsInput} value={item.options.join(',')} onChangeText={(val) => updateItemOptions(sIndex, iIndex, val)} placeholder="e.g. Rice,Wheat" multiline />
                <View style={styles.qtySection}>
                  <TextInput style={styles.qtyInputField} keyboardType="numeric" value={item.quantityValue !== undefined ? String(item.quantityValue) : ''} onChangeText={(val) => updateQuantity(sIndex, iIndex, val)} />
                  <TextInput style={styles.unitInputField} value={item.unit} onChangeText={(val) => updateUnit(sIndex, iIndex, val)} />
                </View>
              </View>
            ))}
          </View>
        ))}

        <TouchableOpacity style={styles.saveBtn} onPress={saveDietPlan}>
          <Text style={styles.saveBtnText}>💾 Save Plan</Text>
        </TouchableOpacity>

        <Modal visible={showFoodModal} transparent={true} animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Food Item</Text>
                <TouchableOpacity onPress={() => setShowFoodModal(false)}><Text style={styles.closeBtn}>✕</Text></TouchableOpacity>
              </View>
              <TextInput style={styles.searchInput} placeholder="Search foods..." value={foodSearchQuery} onChangeText={setFoodSearchQuery} />
              <FlatList data={filteredFoods} keyExtractor={(item, idx) => idx.toString()} renderItem={({ item }) => (
                <TouchableOpacity style={styles.foodOption} onPress={() => addFoodToSession(item)}>
                  <Text style={styles.foodName}>{item.categoryName}</Text>
                  <Text style={styles.foodQty}>{item.quantityValue} {item.unit}</Text>
                </TouchableOpacity>
              )} />
            </View>
          </View>
        </Modal>
      </View>
    );
  };

  const renderAiMonitor = () => (
    <View style={styles.contentPad}>
      {aiLogs.length === 0 ? <Text style={styles.emptyText}>No meal logs yet</Text> : (
        aiLogs.map((log) => {
          const isPending = log.approvalStatus === 'PENDING';
          return (
            <View key={log._id} style={[styles.logCard, isPending && { borderColor: '#FF9800', borderWidth: 2 }]}>
              <View style={styles.logHeader}>
                <Text style={styles.logDate}>{new Date(log.date).toLocaleDateString()} • {log.displayTime || log.sessionName}</Text>
                <Text style={[styles.statusBadge, isPending ? styles.pendingBadge : (log.status === 'EXCEEDED' ? styles.badBadge : styles.goodBadge)]}>
                  {isPending ? 'PENDING REVIEW' : log.status}
                </Text>
              </View>
              
              {/* ✅ NEW: Tap to Enlarge Image Feature! */}
              {log.imageUrl && (
                <TouchableOpacity style={styles.imageWrapper} onPress={() => setFullScreenImage(log.imageUrl)}>
                  <Image source={{ uri: log.imageUrl }} style={styles.foodImage} />
                  <View style={styles.zoomHint}>
                    <Text style={styles.zoomText}>🔍 Tap to enlarge</Text>
                  </View>
                </TouchableOpacity>
              )}
              
              <View style={styles.logDetails}>
                <Text style={styles.detectedTitle}>🔍 Detected & Confirmed Items:</Text>
                <Text style={styles.detectedItems}>{log.aiDetectedItems?.join(', ')}</Text>
                
                {/* MACRO TABLE */}
                <View style={styles.macroTable}>
                  <View style={styles.macroHeaderRow}>
                    <Text style={[styles.macroCell, { fontWeight: 'bold' }]}>Macro</Text>
                    <Text style={[styles.macroCell, { fontWeight: 'bold' }]}>Target</Text>
                    <Text style={[styles.macroCell, { fontWeight: 'bold' }]}>Actual</Text>
                  </View>
                  {['calories', 'protein', 'carbs', 'fat', 'fiber'].map(macro => (
                    <View key={macro} style={styles.macroDataRow}>
                      <Text style={styles.macroCell}>{macro.charAt(0).toUpperCase() + macro.slice(1)}</Text>
                      <Text style={styles.macroCell}>{log.prescribedMacros?.[macro] || 0}</Text>
                      {isPending ? (
                        <TextInput style={styles.editMacroInput} keyboardType="numeric" value={log.actualMacros?.[macro] !== undefined && log.actualMacros?.[macro] !== '' ? String(log.actualMacros[macro]) : ''} onChangeText={(val) => handleMacroChange(log._id, macro, val)} />
                      ) : (
                        <Text style={[styles.macroCell, styles.actualValue]}>{log.actualMacros?.[macro] || 0}</Text>
                      )}
                    </View>
                  ))}
                </View>

                {/* FEEDBACK SECTION */}
                <View style={[styles.feedbackBox, log.feedback?.includes('WARNING') && styles.warningBox]}>
                  <Text style={styles.feedbackTitle}>💬 Dietitian Feedback:</Text>
                  {isPending ? (
                    <TextInput style={styles.editFeedbackInput} multiline value={log.feedback} onChangeText={(val) => handleFeedbackChange(log._id, val)} />
                  ) : (
                    <Text style={styles.feedbackText}>{log.feedback}</Text>
                  )}
                </View>

                {/* APPROVE BUTTON */}
                {isPending && (
                  <TouchableOpacity style={styles.approveBtn} onPress={() => approveMeal(log._id)}>
                    <Text style={styles.approveBtnText}>✅ Approve Meal</Text>
                  </TouchableOpacity>
                )}

              </View>
            </View>
          );
        })
      )}
    </View>
  );
  const renderProgress = () => (
  <View style={styles.contentPad}>
    <Text style={styles.sectionTitle}>📈 Progress Analytics</Text>

    <View style={styles.progressControls}>
      <TouchableOpacity style={styles.progressBtn}>
        <Text style={styles.progressBtnText}>Weekly</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.progressBtn}>
        <Text style={styles.progressBtnText}>Protein</Text>
      </TouchableOpacity>
      </View>

      <View style={styles.placeholderCard}>
        <Text style={styles.placeholderTitle}>
          Progress charts coming next
        </Text>

        <Text style={styles.placeholderText}>
          Weekly and monthly adherence analytics will appear here.
        </Text>
      </View>
    </View>
  );
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}><Text style={styles.backButtonText}>‹</Text></TouchableOpacity>
        <View><Text style={styles.patientName}>{patient.name}</Text><Text style={styles.patientSub}>OP/IP: {patient.opId || 'N/A'} | Weight: {patient.weight || '--'}kg</Text></View>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity style={[styles.tab, activeTab === 'plan' && styles.activeTab]} onPress={() => setActiveTab('plan')}><Text style={[styles.tabText, activeTab === 'plan' && styles.activeTabText]}>Edit Plan</Text></TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'monitor' && styles.activeTab]} onPress={() => setActiveTab('monitor')}><Text style={[styles.tabText, activeTab === 'monitor' && styles.activeTabText]}>Monitor</Text></TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'progress' && styles.activeTab]} onPress={() => setActiveTab('progress')}><Text style={[styles.tabText, activeTab === 'progress' && styles.activeTabText]}>Progress</Text></TouchableOpacity>
      </View>

      <ScrollView style={{ flex: 1 }}>
        {loading ? <ActivityIndicator size="large" color="#005BB5" style={{ marginTop: 50 }} /> : (activeTab === 'plan' ? renderPlanEditor() : activeTab=='monitor' ? renderAiMonitor() : renderProgress())}
      </ScrollView>

      {/* ✅ NEW: FULL SCREEN IMAGE MODAL */}
      <Modal visible={fullScreenImage !== null} transparent={true} animationType="fade">
        <View style={styles.fullScreenBg}>
          <TouchableOpacity style={styles.closeImageBtn} onPress={() => setFullScreenImage(null)}>
            <Text style={styles.closeImageText}>✕ Close</Text>
          </TouchableOpacity>
          {fullScreenImage && (
            <Image source={{ uri: fullScreenImage }} style={styles.fullScreenImg} resizeMode="contain" />
          )}
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' }, header: { backgroundColor: '#003366', padding: 20, paddingTop: 50, flexDirection: 'row', alignItems: 'center' }, backButton: { marginRight: 15, padding: 10 }, backButtonText: { color: '#FFF', fontSize: 28, fontWeight: 'bold' }, patientName: { color: '#FFF', fontSize: 22, fontWeight: '800' }, patientSub: { color: '#B0C4DE', fontSize: 12, marginTop: 3 },
  tabContainer: { flexDirection: 'row', padding: 15, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E0E0E0' }, tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 3, borderBottomColor: 'transparent' }, activeTab: { borderBottomColor: '#005BB5' }, tabText: { color: '#999', fontWeight: '700', fontSize: 14 }, activeTabText: { color: '#005BB5', fontWeight: '800' }, contentPad: { padding: 20, paddingBottom: 40 }, sectionTitle: { fontSize: 16, fontWeight: '800', color: '#003366', marginBottom: 12, marginTop: 15 },
  goalsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 20 }, goalInput: { width: '48%', backgroundColor: '#FFF', borderRadius: 8, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: '#E5E5E5' }, goalLabel: { fontSize: 12, fontWeight: '700', color: '#666', marginBottom: 5 }, goalField: { borderWidth: 1, borderColor: '#005BB5', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 8, fontSize: 16, fontWeight: 'bold', color: '#005BB5', marginBottom: 5 }, goalUnit: { fontSize: 11, color: '#999' },
  avoidInput: { backgroundColor: '#FFF', padding: 15, borderRadius: 8, borderWidth: 1, borderColor: '#DDD', textAlignVertical: 'top', fontSize: 14, marginBottom: 20 }, sessionCard: { backgroundColor: '#FFF', padding: 15, borderRadius: 10, marginBottom: 15, borderWidth: 1, borderColor: '#E5E5E5' }, sessionTitle: { fontSize: 16, fontWeight: '800', color: '#005BB5', marginBottom: 15, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  foodItemBox: { backgroundColor: '#F8F9FB', padding: 15, borderRadius: 8, marginBottom: 12, borderLeftWidth: 4, borderLeftColor: '#005BB5' }, categoryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }, categoryNameInput: { fontSize: 16, fontWeight: '800', color: '#003366', borderWidth: 1, borderColor: '#005BB5', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 8, flex: 1 }, deleteIconBox: { padding: 8 }, deleteIcon: { fontSize: 20, color: '#EF4444', fontWeight: 'bold' }, optionsLabel: { fontSize: 12, fontWeight: '700', color: '#666', marginTop: 10, marginBottom: 5 }, optionsInput: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#DDD', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 8, fontSize: 13, marginBottom: 10, minHeight: 60, textAlignVertical: 'top' },
  qtySection: { flexDirection: 'row', alignItems: 'center', gap: 10 }, qtyInputField: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#005BB5', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 8, width: 70, fontWeight: '700', color: '#005BB5', fontSize: 14 }, unitInputField: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#999', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 8, flex: 1, fontSize: 13 },
  actionButtons: { flexDirection: 'row', gap: 10, marginBottom: 15 }, searchBtn: { flex: 1, backgroundColor: '#E3F2FD', paddingVertical: 10, borderRadius: 6, alignItems: 'center' }, searchBtnText: { color: '#005BB5', fontWeight: '700', fontSize: 13 }, customBtn: { flex: 1, backgroundColor: '#F0F0F0', paddingVertical: 10, borderRadius: 6, alignItems: 'center' }, customBtnText: { color: '#333', fontWeight: '700', fontSize: 13 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', paddingTop: 100 }, modalContent: { flex: 1, backgroundColor: '#FFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingTop: 20 }, modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 15 }, modalTitle: { fontSize: 18, fontWeight: '800', color: '#003366' }, closeBtn: { fontSize: 28, color: '#999', fontWeight: 'bold' }, searchInput: { marginHorizontal: 20, paddingHorizontal: 15, paddingVertical: 12, backgroundColor: '#F5F5F5', borderRadius: 8, borderWidth: 1, borderColor: '#DDD', fontSize: 14, marginBottom: 15 }, foodOption: { paddingHorizontal: 20, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#EEE' }, foodName: { fontSize: 15, fontWeight: '700', color: '#003366', marginBottom: 4 }, foodQty: { fontSize: 12, color: '#999' },
  saveBtn: { backgroundColor: '#003366', paddingVertical: 14, borderRadius: 8, alignItems: 'center', marginTop: 20, marginBottom: 10 }, saveBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 15 },
  emptyText: { textAlign: 'center', color: '#999', marginTop: 40, fontSize: 15 }, logCard: { backgroundColor: '#FFF', borderRadius: 10, marginBottom: 20, overflow: 'hidden', borderWidth: 1, borderColor: '#E5E5E5' }, logHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, backgroundColor: '#F8F9FB', borderBottomWidth: 1, borderBottomColor: '#E5E5E5' }, logDate: { fontWeight: '700', color: '#333', fontSize: 14 }, statusBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, fontSize: 12, fontWeight: 'bold' }, goodBadge: { backgroundColor: '#C8E6C9', color: '#2E7D32' }, badBadge: { backgroundColor: '#FFCDD2', color: '#C62828' }, pendingBadge: { backgroundColor: '#FFE0B2', color: '#E65100' },
  
  // ✅ Image Styles Updated for Enlarge Feature
  imageWrapper: { position: 'relative' },
  foodImage: { width: '100%', height: 200, backgroundColor: '#EEE' }, 
  zoomHint: { position: 'absolute', bottom: 10, right: 10, backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 15 },
  zoomText: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },
  
  // ✅ Full Screen Modal Styles
  fullScreenBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', alignItems: 'center' },
  fullScreenImg: { width: '100%', height: '80%' },
  closeImageBtn: { position: 'absolute', top: 50, right: 20, zIndex: 10, backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 8 },
  closeImageText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },

  logDetails: { padding: 15 }, detectedTitle: { fontWeight: '700', color: '#003366', fontSize: 13, marginBottom: 5 }, detectedItems: { color: '#555', fontSize: 13, marginBottom: 15 },
  macroTable: { borderRadius: 8, borderWidth: 1, borderColor: '#DDD', overflow: 'hidden', marginBottom: 15 }, macroHeaderRow: { flexDirection: 'row', backgroundColor: '#F0F0F0', paddingVertical: 10 }, macroDataRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderTopWidth: 1, borderTopColor: '#EEE' }, macroCell: { flex: 1, textAlign: 'center', fontSize: 12, color: '#333' }, actualValue: { fontWeight: '700', color: '#005BB5' },
  editMacroInput: { flex: 1, backgroundColor: '#F0F4F8', borderWidth: 1, borderColor: '#005BB5', borderRadius: 4, textAlign: 'center', fontSize: 12, paddingVertical: 4, marginHorizontal: 10, fontWeight: 'bold', color: '#003366' }, editFeedbackInput: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#DDD', borderRadius: 6, padding: 10, fontSize: 13, minHeight: 60, textAlignVertical: 'top', marginTop: 5 },
  feedbackBox: { backgroundColor: '#E8F5E9', padding: 12, borderRadius: 8, borderLeftWidth: 4, borderLeftColor: '#4CAF50' }, warningBox: { backgroundColor: '#FFF3E0', borderLeftColor: '#FF9800' }, feedbackTitle: { fontWeight: '700', color: '#333', fontSize: 12, marginBottom: 5 }, feedbackText: { color: '#555', fontSize: 12, lineHeight: 18 },
  approveBtn: { backgroundColor: '#4CAF50', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 15 }, approveBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  progressControls: {flexDirection: 'row',justifyContent: 'space-between',marginBottom: 20,gap: 10},

progressBtn: {flex: 1,backgroundColor: '#E3F2FD',paddingVertical: 12,borderRadius: 8,alignItems: 'center'},

progressBtnText: {color: '#005BB5',fontWeight: '700'},

placeholderCard: {backgroundColor: '#FFF',borderRadius: 12,padding: 25,alignItems: 'center',borderWidth: 1,borderColor: '#E5E5E5'},

placeholderTitle: {fontSize: 18,fontWeight: '800',color: '#003366',marginBottom: 10},

placeholderText: {textAlign: 'center',color: '#666',lineHeight: 22}
});