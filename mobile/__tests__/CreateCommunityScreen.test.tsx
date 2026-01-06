import React from 'react';
import { Alert } from 'react-native';
import { render, fireEvent, waitFor } from '@testing-library/react-native';

import CreateCommunityScreen from '../src/presentation/screens/CreateCommunityScreen';
import { RepositoryProvider } from '../src/app/providers/RepositoryProvider';
import { createCommunityCopy } from '../src/presentation/content/createCommunityCopy';

const mockGoBack = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ goBack: mockGoBack }),
}));

jest.mock('../src/app/providers/AuthProvider', () => ({
  useAuth: () => ({
    session: { user: { id: 'user-1', email: 'user@example.com' } },
    initializing: false,
  }),
}));

jest.mock('expo-network', () => ({
  getNetworkStateAsync: jest.fn(),
}));

jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
  MediaTypeOptions: { Images: 'Images' },
}));

jest.mock('../src/data/offline/queueStore', () => ({
  enqueueWrite: jest.fn(),
}));

jest.mock('../src/data/offline/offlineImages', () => ({
  persistOfflineImage: jest.fn(),
}));

const network = jest.requireMock('expo-network');
const imagePicker = jest.requireMock('expo-image-picker');
const { enqueueWrite } = jest.requireMock('../src/data/offline/queueStore');
const { persistOfflineImage } = jest.requireMock('../src/data/offline/offlineImages');

describe('CreateCommunityScreen', () => {
  beforeAll(() => {
    process.env.EXPO_PUBLIC_APP_MODE = 'prod';
  });

  beforeEach(() => {
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    mockGoBack.mockReset();
    enqueueWrite.mockReset();
    network.getNetworkStateAsync.mockReset();
    imagePicker.requestMediaLibraryPermissionsAsync.mockReset();
    imagePicker.launchImageLibraryAsync.mockReset();
    persistOfflineImage.mockReset();
  });

  it('creates a community when online', async () => {
    network.getNetworkStateAsync.mockResolvedValue({ isConnected: true });
    const communitiesRepo = {
      saveCommunity: jest.fn().mockResolvedValue({ id: 1 }),
    };

    const { getByTestId } = render(
      <RepositoryProvider overrides={{ communities: communitiesRepo }}>
        <CreateCommunityScreen />
      </RepositoryProvider>
    );

    fireEvent.changeText(getByTestId(createCommunityCopy.testIds.title), 'New Community');
    fireEvent.changeText(getByTestId(createCommunityCopy.testIds.description), 'Community details');
    fireEvent.press(getByTestId(createCommunityCopy.testIds.submit));

    await waitFor(() => {
      expect(communitiesRepo.saveCommunity).toHaveBeenCalledWith(
        {
          id: 0,
          title: 'New Community',
          description: 'Community details',
          ownerId: 'user-1',
        },
        null
      );
      expect(Alert.alert).toHaveBeenCalledWith(
        createCommunityCopy.alerts.created.title,
        createCommunityCopy.alerts.created.message
      );
      expect(mockGoBack).toHaveBeenCalled();
    });
  });

  it('queues a community when offline', async () => {
    network.getNetworkStateAsync.mockResolvedValue({ isConnected: false });
    const communitiesRepo = {
      saveCommunity: jest.fn(),
    };

    const { getByTestId } = render(
      <RepositoryProvider overrides={{ communities: communitiesRepo }}>
        <CreateCommunityScreen />
      </RepositoryProvider>
    );

    fireEvent.changeText(getByTestId(createCommunityCopy.testIds.title), 'Offline Community');
    fireEvent.changeText(getByTestId(createCommunityCopy.testIds.description), 'Offline details');
    fireEvent.press(getByTestId(createCommunityCopy.testIds.submit));

    await waitFor(() => {
      expect(enqueueWrite).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'create_community',
          payload: {
            title: 'Offline Community',
            description: 'Offline details',
            ownerId: 'user-1',
            imageUri: null,
          },
        })
      );
      expect(communitiesRepo.saveCommunity).not.toHaveBeenCalled();
      expect(Alert.alert).toHaveBeenCalledWith(
        createCommunityCopy.alerts.offline.title,
        createCommunityCopy.alerts.offline.message
      );
      expect(mockGoBack).toHaveBeenCalled();
    });
  });

  it('queues a community image when offline', async () => {
    network.getNetworkStateAsync.mockResolvedValue({ isConnected: false });
    persistOfflineImage.mockResolvedValue('file://persisted/community.jpg');
    imagePicker.requestMediaLibraryPermissionsAsync.mockResolvedValue({ granted: true });
    imagePicker.launchImageLibraryAsync.mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'file://community.jpg' }],
    });

    const communitiesRepo = {
      saveCommunity: jest.fn(),
    };

    const { getByTestId } = render(
      <RepositoryProvider overrides={{ communities: communitiesRepo }}>
        <CreateCommunityScreen />
      </RepositoryProvider>
    );

    fireEvent.changeText(getByTestId(createCommunityCopy.testIds.title), 'Offline Community');
    fireEvent.changeText(getByTestId(createCommunityCopy.testIds.description), 'Offline details');
    fireEvent.press(getByTestId(createCommunityCopy.testIds.image));

    await waitFor(() => expect(getByTestId(createCommunityCopy.testIds.imagePreview)).toBeTruthy());

    fireEvent.press(getByTestId(createCommunityCopy.testIds.submit));

    await waitFor(() => {
      expect(enqueueWrite).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'create_community',
          payload: {
            title: 'Offline Community',
            description: 'Offline details',
            ownerId: 'user-1',
            imageUri: 'file://persisted/community.jpg',
          },
        })
      );
      expect(persistOfflineImage).toHaveBeenCalledWith('file://community.jpg');
    });
  });

  it('selects an image for the community', async () => {
    network.getNetworkStateAsync.mockResolvedValue({ isConnected: true });
    imagePicker.requestMediaLibraryPermissionsAsync.mockResolvedValue({ granted: true });
    imagePicker.launchImageLibraryAsync.mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'file://community.jpg' }],
    });

    const { getByTestId, queryByTestId } = render(
      <RepositoryProvider overrides={{ communities: { saveCommunity: jest.fn() } }}>
        <CreateCommunityScreen />
      </RepositoryProvider>
    );

    expect(queryByTestId(createCommunityCopy.testIds.imagePreview)).toBeNull();
    fireEvent.press(getByTestId(createCommunityCopy.testIds.image));

    await waitFor(() => {
      expect(imagePicker.launchImageLibraryAsync).toHaveBeenCalled();
      expect(getByTestId(createCommunityCopy.testIds.imagePreview)).toBeTruthy();
    });
  });

  it('renders community form copy', () => {
    const { getByText, getByPlaceholderText, getByTestId } = render(
      <RepositoryProvider overrides={{ communities: { saveCommunity: jest.fn() } }}>
        <CreateCommunityScreen />
      </RepositoryProvider>
    );

    expect(getByText(createCommunityCopy.titleLabel)).toBeTruthy();
    expect(getByPlaceholderText(createCommunityCopy.titlePlaceholder)).toBeTruthy();
    expect(getByText(createCommunityCopy.descriptionLabel)).toBeTruthy();
    expect(getByPlaceholderText(createCommunityCopy.descriptionPlaceholder)).toBeTruthy();
    expect(getByText(createCommunityCopy.iconLabel)).toBeTruthy();
    expect(getByTestId(createCommunityCopy.testIds.submit)).toBeTruthy();
  });
});
