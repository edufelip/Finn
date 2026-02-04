import { persistOfflineImage } from '../src/data/offline/offlineImages';

jest.mock('expo-file-system/legacy', () => ({
  documentDirectory: 'file://documents/',
  makeDirectoryAsync: jest.fn(),
  copyAsync: jest.fn(),
}));

const FileSystem = jest.requireMock('expo-file-system/legacy');

describe('persistOfflineImage', () => {
  beforeEach(() => {
    FileSystem.makeDirectoryAsync.mockReset();
    FileSystem.copyAsync.mockReset();
  });

  it('copies image into offline directory', async () => {
    const randomValue = 0.42;
    jest.spyOn(Date, 'now').mockReturnValue(1234);
    jest.spyOn(Math, 'random').mockReturnValue(randomValue);

    const result = await persistOfflineImage('file://original/photo.jpg');
    const suffix = randomValue.toString(36).slice(2);

    expect(FileSystem.makeDirectoryAsync).toHaveBeenCalledWith('file://documents/offline-images', {
      intermediates: true,
    });
    expect(FileSystem.copyAsync).toHaveBeenCalledWith({
      from: 'file://original/photo.jpg',
      to: `file://documents/offline-images/1234-${suffix}.jpg`,
    });
    expect(result).toBe(`file://documents/offline-images/1234-${suffix}.jpg`);

    (Date.now as jest.Mock).mockRestore();
    (Math.random as jest.Mock).mockRestore();
  });

  it('returns original uri when copy fails', async () => {
    FileSystem.copyAsync.mockRejectedValue(new Error('copy failed'));

    const result = await persistOfflineImage('file://original/photo.jpg');

    expect(result).toBe('file://original/photo.jpg');
  });

  it('returns original uri when already in document directory', async () => {
    const result = await persistOfflineImage('file://documents/offline-images/existing.jpg');
    expect(result).toBe('file://documents/offline-images/existing.jpg');
    expect(FileSystem.copyAsync).not.toHaveBeenCalled();
  });
});
