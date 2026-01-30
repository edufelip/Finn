import { Share } from 'react-native';
import Constants from 'expo-constants';
import type { Post } from '../domain/models/post';
const scheme = Constants.expoConfig?.scheme ?? 'finn';

// Base URL for universal links
const WEB_BASE_URL = 'https://finnsocial.fun';

// Deep link scheme
const DEEP_LINK_SCHEME = scheme;

/**
 * Generates a universal link for a post
 * Format: https://finnsocial.fun/post/{postId}
 */
export function getPostShareUrl(postId: number): string {
  return `${WEB_BASE_URL}/post/${postId}`;
}

/**
 * Generates a deep link for a post
 * Format: finn://post/{postId}
 */
export function getPostDeepLink(postId: number): string {
  return `${DEEP_LINK_SCHEME}://post/${postId}`;
}

/**
 * Shares a post using the native share dialog
 */
export async function sharePost(post: Post): Promise<void> {
  try {
    const url = getPostShareUrl(post.id);
    const message = post.content
      ? `Check out this post: ${post.content.substring(0, 100)}${post.content.length > 100 ? '...' : ''}\n\n${url}`
      : `Check out this post on Finn\n\n${url}`;

    await Share.share({
      message,
      url, // iOS will use this
      title: 'Share Post',
    });
  } catch (error) {
    // User cancelled or error occurred
    console.error('Error sharing post:', error);
  }
}

/**
 * Generates a universal link for a community
 * Format: https://finnsocial.fun/community/{communityId}
 */
export function getCommunityShareUrl(communityId: number): string {
  return `${WEB_BASE_URL}/community/${communityId}`;
}

/**
 * Generates a deep link for a community
 * Format: finn://community/{communityId}
 */
export function getCommunityDeepLink(communityId: number): string {
  return `${DEEP_LINK_SCHEME}://community/${communityId}`;
}
