'use client';

import React from 'react';
import FontSection from '@/components/controls/FontSection';
import LayoutControls from '@/components/controls/LayoutControls';
import RenderSection from '@/components/controls/RenderSection';
import TextInputSection from '@/components/controls/TextInputSection';

export default function TopPrimaryControls() {
  return (
    <LayoutControls>
      <TextInputSection />
      <FontSection />
      <RenderSection />
    </LayoutControls>
  );
}
