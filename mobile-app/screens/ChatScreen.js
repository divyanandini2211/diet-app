import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, SafeAreaView, KeyboardAvoidingView, Platform } from 'react-native';
import axios from 'axios';

export default function ChatScreen({ route, navigation }) {
  const { currentUserId, receiverId, receiverName } = route.params;
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const flatListRef = useRef();
  const API_URL = process.env.EXPO_PUBLIC_API_URL;

  useEffect(() => {
    fetchMessages();
    markAsRead(); // Turn off the red dot when we open the chat!
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, []);

  const markAsRead = async () => {
    try { await axios.put(`${API_URL}/api/chat/mark-read/${receiverId}/${currentUserId}`); } catch (e) {}
  };

  const fetchMessages = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/chat/history/${currentUserId}/${receiverId}`);
      setMessages(res.data);
    } catch (e) {}
  };

  const sendMessage = async () => {
    if (inputText.trim() === '') return;
    try {
      await axios.post(`${API_URL}/api/chat/send`, { senderId: currentUserId, receiverId: receiverId, text: inputText });
      setInputText('');
      fetchMessages(); 
    } catch (e) {}
  };

  const renderMessage = ({ item }) => {
    const isMe = item.senderId === currentUserId;
    const msgDate = new Date(item.createdAt);
    return (
      <View style={[styles.messageWrapper, isMe ? styles.messageWrapperMe : styles.messageWrapperThem]}>
        <View style={[styles.messageBubble, isMe ? styles.messageMe : styles.messageThem]}>
          <Text style={[styles.messageText, isMe ? styles.messageTextMe : styles.messageTextThem]}>{item.text}</Text>
          <Text style={[styles.timeText, isMe ? styles.timeTextMe : styles.timeTextThem]}>
            {msgDate.toLocaleDateString()} • {msgDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}><Text style={styles.backBtnText}>‹</Text></TouchableOpacity>
        <Text style={styles.headerTitle}>{receiverName}</Text>
      </View>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <FlatList
          ref={flatListRef} data={messages} keyExtractor={item => item._id} renderItem={renderMessage} contentContainerStyle={styles.chatList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })} onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />
        <View style={styles.inputContainer}>
          <TextInput style={styles.input} value={inputText} onChangeText={setInputText} placeholder="Type a message..." multiline />
          <TouchableOpacity style={styles.sendBtn} onPress={sendMessage}><Text style={styles.sendBtnText}>Send</Text></TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F4F8' },
  header: { backgroundColor: '#003366', padding: 20, paddingTop: 50, flexDirection: 'row', alignItems: 'center' },
  backBtn: { paddingRight: 15 }, backBtnText: { color: '#FFF', fontSize: 32, fontWeight: 'bold', marginTop: -5 }, headerTitle: { color: '#FFF', fontSize: 20, fontWeight: 'bold' },
  chatList: { padding: 15, paddingBottom: 20 }, messageWrapper: { marginBottom: 15, flexDirection: 'row' }, messageWrapperMe: { justifyContent: 'flex-end' }, messageWrapperThem: { justifyContent: 'flex-start' },
  messageBubble: { maxWidth: '80%', padding: 15, borderRadius: 20 }, messageMe: { backgroundColor: '#005BB5', borderBottomRightRadius: 5 }, messageThem: { backgroundColor: '#FFFFFF', borderBottomLeftRadius: 5, borderWidth: 1, borderColor: '#E2E8F0' },
  messageText: { fontSize: 16, lineHeight: 22 }, messageTextMe: { color: '#FFFFFF' }, messageTextThem: { color: '#334155' },
  timeText: { fontSize: 10, marginTop: 5, alignSelf: 'flex-end' }, timeTextMe: { color: '#B0C4DE' }, timeTextThem: { color: '#94A3B8' },
  inputContainer: { flexDirection: 'row', padding: 15, backgroundColor: '#FFF', borderTopWidth: 1, borderColor: '#E2E8F0', alignItems: 'center' },
  input: { flex: 1, backgroundColor: '#F1F5F9', borderRadius: 20, paddingHorizontal: 15, paddingTop: 12, paddingBottom: 12, fontSize: 16, maxHeight: 100 },
  sendBtn: { marginLeft: 15, backgroundColor: '#005BB5', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 20 }, sendBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 }
});