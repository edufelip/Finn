import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { CompositeNavigationProp, useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { DrawerNavigationProp } from '@react-navigation/drawer';

import type { Community } from '../../domain/models/community';
import { useRepositories } from '../../app/providers/RepositoryProvider';
import { useAuth } from '../../app/providers/AuthProvider';
import type { MainStackParamList } from '../navigation/MainStack';
import type { MainTabParamList } from '../navigation/MainTabs';
import type { MainDrawerParamList } from '../navigation/MainDrawer';
import Divider from '../components/Divider';
import { colors } from '../theme/colors';
import { searchCopy } from '../content/searchCopy';

type Navigation = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Search'>,
  NativeStackNavigationProp<MainStackParamList>
>;

export default function SearchScreen() {
  const navigation = useNavigation<Navigation>();
  const route = useRoute<RouteProp<MainTabParamList, 'Search'>>();
  const { session } = useAuth();
  const { communities: communityRepository, users: userRepository } = useRepositories();
  const [search, setSearch] = useState('');
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const inputRef = useRef<TextInput>(null);

  const loadCommunities = useCallback(
    async (query?: string) => {
      setLoading(true);
      setError(null);
      const term = query ?? '';
      try {
        const data = await communityRepository.getCommunities(term.trim() ? term.trim() : undefined);
        setCommunities(data);
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        }
      } finally {
        setLoading(false);
      }
    },
    [communityRepository]
  );

  useFocusEffect(
    useCallback(() => {
      loadCommunities();
    }, [loadCommunities])
  );

  useEffect(() => {
    if (route.params?.focus) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [route.params?.focus]);

  useEffect(() => {
    if (!session?.user?.id) return;
    userRepository
      .getUser(session.user.id)
      .then((data) => setProfilePhoto(data?.photoUrl ?? null))
      .catch(() => setProfilePhoto(null));
  }, [session?.user?.id, userRepository]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.headerRow}>
        <Pressable
          style={styles.avatarCard}
          onPress={() => navigation.getParent<DrawerNavigationProp<MainDrawerParamList>>()?.openDrawer()}
          testID={searchCopy.testIds.avatar}
          accessibilityLabel={searchCopy.testIds.avatar}
        >
          <Image
            source={profilePhoto ? { uri: profilePhoto } : require('../../../assets/user_icon.png')}
            style={styles.avatar}
          />
        </Pressable>
        <View style={styles.searchContainer}>
          <MaterialIcons name="search" size={18} color={colors.darkGrey} />
          <TextInput
            ref={inputRef}
            style={styles.searchInput}
            placeholder={searchCopy.placeholder}
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={() => loadCommunities(search)}
            returnKeyType="search"
            testID={searchCopy.testIds.searchInput}
            accessibilityLabel={searchCopy.testIds.searchInput}
          />
        </View>
      </View>
      <View style={styles.trendingHeader}>
        <Text style={styles.trendingText}>{searchCopy.trending}</Text>
      </View>
      <Divider />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <FlatList
        testID={searchCopy.testIds.list}
        data={communities}
        keyExtractor={(item) => `${item.id}`}
        renderItem={({ item }) => (
          <Pressable
            style={styles.cardWrapper}
            onPress={() => navigation.navigate('CommunityDetail', { communityId: item.id })}
            testID={`community-card-${item.id}`}
            accessibilityLabel={`community-card-${item.id}`}
          >
            <View style={styles.card}>
              <View style={styles.cardContent}>
                <View style={styles.communityIconWrapper}>
                  {item.imageUrl ? (
                    <Image
                      source={{ uri: item.imageUrl }}
                      style={styles.communityIcon}
                      testID={`community-image-${item.id}`}
                      accessibilityLabel={`community-image-${item.id}`}
                    />
                  ) : (
                    <Image source={require('../../../assets/user_icon.png')} style={styles.communityIcon} />
                  )}
                </View>
                <Text style={styles.communityTitle}>{item.title}</Text>
                <Text style={styles.communityDescription}>{item.description}</Text>
                <Text style={styles.communityFollowers}>
                  {(item.subscribersCount ?? 0).toString()} {searchCopy.followersLabel}
                </Text>
              </View>
            </View>
          </Pressable>
        )}
        ListEmptyComponent={
          loading ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" color={colors.mainBlueDeep} />
            </View>
          ) : (
            <Text style={styles.empty}>{searchCopy.empty}</Text>
          )
        }
        ListFooterComponent={
          loading && communities.length > 0 ? (
            <View style={styles.footer}>
              <ActivityIndicator size="small" color={colors.mainBlueDeep} />
            </View>
          ) : null
        }
        style={styles.list}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.white,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 60,
  },
  avatarCard: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginLeft: 10,
    marginRight: 10,
    overflow: 'hidden',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  searchContainer: {
    flex: 1,
    height: 44,
    marginTop: 8,
    marginBottom: 8,
    marginRight: 10,
    borderRadius: 8,
    backgroundColor: colors.searchBackground,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
  },
  searchInput: {
    flex: 1,
    height: '100%',
  },
  trendingHeader: {
    paddingTop: 16,
    paddingLeft: 16,
  },
  trendingText: {
    fontSize: 16,
  },
  list: {
    backgroundColor: colors.backgroundLight,
  },
  cardWrapper: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 12,
  },
  card: {
    borderRadius: 8,
    backgroundColor: colors.white,
    shadowColor: colors.black,
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 10,
  },
  cardContent: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  communityIconWrapper: {
    width: 52,
    height: 52,
    borderRadius: 26,
    overflow: 'hidden',
  },
  communityIcon: {
    width: '100%',
    height: '100%',
  },
  communityTitle: {
    marginTop: 8,
  },
  communityDescription: {
    marginTop: 4,
    marginHorizontal: 16,
    textAlign: 'center',
  },
  communityFollowers: {
    marginTop: 4,
    color: colors.borderGrey,
  },
  empty: {
    textAlign: 'center',
    marginTop: 24,
    color: colors.darkGrey,
  },
  center: {
    marginTop: 24,
    alignItems: 'center',
  },
  footer: {
    paddingVertical: 16,
  },
  error: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    color: colors.danger,
  },
});
