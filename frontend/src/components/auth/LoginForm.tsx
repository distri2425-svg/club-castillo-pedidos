import React, { useState, useEffect } from 'react';
import { Mail, Lock, Users, Eye, EyeOff, Shield, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { authService } from '../../services/auth';
import { motion } from 'framer-motion';

// Partículas flotantes animadas
const FloatingParticles = () => {
    const particles = Array.from({ length: 12 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 3 + 1.5,
        duration: Math.random() * 15 + 10,
        delay: Math.random() * 3
    }));

    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {particles.map((particle) => (
                <div
                    key={particle.id}
                    className="absolute rounded-full bg-[#f89b01] opacity-20"
                    style={{
                        left: `${particle.x}%`,
                        top: `${particle.y}%`,
                        width: `${particle.size}px`,
                        height: `${particle.size}px`,
                        animation: `float ${particle.duration}s ease-in-out infinite ${particle.delay}s`
                    }}
                />
            ))}
            <style>{`
                @keyframes float {
                    0%, 100% { transform: translateY(0px) translateX(0px); }
                    25% { transform: translateY(-15px) translateX(8px); }
                    50% { transform: translateY(-8px) translateX(-8px); }
                    75% { transform: translateY(-20px) translateX(4px); }
                }
            `}</style>
        </div>
    );
};

// Input animado reutilizable
interface AnimatedInputProps {
    type: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    placeholder: string;
    icon: React.ElementType;
    label: string;
    showPasswordToggle?: boolean;
    showPassword?: boolean;
    onTogglePassword?: () => void;
    required?: boolean;
}

const AnimatedInput = ({
                           type,
                           value,
                           onChange,
                           placeholder,
                           icon: Icon,
                           label,
                           showPasswordToggle = false,
                           showPassword = false,
                           onTogglePassword,
                           required = false
                       }: AnimatedInputProps) => {
    const [isFocused, setIsFocused] = useState(false);

    return (
        <div className="relative">
            <label className="block text-sm font-medium text-gray-300 mb-2 transition-all duration-300">
                {label}
            </label>
            <motion.div
                className="relative"
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
            >
                <Icon className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 transition-all duration-300 ${
                    isFocused ? 'text-[#f89b01] scale-110' : 'text-[#a67c00]'
                }`} />
                <input
                    type={showPasswordToggle ? (showPassword ? 'text' : 'password') : type}
                    value={value}
                    onChange={onChange}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    placeholder={placeholder}
                    required={required}
                    className={`
                        w-full pl-10 ${showPasswordToggle ? 'pr-12' : 'pr-4'} py-3 rounded-xl
                        bg-[#121212]/80 backdrop-blur-sm text-gray-200 placeholder-[#a67c00]
                        border-2 transition-all duration-300
                        focus:outline-none focus:ring-2 focus:ring-[#f89b01]/50
                        ${isFocused
                        ? 'border-[#f89b01] shadow-[0_0_20px_2px_#f89b0140]'
                        : 'border-[#a67c00]/50 hover:border-[#a67c00]'
                    }
                    `}
                />
                {showPasswordToggle && (
                    <button
                        type="button"
                        onClick={onTogglePassword}
                        className={`absolute right-3 top-1/2 transform -translate-y-1/2 transition-all duration-300 hover:scale-110 ${
                            isFocused ? 'text-[#f89b01]' : 'text-[#a67c00] hover:text-[#f89b01]'
                        }`}
                        tabIndex={-1}
                        aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                )}
            </motion.div>
        </div>
    );
};

// Botón animado y personalizable
interface AnimatedButtonProps {
    onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
    type?: 'button' | 'submit' | 'reset';
    variant?: 'primary' | 'outline';
    children: React.ReactNode;
    disabled?: boolean;
    className?: string;
    icon?: React.ElementType;
    [key: string]: unknown;
}

const AnimatedButton = ({
                            onClick,
                            type = 'button',
                            variant = 'primary',
                            children,
                            disabled = false,
                            className = '',
                            icon: Icon,
                            ...props
                        }: AnimatedButtonProps) => {
    const [isHovered, setIsHovered] = useState(false);

    const baseClasses = 'relative overflow-hidden font-bold rounded-xl transition-all duration-300 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2';

    const variants = {
        primary: `
            bg-gradient-to-r from-[#f89b01] to-[#ffb933] text-[#181818]
            hover:from-[#ffb933] hover:to-[#f89b01]
            shadow-[0_4px_20px_0px_#f89b0150]
            hover:shadow-[0_6px_30px_5px_#f89b0170]
            hover:-translate-y-1 hover:scale-105
        `,
        outline: `
            bg-transparent border-2 border-[#c7c7c7] text-[#c7c7c7]
            hover:border-white hover:text-white
            hover:shadow-[0_0_20px_2px_#ffffff40]
            hover:-translate-y-1 hover:scale-105
        `
    };

    return (
        <motion.button
            onClick={onClick}
            type={type}
            disabled={disabled}
            className={`${baseClasses} ${variants[variant]} ${className}`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            whileHover={{ scale: disabled ? 1 : 1.05 }}
            whileTap={{ scale: disabled ? 1 : 0.95 }}
            transition={{ duration: 0.2 }}
            {...props}
        >
            {variant === 'primary' && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 translate-x-[-100%] group-hover:translate-x-[200%] transition-transform duration-700" />
            )}
            <div className="relative z-10 flex items-center gap-2">
                {Icon && <Icon className="h-5 w-5" />}
                {children}
            </div>
            {isHovered && variant === 'primary' && (
                <div className="absolute inset-0">
                    <Sparkles className="absolute top-2 right-2 h-3 w-3 text-[#181818] animate-pulse" />
                    <Sparkles className="absolute bottom-2 left-2 h-2 w-2 text-[#181818] animate-pulse" style={{ animationDelay: '0.5s' }} />
                </div>
            )}
        </motion.button>
    );
};

const LoginForm: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    // LOPDP Art. 9: consentimiento explícito — inicia en false, el usuario debe marcarlo activamente
    const [consentAccepted, setConsentAccepted] = useState(false);

    const { refreshUser, loginAsGuest } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // Lee el parámetro restId (para flujo de pedidos con QR)
    const queryParams = new URLSearchParams(location.search);
    const restId = queryParams.get('restId');

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            setMousePosition({
                x: (e.clientX / window.innerWidth) * 100,
                y: (e.clientY / window.innerHeight) * 100
            });
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    // Login normal con rutas de acuerdo a rol y contexto
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const response = await authService.login(email, password, consentAccepted);
            const { token, user } = response;
            localStorage.setItem('token', token);
            await refreshUser();

            // Redirección según flujo de pedido o rol
            if (restId) {
                navigate(`/customer/restaurant/${restId}`);
            } else if (user.role === 'OWNER') {
                navigate('/owner/dashboard');
            } else if (user.role === 'RESTAURANT_ADMIN') {
                navigate('/admin/home');
            } else {
                navigate('/customer/restaurants');
            }
        } catch (err: any) {
            // Se distingue el rechazo de credenciales de un fallo de conexion
            // con el servidor: antes ambos casos mostraban el mismo mensaje y
            // no era posible saber cual de los dos ocurria.
            const status: number | undefined = err?.response?.status;
            if (status === 401 || status === 403) {
                setError('Credenciales inválidas');
            } else if (!err?.response) {
                setError('No se pudo conectar con el servidor. Verifica que el backend esté en ejecución.');
            } else {
                setError(`No se pudo iniciar sesión (error ${status}). Intenta nuevamente.`);
            }
            localStorage.removeItem('token');
        } finally {
            setLoading(false);
        }
    };

    // Login invitado (sin credenciales, también respeta restId)
    const handleGuestLogin = async () => {
        setLoading(true);
        setError('');
        try {
            await loginAsGuest(restId ?? undefined);
            if (restId) navigate(`/customer/restaurant/${restId}`);
            else navigate('/customer/restaurants');
        } catch (err) {
            setError('No se pudo iniciar como invitado');
            localStorage.removeItem('token');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <style>{`
                @keyframes shimmer {
                    0% { background-position: -1000px 0; }
                    100% { background-position: 1000px 0; }
                }
                @keyframes pulse-glow {
                    0%, 100% { box-shadow: 0 0 20px 2px #f89b0140; }
                    50% { box-shadow: 0 0 40px 8px #f89b0160; }
                }
                @keyframes rotate-border {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                .animate-shimmer {
                    background: linear-gradient(90deg, transparent, rgba(248, 155, 1, 0.4), transparent);
                    background-size: 1000px 100%;
                    animation: shimmer 2s infinite;
                }
                .animate-pulse-glow {
                    animation: pulse-glow 3s ease-in-out infinite;
                }
            `}</style>

            <div className="min-h-screen bg-gradient-to-br from-[#181818] via-[#232323] to-black flex items-center justify-center p-2 sm:p-4 relative overflow-hidden">
                <FloatingParticles />

                {/* Fondo interactivo con mouse */}
                <div
                    className="absolute inset-0 opacity-10"
                    style={{
                        background: `radial-gradient(circle at ${mousePosition.x}% ${mousePosition.y}%, #f89b01 0%, transparent 50%)`,
                        transition: 'background 0.3s ease'
                    }}
                />

                {/* Anillos decorativos */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div
                            key={i}
                            className="absolute border border-[#f89b01]/20 rounded-full"
                            style={{
                                width: `${300 + i * 100}px`,
                                height: `${300 + i * 100}px`,
                                left: '50%',
                                top: '50%',
                                transform: 'translate(-50%, -50%)',
                                animation: `rotate-border ${20 + i * 5}s linear infinite`
                            }}
                        />
                    ))}
                </div>

                <motion.div
                    initial={{
                        rotateY: 90,
                        opacity: 0,
                        scale: 0.8,
                        filter: 'blur(10px)'
                    }}
                    animate={{
                        rotateY: 0,
                        opacity: 1,
                        scale: 1,
                        filter: 'blur(0px)'
                    }}
                    transition={{
                        duration: 1,
                        ease: [0.4, 0, 0.2, 1]
                    }}
                    className="w-full max-w-md relative z-10"
                >
                    <div className="relative">
                        {/* Glow effect background */}
                        <div className="absolute -inset-1 bg-gradient-to-r from-[#f89b01] via-[#ffb933] to-[#f89b01] rounded-3xl opacity-20 blur animate-pulse-glow" />

                        {/* Card principal */}
                        <div className="relative bg-[#1e1e1e]/95 backdrop-blur-xl border border-[#f89b01]/50 rounded-3xl p-8 shadow-2xl">
                            {/* Header con logo animado */}
                            <motion.div
                                className="flex justify-center mb-8"
                                initial={{ scale: 0, rotate: -180 }}
                                animate={{ scale: 1, rotate: 0 }}
                                transition={{
                                    duration: 0.8,
                                    delay: 0.3,
                                    type: "spring",
                                    stiffness: 100
                                }}
                            >
                                <div className="relative">
                                    <div className="absolute inset-0 bg-[#f89b01] rounded-full opacity-20 animate-pulse"
                                         style={{ width: '100px', height: '100px', left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }} />
                                    <img
                                        src="/escudo-castillo.png"
                                        alt="Castillo de Amaguaña"
                                        className="h-20 w-auto drop-shadow-2xl relative z-10 hover:scale-110 transition-transform duration-500"
                                        style={{ filter: 'drop-shadow(0 4px 24px #000a)' }}
                                    />
                                </div>
                            </motion.div>

                            {/* Título animado */}
                            <motion.div
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: 0.5 }}
                                className="text-center mb-6"
                            >
                                <h1 className="text-4xl font-extrabold text-[#f89b01] mb-2">
                                    Iniciar Sesión
                                </h1>
                                <p className="text-gray-400">
                                    Bienvenido al sistema de pedidos digitales del club
                                </p>
                            </motion.div>

                            {/* Formulario de login */}
                            <motion.form
                                onSubmit={handleLogin}
                                className="space-y-6"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.6, delay: 0.7 }}
                            >
                                <AnimatedInput
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="tu@email.com"
                                    icon={Mail}
                                    label="Correo electrónico"
                                    required
                                />

                                <AnimatedInput
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    icon={Lock}
                                    label="Contraseña"
                                    showPasswordToggle
                                    showPassword={showPassword}
                                    onTogglePassword={() => setShowPassword(!showPassword)}
                                    required
                                />

                                {error && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="text-red-400 text-sm bg-red-500/10 border border-red-500/30 p-3 rounded-xl backdrop-blur-sm"
                                    >
                                        <Shield className="inline h-4 w-4 mr-2" />
                                        {error}
                                    </motion.div>
                                )}

                                {/* LOPDP Art. 9: Consentimiento explícito — OBLIGATORIO, no pre-marcado */}
                                <motion.div
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.4, delay: 0.9 }}
                                    className={`mt-2 p-4 rounded-2xl border transition-all duration-300 cursor-pointer select-none
                                        ${consentAccepted
                                            ? 'border-[#f89b01]/60 bg-[#f89b01]/10 shadow-[0_0_20px_0px_rgba(248,155,1,0.15)]'
                                            : 'border-white/10 bg-white/5 hover:border-[#f89b01]/30 hover:bg-[#f89b01]/5'
                                        }`}
                                    onClick={() => setConsentAccepted(!consentAccepted)}
                                >
                                    <div className="flex items-start gap-3">
                                        {/* Checkbox custom animado */}
                                        <div className={`relative flex-shrink-0 mt-0.5 w-5 h-5 rounded-md border-2 transition-all duration-300
                                            ${consentAccepted
                                                ? 'border-[#f89b01] bg-[#f89b01] shadow-[0_0_12px_0px_rgba(248,155,1,0.5)]'
                                                : 'border-white/30 bg-transparent'
                                            }`}
                                        >
                                            {/* Checkmark SVG animado */}
                                            <motion.svg
                                                viewBox="0 0 12 10"
                                                className="absolute inset-0 w-full h-full p-0.5"
                                                initial={false}
                                                animate={consentAccepted ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.5 }}
                                                transition={{ duration: 0.2, ease: 'backOut' }}
                                            >
                                                <motion.path
                                                    d="M1 5 L4.5 8.5 L11 1"
                                                    stroke="#181818"
                                                    strokeWidth="2"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    fill="none"
                                                    initial={{ pathLength: 0 }}
                                                    animate={consentAccepted ? { pathLength: 1 } : { pathLength: 0 }}
                                                    transition={{ duration: 0.25, ease: 'easeOut' }}
                                                />
                                            </motion.svg>
                                        </div>

                                        {/* Texto del consentimiento */}
                                        <label
                                            className="text-xs leading-relaxed cursor-pointer"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <span className={`transition-colors duration-300 ${consentAccepted ? 'text-gray-200' : 'text-gray-400'}`}>
                                                He leído y acepto la{' '}
                                            </span>
                                            <a
                                                href="/privacy-policy"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                onClick={(e) => e.stopPropagation()}
                                                className="text-[#f89b01] underline underline-offset-2 hover:text-[#ffb933] transition-colors font-semibold"
                                            >
                                                Política de Privacidad
                                            </a>
                                            <span className={`transition-colors duration-300 ${consentAccepted ? 'text-gray-200' : 'text-gray-400'}`}>
                                                {' '}y autorizo el tratamiento de mis datos personales conforme a la{' '}
                                                <span className="text-[#f89b01] font-semibold">LOPDP</span> del Ecuador.
                                            </span>
                                        </label>
                                    </div>

                                    {/* Barra de estado inferior */}
                                    <motion.div
                                        className="mt-3 h-0.5 rounded-full bg-gradient-to-r from-[#f89b01] to-[#ffb933]"
                                        initial={{ scaleX: 0, originX: 0 }}
                                        animate={consentAccepted ? { scaleX: 1 } : { scaleX: 0 }}
                                        transition={{ duration: 0.4, ease: 'easeOut' }}
                                    />
                                </motion.div>

                                {/* Botón de login principal */}
                                <AnimatedButton
                                    type="submit"
                                    variant="primary"
                                    disabled={loading || !consentAccepted}
                                    className="w-full py-4 text-lg font-bold"
                                >
                                    {loading ? (
                                        <div className="flex items-center gap-2">
                                            <div className="w-5 h-5 border-2 border-[#181818] border-t-transparent rounded-full animate-spin" />
                                            Iniciando sesión...
                                        </div>
                                    ) : (
                                        'Iniciar Sesión'
                                    )}
                                </AnimatedButton>
                            </motion.form>

                            {/* Separador animado */}
                            <motion.div
                                className="mt-6 text-center relative"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.5, delay: 1 }}
                            >
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-[#f89b01]/50" />
                                </div>
                                <div className="relative flex justify-center">
                                    <span className="text-sm text-[#f89b01] bg-[#1e1e1e] px-4 rounded-full border border-[#f89b01]/30">
                                        o
                                    </span>
                                </div>
                            </motion.div>

                            {/* Botón de invitado */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 1.2 }}
                            >
                                <AnimatedButton
                                    onClick={handleGuestLogin}
                                    variant="outline"
                                    icon={Users}
                                    className="w-full mt-4 py-4 text-lg font-semibold"
                                    disabled={loading}
                                >
                                    Entrar como Invitado
                                </AnimatedButton>
                            </motion.div>

                            {/* Footer — nota legal mínima */}
                            <motion.p
                                className="mt-6 text-xs text-[#a67c00] text-center italic"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.5, delay: 1.4 }}
                            >
                                Exclusivo para socios e invitados del Club Castillo de Amaguaña.
                            </motion.p>

                            {/* Efecto shimmer decorativo */}
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#f89b01] to-transparent animate-shimmer rounded-t-3xl" />
                        </div>
                    </div>
                </motion.div>
            </div>
        </>
    );
};

export default LoginForm;
