import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';

import SearchScreen from '../src/presentation/screens/SearchScreen';
import { RepositoryProvider } from '../src/app/providers/RepositoryProvider';
import { searchCopy } from '../src/presentation/content/searchCopy';

const mockNavigate = jest.fn();
const mockRouteParams: Record<string, unknown> = {};

jest.mock('@react-navigation/native', () => {
  const React = require('react');
  return {
    useNavigation: () => ({
      navigate: mockNavigate,
      getParent: () => ({ openDrawer: jest.fn() }),
      goBack: jest.fn(),
    }),
    useRoute: () => ({ params: mockRouteParams }),
    useFocusEffect: (effect: () => void | (() => void)) =>
      React.useEffect(() => effect(), [effect]),
  };
});

jest.mock('../src/app/providers/AuthProvider', () => ({
  useAuth: () => ({
    session: { user: { id: 'user-1', email: 'user@example.com' } },
    initializing: false,
  }),
}));

describe('SearchScreen', () => {
  beforeEach(() => {
    Object.keys(mockRouteParams).forEach((key) => delete mockRouteParams[key]);
    mockNavigate.mockReset();
  });

  it('loads communities and opens detail on press', async () => {
    const communitiesRepo = {
      getCommunities: jest.fn().mockResolvedValue([
        {
          id: 1,
          title: 'General',
          description: 'General',
          ownerId: 'user-1',
          imageUrl: 'https://example.com/community.jpg',
          subscribersCount: 12,
        },
      ]),
      getSubscription: jest.fn().mockResolvedValue(null),
    };

    const topicsRepo = {
      getTopics: jest.fn().mockResolvedValue([]),
    };

    const usersRepo = {
      getUser: jest.fn().mockResolvedValue({ id: 'user-1', name: 'Tester' }),
    };

    const { getByTestId, getAllByText } = render(
      <RepositoryProvider overrides={{ communities: communitiesRepo, users: usersRepo, topics: topicsRepo }}>
        <SearchScreen />
      </RepositoryProvider>
    );

    await waitFor(() => expect(getAllByText('General').length).toBeGreaterThan(0));
    expect(getAllByText(`12 ${searchCopy.followersLabel}`).length).toBeGreaterThan(0);
    fireEvent.press(getByTestId('community-card-1'));

    expect(mockNavigate).toHaveBeenCalledWith('CommunityDetail', { communityId: 1, initialCommunity: expect.any(Object) });
  });

  it('renders search copy and empty state', async () => {
    const communitiesRepo = {
      getCommunities: jest.fn().mockResolvedValue([]),
    };

    const topicsRepo = {
      getTopics: jest.fn().mockResolvedValue([]),
    };

    const usersRepo = {
      getUser: jest.fn().mockResolvedValue({ id: 'user-1', name: 'Tester' }),
    };

    const { getByText, getByPlaceholderText } = render(
      <RepositoryProvider overrides={{ communities: communitiesRepo, users: usersRepo, topics: topicsRepo }}>
        <SearchScreen />
      </RepositoryProvider>
    );

    expect(getByPlaceholderText(searchCopy.placeholder)).toBeTruthy();

    await waitFor(() => expect(getByText(searchCopy.empty)).toBeTruthy());
  });

  it('prefills and searches when query is provided by route params', async () => {
    mockRouteParams.query = '#General';
    const communitiesRepo = {
      getCommunities: jest.fn().mockResolvedValue([
        {
          id: 1,
          title: 'General',
          description: 'General',
          ownerId: 'user-1',
          imageUrl: 'https://example.com/community.jpg',
          subscribersCount: 12,
        },
      ]),
      getSubscription: jest.fn().mockResolvedValue(null),
    };

    const topicsRepo = {
      getTopics: jest.fn().mockResolvedValue([]),
    };

    const usersRepo = {
      getUser: jest.fn().mockResolvedValue({ id: 'user-1', name: 'Tester' }),
    };

    const { getByDisplayValue } = render(
      <RepositoryProvider overrides={{ communities: communitiesRepo, users: usersRepo, topics: topicsRepo }}>
        <SearchScreen />
      </RepositoryProvider>
    );

    await waitFor(() =>
      expect(communitiesRepo.getCommunities).toHaveBeenCalledWith(
        expect.objectContaining({ search: 'General' })
      )
    );
    expect(getByDisplayValue('General')).toBeTruthy();
  });
});
