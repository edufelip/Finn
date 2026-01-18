import MainTabs from '../src/presentation/navigation/MainTabs';
import { tabCopy } from '../src/presentation/content/tabCopy';

describe('MainTabs', () => {
  it('defines tab labels and ids', () => {
    expect(typeof MainTabs).toBe('function');
    expect(tabCopy.home).toBeTruthy();
    expect(tabCopy.add).toBeTruthy();
    expect(tabCopy.explore).toBeTruthy();
    expect(tabCopy.inbox).toBeTruthy();
    expect(tabCopy.profile).toBeTruthy();
    expect(tabCopy.testIds.home).toBeTruthy();
    expect(tabCopy.testIds.add).toBeTruthy();
    expect(tabCopy.testIds.explore).toBeTruthy();
    expect(tabCopy.testIds.inbox).toBeTruthy();
    expect(tabCopy.testIds.profile).toBeTruthy();
  });
});
