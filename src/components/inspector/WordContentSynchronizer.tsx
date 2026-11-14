'use client';

import React from 'react';
import type { AnimationProps } from '@/lib/AnimationContext';

export const WordContentSynchronizer = ({ text, setProps }: { text: string; setProps: React.Dispatch<React.SetStateAction<AnimationProps>> }) => {
  const words = React.useMemo(() => text.match(/\S+/g) ?? [], [text]);
  React.useEffect(() => {
    const wordTwo = words[1] ?? '';
    const wordThree = words[2] ?? '';
    const showWordTwo = words.length >= 2;
    const showWordThree = words.length >= 3;
    setProps((prev) => prev.wordTwo === wordTwo && prev.wordThree === wordThree && prev.showWordTwo === showWordTwo && prev.showWordThree === showWordThree
      ? prev
      : { ...prev, wordTwo, wordThree, showWordTwo, showWordThree });
  }, [setProps, words]);
  return null;
};
