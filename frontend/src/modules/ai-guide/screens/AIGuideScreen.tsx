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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../../shared/constants/theme';
import { FooterNav } from '../../../shared/components/FooterNav';

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
      landmarkId?: string;
      landmarkName?: string;
      initialContext?: string;
      imageUri?: string;
    };
  };
}

// Ось тут має експортуватися саме AIGuideScreen:
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
      id: '1',
      sender: 'user',
      text: 'Розкажи про Дзеркальну залу театру',
    },
    {
      id: '2',
      sender: 'ai',
      text: 'Вітаю! Дзеркальна зала (фоє) — один із найкрасивіших інтер\'єрів театру. Вона оздоблена ліпниною з позолотою, настінними картинами-алегоріями чотирьох пір року та величезними дзеркалами, які візуально розширюють простір.',
    },
  ]);

  const [inputText, setInputText] = useState('');
  const flatListRef = useRef<FlatList>(null);

  const handleSendMessage = () => {
    if (!inputText.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: inputText.trim(),
    };

    setMessages((prev) => [...prev, userMsg]);
    const prompt = inputText.trim();
    setInputText('');

    setTimeout(() => {
      const aiReply: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: `Відповідь гіда про "${prompt}": Львівська опера стоїть прямо над річкою Полтвою, яку наприкінці XIX століття заховали в підземний колектор безпосередньо перед будівництвом театру.`,
      };
      setMessages((prev) => [...prev, aiReply]);
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 700);
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
            />
            <TouchableOpacity
              style={styles.sendButton}
              onPress={handleSendMessage}
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
  sendIcon: {
    color: COLORS.white,
    fontSize: 16,
  },
});