import React, { ComponentType, lazy } from 'react';

/**
 * retryLazy handles network transient issues or Vite deployment hash updates
 * where dynamic import chunks may change filenames after a new build.
 * If fetching a module fails (e.g. 404 or cache mismatch), it force reloads once
 * to fetch the new HTML and manifest cleanly.
 */
export function retryLazy<T extends ComponentType<any>>(
    componentImport: () => Promise<{ default: T }>
): React.LazyExoticComponent<T> {
    return lazy(async () => {
        const pageHasBeenForceRefreshed = window.sessionStorage.getItem('retry-lazy-refreshed');

        try {
            const component = await componentImport();
            window.sessionStorage.removeItem('retry-lazy-refreshed');
            return component;
        } catch (error: any) {
            console.error('Dynamic chunk import error detected:', error);
            
            // Check if chunk loading failed (network error or deployment hash change)
            const isChunkLoadFailed = 
                error?.message?.includes('Failed to fetch dynamically imported module') ||
                error?.name === 'ChunkLoadError' ||
                error?.message?.includes('dynamically imported module') ||
                error?.message?.includes('loading chunk');

            if (isChunkLoadFailed && !pageHasBeenForceRefreshed) {
                window.sessionStorage.setItem('retry-lazy-refreshed', 'true');
                // Hard refresh to reload updated manifest from the server
                window.location.reload();
                // Return a temporary unresolved promise to prevent uncaught error throw before reload
                return new Promise<{ default: T }>(() => {});
            }

            // If already force refreshed or another type of error, rethrow so ErrorBoundary handles it
            throw error;
        }
    });
}
