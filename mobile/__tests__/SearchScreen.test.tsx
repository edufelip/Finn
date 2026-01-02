import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';

import SearchScreen from '../src/presentation/screens/SearchScreen';
import { RepositoryProvider } from '../src/app/providers/RepositoryProvider';

const mockNavigate = jest.fn();

jest.mock('@react-navigation/native', () => {
  const React = require('react');
  return {
    useNavigation: () => ({
      navigate: mockNavigate,
      getParent: () => ({ openDrawer: jest.fn() }),
    }),
    useRoute: () => ({ params: {} }),
    useFocusEffect: (effect: () => void | (() => void)) => React.useEffect(effect, []),
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
    fireEvent.press(getByTestId('community-card-1'));

    expect(mockNavigate).toHaveBeenCalledWith('CommunityDetail', { communityId: 1 });
  });
});
