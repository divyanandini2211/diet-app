import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, TextInput } from 'react-native';
import axios from 'axios';

// 👉 REPLACE WITH YOUR HOTSPOT/SERVER IP
const API_URL = "http://10.49.211.37:5000"; 

// The 'navigation' prop is essential for moving between screens.
export default function DietitianDashboard({ route, navigation }) {
  const { user } = route.params || {};
  const dietitianId = user?._id || user?.id;
  
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchPatients();
    
    // Set up a listener to refresh data when the screen is focused again
    const unsubscribe = navigation.addListener('focus', () => {
      fetchPatients();
    });

    return unsubscribe;
  }, [navigation]);

  const fetchPatients = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/dietitian/patients`);
      setPatients(response.data);
    } catch (error) {
      console.error("Failed to fetch patients:", error);
    } finally {
      setLoading(false);
    }
  };

  // This is the critical function that takes the user to the detail screen.
  const handleSelectPatient = (patient) => {
    // We navigate to 'DietDetail' and pass the entire patient object.
    // This is what the DietDetailScreen will receive in its 'route.params'.
    navigation.navigate('DietDetail', { patient });
  };

  const filteredPatients = patients.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.opId && p.opId.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const renderPatientCard = ({ item }) => (
    <TouchableOpacity style={styles.card} onPress={() => handleSelectPatient(item)}>
      <View>
        <Text style={styles.patientName}>{item.name}</Text>
        <Text style={styles.patientDetail}>OP/IP: {item.opId || 'N/A'}</Text>
        <Text style={styles.patientDetail}>Weight: {item.weight || '--'} kg</Text>
      </View>
      <Text style={styles.arrow}>›</Text>
    </TouchableOpacity>
  );

  if (loading) {
    return <ActivityIndicator size="large" color="#003366" style={styles.loader} />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Patients</Text>
        <TouchableOpacity 
          style={styles.profileBtn}
          onPress={() => navigation.navigate('DietitianProfile', { user })}
        >
          <Text style={styles.profileBtnText}>👤 Profile</Text>
        </TouchableOpacity>
      </View>
      
      <TextInput
        style={styles.searchInput}
        placeholder="Search by name or OP/IP number..."
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

      <FlatList
        data={filteredPatients}
        renderItem={renderPatientCard}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={<Text style={styles.emptyText}>No patients found.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F7FA' },
  header: { 
    backgroundColor: '#003366', 
    padding: 20, 
    paddingTop: 50,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  headerTitle: { color: '#FFF', fontSize: 28, fontWeight: 'bold' },
  profileBtn: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  profileBtnText: {
    color: '#003366',
    fontWeight: '700',
    fontSize: 13,
  },
  searchInput: {
    backgroundColor: '#FFF',
    padding: 15,
    margin: 20,
    borderRadius: 10,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  listContainer: { paddingHorizontal: 20 },
  card: {
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: 12,
    marginBottom: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  patientName: { fontSize: 18, fontWeight: 'bold', color: '#1E293B' },
  patientDetail: { fontSize: 14, color: '#64748B', marginTop: 4 },
  arrow: { fontSize: 28, color: '#94A3B8' },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { textAlign: 'center', marginTop: 30, fontSize: 16, color: '#64748B' }
});