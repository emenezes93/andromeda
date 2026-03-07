import { useEffect } from 'react';
import { useBlocker, useNavigate } from 'react-router-dom';

const DEFAULT_MESSAGE =
  'Você tem alterações não salvas. Deseja sair sem salvar?';

/**
 * Warns the user before leaving a page with unsaved changes.
 * - Registers a beforeunload listener (browser tab close / reload)
 * - Blocks in-app navigation via React Router's useBlocker; shows a custom modal instead of window.confirm.
 *
 * @param isDirty - whether there are unsaved changes
 * @param message - optional custom message (browser may ignore it for beforeunload)
 * @returns Object with showConfirmModal, confirmLeave, cancelLeave and message for rendering ConfirmModal.
 */
export function useUnsavedChanges(
  isDirty: boolean,
  message = DEFAULT_MESSAGE
) {
  const navigate = useNavigate();

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

  // Block in-app navigation and expose state for custom ConfirmModal
  const blocker = useBlocker(
    (_: { currentLocation: unknown; nextLocation: unknown }) => isDirty
  ) as {
    state?: string;
    proceed?: () => void;
    reset?: () => void;
    location?: { pathname: string; search: string };
  };

  const showConfirmModal = blocker.state === 'blocked';
  const confirmLeave = () => {
    if (typeof blocker.proceed === 'function') {
      blocker.proceed();
    } else if (blocker.location) {
      navigate(blocker.location.pathname + blocker.location.search);
      if (typeof blocker.reset === 'function') blocker.reset();
    }
  };
  const cancelLeave = () => {
    if (typeof blocker.reset === 'function') blocker.reset();
  };

  return { showConfirmModal, confirmLeave, cancelLeave, message };
}
