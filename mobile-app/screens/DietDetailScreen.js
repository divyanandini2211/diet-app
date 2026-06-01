import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Image, Alert, Modal } from 'react-native';
import { Picker } from '@react-native-picker/picker'; // ✅ DROPDOWN IMPORTED!
import axios from 'axios';
import ProgressAnalyticsScreen from './ProgressAnalyticsScreen'; // ✅ Progress Tab Included!

export default function DietDetailScreen({ route, navigation }) {
  const { patient } = route.params || {};
  
  const [activeTab, setActiveTab] = useState('plan'); 
  const [dietPlan, setDietPlan] = useState(null); 
  const [dailyGoals, setDailyGoals] = useState({ calorieTarget: 0, proteinTarget: 0, carbsTarget: 0, fatTarget: 0, fiberTarget: 0 });
  const [avoidables, setAvoidables] = useState('');
  const [aiLogs, setAiLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [templates, setTemplates] = useState({});
  const [selectedTemplateKey, setSelectedTemplateKey] = useState(""); // ✅ DROPDOWN STATE
  const [fullScreenImage, setFullScreenImage] = useState(null);
  
  const API_URL = process.env.EXPO_PUBLIC_API_URL;

  useEffect(() => { 
    fetchTemplates(); 
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => { fetchData(); });
    fetchData();
    return () => { unsubscribe(); };
  }, [activeTab, navigation]);

  const fetchTemplates = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/dietitian/templates`);
      setTemplates(res.data);
    } catch (e) { console.log("Could not load templates"); }
  };

  const fetchData = async () => {
    if (!patient?._id) { setLoading(false); return; }
    try {
      if (activeTab === 'plan') {
        const res = await axios.get(`${API_URL}/api/dietitian/patient/${patient._id}/diet`);
        setDietPlan(res.data);
        setDailyGoals(res.data?.dailyGoals || { calorieTarget: 0, proteinTarget: 0, carbsTarget: 0, fatTarget: 0, fiberTarget: 0 });
        setAvoidables(res.data?.avoidables || '');
      } else {
        const res = await axios.get(`${API_URL}/api/dietitian/patient/${patient._id}/all-logs`);
        setAiLogs(res.data);
      }
    } catch (e) { Alert.alert("Error", "Could not fetch data."); } finally { setLoading(false); }
  };

  const handleMacroChange = (logId, macroName, value) => {
    setAiLogs(prevLogs => prevLogs.map(log => {
      if (log._id === logId) return { ...log, actualMacros: { ...log.actualMacros, [macroName]: value } };
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
      await axios.put(`${API_URL}/api/dietitian/log/${logId}/approve`, { actualMacros: safeMacros, feedback: logToApprove.feedback });
      Alert.alert("Approved", "Meal has been updated and approved!");
      fetchData(); 
    } catch (e) { Alert.alert("Error", "Could not approve meal."); }
  };

  const updateGoal = (field, value) => setDailyGoals({ ...dailyGoals, [field]: value }); 

  // ✅ DROPDOWN SELECTOR LOGIC
  const handleTemplateSelect = (key) => {
    setSelectedTemplateKey(key);
    if (!key) return; 

    Alert.alert(
      "Load Template", 
      `Are you sure you want to load the ${templates[key].name} template? This will overwrite the patient's current plan.`,
      [
        { text: "Cancel", style: "cancel", onPress: () => setSelectedTemplateKey("") },
        { text: "Load", onPress: () => {
            const temp = templates[key];
            setDailyGoals(temp.dailyGoals);
            setAvoidables(temp.avoidables);
            setDietPlan({ ...dietPlan, sessions: temp.sessions, dietCategory: temp.name });
            setSelectedTemplateKey(""); 
        }}
      ]
    );
  };

  // ✅ SIMPLE ITEM ROW FUNCTIONS
  const updateItemName = (sIndex, iIndex, value) => {
    const p = { ...dietPlan }; p.sessions[sIndex].items[iIndex].name = value; setDietPlan(p);
  };
  const updateItemQty = (sIndex, iIndex, value) => {
    const p = { ...dietPlan }; p.sessions[sIndex].items[iIndex].quantity = value; setDietPlan(p);
  };
  const addFoodItem = (sIndex) => {
    const p = { ...dietPlan }; p.sessions[sIndex].items.push({ name: "", quantity: "" }); setDietPlan(p);
  };
  const handleRemoveItem = (sIndex, iIndex) => {
    Alert.alert("Remove Item", "Delete this item?", [
      { text: "Cancel", style: "cancel" }, 
      { text: "Remove", style: "destructive", onPress: () => { const p = { ...dietPlan }; p.sessions[sIndex].items.splice(iIndex, 1); setDietPlan(p); }}
    ]);
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
      await axios.put(`${API_URL}/api/dietitian/patient/${patient._id}/diet-full`, { 
        sessions: dietPlan.sessions, avoidables: avoidables, dailyGoals: safeGoals, dietCategory: dietPlan.dietCategory 
      });
      Alert.alert("Success", "Diet Plan Saved!"); navigation.goBack();
    } catch (e) { Alert.alert("Error", "Could not save the diet plan."); } finally { setLoading(false); }
  };

  const renderPlanEditor = () => {
    return (
      <View style={styles.contentPad}>
        
        {/* ✅ THE DROPDOWN TEMPLATE SELECTOR IS BACK! */}
        <Text style={styles.sectionTitle}>📋 Select Clinical Template</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={selectedTemplateKey}
            onValueChange={(itemValue) => handleTemplateSelect(itemValue)}
            style={styles.picker}
          >
            <Picker.Item label="-- Choose a template to load --" value="" color="#999" />
            {Object.keys(templates).map((key) => (
              <Picker.Item key={key} label={templates[key].name} value={key} />
            ))}
          </Picker>
        </View>

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
        <TextInput style={styles.avoidInput} multiline placeholder="e.g., Fried foods..." value={avoidables} onChangeText={setAvoidables} />

        <Text style={styles.sectionTitle}>🍽️ Meal Sessions</Text>
        {dietPlan?.sessions?.length === 0 && <Text style={{color: '#999', fontStyle: 'italic', marginBottom: 20}}>No sessions active. Please select a template above!</Text>}
        
        {dietPlan?.sessions?.map((session, sIndex) => (
          <View key={sIndex} style={styles.sessionCard}>
            <Text style={styles.sessionTitle}>{session.sessionName} • {session.time}</Text>
            
            {/* CLEAN MODERN FOOD ROWS */}
            {session.items.map((item, iIndex) => (
              <View key={iIndex} style={styles.simpleItemRow}>
                <TextInput 
                  style={[styles.simpleInput, { flex: 2, marginRight: 8 }]} 
                  value={item.name} 
                  onChangeText={(val) => updateItemName(sIndex, iIndex, val)}
                  placeholder="Food Name"
                  multiline
                />
                <TextInput 
                  style={[styles.simpleInput, { flex: 1 }]} 
                  value={item.quantity} 
                  onChangeText={(val) => updateItemQty(sIndex, iIndex, val)}
                  placeholder="Qty"
                />
                <TouchableOpacity onPress={() => handleRemoveItem(sIndex, iIndex)}>
                  <Text style={styles.deleteIcon}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
            
            <TouchableOpacity style={styles.addSimpleBtn} onPress={() => addFoodItem(sIndex)}>
              <Text style={styles.addSimpleBtnText}>+ Add Food Item</Text>
            </TouchableOpacity>
          </View>
        ))}

        <TouchableOpacity style={styles.saveBtn} onPress={saveDietPlan}>
          <Text style={styles.saveBtnText}>💾 Save Plan</Text>
        </TouchableOpacity>
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
                <Text style={styles.logDate}>{new Date(log.date).toLocaleDateString()} • {log.displayTime || log.sessionName || "Time"}</Text>
                <Text style={[styles.statusBadge, isPending ? styles.pendingBadge : (log.status === 'EXCEEDED' ? styles.badBadge : styles.goodBadge)]}>
                  {isPending ? 'PENDING REVIEW' : log.status}
                </Text>
              </View>
              
              {log.imageUrl && (
                <TouchableOpacity style={styles.imageWrapper} onPress={() => setFullScreenImage(log.imageUrl)}>
                  <Image source={{ uri: log.imageUrl }} style={styles.foodImage} />
                  <View style={styles.zoomHint}><Text style={styles.zoomText}>🔍 Tap to enlarge</Text></View>
                </TouchableOpacity>
              )}
              
              <View style={styles.logDetails}>
                <Text style={styles.detectedTitle}>🔍 Detected & Confirmed Items:</Text>
                <Text style={styles.detectedItems}>{log.aiDetectedItems?.join(', ')}</Text>
                
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

                <View style={[styles.feedbackBox, log.feedback?.includes('WARNING') && styles.warningBox]}>
                  <Text style={styles.feedbackTitle}>💬 Dietitian Feedback:</Text>
                  {isPending ? (
                    <TextInput style={styles.editFeedbackInput} multiline value={log.feedback} onChangeText={(val) => handleFeedbackChange(log._id, val)} />
                  ) : (
                    <Text style={styles.feedbackText}>{log.feedback}</Text>
                  )}
                </View>

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
        {loading ? <ActivityIndicator size="large" color="#005BB5" style={{ marginTop: 50 }} /> : 
          activeTab === 'plan' ? renderPlanEditor() : 
          activeTab === 'monitor' ? renderAiMonitor() :  
          <ProgressAnalyticsScreen patient={patient} />
        }
      </ScrollView>

      <Modal visible={fullScreenImage !== null} transparent={true} animationType="fade">
        <View style={styles.fullScreenBg}>
          <TouchableOpacity style={styles.closeImageBtn} onPress={() => setFullScreenImage(null)}><Text style={styles.closeImageText}>✕ Close</Text></TouchableOpacity>
          {fullScreenImage && <Image source={{ uri: fullScreenImage }} style={styles.fullScreenImg} resizeMode="contain" />}
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' }, header: { backgroundColor: '#003366', padding: 20, paddingTop: 50, flexDirection: 'row', alignItems: 'center' }, backButton: { marginRight: 15, padding: 10 }, backButtonText: { color: '#FFF', fontSize: 28, fontWeight: 'bold' }, patientName: { color: '#FFF', fontSize: 22, fontWeight: '800' }, patientSub: { color: '#B0C4DE', fontSize: 12, marginTop: 3 },
  tabContainer: { flexDirection: 'row', padding: 15, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E0E0E0' }, tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 3, borderBottomColor: 'transparent' }, activeTab: { borderBottomColor: '#005BB5' }, tabText: { color: '#999', fontWeight: '700', fontSize: 14 }, activeTabText: { color: '#005BB5', fontWeight: '800' }, contentPad: { padding: 20, paddingBottom: 40 }, sectionTitle: { fontSize: 16, fontWeight: '800', color: '#003366', marginBottom: 12, marginTop: 15 },
  
  // ✅ NEW: DROPDOWN STYLES ARE BACK!
  pickerContainer: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#005BB5', borderRadius: 8, overflow: 'hidden', marginBottom: 20 },
  picker: { height: 50, width: '100%', color: '#333' },

  goalsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 20 }, goalInput: { width: '48%', backgroundColor: '#FFF', borderRadius: 8, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: '#E5E5E5' }, goalLabel: { fontSize: 12, fontWeight: '700', color: '#666', marginBottom: 5 }, goalField: { borderWidth: 1, borderColor: '#005BB5', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 8, fontSize: 16, fontWeight: 'bold', color: '#005BB5', marginBottom: 5 }, goalUnit: { fontSize: 11, color: '#999' },
  avoidInput: { backgroundColor: '#FFF', padding: 15, borderRadius: 8, borderWidth: 1, borderColor: '#DDD', textAlignVertical: 'top', fontSize: 14, marginBottom: 20 }, sessionCard: { backgroundColor: '#FFF', padding: 15, borderRadius: 10, marginBottom: 15, borderWidth: 1, borderColor: '#E5E5E5' }, sessionTitle: { fontSize: 16, fontWeight: '800', color: '#005BB5', marginBottom: 15, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  
  // Clean Item Row Styles
  simpleItemRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, backgroundColor: '#F8F9FB', padding: 10, borderRadius: 8, borderLeftWidth: 3, borderLeftColor: '#005BB5' },
  simpleInput: { fontSize: 14, color: '#333', borderWidth: 1, borderColor: '#E0E0E0', padding: 8, borderRadius: 6, backgroundColor: '#FFF' },
  deleteIcon: { fontSize: 18, color: '#EF4444', fontWeight: 'bold', paddingHorizontal: 10 },
  addSimpleBtn: { alignSelf: 'flex-start', marginTop: 5, padding: 8, backgroundColor: '#E3F2FD', borderRadius: 6 },
  addSimpleBtnText: { color: '#005BB5', fontWeight: 'bold', fontSize: 13 },
  
  saveBtn: { backgroundColor: '#003366', paddingVertical: 14, borderRadius: 8, alignItems: 'center', marginTop: 20, marginBottom: 10 }, saveBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 15 },
  emptyText: { textAlign: 'center', color: '#999', marginTop: 40, fontSize: 15 }, logCard: { backgroundColor: '#FFF', borderRadius: 10, marginBottom: 20, overflow: 'hidden', borderWidth: 1, borderColor: '#E5E5E5' }, logHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, backgroundColor: '#F8F9FB', borderBottomWidth: 1, borderBottomColor: '#E5E5E5' }, logDate: { fontWeight: '700', color: '#333', fontSize: 14 }, statusBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, fontSize: 12, fontWeight: 'bold' }, goodBadge: { backgroundColor: '#C8E6C9', color: '#2E7D32' }, badBadge: { backgroundColor: '#FFCDD2', color: '#C62828' }, pendingBadge: { backgroundColor: '#FFE0B2', color: '#E65100' },
  
  imageWrapper: { position: 'relative' }, foodImage: { width: '100%', height: 200, backgroundColor: '#EEE' }, zoomHint: { position: 'absolute', bottom: 10, right: 10, backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 15 }, zoomText: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },
  fullScreenBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', alignItems: 'center' }, fullScreenImg: { width: '100%', height: '80%' }, closeImageBtn: { position: 'absolute', top: 50, right: 20, zIndex: 10, backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 8 }, closeImageText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  logDetails: { padding: 15 }, detectedTitle: { fontWeight: '700', color: '#003366', fontSize: 13, marginBottom: 5 }, detectedItems: { color: '#555', fontSize: 13, marginBottom: 15 },
  macroTable: { borderRadius: 8, borderWidth: 1, borderColor: '#DDD', overflow: 'hidden', marginBottom: 15 }, macroHeaderRow: { flexDirection: 'row', backgroundColor: '#F0F0F0', paddingVertical: 10 }, macroDataRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderTopWidth: 1, borderTopColor: '#EEE' }, macroCell: { flex: 1, textAlign: 'center', fontSize: 12, color: '#333' }, actualValue: { fontWeight: '700', color: '#005BB5' },
  editMacroInput: { flex: 1, backgroundColor: '#F0F4F8', borderWidth: 1, borderColor: '#005BB5', borderRadius: 4, textAlign: 'center', fontSize: 12, paddingVertical: 4, marginHorizontal: 10, fontWeight: 'bold', color: '#003366' }, editFeedbackInput: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#DDD', borderRadius: 6, padding: 10, fontSize: 13, minHeight: 60, textAlignVertical: 'top', marginTop: 5 },
  feedbackBox: { backgroundColor: '#E8F5E9', padding: 12, borderRadius: 8, borderLeftWidth: 4, borderLeftColor: '#4CAF50' }, warningBox: { backgroundColor: '#FFF3E0', borderLeftColor: '#FF9800' }, feedbackTitle: { fontWeight: '700', color: '#333', fontSize: 12, marginBottom: 5 }, feedbackText: { color: '#555', fontSize: 12, lineHeight: 18 },
  approveBtn: { backgroundColor: '#4CAF50', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 15 }, approveBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 }
});