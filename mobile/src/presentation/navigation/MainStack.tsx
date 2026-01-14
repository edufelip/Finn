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
import type { Post } from '../../domain/models/post';

export type MainStackParamList = {
  DrawerRoot: undefined;
  CreatePost: undefined;
  CreateCommunity: undefined;
  CommunityDetail: { communityId: number };
  SavedPosts: undefined;
  Settings: undefined;
  EditProfile: undefined;
  PostDetail: { post: Post };
  Profile: undefined;
  Notifications: undefined;
  SearchResults: { focus?: boolean } | undefined;
  WebView: { title: string; url: string };
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
    </Stack.Navigator>
  );
}
