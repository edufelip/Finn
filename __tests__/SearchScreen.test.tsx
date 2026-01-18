import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';

import SearchScreen from '../src/presentation/screens/SearchScreen';
import { RepositoryProvider } from '../src/app/providers/RepositoryProvider';
import { searchCopy } from '../src/presentation/content/searchCopy';

const mockNavigate = jest.fn();

jest.mock('@react-navigation/native', () => {
  const React = require('react');
  return {
    useNavigation: () => ({
      navigate: mockNavigate,
      getParent: () => ({ openDrawer: jest.fn() }),
      goBack: jest.fn(),
    }),
    useRoute: () => ({ params: {} }),
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
    };

    const usersRepo = {
      getUser: jest.fn().mockResolvedValue({ id: 'user-1', name: 'Tester' }),
    };

    const { getByTestId, getAllByText } = render(
      <RepositoryProvider overrides={{ communities: communitiesRepo, users: usersRepo }}>
        <SearchScreen />
      </RepositoryProvider>
    );

    await waitFor(() => expect(getAllByText('General').length).toBeGreaterThan(0));
    expect(getAllByText(`12 ${searchCopy.followersLabel}`).length).toBeGreaterThan(0);
    fireEvent.press(getByTestId('community-card-1'));

    expect(mockNavigate).toHaveBeenCalledWith('CommunityDetail', { communityId: 1 });
  });

  it('renders search copy and empty state', async () => {
    const communitiesRepo = {
      getCommunities: jest.fn().mockResolvedValue([]),
    };

    const usersRepo = {
      getUser: jest.fn().mockResolvedValue({ id: 'user-1', name: 'Tester' }),
    };

    const { getByText, getByPlaceholderText } = render(
      <RepositoryProvider overrides={{ communities: communitiesRepo, users: usersRepo }}>
        <SearchScreen />
      </RepositoryProvider>
    );

    expect(getByPlaceholderText(searchCopy.placeholder)).toBeTruthy();
    expect(getByText(searchCopy.trending)).toBeTruthy();

    await waitFor(() => expect(getByText(searchCopy.empty)).toBeTruthy());
  });
});
