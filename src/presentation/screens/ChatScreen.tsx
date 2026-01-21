import React, { useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NavigationProp, RouteProp } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { useThemeColors } from '../../app/providers/ThemeProvider';
import type { ThemeColors } from '../theme/colors';
import type { MainStackParamList } from '../navigation/MainStack';
import { commonCopy } from '../content/commonCopy';
import { useRepositories } from '../../app/providers/RepositoryProvider';
import { useAuth } from '../../app/providers/AuthProvider';
import { isUserOnline } from '../../domain/presence';
import type { ChatMessage } from '../../domain/models/chat';
import GuestGateScreen from '../components/GuestGateScreen';
import { guestCopy } from '../content/guestCopy';
import { chatCopy } from '../content/chatCopy';

type MessageStatus = 'sending' | 'sent' | 'failed';

type ChatMessageState = ChatMessage & {
  localId?: string;
  status?: MessageStatus;
};

export default function ChatScreen() {
  const navigation = useNavigation<NavigationProp<MainStackParamList>>();
  const route = useRoute<RouteProp<MainStackParamList, 'Chat'>>();
  const { userId, user: initialUser } = route.params;
  const { session, isGuest, exitGuest } = useAuth();
  const { chats: chatRepository, users: userRepository } = useRepositories();
  const theme = useThemeColors();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();

  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessageState[]>([]);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [peer, setPeer] = useState(initialUser ?? null);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const bootstrap = async () => {
      if (!session?.user?.id) {
        setLoading(false);
        return;
      }
      try {
        const thread = await chatRepository.getOrCreateDirectThread(session.user.id, userId);
        if (!isMounted) return;
        setThreadId(thread.id);
        const [threadMessages, user] = await Promise.all([
          chatRepository.getMessages(thread.id, 50),
          userRepository.getUser(userId),
        ]);
        if (!isMounted) return;
        setMessages(threadMessages);
        if (user) {
          setPeer(user);
        }
        await chatRepository.markThreadRead(thread.id, session.user.id);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    void bootstrap();
    return () => {
      isMounted = false;
    };
  }, [chatRepository, session?.user?.id, userId, userRepository]);

  const displayName = peer?.name || commonCopy.userFallback;
  const displayPhoto = peer?.photoUrl;
  const isOnline = peer ? isUserOnline(peer) : false;

  const formatTime = (timestamp: string) =>
    new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const updateMessageStatus = (localId: string | undefined, status: MessageStatus) => {
    if (!localId) return;
    setMessages((prev) =>
      prev.map((current) => (current.localId === localId ? { ...current, status } : current))
    );
  };

  const replaceMessage = (localId: string | undefined, created: ChatMessage) => {
    if (!localId) return;
    setMessages((prev) =>
      prev.map((current) =>
        current.localId === localId ? { ...created, status: 'sent' } : current
      )
    );
  };

  const handleRetry = async (failed: ChatMessageState) => {
    if (!session?.user?.id || !threadId) {
      return;
    }
    if (failed.status !== 'failed') {
      return;
    }
    updateMessageStatus(failed.localId, 'sending');
    try {
      const created = await chatRepository.sendMessage(threadId, session.user.id, failed.content);
      replaceMessage(failed.localId, created);
    } catch {
      updateMessageStatus(failed.localId, 'failed');
    }
  };

  const renderMessage = ({ item }: { item: ChatMessageState }) => {
    const isMe = item.senderId === session?.user?.id;
    const status: MessageStatus = item.status ?? 'sent';
    const showFailure = isMe && status === 'failed';
    const showSending = isMe && status === 'sending';
    let statusLabel = formatTime(item.createdAt);
    if (isMe) {
      if (showSending) {
        statusLabel = chatCopy.status.sending;
      } else if (showFailure) {
        statusLabel = chatCopy.status.failed;
      }
    }
    return (
      <View style={[styles.messageRow, isMe ? styles.myMessageRow : styles.otherMessageRow]}>
        {!isMe && (
          <View style={styles.avatarContainer}>
            {displayPhoto ? (
              <Image source={{ uri: displayPhoto }} style={styles.miniAvatar} />
            ) : (
              <View style={styles.miniAvatarFallback}>
                <Text style={styles.miniAvatarText}>{displayName.charAt(0).toUpperCase()}</Text>
              </View>
            )}
          </View>
        )}
        <View style={styles.bubbleStack}>
          <Pressable
            disabled={!showFailure}
            onPress={() => handleRetry(item)}
            style={[
              styles.bubble,
              isMe ? styles.myBubble : styles.otherBubble,
              isMe ? styles.shadowMyBubble : styles.shadowSoft,
              showSending && styles.sendingBubble,
              showFailure && styles.failedBubble,
            ]}
          >
            <Text style={[styles.messageText, isMe ? styles.myMessageText : styles.otherMessageText]}>
              {item.content}
            </Text>
          </Pressable>
          <View style={[styles.timeRow, isMe && styles.myTimeRow]}>
            <Text style={[styles.timeText, showFailure && styles.failedText]}>
              {statusLabel}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const handleSend = async () => {
    if (isSending || !session?.user?.id) {
      return;
    }
    if (!threadId || !message.trim()) {
      return;
    }
    setIsSending(true);
    const content = message.trim();
    const localId = `local-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const optimisticMessage: ChatMessageState = {
      id: -Date.now(),
      threadId,
      senderId: session.user.id,
      content,
      createdAt: new Date().toISOString(),
      status: 'sending',
      localId,
    };
    setMessage('');
    setMessages((prev) => [...prev, optimisticMessage]);
    try {
      const created = await chatRepository.sendMessage(threadId, session.user.id, content);
      replaceMessage(localId, created);
    } catch (error) {
      console.error('Failed to send message:', error);
      updateMessageStatus(localId, 'failed');
    } finally {
      setIsSending(false);
    }
  };

  if (isGuest) {
    return (
      <GuestGateScreen
        title={guestCopy.restricted.title(guestCopy.features.inbox)}
        body={guestCopy.restricted.body(guestCopy.features.inbox)}
        onSignIn={() => void exitGuest()}
      />
    );
  }

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.headerSafe}>
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => navigation.goBack()} hitSlop={8}>
            <MaterialIcons name="arrow-back-ios-new" size={20} color="#0F172A" />
          </Pressable>
          <View style={styles.headerCenter}>
            <View style={styles.headerAvatarContainer}>
              {displayPhoto ? (
                <Image source={{ uri: displayPhoto }} style={styles.headerAvatar} />
              ) : (
                <View style={styles.headerAvatarFallback}>
                  <Text style={styles.headerAvatarText}>{displayName.charAt(0).toUpperCase()}</Text>
                </View>
              )}
              {isOnline ? <View style={styles.onlineDot} /> : null}
            </View>
            <View style={styles.headerInfo}>
              <View style={styles.nameRow}>
                <Text style={styles.headerName}>{displayName}</Text>
                <MaterialIcons name="verified" size={14} color="#3B82F6" />
              </View>
              <Text style={isOnline ? styles.statusText : styles.offlineStatusText}>{isOnline ? 'Online now' : 'Offline'}</Text>
            </View>
          </View>
        </View>
      </SafeAreaView>

      <FlatList
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.localId ?? `${item.id}`}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.dateSeparator}>
            <View style={styles.dateLine} />
            <Text style={styles.dateText}>{chatCopy.todayLabel}</Text>
            <View style={styles.dateLine} />
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <View style={styles.loadingState}>
              <Text style={styles.loadingText}>{chatCopy.loading}</Text>
            </View>
          ) : (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconContainer}>
                <MaterialIcons name="forum" size={48} color="#3B82F640" />
              </View>
              <Text style={styles.emptyTitle}>{chatCopy.emptyState.title}</Text>
              <Text style={styles.emptyBody}>{chatCopy.emptyState.body(displayName)}</Text>
              <Text style={styles.emptyDisclaimer}>{chatCopy.emptyState.disclaimer}</Text>
            </View>
          )
        }
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <View style={[styles.inputContainer, { paddingBottom: Math.max(insets.bottom, 32) }]}>
          <View style={styles.textInputWrapper}>
            <TextInput
              style={styles.textInput}
              placeholder={chatCopy.inputPlaceholder}
              placeholderTextColor="#64748B"
              value={message}
              onChangeText={setMessage}
              maxLength={100}
              multiline
            />
            <Text style={styles.charCounter}>{message.length}/100</Text>
          </View>
          <Pressable 
            style={[
              styles.sendButton, 
              (!message.trim() || isSending) && styles.sendButtonDisabled
            ]} 
            onPress={handleSend} 
            disabled={!message.trim() || isSending}
          >
            <MaterialIcons name="send" size={20} color="#FFF" />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const createStyles = (theme: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#F8FAFC',
    },
    headerSafe: {
      backgroundColor: '#FFF',
      borderBottomWidth: 1,
      borderBottomColor: '#F1F5F9',
      zIndex: 10,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      gap: 12,
    },
    backButton: {
      width: 40,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 20,
    },
    headerCenter: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    headerAvatarContainer: {
      position: 'relative',
    },
    headerAvatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: '#F1F5F9',
    },
    headerAvatarFallback: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: '#F1F5F9',
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerAvatarText: {
      fontSize: 16,
      fontWeight: 'bold',
      color: '#64748B',
    },
    onlineDot: {
      position: 'absolute',
      bottom: 0,
      right: 0,
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: '#22C55E',
      borderWidth: 2,
      borderColor: '#FFF',
    },
    headerInfo: {
      gap: 2,
    },
    nameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    headerName: {
      fontSize: 14,
      fontWeight: 'bold',
      color: '#0F172A',
    },
    statusText: {
      fontSize: 11,
      color: '#16A34A',
      fontWeight: '500',
    },
    offlineStatusText: {
      fontSize: 11,
      color: '#64748B',
      fontWeight: '500',
    },
    listContent: {
      paddingHorizontal: 16,
      paddingBottom: 24,
      flexGrow: 1,
    },
    dateSeparator: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginVertical: 24,
      gap: 12,
    },
    dateLine: {
      flex: 1,
      height: 1,
      backgroundColor: '#F1F5F9',
    },
    dateText: {
      fontSize: 11,
      fontWeight: 'bold',
      color: '#64748B',
      letterSpacing: 1,
    },
    loadingState: {
      alignItems: 'center',
      paddingVertical: 24,
    },
    loadingText: {
      fontSize: 13,
      color: '#64748B',
    },
    emptyState: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 32,
      paddingVertical: 48,
    },
    emptyIconContainer: {
      width: 96,
      height: 96,
      borderRadius: 48,
      backgroundColor: '#EFF6FF',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 24,
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: '#0F172A',
      marginBottom: 8,
      textAlign: 'center',
    },
    emptyBody: {
      fontSize: 14,
      color: '#64748B',
      lineHeight: 21,
      textAlign: 'center',
      marginBottom: 32,
    },
    emptyDisclaimer: {
      fontSize: 12,
      color: '#94A3B8',
      textAlign: 'center',
      fontStyle: 'italic',
    },
    messageRow: {
      flexDirection: 'row',
      marginBottom: 20,
      maxWidth: '85%',
    },
    myMessageRow: {
      alignSelf: 'flex-end',
      flexDirection: 'row-reverse',
    },
    otherMessageRow: {
      alignSelf: 'flex-start',
      alignItems: 'flex-end',
      gap: 8,
    },
    avatarContainer: {
      marginBottom: 4,
    },
    miniAvatar: {
      width: 32,
      height: 32,
      borderRadius: 16,
    },
    miniAvatarFallback: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: '#F1F5F9',
      alignItems: 'center',
      justifyContent: 'center',
    },
    miniAvatarText: {
      fontSize: 14,
      fontWeight: 'bold',
      color: '#64748B',
    },
    avatarSpacer: {
      width: 32,
    },
    bubbleStack: {
      gap: 4,
    },
    bubble: {
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderRadius: 20,
    },
    myBubble: {
      backgroundColor: '#3B82F6',
      borderBottomRightRadius: 4,
    },
    otherBubble: {
      backgroundColor: '#FFF',
      borderBottomLeftRadius: 4,
      borderWidth: 1,
      borderColor: '#F1F5F9',
    },
    messageText: {
      fontSize: 13,
      lineHeight: 18,
    },
    myMessageText: {
      color: '#FFF',
    },
    otherMessageText: {
      color: '#0F172A',
    },
    timeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 4,
    },
    myTimeRow: {
      justifyContent: 'flex-end',
    },
    timeText: {
      fontSize: 10,
      color: '#64748B',
    },
    sendingBubble: {
      opacity: 0.7,
    },
    failedBubble: {
      backgroundColor: '#FEE2E2',
      borderWidth: 1,
      borderColor: '#FCA5A5',
    },
    failedText: {
      color: '#DC2626',
      fontWeight: '600',
    },
    inputContainer: {
      backgroundColor: '#FFF',
      borderTopWidth: 1,
      borderTopColor: '#F1F5F9',
      paddingHorizontal: 12,
      paddingTop: 12,
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: 8,
    },
    textInputWrapper: {
      flex: 1,
      backgroundColor: '#F1F5F9',
      borderRadius: 20,
      paddingHorizontal: 16,
      paddingVertical: 8,
      minHeight: 40,
      maxHeight: 120,
      justifyContent: 'center',
    },
    textInput: {
      fontSize: 14,
      color: '#0F172A',
      paddingTop: 0,
      paddingBottom: 0,
    },
    charCounter: {
      fontSize: 10,
      color: '#64748B',
      alignSelf: 'flex-end',
      marginTop: 4,
    },
    sendButton: {
      width: 40,
      height: 40,
      backgroundColor: '#3B82F6',
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 4,
      shadowColor: '#3B82F6',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 4,
    },
    sendButtonDisabled: {
      backgroundColor: '#94A3B8',
      opacity: 0.5,
      shadowOpacity: 0,
      elevation: 0,
    },
    shadowSoft: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
    shadowMyBubble: {
      shadowColor: '#3B82F6',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 10,
      elevation: 4,
    },
  });
