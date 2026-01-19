import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import MainDrawer from './MainDrawer';
import CreatePostScreen from '../screens/CreatePostScreen';
import CreateCommunityScreen from '../screens/CreateCommunityScreen';
import CommunityDetailScreen from '../screens/CommunityDetailScreen';
import SavedPostsScreen from '../screens/SavedPostsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import PostDetailScreen from '../screens/PostDetailScreen';
import ProfileScreen from '../screens/ProfileScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import SearchScreen from '../screens/SearchScreen';
import WebViewScreen from '../screens/WebViewScreen';
import EditCommunityScreen from '../screens/EditCommunityScreen';
import PendingContentScreen from '../screens/PendingContentScreen';
import ReportedContentScreen from '../screens/ReportedContentScreen';
import ModerationLogsScreen from '../screens/ModerationLogsScreen';
import ManageModeratorsScreen from '../screens/ManageModeratorsScreen';
import type { Community } from '../../domain/models/community';
import type { Post } from '../../domain/models/post';

export type SearchSort = 'mostFollowed' | 'leastFollowed' | 'newest' | 'oldest';

export type MainStackParamList = {
  DrawerRoot: undefined;
  CreatePost: { communityId?: number } | undefined;
  CreateCommunity: undefined;
  CommunityDetail: { communityId: number; initialCommunity?: Community };
  SavedPosts: undefined;
  Settings: undefined;
  EditProfile: undefined;
  PostDetail: { post?: Post; postId?: number };
  Profile: undefined;
  Notifications: undefined;
  SearchResults: { focus?: boolean; sort?: SearchSort; topicId?: number } | undefined;
  WebView: { title: string; url: string };
  EditCommunity: { communityId: number };
  PendingContent: { communityId: number };
  ReportedContent: { communityId: number };
  ModerationLogs: { communityId: number };
  ManageModerators: { communityId: number };
};

const Stack = createNativeStackNavigator<MainStackParamList>();

export default function MainStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="DrawerRoot" component={MainDrawer} />
      <Stack.Screen name="CreatePost" component={CreatePostScreen} />
      <Stack.Screen name="CreateCommunity" component={CreateCommunityScreen} />
      <Stack.Screen name="CommunityDetail" component={CommunityDetailScreen} />
      <Stack.Screen name="SavedPosts" component={SavedPostsScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="SearchResults" component={SearchScreen} />
      <Stack.Screen name="PostDetail" component={PostDetailScreen} />
      <Stack.Screen name="WebView" component={WebViewScreen} />
      <Stack.Screen name="EditCommunity" component={EditCommunityScreen} />
      <Stack.Screen name="PendingContent" component={PendingContentScreen} />
      <Stack.Screen name="ReportedContent" component={ReportedContentScreen} />
      <Stack.Screen name="ModerationLogs" component={ModerationLogsScreen} />
      <Stack.Screen name="ManageModerators" component={ManageModeratorsScreen} />
    </Stack.Navigator>
  );
}
