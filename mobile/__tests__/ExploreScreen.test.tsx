import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';

import ExploreScreen from '../src/presentation/screens/ExploreScreen';
import { RepositoryProvider } from '../src/app/providers/RepositoryProvider';
import { exploreCopy } from '../src/presentation/content/exploreCopy';

const mockNavigate = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
    getParent: () => ({ openDrawer: jest.fn() }),
  }),
  useIsFocused: () => true,
}));

jest.mock('../src/app/providers/AuthProvider', () => ({
  useAuth: () => ({
    session: { user: { id: 'user-1', email: 'user@example.com' } },
    initializing: false,
  }),
}));

describe('ExploreScreen', () => {
  beforeEach(() => {
    mockNavigate.mockReset();
  });

  it('renders trending content sorted by subscribers count', async () => {
    const communitiesRepo = {
      getCommunities: jest.fn().mockResolvedValue([
        {
          id: 1,
          title: 'Small',
          description: 'Small',
          ownerId: 'user-1',
          imageUrl: null,
          subscribersCount: 5,
        },
        {
          id: 2,
          title: 'Big',
          description: 'Big',
          ownerId: 'user-1',
          imageUrl: null,
          subscribersCount: 120,
        },
        {
          id: 3,
          title: 'Medium',
          description: 'Medium',
          ownerId: 'user-1',
          imageUrl: null,
          subscribersCount: 40,
        },
      ]),
    };

    const usersRepo = {
      getUser: jest.fn().mockResolvedValue({ id: 'user-1', name: 'Tester' }),
    };

    const { getAllByTestId } = render(
      <RepositoryProvider overrides={{ communities: communitiesRepo, users: usersRepo }}>
        <ExploreScreen />
      </RepositoryProvider>
    );

    await waitFor(() => expect(communitiesRepo.getCommunities).toHaveBeenCalled());
    await new Promise((resolve) => setTimeout(resolve, 400));

    const titles = getAllByTestId(exploreCopy.testIds.trendingTitle);
    expect(titles[0].props.children).toBe('Big');
  });

  it('navigates to search results from see all', async () => {
    const communitiesRepo = {
      getCommunities: jest.fn().mockResolvedValue([
        {
          id: 1,
          title: 'Sample',
          description: 'Sample',
          ownerId: 'user-1',
          imageUrl: null,
          subscribersCount: 1,
        },
      ]),
    };

    const usersRepo = {
      getUser: jest.fn().mockResolvedValue({ id: 'user-1', name: 'Tester' }),
    };

    const { getByTestId } = render(
      <RepositoryProvider overrides={{ communities: communitiesRepo, users: usersRepo }}>
        <ExploreScreen />
      </RepositoryProvider>
    );

    await waitFor(() => expect(communitiesRepo.getCommunities).toHaveBeenCalled());
    await new Promise((resolve) => setTimeout(resolve, 400));
    fireEvent.press(getByTestId(exploreCopy.testIds.seeAll));
    expect(mockNavigate).toHaveBeenCalledWith('SearchResults', { focus: true });
  });
});
