import type { Metadata } from 'next';
import LinkFallback from '../../components/LinkFallback';

type PostPageProps = {
  params: { id: string };
};

export function generateMetadata({ params }: PostPageProps): Metadata {
  return {
    title: `Post ${params.id}`,
    description: 'Open this post in the Finn app to join the conversation.',
  };
}

export default function PostPage({ params }: PostPageProps) {
  return (
    <LinkFallback
      title="Open this post in Finn"
      subtitle="Posts are best experienced in the app."
    />
  );
}
