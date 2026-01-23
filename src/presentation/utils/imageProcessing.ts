import * as ImageManipulator from 'expo-image-manipulator';

type ImageCompressionOptions = {
  maxWidth?: number;
  compress?: number;
  format?: ImageManipulator.SaveFormat;
};

export const compressImageUri = async (
  uri: string,
  width: number | null | undefined,
  options: ImageCompressionOptions = {}
) => {
  const maxWidth = options.maxWidth ?? 1080;
  const compress = options.compress ?? 0.7;
  const format = options.format ?? ImageManipulator.SaveFormat.JPEG;
  const resolvedWidth = typeof width === 'number' && width > 0 ? width : maxWidth;
  const targetWidth = Math.min(resolvedWidth, maxWidth);

  try {
    const context = ImageManipulator.ImageManipulator.manipulate(uri);
    const resized = targetWidth > 0 ? context.resize({ width: targetWidth }) : context;
    const imageRef = await resized.renderAsync();
    const result = await imageRef.saveAsync({ compress, format });
    return result.uri;
  } catch {
    return uri;
  }
};
