import { useState, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useVirtualKeyboard } from '../../context/VirtualKeyboardContext';

const OLIVE = '#55624a';

// ── Native value setter (triggers React's onChange) ────────────────────────────
function getNativeSetter(el) {
  const proto = el.tagName === 'TEXTAREA'
    ? HTMLTextAreaElement.prototype
    : HTMLInputElement.prototype;
  return Object.getOwnPropertyDescriptor(proto, 'value').set;
}

function dispatchReactInput(el) {
  el.dispatchEvent(new Event('input',  { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
}

function setElValue(el, val) {
  getNativeSetter(el).call(el, val);
  dispatchReactInput(el);
}

function getCursor(el) {
  try { return [el.selectionStart ?? el.value.length, el.selectionEnd ?? el.value.length]; }
  catch { return [el.value.length, el.value.length]; }
}

function setCursor(el, pos) {
  try { el.setSelectionRange(pos, pos); } catch {}
}

function getKbType(el) {
  const type = (el?.getAttribute('type') || 'text').toLowerCase();
  return (type === 'number' || type === 'tel') ? 'numpad' : 'alpha';
}

function getLabel(el) {
  if (!el) return '';
  return el.placeholder || el.getAttribute('aria-label') || el.getAttribute('name') || '';
}

// ── Position hook — measures active element and places keyboard near it ────────
function useKeyboardPosition(el, kbType) {
  const [coords, setCoords] = useState(null);

  useEffect(() => {
    if (!el || !document.contains(el)) { setCoords(null); return; }

    const KB_W = kbType === 'numpad' ? 244 : 382;
    const KB_H = kbType === 'numpad' ? 350 : 244;
    const GAP  = 6;

    const update = () => {
      if (!el || !document.contains(el)) return;
      const rect = el.getBoundingClientRect();

      // Horizontal: left-align with element, clamp to viewport
      let left = rect.left;
      if (left + KB_W > window.innerWidth - 8) left = window.innerWidth - KB_W - 8;
      left = Math.max(8, left);

      // Vertical: prefer below, go above if not enough space
      const spaceBelow = window.innerHeight - rect.bottom - GAP;
      const spaceAbove = rect.top - GAP;
      const top = (spaceBelow >= KB_H || spaceBelow >= spaceAbove)
        ? rect.bottom + GAP
        : rect.top - KB_H - GAP;

      setCoords({ top, left });
    };

    update();
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
  }, [el, kbType]);

  return coords;
}

// ── Alpha keyboard layouts ─────────────────────────────────────────────────────
const ALPHA = {
  lower: [
    ['q','w','e','r','t','y','u','i','o','p'],
    ['a','s','d','f','g','h','j','k','l'],
    ['⇧','z','x','c','v','b','n','m','⌫'],
    ['123','{sp}','.','-','✓'],
  ],
  upper: [
    ['Q','W','E','R','T','Y','U','I','O','P'],
    ['A','S','D','F','G','H','J','K','L'],
    ['⇧','Z','X','C','V','B','N','M','⌫'],
    ['123','{sp}','.','-','✓'],
  ],
  sym: [
    ['1','2','3','4','5','6','7','8','9','0'],
    ['@','#','$','%','&','_','=','+','(',')'],
    ['ABC','?','!','/','"',"'",'~','⌫'],
    ['{sp}',',','.','✓'],
  ],
};

const NUMPAD = [
  ['7','8','9'],
  ['4','5','6'],
  ['1','2','3'],
  ['.','0','⌫'],
  ['{clr}','✓'],
];

// ── AlphaKeyboard ──────────────────────────────────────────────────────────────
function AlphaKeyboard({ el, onClose }) {
  const [mode, setMode] = useState('lower');

  const press = useCallback((key) => {
    if (!el || !document.contains(el)) return;
    if (key === '⇧')   { setMode(m => m === 'upper' ? 'lower' : 'upper'); return; }
    if (key === '123')  { setMode('sym');   return; }
    if (key === 'ABC')  { setMode('lower'); return; }
    if (key === '✓')   { onClose(); return; }

    const [s, e] = getCursor(el);
    const old = el.value;

    if (key === '⌫') {
      if (s !== e) { setElValue(el, old.slice(0, s) + old.slice(e)); setCursor(el, s); }
      else if (s > 0) { setElValue(el, old.slice(0, s - 1) + old.slice(s)); setCursor(el, s - 1); }
      return;
    }

    const ch = key === '{sp}' ? ' ' : key;
    setElValue(el, old.slice(0, s) + ch + old.slice(e));
    setCursor(el, s + ch.length);
    if (mode === 'upper') setMode('lower');
  }, [el, mode, onClose]);

  const rows = ALPHA[mode] ?? ALPHA.lower;

  const kStyle = (key) => {
    const base = {
      height: 38, flex: 1, minWidth: 0, borderRadius: 8,
      border: '1px solid rgba(0,0,0,0.08)', background: 'rgba(0,0,0,0.03)',
      color: '#111827', fontSize: 13, fontWeight: 500, cursor: 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      WebkitTapHighlightColor: 'transparent', padding: 0,
      boxSizing: 'border-box', userSelect: 'none',
      boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
    };
    if (key === '✓')    return { ...base, background: `linear-gradient(135deg,${OLIVE},#3d4735)`, color: 'white', border: 'none', fontWeight: 700, fontSize: 15, flex: 1.5, boxShadow: 'none' };
    if (key === '{sp}')  return { ...base, flex: 4.5, fontSize: 10, color: '#9ca3af', background: 'white' };
    if (['⌫','⇧','123','ABC'].includes(key)) return {
      ...base, background: 'rgba(0,0,0,0.07)', fontWeight: 700, flex: 1.4,
      fontSize: key === '⇧' ? 14 : 10,
      ...(mode === 'upper' && key === '⇧' ? { background: `${OLIVE}22`, border: `1px solid ${OLIVE}44`, color: OLIVE } : {}),
    };
    return base;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {rows.map((row, ri) => (
        <div key={ri} style={{ display: 'flex', gap: 3, justifyContent: 'center' }}>
          {row.map((key, ki) => (
            <button
              key={`${key}-${ki}`}
              onPointerDown={(e) => { e.preventDefault(); press(key); }}
              style={kStyle(key)}
            >
              {key === '{sp}' ? 'espacio' : key}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}

// ── NumpadKeyboard ─────────────────────────────────────────────────────────────
function NumpadKeyboard({ el, onClose }) {
  const [buf, setBuf] = useState(() => el?.value ?? '');
  const isNumber = el?.getAttribute('type') === 'number';

  useEffect(() => { setBuf(el?.value ?? ''); }, [el]);

  const commitBuf = useCallback((newBuf) => {
    if (!el || !document.contains(el)) return;
    const setter = getNativeSetter(el);
    if (isNumber) {
      const n = parseFloat(newBuf);
      if (!isNaN(n)) { setter.call(el, String(n)); dispatchReactInput(el); }
      else if (newBuf === '' || newBuf === '-') { setter.call(el, ''); dispatchReactInput(el); }
    } else {
      setter.call(el, newBuf);
      dispatchReactInput(el);
    }
  }, [el, isNumber]);

  const press = useCallback((key) => {
    if (!el || !document.contains(el)) return;
    if (key === '✓') { commitBuf(buf); onClose(); return; }
    let next;
    if (key === '{clr}') { next = ''; }
    else if (key === '⌫') { next = buf.slice(0, -1); }
    else if (key === '.') { if (buf.includes('.')) return; next = buf + '.'; }
    else { next = buf === '0' ? key : buf + key; }
    setBuf(next);
    commitBuf(next);
  }, [el, buf, commitBuf, onClose]);

  const kStyle = (key) => {
    const base = {
      height: 48, flex: 1, borderRadius: 9,
      border: '1px solid rgba(0,0,0,0.08)', background: 'rgba(0,0,0,0.03)',
      color: '#111827', fontSize: 19, fontWeight: 600, cursor: 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      WebkitTapHighlightColor: 'transparent', padding: 0,
      boxSizing: 'border-box', userSelect: 'none',
      boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
    };
    if (key === '✓')     return { ...base, background: `linear-gradient(135deg,${OLIVE},#3d4735)`, color: 'white', border: 'none', fontWeight: 700, flex: 2, boxShadow: 'none' };
    if (key === '{clr}') return { ...base, background: '#fee2e2', color: '#dc2626', border: '1px solid #fecaca', fontSize: 10, fontWeight: 800, flex: 1 };
    if (key === '⌫')    return { ...base, background: 'rgba(0,0,0,0.07)', fontWeight: 700, fontSize: 16 };
    if (key === '.')     return { ...base, fontSize: 22, color: '#6b7280', background: 'rgba(0,0,0,0.04)' };
    return base;
  };

  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: 6, padding: '5px 10px', background: 'rgba(0,0,0,0.04)', borderRadius: 8, minHeight: 30, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: 19, fontWeight: 700, color: buf ? '#111827' : '#9ca3af', fontFamily: "'Syne',sans-serif" }}>
          {buf || '0'}
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {NUMPAD.map((row, ri) => (
          <div key={ri} style={{ display: 'flex', gap: 4 }}>
            {row.map((key, ki) => (
              <button
                key={`${key}-${ki}`}
                onPointerDown={(e) => { e.preventDefault(); press(key); }}
                style={kStyle(key)}
              >
                {key === '{clr}' ? 'C' : key}
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── GlobalVirtualKeyboard ──────────────────────────────────────────────────────
export default function GlobalVirtualKeyboard() {
  const { activeEl, close } = useVirtualKeyboard();
  const kbType = activeEl ? getKbType(activeEl) : 'alpha';
  const label  = activeEl ? getLabel(activeEl) : '';
  const coords = useKeyboardPosition(activeEl, kbType);

  if (!activeEl || !document.contains(activeEl) || !coords) return null;

  const kb = (
    <div
      data-vkb-keyboard="true"
      style={{
        position: 'fixed',
        top: coords.top,
        left: coords.left,
        width: kbType === 'numpad' ? 244 : 382,
        zIndex: 99990,
        background: '#f8f7f5',
        borderRadius: 14,
        border: '1px solid rgba(0,0,0,0.10)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.08)',
        padding: kbType === 'numpad' ? '10px 12px 12px' : '10px 10px 12px',
        animation: 'vkbFadeIn 150ms cubic-bezier(0.34,1.2,0.64,1)',
      }}
    >
      <style>{`@keyframes vkbFadeIn{from{opacity:0;transform:translateY(5px) scale(0.97)}to{opacity:1;transform:none}}`}</style>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, paddingBottom: 7, borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, overflow: 'hidden' }}>
          <span style={{ fontSize: 9, fontWeight: 800, color: OLIVE, textTransform: 'uppercase', letterSpacing: '0.10em', fontFamily: "'Syne',sans-serif", flexShrink: 0 }}>
            {kbType === 'numpad' ? 'Numérico' : 'Teclado'}
          </span>
          {label && (
            <span style={{ fontSize: 10, color: '#6b7280', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              — {label}
            </span>
          )}
        </div>
        <button
          onPointerDown={(e) => { e.preventDefault(); close(); }}
          style={{ width: 22, height: 22, borderRadius: 6, border: '1px solid rgba(0,0,0,0.08)', background: 'rgba(0,0,0,0.05)', color: '#9ca3af', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, fontSize: 11, flexShrink: 0, marginLeft: 6 }}
        >
          ✕
        </button>
      </div>

      {kbType === 'numpad'
        ? <NumpadKeyboard el={activeEl} onClose={close} key={activeEl?.id || activeEl?.name || 'numpad'} />
        : <AlphaKeyboard  el={activeEl} onClose={close} />
      }
    </div>
  );

  return createPortal(kb, document.body);
}
