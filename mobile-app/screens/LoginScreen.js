import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, SafeAreaView, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function LoginScreen({ navigation }) {
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState('patient'); 
  
  const [phone, setPhone] = useState('');
  const [opId, setOpId] = useState('');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  
  const [otpSent, setOtpSent] = useState(false);
  const [userOtp, setUserOtp] = useState('');
  
  // ⚡ Loading state to prevent duplicate clicks
  const [isSendingOtp, setIsSendingOtp] = useState(false);

  const API_URL = `${process.env.EXPO_PUBLIC_API_URL}/api/auth`;
  
  // Auto-login check
  useEffect(() => {
    checkLogin();
  }, []);

  const checkLogin = async () => {
    const savedUser = await AsyncStorage.getItem('userData');
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      if (parsedUser.role === 'dietitian') navigation.replace('DietitianDashboard', { user: parsedUser });
      else navigation.replace('PatientNavigation', { user: parsedUser });
    }
  };

  const handleFastLogin = async () => {
    if (!phone) return Alert.alert("Error", "Please enter your phone number.");
    if (role === 'patient' && !opId) return Alert.alert("Error", "Please enter your OP ID.");

    try {
      const res = await axios.post(`${API_URL}/login`, { phone, role, opId });
      const userData = res.data.user;

      await AsyncStorage.setItem('userData', JSON.stringify(userData)); 

      if (userData.role === 'dietitian') navigation.replace('DietitianDashboard', { user: userData });
      else navigation.replace('PatientNavigation', { user: userData });
    } catch (error) {
      // Handle the Unverified Ghost User!
      if (error.response?.status === 403) {
        Alert.alert("Not Verified", "You haven't verified your account yet. Please sign up to receive your OTP.");
        setIsLogin(false); // Switch to Sign Up screen
      } else {
        Alert.alert("Login Failed", error.response?.data?.message || "User not found.");
      }
    }
  };

  const handleRequestOtp = async () => {
    if (!name || !email || !phone) return Alert.alert("Missing Info", "Name, Email, and Phone are required.");
    if (role === 'patient' && !opId) return Alert.alert("Missing Info", "Please enter your OP / IP Number.");

    try {
      setIsSendingOtp(true); // Disable button and show loading text

      const res = await axios.post(`${API_URL}/request-otp`, { 
        name, email, phone, role, opId, height, weight 
      });
      
      setOtpSent(true);
      
      // 🏆 SHOW THE TEST OTP IN A POPUP IMMEDIATELY
      if (res.data.testOtp) {
        Alert.alert("Prototype Mode", `Your Test OTP is: ${res.data.testOtp}`);
      } else {
        Alert.alert("Notice", res.data.message || "OTP Sent!");
      }
      
    } catch (error) {
      Alert.alert("Error", error.response?.data?.message || "Could not send OTP.");
    } finally {
      setIsSendingOtp(false); // Re-enable button
    }
  };

  const handleVerifyAndRegister = async () => {
    if (!phone || !userOtp) return Alert.alert("Error", "Phone and OTP are required.");

    try {
      const res = await axios.post(`${API_URL}/register`, {
        phone: phone, 
        clientOtp: userOtp 
      });
      
      const userData = res.data.user;
      await AsyncStorage.setItem('userData', JSON.stringify(userData)); 

      Alert.alert("Success", "Account created successfully!");
      
      if (userData.role === 'dietitian') navigation.replace('DietitianDashboard', { user: userData });
      else navigation.replace('PatientNavigation', { user: userData });

    } catch (error) {
      console.log("Verify Error:", error.response?.data || error.message);
      Alert.alert("Error", error.response?.data?.message || "Invalid OTP");
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          
          <View style={styles.headerContainer}>
            <Text style={styles.title}>OncoDiet</Text>
            <Text style={styles.subtitle}>{otpSent ? 'Enter OTP to create account' : 'Please authenticate to continue'}</Text>
          </View>

          {!otpSent && (
            <View style={styles.roleContainer}>
              <TouchableOpacity style={[styles.roleButton, role === 'patient' && styles.activeRole]} onPress={() => setRole('patient')}>
                <Text style={[styles.roleText, role === 'patient' && styles.activeRoleText]}>Patient</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.roleButton, role === 'dietitian' && styles.activeRole]} onPress={() => setRole('dietitian')}>
                <Text style={[styles.roleText, role === 'dietitian' && styles.activeRoleText]}>Dietitian</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.formContainer}>
            {otpSent ? (
              <>
                <TextInput 
                  style={[styles.input, styles.otpInput]} 
                  placeholder="• • • •" 
                  placeholderTextColor="#888888"
                  value={userOtp} 
                  onChangeText={setUserOtp} 
                  keyboardType="numeric" 
                  maxLength={4} 
                />
                <TouchableOpacity style={styles.submitBtn} onPress={handleVerifyAndRegister}><Text style={styles.submitText}>Verify & Create Account</Text></TouchableOpacity>
                <TouchableOpacity style={styles.toggleContainer} onPress={() => setOtpSent(false)}><Text style={styles.toggleTextAction}>Cancel</Text></TouchableOpacity>
              </>
            ) : (
              <>
                <TextInput 
                  style={styles.input} 
                  placeholder="Mobile Number" 
                  placeholderTextColor="#888888"
                  value={phone} 
                  onChangeText={setPhone} 
                  keyboardType="phone-pad" 
                />
                {role === 'patient' && (
                  <TextInput 
                    style={styles.input} 
                    placeholder="OP / IP Number" 
                    placeholderTextColor="#888888"
                    value={opId} 
                    onChangeText={setOpId} 
                  />
                )}

                {!isLogin && (
                  <>
                    <TextInput 
                      style={styles.input} 
                      placeholder="Full Name" 
                      placeholderTextColor="#888888"
                      value={name} 
                      onChangeText={setName} 
                    />
                    <TextInput 
                      style={styles.input} 
                      placeholder="Email (For OTP)" 
                      placeholderTextColor="#888888"
                      value={email} 
                      onChangeText={setEmail} 
                      autoCapitalize="none" 
                      keyboardType="email-address" 
                    />
                    {role === 'patient' && (
                      <View style={styles.row}>
                        <TextInput 
                          style={[styles.input, styles.halfInput]} 
                          placeholder="Height (cm)" 
                          placeholderTextColor="#888888"
                          value={height} 
                          onChangeText={setHeight} 
                          keyboardType="numeric" 
                        />
                        <TextInput 
                          style={[styles.input, styles.halfInput]} 
                          placeholder="Weight (kg)" 
                          placeholderTextColor="#888888"
                          value={weight} 
                          onChangeText={setWeight} 
                          keyboardType="numeric" 
                        />
                      </View>
                    )}
                  </>
                )}

                <TouchableOpacity 
                  style={[styles.submitBtn, isSendingOtp && { backgroundColor: '#888888' }]} 
                  onPress={isLogin ? handleFastLogin : handleRequestOtp}
                  disabled={isSendingOtp}
                >
                  <Text style={styles.submitText}>
                    {isSendingOtp ? 'Sending OTP...' : (isLogin ? 'Sign In' : 'Get OTP')}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.toggleContainer} onPress={() => setIsLogin(!isLogin)}>
                  <Text style={styles.toggleText}>{isLogin ? "New user? " : "Already registered? "}<Text style={styles.toggleTextAction}>{isLogin ? "Sign Up" : "Sign In"}</Text></Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' }, container: { flex: 1 }, scrollContent: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 40 },
  headerContainer: { marginBottom: 40, alignItems: 'center' }, title: { fontSize: 28, fontWeight: '700', color: '#003366', marginBottom: 8 }, subtitle: { fontSize: 15, color: '#666666' },
  roleContainer: { flexDirection: 'row', backgroundColor: '#F0F4F8', borderRadius: 8, padding: 4, marginBottom: 30 }, roleButton: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 6 }, activeRole: { backgroundColor: '#005BB5' }, roleText: { fontWeight: '600', color: '#666666' }, activeRoleText: { color: '#FFFFFF' },
  formContainer: { width: '100%' }, input: { backgroundColor: '#FAFAFA', padding: 16, borderRadius: 8, marginBottom: 16, borderWidth: 1, borderColor: '#E0E0E0', fontSize: 15, color: '#333' }, row: { flexDirection: 'row', justifyContent: 'space-between' }, halfInput: { width: '48%' },
  otpInput: { textAlign: 'center', fontSize: 24, letterSpacing: 10, fontWeight: 'bold' },
  submitBtn: { backgroundColor: '#005BB5', padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 10 }, submitText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 16 },
  toggleContainer: { marginTop: 25, alignItems: 'center', padding: 10 }, toggleText: { fontSize: 15, color: '#666666' }, toggleTextAction: { color: '#005BB5', fontWeight: 'bold' }
});