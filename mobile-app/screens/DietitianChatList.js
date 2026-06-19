import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, SafeAreaView } from 'react-native';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

export default function DietitianChatList({ route, navigation }) {
  const { user } = route.params || {};
  const dietitianId = user?._id || user?.id;

  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCounts, setUnreadCounts] = useState({});

  useEffect(() => {
    fetchPatientsAndUnreads();
    const unsubscribe = navigation.addListener('focus', () => { 
      fetchPatientsAndUnreads(); 
    });
    return unsubscribe;
  }, [navigation]);

  const fetchPatientsAndUnreads = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/dietitian/patients`);
      setPatients(response.data);
      await checkAllUnreadMessages(response.data);
    } catch (error) {
      console.error("Failed to fetch patients:", error);
    } finally {
      setLoading(false);
    }
  };

  const checkAllUnreadMessages = async (patientList) => {
    try {
      const unreadMap = {};
      
      for (let p of patientList) {
        const chatRes = await axios.get(`${API_URL}/api/chat/history/${dietitianId}/${p._id}`);
        const history = chatRes.data;
        
        if (history.length > 0) {
          const lastMsg = history[history.length - 1];
          if (lastMsg.senderId === p._id && lastMsg.read === false) {
            unreadMap[p._id] = true;
          }
        }
      }
      setUnreadCounts(unreadMap);
    } catch (e) { 
      console.log("Unread check error:", e); 
    }
  };

  const openChatWithPatient = async (patientId, patientName) => {
    try {
      // Clear locally immediately for snappy visual updates
      setUnreadCounts(prev => ({ ...prev, [patientId]: false }));

      // Symmetrically clear on backend matching your exact ChatScreen URL parameters
      await axios.put(`${API_URL}/api/chat/mark-read/${patientId}/${dietitianId}`).catch(() => {});

      navigation.navigate('Chat', { 
        currentUserId: dietitianId, 
        receiverId: patientId, 
        receiverName: patientName 
      });
    } catch (e) {
      console.log("Error launching patient chat:", e);
    }
  };

  const renderPatientChatCard = ({ item }) => {
    const hasUnread = unreadCounts[item._id] === true;

    return (
      <TouchableOpacity style={styles.card} onPress={() => openChatWithPatient(item._id, item.name)}>
        <View style={styles.chatCardContent}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
            {hasUnread && <View style={styles.avatarRedDotBadge} />}
          </View>
          
          <View style={{ flex: 1, marginLeft: 15 }}>
            <Text style={styles.patientName}>{item.name}</Text>
            <Text style={styles.patientDetail}>
              {hasUnread ? "New message waiting" : "Conversation read"}
            </Text>
          </View>
          
          <Ionicons name="chatbubble-ellipses-outline" size={24} color="#005BB5" />
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return <ActivityIndicator size="large" color="#003366" style={styles.loader} />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Patient Chats</Text>
      </View>
      
      <FlatList
        data={patients}
        renderItem={renderPatientChatCard}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={<Text style={styles.emptyText}>No patient chats active.</Text>}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F7FA' },
  header: { 
    backgroundColor: '#003366', 
    padding: 20, 
    paddingTop: 40,
    alignItems: 'center',
    justifyContent: 'center'
  },
  headerTitle: { color: '#FFF', fontSize: 24, fontWeight: 'bold' },
  listContainer: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40 },
  card: {
    backgroundColor: '#FFF',
    padding: 18,
    borderRadius: 12,
    marginBottom: 15,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  chatCardContent: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  avatarContainer: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#E3F2FD', justifyContent: 'center', alignItems: 'center', position: 'relative' },
  avatarText: { fontSize: 18, fontWeight: 'bold', color: '#005BB5' },
  avatarRedDotBadge: { position: 'absolute', top: 0, right: 0, width: 12, height: 12, borderRadius: 6, backgroundColor: '#EF4444', borderWidth: 2, borderColor: '#FFF' },
  patientName: { fontSize: 18, fontWeight: 'bold', color: '#1E293B' },
  patientDetail: { fontSize: 14, color: '#64748B', marginTop: 4 },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { textAlign: 'center', marginTop: 30, fontSize: 16, color: '#64748B' }
});