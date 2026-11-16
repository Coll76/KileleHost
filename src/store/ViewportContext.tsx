import React, { createContext, useContext, useEffect, useState } from 'react';

export type PreviewMode = 'desktop' | 'mobile';

interface ViewportContextValue {
  previewMode: PreviewMode;
  setPreviewMode: (mode: PreviewMode) => void;
  isIframePreview: boolean;
  isMobileLayout: boolean;
}

const ViewportContext = createContext<ViewportContextValue>({
  previewMode: 'desktop',
  setPreviewMode: () => {},
  isIframePreview: false,
  isMobileLayout: false,
});

function detectIframePreviewParam(): boolean {
  if (typeof window === 'undefined') return false;
  return new URLSearchParams(window.location.search).get('frame') === '1';
}

export function ViewportProvider({ children }: { children: React.ReactNode }) {
  const [isIframePreview] = useState<boolean>(detectIframePreviewParam);
  const [previewMode, setPreviewMode] = useState<PreviewMode>('desktop');
  const [isNarrowScreen, setIsNarrowScreen] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.innerWidth < 1024 : false
  );

  useEffect(() => {
    const onResize = () => {
      setIsNarrowScreen(window.innerWidth < 1024);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const isMobileLayout = isIframePreview || isNarrowScreen;

  return (
    <ViewportContext.Provider
      value={{ previewMode, setPreviewMode, isIframePreview, isMobileLayout }}
    >
      {children}
    </ViewportContext.Provider>
  );
}

export function useViewport(): ViewportContextValue {
  return useContext(ViewportContext);
}
