export interface ArabicPageMeta {
  path: string;
  title: string;
  description: string;
}
export const ARABIC_PAGE_META: ArabicPageMeta[];
export const ARABIC_TWIN_PATHS: string[];
export function arabicTwinOf(path: string): string | null;
