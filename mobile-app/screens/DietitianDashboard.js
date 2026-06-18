import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, TextInput } from 'react-native';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons'; 

const API_URL = process.env.EXPO_PUBLIC_API_URL;

export default function DietitianDashboard({ route, navigation }) {
  const { user } = route.params || {};
  const dietitianId = user?._id || user?.id;
  
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // ✅ NEW: We store a list of patient IDs who have unread messages
  const [unreadCounts, setUnreadCounts] = useState({});

  useEffect(() => {
    fetchPatients();
    const unsubscribe = navigation.addListener('focus', () => { 
      fetchPatients(); 
    });
    return unsubscribe;
  }, [navigation]);

  const fetchPatients = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/dietitian/patients`);
      setPatients(response.data);
      
      // ✅ NEW: After we get the patients, we ask the backend which ones sent a message!
      checkAllUnreadMessages(response.data);
    } catch (error) {
      console.error("Failed to fetch patients:", error);
    } finally {
      setLoading(false);
    }
  };

  const checkAllUnreadMessages = async (patientList) => {
    try {
      // Ask the backend for our total unread messages
      const res = await axios.get(`${API_URL}/api/chat/unread/${dietitianId}`);
      
      // If we have an advanced backend, it would send us the exact senders. 
      // But for this fast version, we'll just check if there are ANY unread messages.
      // (To keep it perfectly accurate per patient, we just loop through them quickly!)
      const unreadMap = {};
      
      for (let p of patientList) {
        // Fetch chat history and see if the last message was sent by the patient and is unread
        const chatRes = await axios.get(`${API_URL}/api/chat/history/${dietitianId}/${p._id}`);
        const history = chatRes.data;
        
        if (history.length > 0) {
          const lastMsg = history[history.length - 1];
          // If the last message was sent BY the patient, and it is NOT read:
          if (lastMsg.senderId === p._id && lastMsg.read === false) {
            unreadMap[p._id] = true;
          }
        }
      }
      setUnreadCounts(unreadMap);
    } catch (e) { console.log("Unread check error"); }
  };

  const handleSelectPatient = (patient) => {
    navigation.navigate('DietDetail', { patient });
  };

  const filteredPatients = patients.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.opId && p.opId.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const renderPatientCard = ({ item }) => {
    // ✅ Check if THIS specific patient has a red dot waiting!
    const hasUnread = unreadCounts[item._id] === true;

    return (
      <TouchableOpacity style={styles.card} onPress={() => handleSelectPatient(item)}>
        <View style={{ flex: 1 }}>
          <Text style={styles.patientName}>{item.name}</Text>
          <Text style={styles.patientDetail}>OP/IP: {item.opId || 'N/A'}</Text>
          <Text style={styles.patientDetail}>Weight: {item.weight || '--'} kg</Text>
        </View>
        
        {/* ✅ THE CHAT BUTTON WITH RED DOT */}
        <TouchableOpacity 
          style={styles.chatActionBtn} 
          onPress={() => navigation.navigate('Chat', { 
            currentUserId: dietitianId, 
            receiverId: item._id, 
            receiverName: item.name 
          })}
        >
          <Ionicons name="chatbubble-ellipses" size={24} color="#005BB5" />
          {hasUnread && <View style={styles.redDot} />}
        </TouchableOpacity>
        
        <Text style={styles.arrow}>›</Text>
      </TouchableOpacity>
    );
  };

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
        placeholderTextColor="#888888" 
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
  profileBtn: { backgroundColor: '#FFFFFF', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6 },
  profileBtnText: { color: '#003366', fontWeight: '700', fontSize: 13 },
  searchInput: { backgroundColor: '#FFF', padding: 15, margin: 20, borderRadius: 10, fontSize: 16, borderWidth: 1, borderColor: '#E2E8F0', color: '#000000' },
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
  
  chatActionBtn: {
    backgroundColor: '#E3F2FD', 
    padding: 10, 
    borderRadius: 50, 
    marginRight: 15,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative' // ✅ Required for absolute positioning the red dot
  },
  
  redDot: { 
    position: 'absolute', 
    top: 0, 
    right: 0, 
    backgroundColor: '#EF4444', 
    width: 12, 
    height: 12, 
    borderRadius: 6, 
    borderWidth: 2, 
    borderColor: '#E3F2FD' 
  },

  arrow: { fontSize: 28, color: '#94A3B8' },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { textAlign: 'center', marginTop: 30, fontSize: 16, color: '#64748B' }
});