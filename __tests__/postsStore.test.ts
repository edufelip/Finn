import { usePostsStore } from '../src/app/store/postsStore';

describe('postsStore', () => {
  beforeEach(() => {
    usePostsStore.getState().reset();
  });

  it('prepends saved posts for a user', () => {
    const { setSavedForUser } = usePostsStore.getState();

    setSavedForUser('user-1', 1, true);
    setSavedForUser('user-1', 2, true);

    const savedIds = usePostsStore.getState().savedIds['user-1'];
    expect(savedIds).toEqual([2, 1]);
  });

  it('removes saved posts when unsaving', () => {
    const { setSavedForUser } = usePostsStore.getState();

    setSavedForUser('user-1', 1, true);
    setSavedForUser('user-1', 2, true);
    setSavedForUser('user-1', 1, false);

    const savedIds = usePostsStore.getState().savedIds['user-1'];
    expect(savedIds).toEqual([2]);
  });
});
