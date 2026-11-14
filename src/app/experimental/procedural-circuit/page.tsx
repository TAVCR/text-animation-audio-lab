import dynamic from 'next/dynamic';

const ProceduralCircuitPreview = dynamic(() => import('@/components/experimental/ProceduralCircuitPreview'), {
  ssr: false,
});

export default function ProceduralCircuitPreviewPage() {
  return <ProceduralCircuitPreview />;
}
