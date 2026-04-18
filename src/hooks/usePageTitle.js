import { useEffect } from 'react';

export function usePageTitle(title) {
  useEffect(() => {
    // Optional: Keep the base brand name at the end
    const fullTitle = title ? `${title} · HVT` : 'HVT';
    document.title = fullTitle;
  }, [title]);
}
