interface Window {
  desktopFonts?: {
    getFamilies: () => Promise<string[]>;
  };
  queryLocalFonts?: () => Promise<Array<{ family: string }>>;
}
