import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  ImageBackground,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../../shared/constants/theme';
import { FooterNav } from '../../../shared/components/FooterNav';
import { API_BASE_URL } from '../../../shared/constants/apiConfig';

// Локальне фонове зображення бруківки
const COBBLESTONE_BG = require('../../../assets/images/cobblestone_bg.jpg');

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
}

interface AIGuideScreenProps {
  navigation?: any;
  route?: {
    params?: {
      landmarkId?: number | string;
      landmarkName?: string;
      initialContext?: string;
      imageUri?: string;
    };
  };
}

export const AIGuideScreen: React.FC<AIGuideScreenProps> = ({ navigation, route }) => {
  const landmarkName = route?.params?.landmarkName || 'ЛЬВІВСЬКА ОПЕРА';

  const landmarkImage =
    route?.params?.imageUri ||
    'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTP45Z-Um2DKaeYkRKhBhAPjF4YKJ57j5rz5zvyOqkXTA&s=10';

  const initialDescription =
    route?.params?.initialContext ||
    'Архітектурна перлина Львова у стилі неоренесансу, зведена на початку XX століття за проєктом архітектора Зиґмунта Ґорґолевського.';

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: `Вітаю біля локації «${landmarkName}»! Я твій персональний екскурсовод Brookivka. Питай усе, що цікавить — від історичних фактів до міських легенд.`,
    },
  ]);

  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const handleSendMessage = async () => {
    const prompt = inputText.trim();
    if (!prompt || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: prompt,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/ai-guide/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          landmarkName,
          context: initialDescription,
          userMessage: prompt,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }

      const data = await response.json();

      const aiReply: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: data.reply || 'Цікаве питання, але зараз не вдалося сформувати відповідь.',
      };
      setMessages((prev) => [...prev, aiReply]);
    } catch (error) {
      console.error('AI Guide fetch error:', error);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'ai',
          text: 'Не вдалося зв’язатися з AI-гідом. Перевір, чи запущений бекенд та чи налаштований ключ.',
        },
      ]);
    } finally {
      setIsLoading(false);
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <StatusBar
        barStyle="light-content"
        {...(Platform.OS === 'android' ? { backgroundColor: COLORS.primaryGreen } : {})}
      />

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation?.goBack()}
          activeOpacity={0.7}
        >
          <Text style={styles.backButtonText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {landmarkName.toUpperCase()}
        </Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <ImageBackground
        source={COBBLESTONE_BG}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.chatListContent}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            ListHeaderComponent={
              <View style={styles.landmarkCard}>
                <Image
                  source={{ uri: landmarkImage }}
                  style={styles.landmarkImage}
                  resizeMode="cover"
                />
                <View style={styles.landmarkTextContainer}>
                  <Text style={styles.landmarkDescription} numberOfLines={8}>
                    {initialDescription}
                  </Text>
                </View>
              </View>
            }
            ListFooterComponent={
              isLoading ? (
                <View style={[styles.messageBubble, styles.aiBubble, styles.loadingBubble]}>
                  <ActivityIndicator size="small" color={COLORS.primaryGreen} />
                  <Text style={styles.aiMessageText}>Гід готує відповідь...</Text>
                </View>
              ) : undefined
            }
            renderItem={({ item }) => (
              <View
                style={[
                  styles.messageBubble,
                  item.sender === 'user' ? styles.userBubble : styles.aiBubble,
                ]}
              >
                <Text
                  style={[
                    styles.messageText,
                    item.sender === 'user' ? styles.userMessageText : styles.aiMessageText,
                  ]}
                >
                  {item.text}
                </Text>
              </View>
            )}
          />

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Запитати AI-гіда..."
              placeholderTextColor="#888888"
              value={inputText}
              onChangeText={setInputText}
              onSubmitEditing={handleSendMessage}
              returnKeyType="send"
              editable={!isLoading}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                (!inputText.trim() || isLoading) && styles.sendButtonDisabled,
              ]}
              onPress={handleSendMessage}
              disabled={!inputText.trim() || isLoading}
              activeOpacity={0.8}
            >
              <Text style={styles.sendIcon}>➤</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </ImageBackground>

      <FooterNav
        navigation={navigation}
        rightTabLabel="SITES"
        rightTabTarget="Landmarks"
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.primaryGreen,
  },
  header: {
    height: 52,
    backgroundColor: COLORS.primaryGreen,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    color: COLORS.white,
    fontSize: 26,
    lineHeight: 28,
  },
  headerTitle: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.8,
    textAlign: 'center',
    flex: 1,
    marginHorizontal: 8,
  },
  headerPlaceholder: {
    width: 36,
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  chatListContent: {
    padding: 16,
    paddingBottom: 20,
  },
  landmarkCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.backgroundPergament,
    borderWidth: 2,
    borderColor: COLORS.borderBronze,
    borderRadius: 18,
    padding: 10,
    marginBottom: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 4,
  },
  landmarkImage: {
    width: 120,
    height: 145,
    borderRadius: 12,
    backgroundColor: '#E0D0B0',
  },
  landmarkTextContainer: {
    flex: 1,
    paddingLeft: 12,
    justifyContent: 'center',
  },
  landmarkDescription: {
    fontSize: 13,
    lineHeight: 18,
    color: COLORS.textDark,
  },
  messageBubble: {
    maxWidth: '82%',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1.5,
  },
  loadingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: COLORS.buttonBrown,
    borderColor: COLORS.borderBronze,
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.backgroundPergament,
    borderColor: COLORS.borderBronze,
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  userMessageText: {
    color: COLORS.white,
    fontWeight: '500',
  },
  aiMessageText: {
    color: COLORS.textDark,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: COLORS.footerBackground,
    borderTopWidth: 1.5,
    borderTopColor: COLORS.borderBronze,
    gap: 10,
  },
  input: {
    flex: 1,
    height: 44,
    backgroundColor: COLORS.white,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: COLORS.borderBronze,
    paddingHorizontal: 14,
    fontSize: 14,
    color: COLORS.textDark,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: COLORS.primaryGreen,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendIcon: {
    color: COLORS.white,
    fontSize: 16,
  },
});