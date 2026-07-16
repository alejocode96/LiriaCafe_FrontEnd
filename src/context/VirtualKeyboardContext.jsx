import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';

const VKBContext = createContext(null);

// Input types that should NOT be intercepted (use native picker/control)
const SKIP_TYPES = new Set([
  'date', 'datetime-local', 'time', 'month', 'week',
  'file', 'color', 'range', 'checkbox', 'radio',
  'submit', 'button', 'reset', 'image', 'hidden',
]);

export function canIntercept(el) {
  if (!el) return false;
  const tag = el.tagName?.toUpperCase();
  if (tag !== 'INPUT' && tag !== 'TEXTAREA') return false;
  if (el.readOnly || el.disabled) return false;
  const type = (el.getAttribute('type') || 'text').toLowerCase();
  return !SKIP_TYPES.has(type);
}

export function VirtualKeyboardProvider({ children }) {
  const [enabled, setEnabled] = useState(() => {
    try { return localStorage.getItem('vkb-global') === '1'; } catch { return false; }
  });
  const [activeEl, setActiveEl] = useState(null);
  const mutObsRef   = useRef(null);
  const cleanObsRef = useRef(null);

  const applyInputMode = useCallback((el) => {
    if (!canIntercept(el) || el.dataset.vkbManaged) return;
    const orig = el.getAttribute('inputmode');
    if (orig) el.dataset.vkbOrig = orig;
    el.setAttribute('inputmode', 'none');
    el.dataset.vkbManaged = '1';
  }, []);

  const restoreInputMode = useCallback((el) => {
    if (!el.dataset.vkbManaged) return;
    if (el.dataset.vkbOrig) {
      el.setAttribute('inputmode', el.dataset.vkbOrig);
      delete el.dataset.vkbOrig;
    } else {
      el.removeAttribute('inputmode');
    }
    delete el.dataset.vkbManaged;
  }, []);

  // Main effect: enable/disable the system
  useEffect(() => {
    try { localStorage.setItem('vkb-global', enabled ? '1' : '0'); } catch {}

    if (!enabled) {
      document.querySelectorAll('[data-vkb-managed]').forEach(restoreInputMode);
      setActiveEl(null);
      mutObsRef.current?.disconnect();
      mutObsRef.current = null;
      return;
    }

    // Apply to all existing inputs
    document.querySelectorAll('input, textarea').forEach(applyInputMode);

    // Watch DOM for dynamically-added inputs (modals, panels, etc.)
    mutObsRef.current = new MutationObserver((muts) => {
      muts.forEach((m) => {
        m.addedNodes.forEach((node) => {
          if (node.nodeType !== 1) return;
          if (node.matches?.('input, textarea')) applyInputMode(node);
          node.querySelectorAll?.('input, textarea').forEach(applyInputMode);
        });
      });
    });
    mutObsRef.current.observe(document.body, { childList: true, subtree: true });

    // Show keyboard when any managed input is focused
    const onFocus = (e) => {
      if (canIntercept(e.target)) setActiveEl(e.target);
    };

    // Close keyboard when clicking outside an input or the keyboard itself
    const onPointerDown = (e) => {
      if (e.target.closest?.('[data-vkb-keyboard]')) return;
      const tag = e.target?.tagName?.toUpperCase();
      if (tag !== 'INPUT' && tag !== 'TEXTAREA') {
        setActiveEl(null);
      }
    };

    document.addEventListener('focus',       onFocus,       true);
    document.addEventListener('pointerdown', onPointerDown, true);

    return () => {
      mutObsRef.current?.disconnect();
      mutObsRef.current = null;
      document.removeEventListener('focus',       onFocus,       true);
      document.removeEventListener('pointerdown', onPointerDown, true);
    };
  }, [enabled, applyInputMode, restoreInputMode]);

  // Watch if activeEl is removed from DOM
  useEffect(() => {
    if (!activeEl) return;
    cleanObsRef.current = new MutationObserver(() => {
      if (!document.contains(activeEl)) setActiveEl(null);
    });
    cleanObsRef.current.observe(document.body, { childList: true, subtree: true });
    return () => { cleanObsRef.current?.disconnect(); cleanObsRef.current = null; };
  }, [activeEl]);

  const toggle = useCallback(() => setEnabled(v => !v), []);
  const close  = useCallback(() => setActiveEl(null), []);

  return (
    <VKBContext.Provider value={{ enabled, toggle, activeEl, close }}>
      {children}
    </VKBContext.Provider>
  );
}

export const useVirtualKeyboard = () => useContext(VKBContext);
