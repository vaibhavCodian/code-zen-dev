// src/components/editor/LanguageSelector.tsx 

import { sampleCode, SupportedLanguage } from '../../constants/editor';

interface LanguageSelectorProps {
  currentLanguage: SupportedLanguage;
  currentSnippetId: string | null;
  onLanguageChange: (lang: SupportedLanguage) => void;
}

const availableLanguages = Object.keys(sampleCode) as SupportedLanguage[];

export function LanguageSelector({
  currentLanguage,
  currentSnippetId,
  onLanguageChange,
}: LanguageSelectorProps) {
  return (
    <div className="flex space-x-4">
      {availableLanguages.map((lang) => (
        <button
          key={lang}
          onClick={() => onLanguageChange(lang)}
          className={`px-4 py-2 rounded transition-colors ${
            currentLanguage === lang && !currentSnippetId
              ? 'bg-[var(--accent)] text-white'
              : 'bg-[var(--secondary-bg)] text-[var(--text-primary)] hover:bg-[var(--border-color)]'
          }`}
        >
          {lang.charAt(0).toUpperCase() + lang.slice(1)}
        </button>
      ))}
    </div>
  );
}