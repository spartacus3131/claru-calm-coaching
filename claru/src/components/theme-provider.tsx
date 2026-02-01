'use client';

/**
 * @file theme-provider.tsx
 * @description Theme provider for dark/light mode support using next-themes
 * @module components
 */

import * as React from 'react';
import { ThemeProvider as NextThemesProvider, type ThemeProviderProps } from 'next-themes';

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
