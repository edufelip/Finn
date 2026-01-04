import React from 'react';
import { render } from '@testing-library/react-native';

import CreateBottomSheet from '../src/presentation/components/CreateBottomSheet';
import { createBottomSheetCopy } from '../src/presentation/content/createBottomSheetCopy';

describe('CreateBottomSheet', () => {
  it('renders copy and actions', () => {
    const { getByText, getByTestId } = render(
      <CreateBottomSheet
        visible
        onClose={jest.fn()}
        onCreateCommunity={jest.fn()}
        onCreatePost={jest.fn()}
      />
    );

    expect(getByText(createBottomSheetCopy.title)).toBeTruthy();
    expect(getByText(createBottomSheetCopy.communityLabel)).toBeTruthy();
    expect(getByText(createBottomSheetCopy.postLabel)).toBeTruthy();
    expect(getByTestId(createBottomSheetCopy.testIds.community)).toBeTruthy();
    expect(getByTestId(createBottomSheetCopy.testIds.post)).toBeTruthy();
  });
});
