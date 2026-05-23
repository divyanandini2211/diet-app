// screens/LoginScreen.js
import React, { useState } from 'react';
import axios from 'axios';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, SafeAreaView, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';

export default function LoginScreen({ navigation }) {
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState('patient'); 
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [opId, setOpId] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');

  // REPLACE "192.168.1.X" WITH YOUR ACTUAL IPv4 ADDRESS FROM STEP 3!!!
// I ADDED /api/auth TO THE END OF YOUR LINK!
// Back to the easiest link!
 const API_URL = `${process.env.EXPO_PUBLIC_API_URL}/api/auth`;


  const handleSubmit = async () => {
    try {
      if (isLogin) {
        // --- LOGIN LOGIC ---
        const response = await axios.post(`${API_URL}/login`, { email, password });
        
        // 2. 👉 FIXED: We must pass the user data to the dashboard!
        const userData = response.data.user || response.data; // Handles different backend setups

        if (userData.role === 'dietitian') {
          navigation.replace('DietitianDashboard', { user: userData }); 
        } else {
          navigation.replace('PatientNavigation', { user: userData }); 
        }

      } else {
        // --- SIGNUP LOGIC ---
        await axios.post(`${API_URL}/register`, {
          name, email, password, role, opId, height, weight
        });
        
        alert("Success! Account created! You can now log in.");
        setIsLogin(true); 
      }
    } catch (error) {
      console.log("FULL ERROR:", error);
      alert("Error: " + (error.response?.data?.message || error.message));
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'undefined'}
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          {/* Professional Header */}
          <View style={styles.headerContainer}>
            <Text style={styles.title}>OncoDiet</Text>
            <Text style={styles.subtitle}>Please authenticate to continue</Text>
          </View>

          {/* Elegant Role Selector (Segmented Control style) */}
          <View style={styles.roleContainer}>
            <TouchableOpacity 
              style={[styles.roleButton, role === 'patient' && styles.activeRole]} 
              onPress={() => setRole('patient')}
            >
              <Text style={[styles.roleText, role === 'patient' && styles.activeRoleText]}>Patient</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.roleButton, role === 'dietitian' && styles.activeRole]} 
              onPress={() => setRole('dietitian')}
            >
              <Text style={[styles.roleText, role === 'dietitian' && styles.activeRoleText]}>Dietitian</Text>
            </TouchableOpacity>
          </View>

          {/* Clean Form Fields */}
          <View style={styles.formContainer}>
            {!isLogin && (
              <TextInput style={styles.input} placeholder="Full Legal Name" placeholderTextColor="#999" value={name} onChangeText={setName} />
            )}
            
            <TextInput 
              style={styles.input} 
              placeholder="Email Address" 
              placeholderTextColor="#999" 
              value={email} 
              onChangeText={setEmail} 
              autoCapitalize="none" 
              keyboardType="email-address"
            />
            
            <TextInput 
              style={styles.input} 
              placeholder="Password" 
              placeholderTextColor="#999" 
              value={password} 
              onChangeText={setPassword} 
              secureTextEntry 
            />

            {/* Patient Only Fields */}
            {!isLogin && role === 'patient' && (
              <>
                <TextInput style={styles.input} placeholder="OP / IP Number" placeholderTextColor="#999" value={opId} onChangeText={setOpId} />
                <View style={styles.row}>
                  <TextInput style={[styles.input, styles.halfInput]} placeholder="Height (cm)" placeholderTextColor="#999" value={height} onChangeText={setHeight} keyboardType="numeric" />
                  <TextInput style={[styles.input, styles.halfInput]} placeholder="Weight (kg)" placeholderTextColor="#999" value={weight} onChangeText={setWeight} keyboardType="numeric" />
                </View>
              </>
            )}

            {/* Solid Professional Submit Button */}
            <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
              <Text style={styles.submitText}>{isLogin ? 'Sign In' : 'Create Account'}</Text>
            </TouchableOpacity>

            {/* Subdued Toggle */}
            <TouchableOpacity style={styles.toggleContainer} onPress={() => setIsLogin(!isLogin)}>
              <Text style={styles.toggleText}>
                {isLogin ? "Don't have an account? " : "Already registered? "}
                <Text style={styles.toggleTextAction}>{isLogin ? "Sign Up" : "Sign In"}</Text>
              </Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  container: { flex: 1 },
  scrollContent: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 40 },
  
  headerContainer: { marginBottom: 40, alignItems: 'center' },
  title: { fontSize: 28, fontWeight: '700', color: '#003366', marginBottom: 8, letterSpacing: 0.5 },
  subtitle: { fontSize: 15, color: '#666666' },
  
  roleContainer: { flexDirection: 'row', backgroundColor: '#F0F4F8', borderRadius: 8, padding: 4, marginBottom: 30 },
  roleButton: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 6 },
  activeRole: { backgroundColor: '#005BB5', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  roleText: { fontWeight: '600', color: '#666666', fontSize: 15 },
  activeRoleText: { color: '#FFFFFF' },
  
  formContainer: { width: '100%' },
  input: { backgroundColor: '#FAFAFA', padding: 16, borderRadius: 8, marginBottom: 16, borderWidth: 1, borderColor: '#E0E0E0', fontSize: 15, color: '#333' },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  halfInput: { width: '48%' },
  
  submitBtn: { backgroundColor: '#005BB5', padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 10, shadowColor: '#005BB5', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 5, elevation: 3 },
  submitText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 16, letterSpacing: 0.5 },
  
  toggleContainer: { marginTop: 25, alignItems: 'center', padding: 10 },
  toggleText: { fontSize: 15, color: '#666666' },
  toggleTextAction: { color: '#005BB5', fontWeight: 'bold' }
});