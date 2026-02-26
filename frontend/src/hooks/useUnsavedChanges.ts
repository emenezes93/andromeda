import { useEffect } from 'react';
import { useBlocker } from 'react-router-dom';

/**
 * Warns the user before leaving a page with unsaved changes.
 * - Registers a beforeunload listener (browser tab close / reload)
 * - Blocks in-app navigation via React Router's useBlocker
 *
 * @param isDirty - whether there are unsaved changes
 * @param message - optional custom message (browser may ignore it)
 */
export function useUnsavedChanges(
  isDirty: boolean,
  message = 'Você tem alterações não salvas. Deseja sair sem salvar?'
) {
  // Block browser close / reload
  useEffect(() => {
    if (!isDirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = message;
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty, message]);

  // Block in-app navigation
  useBlocker(() => {
    if (!isDirty) return false;
    return !window.confirm(message);
  });
}
