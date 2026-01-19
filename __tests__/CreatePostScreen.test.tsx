import React from 'react';
import { Alert } from 'react-native';
import { render, fireEvent, waitFor } from '@testing-library/react-native';

import CreatePostScreen from '../src/presentation/screens/CreatePostScreen';
import { RepositoryProvider } from '../src/app/providers/RepositoryProvider';
import { createPostCopy } from '../src/presentation/content/createPostCopy';
import { imagePickerCopy } from '../src/presentation/content/imagePickerCopy';

const mockGoBack = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ goBack: mockGoBack }),
  useRoute: () => ({ params: {} }),
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
  requestCameraPermissionsAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
  launchCameraAsync: jest.fn(),
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

describe('CreatePostScreen', () => {
  beforeAll(() => {
    process.env.EXPO_PUBLIC_APP_MODE = 'prod';
  });

  beforeEach(() => {
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    mockGoBack.mockReset();
    enqueueWrite.mockReset();
    network.getNetworkStateAsync.mockReset();
    imagePicker.requestMediaLibraryPermissionsAsync.mockReset();
    imagePicker.requestCameraPermissionsAsync.mockReset();
    imagePicker.launchImageLibraryAsync.mockReset();
    imagePicker.launchCameraAsync.mockReset();
    persistOfflineImage.mockReset();
  });

  it('creates a post when online', async () => {
    network.getNetworkStateAsync.mockResolvedValue({ isConnected: true });
    const communitiesRepo = {
      getSubscribedCommunities: jest.fn().mockResolvedValue([
        { id: 1, title: 'General', description: 'General', ownerId: 'user-1' },
      ]),
    };
    const postsRepo = {
      savePost: jest.fn().mockResolvedValue({ id: 1 }),
    };

    const { getByPlaceholderText, getByText, getByTestId } = render(
      <RepositoryProvider overrides={{ communities: communitiesRepo, posts: postsRepo }}>
        <CreatePostScreen />
      </RepositoryProvider>
    );

    await waitFor(() => expect(getByText('General')).toBeTruthy());
    expect(getByTestId(createPostCopy.testIds.content)).toBeTruthy();
    expect(getByTestId(createPostCopy.testIds.submit)).toBeTruthy();
    fireEvent.changeText(getByPlaceholderText(createPostCopy.contentPlaceholder), 'My post');
    fireEvent.press(getByTestId(createPostCopy.testIds.submit));

    await waitFor(() => {
      expect(postsRepo.savePost).toHaveBeenCalledWith(
        {
          id: 0,
          content: 'My post',
          communityId: 1,
          userId: 'user-1',
          moderationStatus: 'approved',
        },
        null
      );
      expect(Alert.alert).toHaveBeenCalledWith(
        createPostCopy.alerts.posted.title,
        createPostCopy.alerts.posted.message
      );
      expect(mockGoBack).toHaveBeenCalled();
    });
  });

  it('queues a post when offline', async () => {
    network.getNetworkStateAsync.mockResolvedValue({ isConnected: false });
    persistOfflineImage.mockResolvedValue('file://persisted/offline-post.jpg');
    imagePicker.requestMediaLibraryPermissionsAsync.mockResolvedValue({ granted: true });
    imagePicker.launchImageLibraryAsync.mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'file://offline-post.jpg' }],
    });
    const communitiesRepo = {
      getSubscribedCommunities: jest.fn().mockResolvedValue([
        { id: 1, title: 'General', description: 'General', ownerId: 'user-1' },
      ]),
    };
    const postsRepo = {
      savePost: jest.fn(),
    };

    const { getByPlaceholderText, getByText, getByTestId } = render(
      <RepositoryProvider overrides={{ communities: communitiesRepo, posts: postsRepo }}>
        <CreatePostScreen />
      </RepositoryProvider>
    );

    await waitFor(() => expect(getByText('General')).toBeTruthy());
    expect(getByTestId(createPostCopy.testIds.content)).toBeTruthy();
    expect(getByTestId(createPostCopy.testIds.submit)).toBeTruthy();
    fireEvent.press(getByTestId(createPostCopy.testIds.image));
    fireEvent.press(getByTestId(imagePickerCopy.testIds.gallery));
    await waitFor(() => expect(getByTestId(createPostCopy.testIds.imagePreview)).toBeTruthy());
    fireEvent.changeText(getByPlaceholderText(createPostCopy.contentPlaceholder), 'Offline post');
    fireEvent.press(getByTestId(createPostCopy.testIds.submit));

    await waitFor(() => {
      expect(enqueueWrite).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'create_post',
          payload: {
            content: 'Offline post',
            communityId: 1,
            userId: 'user-1',
            imageUri: 'file://persisted/offline-post.jpg',
            moderationStatus: 'approved',
          },
        })
      );
      expect(Alert.alert).toHaveBeenCalledWith(
        createPostCopy.alerts.offline.title,
        createPostCopy.alerts.offline.message
      );
      expect(persistOfflineImage).toHaveBeenCalledWith('file://offline-post.jpg');
      expect(postsRepo.savePost).not.toHaveBeenCalled();
      expect(mockGoBack).toHaveBeenCalled();
    });
  });

  it('selects an image for the post', async () => {
    network.getNetworkStateAsync.mockResolvedValue({ isConnected: true });
    imagePicker.requestMediaLibraryPermissionsAsync.mockResolvedValue({ granted: true });
    imagePicker.launchImageLibraryAsync.mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'file://post.jpg' }],
    });

    const communitiesRepo = {
      getSubscribedCommunities: jest.fn().mockResolvedValue([
        { id: 1, title: 'General', description: 'General', ownerId: 'user-1' },
      ]),
    };

    const { getByTestId, queryByTestId } = render(
      <RepositoryProvider overrides={{ communities: communitiesRepo, posts: { savePost: jest.fn() } }}>
        <CreatePostScreen />
      </RepositoryProvider>
    );

    expect(queryByTestId(createPostCopy.testIds.imagePreview)).toBeNull();
    fireEvent.press(getByTestId(createPostCopy.testIds.image));
    fireEvent.press(getByTestId(imagePickerCopy.testIds.gallery));

    await waitFor(() => {
      expect(imagePicker.launchImageLibraryAsync).toHaveBeenCalled();
      expect(getByTestId(createPostCopy.testIds.imagePreview)).toBeTruthy();
    });
  });

  it('creates a post with an image when online', async () => {
    network.getNetworkStateAsync.mockResolvedValue({ isConnected: true });
    imagePicker.requestMediaLibraryPermissionsAsync.mockResolvedValue({ granted: true });
    imagePicker.launchImageLibraryAsync.mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'file://post.jpg' }],
    });

    const communitiesRepo = {
      getSubscribedCommunities: jest.fn().mockResolvedValue([
        { id: 1, title: 'General', description: 'General', ownerId: 'user-1' },
      ]),
    };
    const postsRepo = {
      savePost: jest.fn().mockResolvedValue({ id: 1 }),
    };

    const { getByPlaceholderText, getByText, getByTestId } = render(
      <RepositoryProvider overrides={{ communities: communitiesRepo, posts: postsRepo }}>
        <CreatePostScreen />
      </RepositoryProvider>
    );

    await waitFor(() => expect(getByText('General')).toBeTruthy());
    fireEvent.press(getByTestId(createPostCopy.testIds.image));
    fireEvent.press(getByTestId(imagePickerCopy.testIds.gallery));
    await waitFor(() => expect(getByTestId(createPostCopy.testIds.imagePreview)).toBeTruthy());
    fireEvent.changeText(getByPlaceholderText(createPostCopy.contentPlaceholder), 'My post with image');
    fireEvent.press(getByTestId(createPostCopy.testIds.submit));

    await waitFor(() => {
      expect(postsRepo.savePost).toHaveBeenCalledWith(
        {
          id: 0,
          content: 'My post with image',
          communityId: 1,
          userId: 'user-1',
          moderationStatus: 'approved',
        },
        'file://post.jpg'
      );
      expect(mockGoBack).toHaveBeenCalled();
    });
  });

  it('renders create post copy', async () => {
    const communitiesRepo = {
      getSubscribedCommunities: jest.fn().mockResolvedValue([
        { id: 1, title: 'General', description: 'General', ownerId: 'user-1' },
      ]),
    };

    const { getByText, getByPlaceholderText, getByTestId } = render(
      <RepositoryProvider overrides={{ communities: communitiesRepo, posts: { savePost: jest.fn() } }}>
        <CreatePostScreen />
      </RepositoryProvider>
    );

    await waitFor(() => expect(getByText(createPostCopy.title)).toBeTruthy());
    expect(getByPlaceholderText(createPostCopy.contentPlaceholder)).toBeTruthy();
    expect(getByText(createPostCopy.contentCount(0, 500))).toBeTruthy();
    expect(getByText(createPostCopy.submit)).toBeTruthy();
    fireEvent.press(getByTestId(createPostCopy.testIds.communityPicker));
    await waitFor(() => expect(getByText(createPostCopy.modalTitle)).toBeTruthy());
  });
});
