'use client';

import dynamic from 'next/dynamic';

const CanvasInner = dynamic(() => import('./CanvasInner'), { 
  ssr: false,
  loading: () => <div className="w-full h-full bg-muted flex items-center justify-center">Loading Canvas...</div>
});

export default function Canvas() {
  return <CanvasInner />;
}
