'use client';

import React from 'react';
import TopPrimaryControlsLegacy from '@/components/TopPrimaryControlsLegacy';

type LayoutControlsProps = {
  children?: React.ReactNode;
};

export default function LayoutControls({ children }: LayoutControlsProps) {
  return (
    <>
      <div className="hidden" aria-hidden="true">
        {children}
      </div>
      <TopPrimaryControlsLegacy />
    </>
  );
}
