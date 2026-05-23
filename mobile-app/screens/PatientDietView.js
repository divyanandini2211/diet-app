import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, Dimensions, FlatList, TextInput, 
  TouchableOpacity, SafeAreaView, KeyboardAvoidingView, Platform, 
  ActivityIndicator, ScrollView, Alert 
} from 'react-native';
import axios from 'axios';

const { width } = Dimensions.get('window');

// REPLACE WITH YOUR ACTUAL API URL
const API_URL = process.env.EXPO_PUBLIC_API_URL;

export default function PatientDietView({ route, navigation }) {
  // Patient ID is passed from DietDetailScreen or LoginScreen
  const { patientId } = route.params || {}; 
  
  const [dietPlan, setDietPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dailyGoals, setDailyGoals] = useState(null);
  const [currentWeight, setCurrentWeight] = useState('');

  useEffect(() => {
    fetchPatientData();
  }, [patientId]);

  const fetchPatientData = async () => {
    try {
      // Fetch the custom diet plan assigned by the dietitian
      const res = await axios.get(`${API_URL}/api/patient/my-diet/${patientId}`);
      
      setDietPlan(res.data);
      setDailyGoals(res.data?.dailyGoals || {
        calorieTarget: 2000,
        proteinTarget: 100,
        carbsTarget: 250,
        fatTarget: 65,
        fiberTarget: 30
      });
      setLoading(false);
    } catch (error) {
      console.error("Fetch Error:", error);
      Alert.alert("Error", "Could not load your diet plan.");
      setLoading(false);
    }
  };

  const handleUpdateWeight = async () => {
    try {
      await axios.post(`${API_URL}/api/patient/update-weight`, { patientId, weight: Number(currentWeight) });
      Alert.alert("Success", "Weight updated successfully!");
    } catch (error) {
      Alert.alert("Error", "Could not update weight.");
    }
  };

  // --- RENDER EACH MEAL SESSION (READ-ONLY) ---
  const renderSession = ({ item: session, index }) => (
    <View style={styles.pageContainer}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 50 }}>
        
        {/* Session Header */}
        <View style={styles.sessionHeader}>
          <Text style={styles.sessionTitle}>{session.sessionName}</Text>
          <Text style={styles.timeText}>🕒 {session.time}</Text>
          <Text style={styles.pageIndicator}>Swipe for next meal ➔</Text>
        </View>

        {/* Food Items List - READ ONLY */}
        {session.items.map((foodItem, idx) => (
          <View key={idx} style={styles.foodCard}>
            
            <View style={styles.cardTop}>
              <Text style={styles.categoryName}>{foodItem.categoryName}</Text>
              <Text style={styles.targetText}>Quantity: {foodItem.quantityValue} {foodItem.unit}</Text>
            </View>

            {/* Sleek Pill Tags for Options */}
            <Text style={styles.optionLabel}>Options:</Text>
            <View style={styles.optionsWrapper}>
              {foodItem.options.map((opt, oIdx) => (
                <View key={oIdx} style={styles.optionPill}>
                  <Text style={styles.optionPillText}>{opt}</Text>
                </View>
              ))}
            </View>
          </View>
        ))}

        {/* Info Text */}
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>📸 Log your meals with camera from your home screen to track your nutrition!</Text>
        </View>

      </ScrollView>
    </View>
  );

  if (loading) return <ActivityIndicator size="large" color="#003366" style={{ marginTop: 100 }} />;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        
        {/* BACK BUTTON */}
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>‹ Back</Text>
        </TouchableOpacity>

        {/* TOP GREETING HEADER */}
        <View style={styles.topHeader}>
          <View>
            <Text style={styles.greetingText}>Hello ,</Text>
            <Text style={styles.subGreeting}>Track your meals to build your streak!</Text>
          </View>
        </View>

        {/* DAILY GOALS CARD */}
        <View style={styles.goalsCard}>
          <Text style={styles.goalsTitle}>📊 Your Daily Goals</Text>
          <View style={styles.goalsRow}>
            <View style={styles.goalBadge}>
              <Text style={styles.goalValue}>{dailyGoals?.calorieTarget || 2000}</Text>
              <Text style={styles.goalLabel}>kcal</Text>
            </View>
            <View style={styles.goalBadge}>
              <Text style={styles.goalValue}>{dailyGoals?.proteinTarget || 100}g</Text>
              <Text style={styles.goalLabel}>Protein</Text>
            </View>
            <View style={styles.goalBadge}>
              <Text style={styles.goalValue}>{dailyGoals?.carbsTarget || 250}g</Text>
              <Text style={styles.goalLabel}>Carbs</Text>
            </View>
            <View style={styles.goalBadge}>
              <Text style={styles.goalValue}>{dailyGoals?.fatTarget || 65}g</Text>
              <Text style={styles.goalLabel}>Fat</Text>
            </View>
            <View style={styles.goalBadge}>
              <Text style={styles.goalValue}>{dailyGoals?.fiberTarget || 30}g</Text>
              <Text style={styles.goalLabel}>Fiber</Text>
            </View>
          </View>
        </View>

        {/* SWIPEABLE MEAL SESSIONS (Only 3 meals) */}
        <FlatList
          data={(dietPlan?.sessions || []).filter(s => ['Breakfast', 'Lunch', 'Dinner'].includes(s.sessionName))}
          keyExtractor={(item, index) => index.toString()}
          renderItem={renderSession}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          bounces={false}
        />

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F7FA', // Soft medical background
  },
  
  // --- TOP WEIGHT HEADER ---
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#003366', // Deep Navy
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    zIndex: 10,
  },
  greetingText: { fontSize: 20, fontWeight: '800', color: '#FFF' },
  subGreeting: { fontSize: 12, color: '#94A3B8', marginTop: 4 },
  weightWidget: { backgroundColor: '#0F172A', padding: 10, borderRadius: 12, alignItems: 'center' },
  weightLabel: { fontSize: 11, color: '#94A3B8', textTransform: 'uppercase', fontWeight: '700' },
  weightInputRow: { flexDirection: 'row', alignItems: 'flex-end', marginTop: 4 },
  weightInput: { fontSize: 24, fontWeight: '800', color: '#22C55E', borderBottomWidth: 1, borderBottomColor: '#22C55E', minWidth: 40, textAlign: 'center', padding: 0 },
  weightUnit: { fontSize: 14, color: '#FFF', fontWeight: '600', marginLeft: 2, marginBottom: 3 },
  editIcon: { fontSize: 14, color: '#94A3B8', marginBottom: 3 },

  // --- GOALS CARD ---
  goalsCard: {
    marginHorizontal: 20,
    marginVertical: 15,
    backgroundColor: '#F0F8FF',
    borderRadius: 12,
    padding: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#005BB5',
  },
  goalsTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#003366',
    marginBottom: 12,
  },
  goalsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  goalBadge: {
    width: '30%',
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  goalValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#005BB5',
  },
  goalLabel: {
    fontSize: 11,
    color: '#666',
    fontWeight: '600',
    marginTop: 4,
  },

  // --- SWIPEABLE PAGES ---
  pageContainer: {
    width: width,
    padding: 20,
  },
  sessionHeader: {
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 10,
  },
  sessionTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#003366',
  },
  timeText: {
    fontSize: 18,
    color: '#64748B',
    marginTop: 5,
    fontWeight: '700',
  },
  pageIndicator: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontWeight: '700',
  },

  // --- FOOD CARDS ---
  foodCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 20,
    borderLeftWidth: 6,
    borderLeftColor: '#003366', 
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  categoryName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    flex: 1,
  },
  targetText: {
    fontSize: 14,
    color: '#003366',
    fontWeight: '700',
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    overflow: 'hidden',
  },

  // --- OPTIONS PILLS ---
  optionLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  optionsWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  optionPill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  optionPillText: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '600',
  },

  // --- INPUT SECTION ---
  inputSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    padding: 15,
    borderRadius: 12,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#003366',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  foodInput: {
    backgroundColor: '#FFF',
    borderWidth: 2,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    width: 60,
    height: 45,
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
  },
  inputUnit: {
    fontSize: 16,
    color: '#64748B',
    fontWeight: '600',
    marginLeft: 10,
    marginBottom: 10,
  },

  // --- INFO BOX ---
  infoBox: {
    backgroundColor: '#E3F2FD',
    borderLeftWidth: 4,
    borderLeftColor: '#005BB5',
    padding: 15,
    borderRadius: 8,
    marginVertical: 20,
  },
  infoText: {
    fontSize: 14,
    color: '#003366',
    fontWeight: '600',
    lineHeight: 20,
  },

  // --- BACK BUTTON ---
  backButton: {
    marginLeft: 20,
    marginTop: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#005BB5',
  }
});