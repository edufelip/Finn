import type { Metadata } from 'next';
import LinkFallback from '../../components/LinkFallback';

type CommunityPageProps = {
  params: { id: string };
};

export function generateMetadata({ params }: CommunityPageProps): Metadata {
  return {
    title: `Community ${params.id}`,
    description: 'Open this community in the Finn app to see the latest posts.',
  };
}

export default function CommunityPage({ params }: CommunityPageProps) {
  return (
    <LinkFallback
      title="Open this community in Finn"
      subtitle="Communities come alive inside the app."
    />
  );
}
