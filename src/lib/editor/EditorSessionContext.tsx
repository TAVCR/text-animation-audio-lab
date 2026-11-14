'use client';

import React from 'react';

type EditorSession = {
  uiLanguage: 'es' | 'en';
  setUiLanguage: React.Dispatch<React.SetStateAction<'es' | 'en'>>;
  editWordByWord: boolean;
  setEditWordByWord: React.Dispatch<React.SetStateAction<boolean>>;
};

const EditorSessionContext = React.createContext<EditorSession | undefined>(undefined);

export const EditorSessionProvider = ({ children }: { children: React.ReactNode }) => {
  const [uiLanguage, setUiLanguage] = React.useState<'es' | 'en'>('es');
  const [editWordByWord, setEditWordByWord] = React.useState(false);

  React.useEffect(() => {
    try {
      const saved = window.localStorage.getItem('inspector-ui-language-v2');
      if (saved === 'es' || saved === 'en') setUiLanguage(saved);
    } catch {
      // Keep the in-memory preference when storage is unavailable.
    }
  }, []);

  React.useEffect(() => {
    try {
      window.localStorage.setItem('inspector-ui-language-v2', uiLanguage);
    } catch {
      // Keep the in-memory preference when storage is unavailable.
    }
  }, [uiLanguage]);

  return (
    <EditorSessionContext.Provider value={{ uiLanguage, setUiLanguage, editWordByWord, setEditWordByWord }}>
      {children}
    </EditorSessionContext.Provider>
  );
};

export const useEditorSession = (): EditorSession => {
  const context = React.useContext(EditorSessionContext);
  if (!context) throw new Error('useEditorSession must be used within EditorSessionProvider');
  return context;
};
