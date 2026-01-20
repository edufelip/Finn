import React, { useMemo, useState } from 'react';
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
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { useThemeColors } from '../../app/providers/ThemeProvider';
import type { ThemeColors } from '../theme/colors';
import type { MainStackParamList } from '../navigation/MainStack';
import { commonCopy } from '../content/commonCopy';

type Message = {
  id: string;
  senderId: string;
  text: string;
  timestamp: string;
  isMe: boolean;
  attachment?: {
    name: string;
    size: string;
    type: 'pdf' | 'image';
  };
};

export default function ChatScreen() {
  const navigation = useNavigation<NavigationProp<MainStackParamList>>();
  const route = useRoute<RouteProp<MainStackParamList, 'Chat'>>();
  const { userId, user: initialUser } = route.params;
  const theme = useThemeColors();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();

  const [message, setMessage] = useState('');
  const [messages] = useState<Message[]>([
    {
      id: '1',
      senderId: userId,
      text: 'Hi! I saw your request about the LLM optimization paper. Happy to discuss how we achieved those latency gains.',
      timestamp: '10:24 AM',
      isMe: false,
    },
    {
      id: '2',
      senderId: 'me',
      text: "That would be amazing, Alex! I'm particularly interested in the quantization techniques you mentioned on page 4.",
      timestamp: '10:26 AM',
      isMe: true,
    },
    {
      id: '3',
      senderId: userId,
      text: "Specifically, we used a custom 4-bit implementation that handles outliers differently. I've attached a snippet of the schema we used.",
      timestamp: '10:27 AM',
      isMe: false,
    },
    {
      id: '4',
      senderId: userId,
      text: '',
      timestamp: '10:27 AM',
      isMe: false,
      attachment: {
        name: 'quantization_schema.pdf',
        size: '1.2 MB',
        type: 'pdf',
      },
    },
  ]);

  const displayName = initialUser?.name || commonCopy.userFallback;
  const displayPhoto = initialUser?.photoUrl;

  const renderMessage = ({ item }: { item: Message }) => {
    if (item.attachment) {
      return (
        <View style={[styles.messageRow, item.isMe ? styles.myMessageRow : styles.otherMessageRow]}>
          {!item.isMe && <View style={styles.avatarSpacer} />}
          <View style={[styles.attachmentContainer, styles.shadowSoft]}>
            <View style={styles.attachmentIconBox}>
              <MaterialIcons name="description" size={24} color="#3B82F6" />
            </View>
            <View style={styles.attachmentInfo}>
              <Text style={styles.attachmentName} numberOfLines={1}>
                {item.attachment.name}
              </Text>
              <Text style={styles.attachmentSize}>{item.attachment.size}</Text>
            </View>
          </View>
        </View>
      );
    }

    return (
      <View style={[styles.messageRow, item.isMe ? styles.myMessageRow : styles.otherMessageRow]}>
        {!item.isMe && (
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
          <View
            style={[
              styles.bubble,
              item.isMe ? styles.myBubble : styles.otherBubble,
              item.isMe ? styles.shadowMyBubble : styles.shadowSoft,
            ]}
          >
            <Text style={[styles.messageText, item.isMe ? styles.myMessageText : styles.otherMessageText]}>
              {item.text}
            </Text>
          </View>
          <View style={[styles.timeRow, item.isMe && styles.myTimeRow]}>
            <Text style={styles.timeText}>{item.timestamp}</Text>
            {item.isMe && (
              <MaterialIcons name="done-all" size={14} color="#3B82F6" style={styles.readReceipt} />
            )}
          </View>
        </View>
      </View>
    );
  };

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
              <View style={styles.onlineDot} />
            </View>
            <View style={styles.headerInfo}>
              <View style={styles.nameRow}>
                <Text style={styles.headerName}>{displayName}</Text>
                <MaterialIcons name="verified" size={14} color="#3B82F6" />
              </View>
              <Text style={styles.statusText}>Online now</Text>
            </View>
          </View>
          <Pressable style={styles.infoButton} hitSlop={8}>
            <MaterialIcons name="info-outline" size={24} color="#64748B" />
          </Pressable>
        </View>
      </SafeAreaView>

      <FlatList
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.dateSeparator}>
            <View style={styles.dateLine} />
            <Text style={styles.dateText}>TODAY</Text>
            <View style={styles.dateLine} />
          </View>
        }
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <View style={[styles.inputContainer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <View style={styles.inputActions}>
            <Pressable style={styles.iconButton}>
              <MaterialCommunityIcons name="plus-circle-outline" size={26} color="#64748B" />
            </Pressable>
            <Pressable style={styles.iconButton}>
              <MaterialIcons name="image-outline" size={26} color="#64748B" />
            </Pressable>
          </View>
          <View style={styles.textInputWrapper}>
            <TextInput
              style={styles.textInput}
              placeholder="Message..."
              placeholderTextColor="#64748B"
              value={message}
              onChangeText={setMessage}
              multiline
            />
          </View>
          <Pressable style={styles.sendButton}>
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
    infoButton: {
      width: 40,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
    },
    listContent: {
      paddingHorizontal: 16,
      paddingBottom: 24,
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
    readReceipt: {
      marginLeft: 2,
    },
    attachmentContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#FFF',
      padding: 10,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: '#F1F5F9',
      gap: 12,
    },
    attachmentIconBox: {
      width: 40,
      height: 40,
      backgroundColor: '#EFF6FF',
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    attachmentInfo: {
      paddingRight: 16,
    },
    attachmentName: {
      fontSize: 12,
      fontWeight: 'bold',
      color: '#0F172A',
      maxWidth: 150,
    },
    attachmentSize: {
      fontSize: 10,
      color: '#64748B',
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
    inputActions: {
      flexDirection: 'row',
      paddingBottom: 4,
    },
    iconButton: {
      width: 40,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
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
