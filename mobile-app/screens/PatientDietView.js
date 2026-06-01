import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, FlatList, TouchableOpacity, SafeAreaView, ActivityIndicator, ScrollView } from 'react-native';
import axios from 'axios';

const { width } = Dimensions.get('window');
const API_URL = process.env.EXPO_PUBLIC_API_URL;

export default function PatientDietView({ route, navigation }) {
  const { patientId } = route.params || {}; 
  
  const [dietPlan, setDietPlan] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPatientData();
    const unsubscribe = navigation.addListener('focus', () => { fetchPatientData(); });
    return unsubscribe;
  }, [patientId, navigation]);

  const fetchPatientData = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/patient/my-diet/${patientId}`);
      setDietPlan(res.data);
    } catch (error) {
      console.log("No diet plan found yet");
    } finally {
      setLoading(false);
    }
  };

  const isPlanEmpty = !dietPlan || !dietPlan.sessions || dietPlan.sessions.length === 0;

  // ✅ THIS HAS THE SWIPE / SKID PAGING
  const renderSession = ({ item: session }) => (
    <View style={styles.pageContainer}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 50 }}>
        <View style={styles.sessionHeader}>
          <Text style={styles.sessionTitle}>{session.sessionName}</Text>
          <Text style={styles.timeText}>🕒 {session.time}</Text>
          <Text style={styles.pageIndicator}>Swipe for next meal ➔</Text>
        </View>

        <View style={styles.foodCard}>
          {session.items.map((food, idx) => (
            <View key={idx} style={styles.foodRow}>
              <Text style={styles.bulletPoint}>•</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.foodName}>{food.name}</Text>
                {food.quantity ? <Text style={styles.foodQty}>Qty: {food.quantity}</Text> : null}
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );

  if (loading) return <ActivityIndicator size="large" color="#003366" style={{ marginTop: 100 }} />;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topHeader}>
        <Text style={styles.greetingText}>My Diet Plan</Text>
        <Text style={styles.subGreeting}>{dietPlan?.dietCategory || "Your official medical nutrition guide"}</Text>
      </View>

      {isPlanEmpty ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.lockIcon}>🔒</Text>
          <Text style={styles.emptyTitle}>Plan Not Assigned Yet</Text>
          <Text style={styles.emptyText}>
            Your Dietitian is currently reviewing your profile to customize the perfect diet plan for you. Please check back later!
          </Text>
        </View>
      ) : (
        <>
          <View style={styles.goalsCard}>
            <Text style={styles.goalsTitle}>📊 Your Daily Goals</Text>
            <View style={styles.goalsRow}>
              <View style={styles.goalBadge}><Text style={styles.goalValue}>{dietPlan.dailyGoals?.calorieTarget || 0}</Text><Text style={styles.goalLabel}>kcal</Text></View>
              <View style={styles.goalBadge}><Text style={styles.goalValue}>{dietPlan.dailyGoals?.proteinTarget || 0}g</Text><Text style={styles.goalLabel}>Protein</Text></View>
              <View style={styles.goalBadge}><Text style={styles.goalValue}>{dietPlan.dailyGoals?.carbsTarget || 0}g</Text><Text style={styles.goalLabel}>Carbs</Text></View>
              <View style={styles.goalBadge}><Text style={styles.goalValue}>{dietPlan.dailyGoals?.fatTarget || 0}g</Text><Text style={styles.goalLabel}>Fat</Text></View>
              <View style={styles.goalBadge}><Text style={styles.goalValue}>{dietPlan.dailyGoals?.fiberTarget || 0}g</Text><Text style={styles.goalLabel}>Fiber</Text></View>
            </View>
          </View>

          {/* THIS FLATLIST CREATES THE SWIPE SKIDDING */}
          <FlatList
            data={dietPlan.sessions}
            keyExtractor={(item, index) => index.toString()}
            renderItem={renderSession}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            bounces={false}
          />
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F7FA' },
  topHeader: { padding: 20, paddingTop: 50, backgroundColor: '#003366', borderBottomLeftRadius: 20, borderBottomRightRadius: 20, elevation: 5 },
  greetingText: { fontSize: 24, fontWeight: '800', color: '#FFF' },
  subGreeting: { fontSize: 13, color: '#94A3B8', marginTop: 4, fontStyle: 'italic' },
  
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30 },
  lockIcon: { fontSize: 60, marginBottom: 20 },
  emptyTitle: { fontSize: 22, fontWeight: '800', color: '#003366', marginBottom: 10, textAlign: 'center' },
  emptyText: { fontSize: 15, color: '#64748B', textAlign: 'center', lineHeight: 22 },

  goalsCard: { marginHorizontal: 20, marginVertical: 15, backgroundColor: '#F0F8FF', borderRadius: 12, padding: 15, borderLeftWidth: 4, borderLeftColor: '#005BB5' },
  goalsTitle: { fontSize: 14, fontWeight: '800', color: '#003366', marginBottom: 12 },
  goalsRow: { flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap' },
  goalBadge: { width: '30%', backgroundColor: '#FFF', borderRadius: 8, padding: 10, alignItems: 'center', marginBottom: 8, borderWidth: 1, borderColor: '#E5E5E5' },
  goalValue: { fontSize: 14, fontWeight: '800', color: '#005BB5' },
  goalLabel: { fontSize: 11, color: '#666', fontWeight: '600', marginTop: 4 },
  
  pageContainer: { width: width, padding: 20 },
  sessionHeader: { alignItems: 'center', marginBottom: 20 },
  sessionTitle: { fontSize: 28, fontWeight: '800', color: '#003366' },
  timeText: { fontSize: 16, color: '#64748B', marginTop: 5, fontWeight: '700' },
  pageIndicator: { fontSize: 12, color: '#94A3B8', marginTop: 10, textTransform: 'uppercase', letterSpacing: 1, fontWeight: '700' },
  
  foodCard: { backgroundColor: '#FFFFFF', padding: 20, borderRadius: 16, marginBottom: 20, borderLeftWidth: 6, borderLeftColor: '#003366', elevation: 2 },
  foodRow: { flexDirection: 'row', marginBottom: 15, borderBottomWidth: 1, borderBottomColor: '#F0F0F0', paddingBottom: 10 },
  bulletPoint: { fontSize: 20, color: '#005BB5', marginRight: 10 },
  foodName: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
  foodQty: { fontSize: 14, color: '#64748B', marginTop: 4, fontStyle: 'italic' }
});