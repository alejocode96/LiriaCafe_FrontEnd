import { useState, useEffect, useRef } from "react";
import { User, Lock, Eye, EyeOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/auth.store";
import api from "../../api/client";
import toast from "react-hot-toast";
/* ── Grain canvas hook ── */
function useGrain(opacity = 0.22) {
    const ref = useRef(null);
    useEffect(() => {
        const canvas = document.createElement("canvas");
        canvas.width = 400;
        canvas.height = 400;
        const ctx = canvas.getContext("2d");
        const imageData = ctx.createImageData(canvas.width, canvas.height);
        for (let i = 0; i < imageData.data.length; i += 4) {
            const value = Math.random() > 0.5 ? 255 : 0;
            imageData.data[i] = value;
            imageData.data[i + 1] = value;
            imageData.data[i + 2] = value;
            imageData.data[i + 3] = Math.random() * 28;
        }
        ctx.putImageData(imageData, 0, 0);
        if (ref.current) {
            ref.current.style.backgroundImage = `url(${canvas.toDataURL()})`;
            ref.current.style.opacity = opacity;
        }
    }, [opacity]);
    return ref;
}

/* ── Feature cards data ── */
const CARDS = [
    {
        emoji: "⚡",
        title: "Pedidos al instante",
        desc: "Envía a cocina en segundos",
        rotate: "-1deg",
        accent: "rgba(255, 160, 40, 0.18)",
        accentBorder: "rgba(255, 160, 40, 0.30)",
        emojiRotate: "-18deg",
        emojiScale: "1.45",
    },
    {
        emoji: "📦",
        title: "Inventario en vivo",
        desc: "Stock actualizado con cada venta",
        rotate: "-2deg",
        accent: "rgba(140, 145, 108, 0.20)",
        accentBorder: "rgba(200, 212, 176, 0.28)",
        emojiRotate: "12deg",
        emojiScale: "1.55",
    },
    {
        emoji: "💰",
        title: "Reportes del día",
        desc: "Cierre de caja al instante",
        rotate: "2deg",
        accent: "rgba(80, 200, 120, 0.14)",
        accentBorder: "rgba(80, 200, 120, 0.25)",
        emojiRotate: "22deg",
        emojiScale: "1.50",
    },
];

/* ── Shared input field ── */
function InputField({ type = "text", placeholder, icon: Icon, rightSlot, value, onChange, error, }) {
    return (
        <div>
            <div className="relative flex items-center">
                <span className="absolute left-4 text-[#55624a]/50 pointer-events-none">
                    <Icon size={17} />
                </span>

                <input type={type} value={value} onChange={onChange} placeholder={placeholder} className={`  w-full h-12 md:h-14 rounded-2xl border bg-zinc-100  pl-11 pr-12 text-[15px] text-[#003a30]  outline-none transition-all placeholder:text-[#55624a]/45     focus:shadow-[0_0_0_4px_rgba(85,98,74,0.08)]   ${error ? "border-red-500 focus:border-red-500 focus:shadow-[0_0_0_4px_rgba(239,68,68,0.12)]" : "border-[#8c916c]/20 focus:border-[#55624a]"}  `} />

                {rightSlot && (
                    <span className="absolute right-4">
                        {rightSlot}
                    </span>
                )}
            </div>

            {error && (
                <p className="mt-1 text-[13px] text-red-500 pl-1">
                    {error}
                </p>
            )}
        </div>
    );
}

/* ── Login form ── */
function LoginForm() {
    const [showPass, setShowPass] = useState(false);
    const { login } = useAuthStore();
    const navigate = useNavigate();
    const [form, setForm] = useState({ username: "", password: "" });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    const handleChange = (field, value) => {
        setForm((prev) => ({
            ...prev,
            [field]: value,
        }));

        setErrors((prev) => ({
            ...prev,
            [field]: "",
        }));
    };

    const validate = () => {
        const newErrors = {};

        if (!form.username.trim()) {
            newErrors.username = "El usaurio es obligatorio";
        } else if (form.username.length < 5) {
            newErrors.username = "Mínimo 5 caracteres";
        }

        if (!form.password.trim()) {
            newErrors.password = "La contraseña es obligatoria";
        } else if (form.password.length < 4) {
            newErrors.password = "Mínimo 4 caracteres";
        }

        return newErrors;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const validationErrors = validate();

        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            toast.error(errors?.message || "Credenciales incorrectas");
            return;
        }

        try {
            console.log("FORM ENVIADO =>", form);
            const res = await api.post("/auth/login", form);
            login(res.data);
            toast.success(`Bienvenido, ${res.data.user.name}`);
            navigate("/");
        } catch (err) {
            toast.error(err?.message || "Credenciales incorrectas");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="w-full">
            <div className="mb-5 md:mb-10">
                <h2 className="text-2xl md:text-3xl uppercase font-extrabold tracking-tight text-[#003a30] leading-none" style={{ fontFamily: "'Syne', sans-serif" }}   >
                    Iniciar sesión
                </h2>

                <p className="mt-2 text-sm text-[#55624a]/70">
                    Ingresa tus credenciales para continuar
                </p>
            </div>

            <div className="flex flex-col gap-3 md:gap-4">

                <InputField type="text" placeholder="Correo electrónico" icon={User} value={form.username} onChange={(e) => handleChange("username", e.target.value)} error={errors.username} />

                <InputField type={showPass ? "text" : "password"} placeholder="Contraseña" icon={Lock} value={form.password} onChange={(e) => handleChange("password", e.target.value)} error={errors.password} rightSlot={
                    <button type="button" onClick={() => setShowPass((v) => !v)} className="text-[#55624a]/50 hover:text-[#003a30] transition-colors"  >
                        {showPass ? (
                            <EyeOff size={17} />
                        ) : (
                            <Eye size={17} />
                        )}
                    </button>
                }
                />

                <div className="flex justify-end">
                    <button type="button" className="text-sm text-[#55624a] hover:text-[#003a30] transition-colors"   >
                        Recuperar acceso
                    </button>
                </div>

                <button type="submit" className="h-12 md:h-14 rounded-2xl bg-[#003a30] text-white font-medium tracking-wide transition-all hover:bg-[#00271f] hover:shadow-xl active:scale-[0.98]" >
                    Ingresar al sistema
                </button>
            </div>
        </form>
    );
}

/* ── Feature Card ── */
function FeatureCard({ emoji, title, desc, rotate, accent, accentBorder, emojiRotate, emojiScale }) {
    return (
        <div className="relative overflow-hidden rounded-[18px] px-5 py-4 w-full" style={{ background: `linear-gradient(135deg, rgba(255,255,255,0.13) 0%, ${accent} 100%)`, backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)", border: `1px solid ${accentBorder}`, boxShadow: "0 12px 36px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.18)", transform: `rotate(${rotate})`, transition: "transform 0.25s ease, box-shadow 0.25s ease", minHeight: "82px", }} onMouseEnter={(e) => { e.currentTarget.style.transform = `rotate(${rotate}) scale(1.04)`; e.currentTarget.style.boxShadow = "0 20px 48px rgba(0,0,0,0.38), inset 0 1px 0 rgba(255,255,255,0.22)"; }} onMouseLeave={(e) => { e.currentTarget.style.transform = `rotate(${rotate}) scale(1)`; e.currentTarget.style.boxShadow = "0 12px 36px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.18)"; }}   >
            <div className="relative z-10">
                <p className="text-[13.5px] font-bold text-white/95 leading-tight uppercase" style={{ fontFamily: "'Syne', sans-serif", letterSpacing: "-0.01em" }}   >
                    {title}
                </p>
                <p className="text-[11px] text-white/45 mt-1 leading-snug">{desc}</p>
            </div>
            <div className="absolute pointer-events-none select-none" style={{ right: "-4px", bottom: "-6px", fontSize: "58px", lineHeight: 1, transform: `rotate(${emojiRotate}) scale(${emojiScale})`, filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.4))", opacity: 0.92, }}  >
                {emoji}
            </div>
        </div>
    );
}

export default function LoginPage() {
    const grainRef = useGrain(0.16);

    return (
        <>
            <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;500;700;800&display=swap" rel="stylesheet" />

            {/* ─── ROOT: usa 100dvh para descontar la barra de iOS Safari ─── */}
            <div className="w-screen overflow-hidden flex font-sans relative" style={{ height: "100dvh" }}    >
                {/* ══ DESKTOP ══ */}
                <div className="hidden md:flex w-[58%] h-full p-[14px_0_14px_14px] shrink-0">
                    <div className="flex-1 relative">
                        <div className="absolute inset-0 rounded-[22px] overflow-hidden">
                            <div className="absolute inset-0 bg-[#001a12]" />
                            <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 100% 75% at 50% 108%, #55624a 0%, #1a3022 38%, transparent 65%), radial-gradient(ellipse 55% 45% at 50% 105%, #8c916c55 0%, transparent 55%)", }} />
                            <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 120% 55% at 50% 0%, rgba(0,0,0,.65) 0%, transparent 70%)", }} />
                            <div ref={grainRef} className="absolute inset-0 pointer-events-none mix-blend-screen" style={{ filter: "blur(0.15px)", backgroundSize: "200px 200px" }} />
                        </div>
                        <div className="relative z-10 flex flex-col justify-between h-full p-8">
                            <div>
                                <div className="flex items-center gap-2 mb-9">
                                    <img src="./Logo.png" className="w-20" alt="Logo" />
                                </div>
                                <h2 className="text-5xl uppercase font-extrabold tracking-tight text-[#f0ede6] leading-none" style={{ fontFamily: "'Syne', sans-serif" }}     >
                                    Bienvenido
                                    <br />
                                    <em className="text-[#8c916c] italic">de regreso.</em>
                                </h2>
                            </div>
                        </div>
                        <div className="absolute z-30" style={{ left: "30px", right: "-90px", bottom: "30px", height: "210px", pointerEvents: "none" }}   >
                            <div className="absolute" style={{ left: "35%", top: "0px", width: "300px" }}>
                                <FeatureCard {...CARDS[0]} />
                            </div>
                            <div className="absolute" style={{ right: "50%", bottom: "18px", width: "300px" }}>
                                <FeatureCard {...CARDS[1]} />
                            </div>
                            <div className="absolute" style={{ right: "4%", bottom: "0px", width: "300px" }}>
                                <FeatureCard {...CARDS[2]} />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="hidden md:flex flex-1 h-full p-[14px_14px_14px_0]">
                    <div className="flex-1 rounded-[22px] bg-white flex items-center justify-center px-9 py-8">
                        <LoginForm />
                    </div>
                </div>

                {/* ══ MOBILE ══
                    Clave: posición fixed + 100dvh evita el scroll de iOS Safari
                    El top section y el sheet usan dvh exactos que suman 100
                ══ */}
                <div className="flex md:hidden flex-col" style={{ position: "fixed", inset: 0, height: "100dvh", width: "100vw", overflow: "hidden", }}   >
                    {/* Fondos */}
                    <div className="absolute inset-0 bg-[#001a12]" />
                    <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 130% 60% at 50% 110%, #55624a 0%, #1a3022 40%, transparent 65%), radial-gradient(ellipse 70% 40% at 50% 108%, #8c916c44 0%, transparent 55%)", }} />
                    <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 140% 50% at 50% 0%, rgba(0,0,0,.6) 0%, transparent 65%)", }} />

                    {/* Top: logo + título — 30% del viewport visible */}
                    <div className="relative z-10 flex flex-col items-center justify-center px-5 shrink-0" style={{ height: "30dvh" }}  >
                        <img src="./Logo.png" className="w-12 mb-3" alt="Logo" />
                        <h2 className="text-2xl uppercase font-extrabold tracking-tight text-[#f0ede6] leading-none text-center" style={{ fontFamily: "'Syne', sans-serif" }}  >
                            Bienvenido
                            <br />
                            <em className="text-[#8c916c] italic">de regreso.</em>
                        </h2>
                    </div>

                    {/* Sheet blanco — 70% restante, SIN overflow */}
                    <div className="relative z-20 bg-white rounded-t-[24px] flex flex-col" style={{ height: "70dvh", overflow: "hidden" }}>
                        {/* Pill centrada */}
                        <div className="w-9 h-1 rounded-full bg-[#e0dbd0] mx-auto mt-3 mb-1 shrink-0" />

                        {/* Form centrado verticalmente — ocupa todo el espacio restante */}
                        <div className="flex-1 flex flex-col justify-center px-6" style={{ minHeight: 0 }} >
                            <LoginForm />
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}