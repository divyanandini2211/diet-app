import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage'; // ✅ ADDED THIS

export default function DietitianProfileScreen({ route, navigation }) {
  const { user } = route.params || {};

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          // ✅ WIPES THE MEMORY SO THEY DON'T AUTO-LOGIN
          await AsyncStorage.removeItem('userData'); 
          navigation.replace('Login'); // Use replace so they can't hit the back button!
        }
      }
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>My Profile</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.closeBtn}>✕</Text>
        </TouchableOpacity>
      </View>

      {/* Profile Card */}
      <View style={styles.profileCard}>
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user?.name?.charAt(0).toUpperCase() || 'D'}</Text>
          </View>
          <Text style={styles.name}>{user?.name || 'Dietitian'}</Text>
          <Text style={styles.email}>{user?.phone || 'N/A'}</Text> 
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}> Dietitian</Text>
          </View>
        </View>

        {/* Info Section */}
        <View style={styles.infoSection}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Role</Text>
            <Text style={styles.infoValue}>Healthcare Provider</Text>
          </View>

          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Phone</Text>
            <Text style={styles.infoValue}>{user?.phone || 'N/A'}</Text>
          </View>
        </View>
      </View>

      {/* Logout Button */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}> Logout</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E5E5E5' },
  title: { fontSize: 24, fontWeight: '800', color: '#003366' },
  closeBtn: { fontSize: 24, color: '#64748B' },
  profileCard: { margin: 20, backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 },
  avatarSection: { alignItems: 'center', marginBottom: 30 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#005BB5', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  avatarText: { fontSize: 36, fontWeight: '800', color: '#FFFFFF' },
  name: { fontSize: 22, fontWeight: '800', color: '#003366', marginBottom: 4 },
  email: { fontSize: 14, color: '#64748B', fontWeight: '500', marginBottom: 12 },
  roleBadge: { backgroundColor: '#E3F2FD', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#005BB5' },
  roleText: { fontSize: 12, fontWeight: '700', color: '#005BB5' },
  infoSection: { gap: 16 },
  infoItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#E5E5E5' },
  infoLabel: { fontSize: 14, fontWeight: '700', color: '#64748B' },
  infoValue: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  logoutButton: { marginHorizontal: 20, marginBottom: 30, paddingVertical: 14, backgroundColor: '#EF4444', borderRadius: 12, alignItems: 'center', justifyContent: 'center', shadowColor: '#EF4444', shadowOpacity: 0.3, shadowRadius: 8, elevation: 3 },
  logoutText: { fontSize: 16, fontWeight: '800', color: '#FFFFFF' }
});

