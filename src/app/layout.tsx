import type { Metadata } from 'next';
import './globals.css';
import { AnimationProvider } from '@/lib/AnimationContext';
import { EditorSessionProvider } from '@/lib/editor/EditorSessionContext';
import { ExportProvider } from '@/lib/editor/ExportContext';

export const metadata: Metadata = {
  title: 'Remotion Text Animation App',
  description: 'Custom text animation generator built with Next.js and Remotion',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="antialiased font-sans bg-neutral-950 text-neutral-100">
        <AnimationProvider>
          <EditorSessionProvider>
            <ExportProvider>{children}</ExportProvider>
          </EditorSessionProvider>
        </AnimationProvider>
      </body>
    </html>
  );
}
