import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ActivityIndicator, Alert } from 'react-native';
import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

export default function PatientProfileScreen({ route, navigation }) {
  const { user } = route.params || {};
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Use the user object passed from navigation instead of fetching
    if (user) {
      setPatient(user);
    }
    setLoading(false);
  }, [user]);

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: () => {
          // Clear any stored auth and go back to login
          navigation.navigate('Login');
        }
      }
    ]);
  };

  if (loading) return <ActivityIndicator size="large" color="#003366" style={{ marginTop: 100 }} />;

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
            <Text style={styles.avatarText}>{patient?.name?.charAt(0).toUpperCase() || 'P'}</Text>
          </View>
          <Text style={styles.name}>{patient?.name || 'Patient'}</Text>
          <Text style={styles.email}>{patient?.email || 'N/A'}</Text>
        </View>

        {/* Info Items */}
        <View style={styles.infoSection}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>📋 OP ID</Text>
            <Text style={styles.infoValue}>{patient?.opId || 'N/A'}</Text>
          </View>

          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>📏 Height</Text>
            <Text style={styles.infoValue}>{patient?.height || 'N/A'} cm</Text>
          </View>

          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>⚖️ Weight</Text>
            <Text style={styles.infoValue}>{patient?.weight || 'N/A'} kg</Text>
          </View>

          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>🔥 Streak</Text>
            <Text style={styles.infoValue}>{patient?.streak || 0} days</Text>
          </View>
        </View>
      </View>

      {/* Logout Button */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>🚪 Logout</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#003366',
  },
  closeBtn: {
    fontSize: 24,
    color: '#64748B',
  },
  profileCard: {
    margin: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#005BB5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 36,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  name: {
    fontSize: 22,
    fontWeight: '800',
    color: '#003366',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  infoSection: {
    gap: 16,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748B',
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  logoutButton: {
    marginHorizontal: 20,
    marginBottom: 30,
    paddingVertical: 14,
    backgroundColor: '#EF4444',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#EF4444',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
