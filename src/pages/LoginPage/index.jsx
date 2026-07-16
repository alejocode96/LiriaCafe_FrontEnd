import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { User, Lock, Eye, EyeOff, Keyboard } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useLogin } from "../../hooks/useLogin";

/* ─────────────────────────────────────────────────────────────
   Grain texture hook
───────────────────────────────────────────────────────────── */
function useGrain(opacity = 0.16) {
    const ref = useRef(null);
    useEffect(() => {
        const canvas = document.createElement("canvas");
        canvas.width = 400;
        canvas.height = 400;
        const ctx = canvas.getContext("2d");
        const img = ctx.createImageData(400, 400);
        for (let i = 0; i < img.data.length; i += 4) {
            const v = Math.random() > 0.5 ? 255 : 0;
            img.data[i] = v;
            img.data[i + 1] = v;
            img.data[i + 2] = v;
            img.data[i + 3] = Math.random() * 28;
        }
        ctx.putImageData(img, 0, 0);
        if (ref.current) {
            ref.current.style.backgroundImage = `url(${canvas.toDataURL()})`;
            ref.current.style.opacity = String(opacity);
        }
    }, [opacity]);
    return ref;
}

/* ─────────────────────────────────────────────────────────────
   Feature cards data
───────────────────────────────────────────────────────────── */
const CARDS = [
    {
        emoji: "⚡",
        title: "Pedidos al instante",
        desc: "Envía a cocina en segundos",
        rotate: "-1deg",
        accent: "rgba(255,160,40,0.18)",
        accentBorder: "rgba(255,160,40,0.30)",
        emojiRotate: "-18deg",
        emojiScale: "1.45",
    },
    {
        emoji: "📦",
        title: "Inventario en vivo",
        desc: "Stock actualizado con cada venta",
        rotate: "-2deg",
        accent: "rgba(140,145,108,0.20)",
        accentBorder: "rgba(200,212,176,0.28)",
        emojiRotate: "12deg",
        emojiScale: "1.55",
    },
    {
        emoji: "💰",
        title: "Reportes del día",
        desc: "Cierre de caja al instante",
        rotate: "2deg",
        accent: "rgba(80,200,120,0.14)",
        accentBorder: "rgba(80,200,120,0.25)",
        emojiRotate: "22deg",
        emojiScale: "1.50",
    },
];

/* ─────────────────────────────────────────────────────────────
   Inline Keyboard
───────────────────────────────────────────────────────────── */
const KB_LAYOUTS = {
    alpha: [
        ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
        ["a", "s", "d", "f", "g", "h", "j", "k", "l"],
        ["⇧", "z", "x", "c", "v", "b", "n", "m", "⌫"],
        ["123", "{space}", ".", "✓"],
    ],
    alphaUpper: [
        ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
        ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
        ["⇧", "Z", "X", "C", "V", "B", "N", "M", "⌫"],
        ["123", "{space}", ".", "✓"],
    ],
    numeric: [
        ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"],
        ["-", "/", ".", ":", ";", "(", ")", "@", '"', "_"],
        ["ABC", "?", "!", "#", "%", "&", "'", "⌫"],
        ["{space}", "✓"],
    ],
};

function InlineKeyboard({ value, onChange, onClose, label }) {
    const [layout, setLayout] = useState("alpha");

    const press = (key) => {
        if (key === "⌫") { onChange(value.slice(0, -1)); return; }
        if (key === "{space}") { onChange(value + " "); return; }
        if (key === "⇧") { setLayout((l) => (l === "alphaUpper" ? "alpha" : "alphaUpper")); return; }
        if (key === "123") { setLayout("numeric"); return; }
        if (key === "ABC") { setLayout("alpha"); return; }
        if (key === "✓") { onClose?.(); return; }
        onChange(value + key);
        if (layout === "alphaUpper") setLayout("alpha");
    };

    const keyStyle = (key) => {
        const base = {
            height: 42, flex: 1, minWidth: 0, borderRadius: 9,
            border: "1px solid rgba(0,0,0,0.08)", background: "rgba(0,0,0,0.03)",
            color: "#111827", fontSize: 14, fontWeight: 500, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            WebkitTapHighlightColor: "transparent", padding: 0,
            boxSizing: "border-box", userSelect: "none", transition: "background 60ms",
        };
        if (key === "✓") return { ...base, background: "linear-gradient(135deg,#55624a,#3d4735)", color: "white", border: "1px solid #55624a", fontWeight: 700, fontSize: 16, flex: 1.5 };
        if (key === "{space}") return { ...base, flex: 5, fontSize: 11, color: "#9ca3af" };
        if (["⌫", "⇧", "123", "ABC"].includes(key)) return {
            ...base, background: "rgba(0,0,0,0.07)",
            fontSize: key === "⇧" ? 16 : 11, fontWeight: 700, flex: 1.4,
            ...(layout === "alphaUpper" && key === "⇧"
                ? { background: "rgba(85,98,74,0.15)", border: "1px solid rgba(85,98,74,0.3)", color: "#55624a" }
                : {}),
        };
        return base;
    };

    return (
        <div style={{
            width: "100%", background: "#f8f7f5", borderRadius: 14,
            border: "1px solid rgba(0,0,0,0.07)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.14),0 2px 8px rgba(0,0,0,0.06)",
            padding: "10px 10px 12px", boxSizing: "border-box",
            animation: "kbSlide 160ms cubic-bezier(0.34,1.4,0.64,1)",
        }}>
            <style>{`
        @keyframes kbSlide { from{opacity:0;transform:translateY(6px) scale(0.98)} to{opacity:1;transform:none} }
      `}</style>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, paddingBottom: 6, borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: "#55624a", textTransform: "uppercase", letterSpacing: "0.07em", fontFamily: "'Syne',sans-serif" }}>{label}</span>
                <button onPointerDown={(e) => { e.preventDefault(); onClose?.(); }}
                    style={{ width: 24, height: 24, borderRadius: 7, border: "1px solid rgba(0,0,0,0.08)", background: "rgba(0,0,0,0.04)", color: "#9ca3af", fontSize: 10, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}>
                    ✕
                </button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                {KB_LAYOUTS[layout].map((row, ri) => (
                    <div key={ri} style={{ display: "flex", gap: 4, justifyContent: "center" }}>
                        {row.map((key, ki) => (
                            <button key={`${key}-${ki}`} onPointerDown={(e) => { e.preventDefault(); press(key); }} style={keyStyle(key)}>
                                {key === "{space}" ? "espacio" : key}
                            </button>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
}

/* ─────────────────────────────────────────────────────────────
   KeyboardPortal
───────────────────────────────────────────────────────────── */
function KeyboardPortal({ anchorRef, isOpen, children }) {
    const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });

    useEffect(() => {
        if (!isOpen || !anchorRef.current) return;
        const update = () => {
            const rect = anchorRef.current.getBoundingClientRect();
            const kbHeight = 280;
            const gap = 8;
            const spaceBelow = window.innerHeight - rect.bottom - gap;
            const spaceAbove = rect.top - gap;
            const top = spaceBelow >= kbHeight || spaceBelow >= spaceAbove
                ? rect.bottom + gap
                : rect.top - kbHeight - gap;
            setCoords({ top, left: rect.left, width: rect.width });
        };
        update();
        window.addEventListener("scroll", update, true);
        window.addEventListener("resize", update);
        return () => {
            window.removeEventListener("scroll", update, true);
            window.removeEventListener("resize", update);
        };
    }, [isOpen, anchorRef]);

    if (!isOpen) return null;
    return createPortal(
        <div style={{ position: "fixed", top: coords.top, left: coords.left, width: coords.width, zIndex: 9999 }}>
            {children}
        </div>,
        document.body
    );
}

/* ─────────────────────────────────────────────────────────────
   RealField — input nativo con icono y soporte teclado virtual
───────────────────────────────────────────────────────────── */
function RealField({
    value, onChange, onFocus, onBlur,
    hasError, placeholder, icon, rightSlot,
    isPassword, showPassword, inputRef,
    useVirtualKb, onVirtualKbFocus,
    fieldId,
}) {
    const type = isPassword ? (showPassword ? "text" : "password") : "text";

    const handleFocus = (e) => {
        if (useVirtualKb) {
            e.preventDefault();
            e.target.blur();
            onVirtualKbFocus?.(fieldId);
            return;
        }
        onFocus?.(e);
    };

    return (
        <div style={{ position: "relative", width: "100%" }}>
            {/* Icono izquierdo */}
            <span style={{
                position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)",
                color: "rgba(85,98,74,0.5)", display: "flex", pointerEvents: "none",
                zIndex: 1, transition: "color 150ms",
            }}>
                {icon}
            </span>

            <input
                ref={inputRef}
                type={type}
                value={value}
                placeholder={placeholder}
                autoComplete={isPassword ? "current-password" : "username"}
                readOnly={useVirtualKb}
                onFocus={handleFocus}
                onBlur={onBlur}
                onChange={(e) => !useVirtualKb && onChange(e.target.value)}
                onClick={() => useVirtualKb && onVirtualKbFocus?.(fieldId)}
                style={{
                    width: "100%",
                    height: 52,
                    borderRadius: 16,
                    border: `1.5px solid ${hasError ? "#ef4444" : "rgba(140,145,108,0.25)"}`,
                    background: "#f4f4f2",
                    paddingLeft: 44,
                    paddingRight: rightSlot ? 52 : 16,
                    fontSize: 15,
                    color: "#003a30",
                    fontFamily: "inherit",
                    outline: "none",
                    boxSizing: "border-box",
                    cursor: useVirtualKb ? "pointer" : "text",
                    transition: "border-color 150ms, box-shadow 150ms",
                    letterSpacing: isPassword && !showPassword ? "0.12em" : "0.01em",
                    caretColor: "#55624a",
                    /* Focus styles via CSS class */
                }}
                className="pos-input"
            />

            {rightSlot && (
                <span style={{
                    position: "absolute", right: 14, top: "50%",
                    transform: "translateY(-50%)", zIndex: 2,
                }}>
                    {rightSlot}
                </span>
            )}

            <style>{`
                .pos-input::placeholder { color: rgba(85,98,74,0.45); }
                .pos-input:focus {
                    border-color: #55624a !important;
                    box-shadow: 0 0 0 4px rgba(85,98,74,0.10);
                }
            `}</style>
        </div>
    );
}

/* ─────────────────────────────────────────────────────────────
   FieldWithOptionalVirtualKb
───────────────────────────────────────────────────────────── */
function FieldWithOptionalVirtualKb({
    fieldId, activeVkbField, onVirtualKbFocus, onVirtualKbClose,
    value, onChange, useVirtualKb, ...fieldProps
}) {
    const wrapRef = useRef(null);
    const isVkbOpen = useVirtualKb && activeVkbField === fieldId;

    // Cerrar teclado virtual al click afuera
    useEffect(() => {
        if (!isVkbOpen) return;
        const handler = (e) => {
            if (wrapRef.current?.contains(e.target)) return;
            if (e.target.closest("[data-kb-portal]")) return;
            onVirtualKbClose();
        };
        document.addEventListener("mousedown", handler);
        document.addEventListener("touchstart", handler);
        return () => {
            document.removeEventListener("mousedown", handler);
            document.removeEventListener("touchstart", handler);
        };
    }, [isVkbOpen, onVirtualKbClose]);

    return (
        <div ref={wrapRef} style={{ position: "relative" }}>
            <RealField
                value={value}
                onChange={onChange}
                useVirtualKb={useVirtualKb}
                onVirtualKbFocus={onVirtualKbFocus}
                fieldId={fieldId}
                {...fieldProps}
            />
            {useVirtualKb && (
                <KeyboardPortal anchorRef={wrapRef} isOpen={isVkbOpen}>
                    <div data-kb-portal="true">
                        <InlineKeyboard
                            value={value}
                            onChange={onChange}
                            onClose={onVirtualKbClose}
                            label={fieldProps.placeholder}
                        />
                    </div>
                </KeyboardPortal>
            )}
        </div>
    );
}

/* ─────────────────────────────────────────────────────────────
   LoginForm
───────────────────────────────────────────────────────────── */
function LoginForm() {
    const [showPass, setShowPass] = useState(false);
    const [form, setForm] = useState({ identificador: "", contrasena: "" });
    const [errors, setErrors] = useState({});
    const [useVirtualKb, setUseVirtualKb] = useState(false);
    const [activeVkbField, setActiveVkbField] = useState(null);
    const { handleLogin, loading } = useLogin();
    const navigate = useNavigate();

    const openVkb = useCallback((field) => {
        setActiveVkbField(field);
        setErrors((p) => ({ ...p, [field]: "" }));
    }, []);

    const closeVkb = useCallback(() => setActiveVkbField(null), []);

    const handleChange = useCallback((field, val) => {
        setForm((p) => ({ ...p, [field]: val }));
        setErrors((p) => ({ ...p, [field]: "" }));
    }, []);

    const toggleVirtualKb = () => {
        setUseVirtualKb((v) => {
            if (v) closeVkb(); // cerrar teclado si se desactiva
            return !v;
        });
    };

    const validate = () => {
        const errs = {};
        if (!form.identificador.trim()) errs.identificador = "El usuario o correo es obligatorio";
        else if (form.identificador.length < 3) errs.identificador = "Mínimo 3 caracteres";
        if (!form.contrasena.trim()) errs.contrasena = "La contraseña es obligatoria";
        else if (form.contrasena.length < 4) errs.contrasena = "Mínimo 4 caracteres";
        return errs;
    };

    const handleSubmit = async (e) => {
        e?.preventDefault?.();
        closeVkb();
        const errs = validate();
        if (Object.keys(errs).length > 0) { setErrors(errs); return; }
        try {
            await handleLogin(form.identificador, form.contrasena);
        } catch {
            setErrors({
                identificador: " ",
                contrasena: "Usuario o contraseña incorrectos",
            });
        }
    };

    const sharedProps = {
        activeVkbField,
        onVirtualKbFocus: openVkb,
        onVirtualKbClose: closeVkb,
        useVirtualKb,
    };

    return (
        <div style={{ width: "100%" }}>
            <form onSubmit={handleSubmit} style={{ width: "100%" }}>
                {/* Encabezado */}
                <div style={{ marginBottom: 28 }}>
                    <h2 style={{
                        fontFamily: "'Syne',sans-serif", fontSize: "clamp(18px,3vw,22px)",
                        fontWeight: 800, textTransform: "uppercase", letterSpacing: "-0.02em",
                        color: "#003a30", margin: 0, lineHeight: 1,
                    }}>
                        Iniciar sesión
                    </h2>
                    <p style={{ fontSize: 14, color: "rgba(85,98,74,0.7)", margin: "8px 0 0" }}>
                        Ingresa tus credenciales para continuar
                    </p>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    {/* Usuario / correo */}
                    <div>
                        <FieldWithOptionalVirtualKb
                            fieldId="identificador"
                            value={form.identificador}
                            onChange={(val) => handleChange("identificador", val)}
                            hasError={!!errors.identificador}
                            placeholder="Usuario o correo electrónico"
                            icon={<User size={17} />}
                            {...sharedProps}
                        />
                        {errors.identificador?.trim() && (
                            <p style={{ marginTop: 4, fontSize: 13, color: "#ef4444", paddingLeft: 4 }}>
                                {errors.identificador}
                            </p>
                        )}
                    </div>

                    {/* Contraseña */}
                    <div>
                        <FieldWithOptionalVirtualKb
                            fieldId="contrasena"
                            value={form.contrasena}
                            onChange={(val) => handleChange("contrasena", val)}
                            hasError={!!errors.contrasena}
                            placeholder="Contraseña"
                            isPassword
                            showPassword={showPass}
                            icon={<Lock size={17} />}
                            rightSlot={
                                <span
                                    onClick={(e) => { e.stopPropagation(); setShowPass((v) => !v); }}
                                    style={{ color: "rgba(85,98,74,0.5)", display: "flex", cursor: "pointer" }}
                                >
                                    {showPass ? <EyeOff size={17} /> : <Eye size={17} />}
                                </span>
                            }
                            {...sharedProps}
                        />
                        {errors.contrasena?.trim() && (
                            <p style={{ marginTop: 4, fontSize: 13, color: "#ef4444", paddingLeft: 4 }}>
                                {errors.contrasena}
                            </p>
                        )}
                    </div>

                    {/* Fila: recuperar + toggle teclado */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <button
                            type="button"
                            onClick={toggleVirtualKb}
                            style={{
                                display: "flex", alignItems: "center", gap: 6,
                                background: useVirtualKb ? "rgba(85,98,74,0.12)" : "rgba(0,0,0,0.04)",
                                border: useVirtualKb ? "1px solid rgba(85,98,74,0.35)" : "1px solid rgba(0,0,0,0.08)",
                                borderRadius: 10, padding: "6px 12px",
                                fontSize: 12, fontWeight: 600,
                                color: useVirtualKb ? "#55624a" : "#9ca3af",
                                cursor: "pointer", transition: "all 150ms",
                                fontFamily: "inherit",
                            }}
                        >
                            <Keyboard size={14} />
                            {useVirtualKb ? "Teclado virtual: ON" : "Habilitar teclado virtual"}
                        </button>

                        <button
                            type="button"
                            onClick={() => navigate("/forgot-password")}
                            style={{ background: "none", border: "none", fontSize: 14, color: "#55624a", cursor: "pointer", padding: 0 }}
                        >
                            Recuperar acceso
                        </button>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            height: 52, borderRadius: 16, border: "none",
                            background: loading ? "rgba(0,58,48,0.6)" : "#003a30",
                            color: "white", fontSize: 15, fontWeight: 600,
                            fontFamily: "'Syne',sans-serif",
                            cursor: loading ? "not-allowed" : "pointer",
                            letterSpacing: "0.02em", transition: "background 150ms",
                        }}
                    >
                        {loading ? "Ingresando…" : "Ingresar al sistema"}
                    </button>
                </div>
            </form>
        </div>
    );
}

/* ─────────────────────────────────────────────────────────────
   FeatureCard
───────────────────────────────────────────────────────────── */
function FeatureCard({ emoji, title, desc, rotate, accent, accentBorder, emojiRotate, emojiScale }) {
    return (
        <div
            style={{
                position: "relative", overflow: "hidden", borderRadius: 18,
                padding: "16px 20px", width: "100%",
                background: `linear-gradient(135deg,rgba(255,255,255,0.13) 0%,${accent} 100%)`,
                backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)",
                border: `1px solid ${accentBorder}`,
                boxShadow: "0 12px 36px rgba(0,0,0,0.28),inset 0 1px 0 rgba(255,255,255,0.18)",
                transform: `rotate(${rotate})`,
                transition: "transform 0.25s ease,box-shadow 0.25s ease",
                minHeight: 82,
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.transform = `rotate(${rotate}) scale(1.04)`;
                e.currentTarget.style.boxShadow = "0 20px 48px rgba(0,0,0,0.38),inset 0 1px 0 rgba(255,255,255,0.22)";
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.transform = `rotate(${rotate}) scale(1)`;
                e.currentTarget.style.boxShadow = "0 12px 36px rgba(0,0,0,0.28),inset 0 1px 0 rgba(255,255,255,0.18)";
            }}
        >
            <div style={{ position: "relative", zIndex: 10 }}>
                <p style={{ fontSize: 13.5, fontWeight: 700, color: "rgba(255,255,255,0.95)", lineHeight: 1.2, textTransform: "uppercase", margin: 0, fontFamily: "'Syne',sans-serif", letterSpacing: "-0.01em" }}>{title}</p>
                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", marginTop: 4, lineHeight: 1.4, marginBottom: 0 }}>{desc}</p>
            </div>
            <div style={{ position: "absolute", right: -4, bottom: -6, fontSize: 58, lineHeight: 1, transform: `rotate(${emojiRotate}) scale(${emojiScale})`, filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.4))", opacity: 0.92, pointerEvents: "none", userSelect: "none" }}>
                {emoji}
            </div>
        </div>
    );
}

/* ─────────────────────────────────────────────────────────────
   LoginPage
───────────────────────────────────────────────────────────── */
export default function LoginPage() {
    const grainRef = useGrain(0.16);

    return (
        <>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; padding: 0; }
      `}</style>

            <div style={{ width: "100vw", height: "100dvh", display: "flex", overflow: "hidden", fontFamily: "system-ui,sans-serif", position: "relative" }}>

                {/* ══ PANEL IZQUIERDO — visible md+ ══ */}
                <div style={{ display: "none", width: "58%", height: "100%", padding: "14px 0 14px 14px", flexShrink: 0 }}
                    className="left-panel">
                    <style>{`.left-panel { display: none; } @media(min-width:768px){ .left-panel { display: block !important; } }`}</style>
                    <div style={{ flex: 1, position: "relative", height: "100%" }}>
                        <div style={{ position: "absolute", inset: 0, borderRadius: 22, overflow: "hidden" }}>
                            <div style={{ position: "absolute", inset: 0, background: "#001a12" }} />
                            <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 100% 75% at 50% 108%,#55624a 0%,#1a3022 38%,transparent 65%),radial-gradient(ellipse 55% 45% at 50% 105%,#8c916c55 0%,transparent 55%)" }} />
                            <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 120% 55% at 50% 0%,rgba(0,0,0,.65) 0%,transparent 70%)" }} />
                            <div ref={grainRef} style={{ position: "absolute", inset: 0, pointerEvents: "none", mixBlendMode: "screen", filter: "blur(0.15px)", backgroundSize: "200px 200px" }} />
                        </div>

                        <div style={{ position: "relative", zIndex: 10, display: "flex", flexDirection: "column", justifyContent: "space-between", height: "100%", padding: 32 }}>
                            <div>
                                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 36 }}>
                                    <img src="/Logo.png" style={{ width: 80 }} alt="Logo" onError={(e) => { e.target.style.display = "none"; }} />
                                </div>
                                <h2 style={{ fontSize: "clamp(28px,3.5vw,40px)", textTransform: "uppercase", fontWeight: 800, letterSpacing: "-0.02em", color: "#f0ede6", lineHeight: 1, margin: 0, fontFamily: "'Syne',sans-serif" }}>
                                    Bienvenido<br />
                                    <em style={{ color: "#8c916c", fontStyle: "italic" }}>de regreso.</em>
                                </h2>
                            </div>
                        </div>

                        {/* Cards flotantes */}
                        <div style={{ position: "absolute", zIndex: 30, left: 30, right: -90, bottom: 30, height: 210, pointerEvents: "none" }}>
                            <div style={{ position: "absolute", left: "35%", top: 0, width: 300 }}><FeatureCard {...CARDS[0]} /></div>
                            <div style={{ position: "absolute", right: "52%", bottom: 18, width: 300 }}><FeatureCard {...CARDS[1]} /></div>
                            <div style={{ position: "absolute", right: "4%", bottom: 0, width: 300 }}><FeatureCard {...CARDS[2]} /></div>
                        </div>
                    </div>
                </div>

                {/* ══ PANEL DERECHO desktop ══ */}
                <div style={{ display: "none", flex: 1, height: "100%", padding: "14px 14px 14px 0" }}
                    className="right-panel">
                    <style>{`.right-panel { display: none; } @media(min-width:768px){ .right-panel { display: block !important; } }`}</style>
                    <div style={{ height: "100%", borderRadius: 22, background: "white", display: "flex", alignItems: "center", justifyContent: "center", padding: "32px 36px" }}>
                        <div style={{ width: "100%", maxWidth: 420 }}>
                            <LoginForm />
                        </div>
                    </div>
                </div>

                {/* ══ MOBILE ══ */}
                <div className="mobile-layout" style={{ position: "fixed", inset: 0, height: "100dvh", width: "100vw", overflow: "hidden", display: "flex", flexDirection: "column" }}>
                    <style>{`
            .mobile-layout { display: flex !important; }
            @media(min-width:768px){ .mobile-layout { display: none !important; } }
          `}</style>

                    <div style={{ position: "absolute", inset: 0, background: "#001a12" }} />
                    <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 130% 60% at 50% 110%,#55624a 0%,#1a3022 40%,transparent 65%)" }} />

                    <div style={{ position: "relative", zIndex: 10, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 20px", height: "28dvh", flexShrink: 0 }}>
                        <img src="/Logo.png" style={{ width: 48, marginBottom: 12 }} alt="Logo" onError={(e) => { e.target.style.display = "none"; }} />
                        <h2 style={{ fontSize: "clamp(20px,5vw,26px)", textTransform: "uppercase", fontWeight: 800, letterSpacing: "-0.02em", color: "#f0ede6", lineHeight: 1.1, margin: 0, textAlign: "center", fontFamily: "'Syne',sans-serif" }}>
                            Bienvenido<br />
                            <em style={{ color: "#8c916c", fontStyle: "italic" }}>de regreso.</em>
                        </h2>
                    </div>

                    <div style={{ position: "relative", zIndex: 20, background: "white", borderRadius: "24px 24px 0 0", flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
                        <div style={{ width: 36, height: 4, borderRadius: 2, background: "#e0dbd0", margin: "12px auto 4px", flexShrink: 0 }} />
                        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 24px 24px", minHeight: 0 }}>
                            <LoginForm />
                        </div>
                    </div>
                </div>

            </div>
        </>
    );
}