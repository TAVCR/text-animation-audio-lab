import React from 'react';

export const PREFERRED_FONT_FAMILIES = [
  'Arial', 'Poppins', 'Montserrat', 'Inter', 'Roboto', 'Open Sans', 'Oswald',
  'Bebas Neue', 'Playfair Display', 'Rubik', 'Nunito', 'Roboto Mono', 'Orbitron',
  'Calibri', 'Segoe UI', 'Verdana', 'Tahoma', 'Trebuchet MS',
  'Times New Roman', 'Georgia', 'Courier New', 'Consolas', 'Cascadia Code',
] as const;

export const orderAvailableFontFamilies = (families: readonly string[]): string[] => {
  const unique = new Map<string, string>();
  for (const raw of families) {
    const family = raw.trim();
    if (family && !unique.has(family.toLocaleLowerCase())) unique.set(family.toLocaleLowerCase(), family);
  }
  const priority = new Map(PREFERRED_FONT_FAMILIES.map((font, index) => [font.toLocaleLowerCase(), index]));
  return Array.from(unique.values()).sort((left, right) => {
    const leftPriority = priority.get(left.toLocaleLowerCase());
    const rightPriority = priority.get(right.toLocaleLowerCase());
    if (leftPriority !== undefined || rightPriority !== undefined) return (leftPriority ?? Number.MAX_SAFE_INTEGER) - (rightPriority ?? Number.MAX_SAFE_INTEGER);
    return left.localeCompare(right, undefined, { sensitivity: 'base' });
  });
};

const readSystemFonts = async (): Promise<string[]> => {
  if (typeof window === 'undefined') return [...PREFERRED_FONT_FAMILIES];
  const detected: string[] = [];

  // Electron is the authoritative source for the installed desktop app. It
  // enumerates both Windows system fonts and the current user's fonts.
  if (window.desktopFonts) {
    try {
      detected.push(...await window.desktopFonts.getFamilies());
    } catch {
      // Keep trying the browser source below; never silently replace a real
      // result with the small built-in catalogue.
    }
  }

  // This is useful when the same UI is opened in a normal browser. It may be
  // permission-gated, so it is deliberately additive and never required.
  if (typeof window.queryLocalFonts === 'function') {
    try {
      const fonts = await window.queryLocalFonts();
      detected.push(...fonts.map((font) => font.family));
    } catch {
      // Local Font Access can be unavailable or denied by the browser.
    }
  }

  return detected.length > 0 ? detected : [...PREFERRED_FONT_FAMILIES];
};

export const useAvailableFontFamilies = (): string[] => {
  const [families, setFamilies] = React.useState<string[]>(() => orderAvailableFontFamilies(PREFERRED_FONT_FAMILIES));
  React.useEffect(() => {
    let active = true;
    void readSystemFonts().then((detected) => {
      if (active) setFamilies(orderAvailableFontFamilies([...PREFERRED_FONT_FAMILIES, ...detected]));
    }).catch(() => undefined);
    return () => { active = false; };
  }, []);
  return families;
};
