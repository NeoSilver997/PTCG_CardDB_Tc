'use client';

import dynamic from 'next/dynamic';

// Dynamically import NewDeckStudio component with SSR disabled
const NewDeckStudio = dynamic(() => import('../../components/NewDeckStudio'), { ssr: false });

export default function DeckStudioPage() {
  return <NewDeckStudio />;
}