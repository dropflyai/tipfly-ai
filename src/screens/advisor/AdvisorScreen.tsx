import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, Shadows } from '../../constants/colors';
import { useUserStore } from '../../store/userStore';
import { askAdvisor, AdvisorMessage, AdvisorContext } from '../../services/ai/advisor';
import { getTipEntries, getWeeklyTips } from '../../services/api/tips';
import { getTaxSummary } from '../../services/api/tax';
import { calculateTotalTips, calculateAverageHourlyRate } from '../../utils/calculations';
import { lightHaptic, mediumHaptic } from '../../utils/haptics';
import { useNavigation } from '@react-navigation/native';

const FREE_DAILY_LIMIT = 5;
const DAILY_COUNT_KEY = 'advisor_daily_count';
const DAILY_DATE_KEY = 'advisor_daily_date';

const SUGGESTED_PROMPTS = [
  'How do I add a tip?',
  "What's the No Tax on Tips Act?",
  'How am I doing this week?',
  'How do I split tips with my team?',
];

export default function AdvisorScreen() {
  const navigation = useNavigation();
  const isPremium = useUserStore((state) => state.isPremium());
  const user = useUserStore((state) => state.user);

  const [messages, setMessages] = useState<AdvisorMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [context, setContext] = useState<AdvisorContext>({
    userName: user?.full_name || 'there',
    isPremium,
    totalTipsThisWeek: 0,
    avgHourlyRate: 0,
    deductionProgress: 0,
    totalTipsYTD: 0,
    tipCount: 0,
  });
  const [dailyCount, setDailyCount] = useState(0);
  const [limitReached, setLimitReached] = useState(false);

  const flatListRef = useRef<FlatList>(null);

  // Load user data context on focus
  useFocusEffect(
    useCallback(() => {
      loadContext();
      checkDailyLimit();
    }, [])
  );

  const loadContext = async () => {
    try {
      const currentYear = new Date().getFullYear();
      const [weeklyTips, allTips, taxData] = await Promise.all([
        getWeeklyTips().catch(() => []),
        getTipEntries(50).catch(() => []),
        getTaxSummary(currentYear).catch(() => null),
      ]);

      const weekTotal = calculateTotalTips(weeklyTips);
      const weekRate = calculateAverageHourlyRate(weeklyTips);
      const ytdTotal = taxData?.yearTotal?.netTipEarnings || 0;
      const deductionPct = taxData?.yearTotal?.thresholdProgress || 0;

      setContext({
        userName: user?.full_name || 'there',
        isPremium,
        totalTipsThisWeek: weekTotal,
        avgHourlyRate: weekRate,
        deductionProgress: deductionPct,
        totalTipsYTD: ytdTotal,
        tipCount: allTips.length,
      });
    } catch (error) {
      console.warn('[Advisor] Failed to load context:', error);
    }
  };

  const checkDailyLimit = async () => {
    if (isPremium) {
      setLimitReached(false);
      return;
    }

    try {
      const today = new Date().toISOString().split('T')[0];
      const savedDate = await AsyncStorage.getItem(DAILY_DATE_KEY);
      const savedCount = await AsyncStorage.getItem(DAILY_COUNT_KEY);

      if (savedDate !== today) {
        // New day, reset
        await AsyncStorage.setItem(DAILY_DATE_KEY, today);
        await AsyncStorage.setItem(DAILY_COUNT_KEY, '0');
        setDailyCount(0);
        setLimitReached(false);
      } else {
        const count = parseInt(savedCount || '0', 10);
        setDailyCount(count);
        setLimitReached(count >= FREE_DAILY_LIMIT);
      }
    } catch {
      // If storage fails, don't block the user
      setLimitReached(false);
    }
  };

  const incrementDailyCount = async () => {
    if (isPremium) return;

    const newCount = dailyCount + 1;
    setDailyCount(newCount);

    try {
      const today = new Date().toISOString().split('T')[0];
      await AsyncStorage.setItem(DAILY_DATE_KEY, today);
      await AsyncStorage.setItem(DAILY_COUNT_KEY, String(newCount));

      if (newCount >= FREE_DAILY_LIMIT) {
        setLimitReached(true);
      }
    } catch {
      // Non-critical
    }
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    if (limitReached && !isPremium) return;

    lightHaptic();
    const userMessage: AdvisorMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      const response = await askAdvisor(text.trim(), messages, context);
      const assistantMessage: AdvisorMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
      await incrementDailyCount();
    } catch (error) {
      const errorMessage: AdvisorMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: 'Sorry, I ran into an issue. Please try again.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestedPrompt = (prompt: string) => {
    mediumHaptic();
    sendMessage(prompt);
  };

  const renderMessage = ({ item }: { item: AdvisorMessage }) => {
    const isUser = item.role === 'user';
    return (
      <View style={[styles.messageBubble, isUser ? styles.userBubble : styles.assistantBubble]}>
        {!isUser && (
          <View style={styles.advisorAvatar}>
            <Ionicons name="sparkles" size={14} color={Colors.gold} />
          </View>
        )}
        <View style={[styles.bubbleContent, isUser ? styles.userContent : styles.assistantContent]}>
          <Text style={[styles.messageText, isUser ? styles.userText : styles.assistantText]}>
            {item.content}
          </Text>
        </View>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIconContainer}>
        <Ionicons name="sparkles" size={48} color={Colors.gold} />
      </View>
      <Text style={styles.emptyTitle}>TipFly Advisor</Text>
      <Text style={styles.emptySubtitle}>
        Ask me about the app, your earnings, tax deductions, or tip pooling.
      </Text>

      <View style={styles.suggestedContainer}>
        {SUGGESTED_PROMPTS.map((prompt) => (
          <TouchableOpacity
            key={prompt}
            style={styles.suggestedChip}
            onPress={() => handleSuggestedPrompt(prompt)}
            activeOpacity={0.7}
          >
            <Text style={styles.suggestedText}>{prompt}</Text>
            <Ionicons name="arrow-forward" size={14} color={Colors.primary} />
          </TouchableOpacity>
        ))}
      </View>

      {!isPremium && (
        <Text style={styles.limitNote}>
          {FREE_DAILY_LIMIT} free questions per day
        </Text>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="sparkles" size={24} color={Colors.gold} />
          <Text style={styles.headerTitle}>TipFly Advisor</Text>
        </View>
        {messages.length > 0 && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={() => {
              lightHaptic();
              setMessages([]);
            }}
          >
            <Text style={styles.clearText}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>

      <KeyboardAvoidingView
        style={styles.chatContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Messages */}
        {messages.length === 0 ? (
          renderEmptyState()
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.messageList}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
          />
        )}

        {/* Loading indicator */}
        {isLoading && (
          <View style={styles.typingIndicator}>
            <View style={styles.advisorAvatar}>
              <Ionicons name="sparkles" size={14} color={Colors.gold} />
            </View>
            <View style={styles.typingDots}>
              <ActivityIndicator size="small" color={Colors.textSecondary} />
              <Text style={styles.typingText}>Thinking...</Text>
            </View>
          </View>
        )}

        {/* Daily limit banner */}
        {limitReached && !isPremium && (
          <View style={styles.limitBanner}>
            <Text style={styles.limitBannerText}>
              You've used your {FREE_DAILY_LIMIT} free questions today.
            </Text>
            <TouchableOpacity
              onPress={() => {
                mediumHaptic();
                navigation.navigate('Upgrade' as never);
              }}
            >
              <Text style={styles.limitUpgradeText}>Upgrade for unlimited</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Input area */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            placeholder={limitReached && !isPremium ? 'Daily limit reached' : 'Ask your advisor...'}
            placeholderTextColor={Colors.textSecondary}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
            editable={!limitReached || isPremium}
            onSubmitEditing={() => sendMessage(inputText)}
            blurOnSubmit={false}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!inputText.trim() || isLoading || (limitReached && !isPremium)) && styles.sendButtonDisabled,
            ]}
            onPress={() => sendMessage(inputText)}
            disabled={!inputText.trim() || isLoading || (limitReached && !isPremium)}
            activeOpacity={0.7}
          >
            <Ionicons
              name="send"
              size={20}
              color={inputText.trim() && !isLoading ? Colors.white : Colors.textSecondary}
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.backgroundSecondary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderBlue,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.text,
  },
  clearButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  clearText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  chatContainer: {
    flex: 1,
  },
  messageList: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  messageBubble: {
    flexDirection: 'row',
    marginBottom: 12,
    maxWidth: '85%',
  },
  userBubble: {
    alignSelf: 'flex-end',
  },
  assistantBubble: {
    alignSelf: 'flex-start',
  },
  advisorAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.gold + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    marginTop: 2,
  },
  bubbleContent: {
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxWidth: '100%',
    flexShrink: 1,
  },
  userContent: {
    backgroundColor: Colors.primary,
    borderBottomRightRadius: 4,
  },
  assistantContent: {
    backgroundColor: Colors.backgroundSecondary,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: Colors.borderBlue,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
  },
  userText: {
    color: Colors.white,
  },
  assistantText: {
    color: Colors.text,
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  typingDots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: Colors.borderBlue,
  },
  typingText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingBottom: 40,
  },
  emptyIconContainer: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: Colors.gold + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
  suggestedContainer: {
    width: '100%',
    gap: 8,
  },
  suggestedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: Colors.borderBlue,
  },
  suggestedText: {
    fontSize: 15,
    color: Colors.text,
    fontWeight: '500',
  },
  limitNote: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 20,
  },
  limitBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.gold + '15',
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  limitBannerText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  limitUpgradeText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.gold,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
    backgroundColor: Colors.backgroundSecondary,
    borderTopWidth: 1,
    borderTopColor: Colors.borderBlue,
    gap: 10,
  },
  textInput: {
    flex: 1,
    backgroundColor: Colors.background,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    fontSize: 15,
    color: Colors.text,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: Colors.borderBlue,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: Colors.backgroundSecondary,
  },
});
