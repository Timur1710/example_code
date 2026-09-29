import { TRANSLITERATION_MAP } from "../constants/transliterations-word";

export function useTransliterationsWord() {
  function transliterate(word: string): string {
    return word
      .split('')
      .map(char => TRANSLITERATION_MAP[char] || char)
      .join('');
  }

  return { transliterate };
}