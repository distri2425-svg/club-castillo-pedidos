import React, { useState, useEffect } from 'react';
import { QrCode, Clock, ChefHat, Star, Shield, Smartphone } from 'lucide-react';
import { useNavigate } from 'react-router-dom'; // Asegúrate de tener esto si usas react-router

const features = [
    {
        icon: QrCode,
        title: 'Pedidos con QR en tu mesa',
        description: 'Escanea el código QR de tu mesa y realiza tu pedido digitalmente.'
    },
    {
        icon: Clock,
        title: 'Seguimiento en Tiempo Real',
        description: 'Sigue el estado de tu pedido desde la cocina hasta tu mesa, sin perder detalle.'
    },
    {
        icon: ChefHat,
        title: 'Todos los Restaurantes del Club',
        description: 'Explora y pide en cualquiera de los restaurantes del club desde una sola app.'
    },
    {
        icon: Star,
        title: 'Atención Premium',
        description: 'Calidad, tradición y excelencia a solo un clic.'
    },
    {
        icon: Shield,
        title: 'Seguro y Privado',
        description: 'Tus datos y pedidos están protegidos bajo los más altos estándares.'
    },
    {
        icon: Smartphone,
        title: 'Fácil e intuitivo',
        description: 'Diseñado para que cualquier socio o invitado pueda pedir sin complicaciones.'
    }
];

// Componente de partículas flotantes
const FloatingParticles = () => {
    const particles = Array.from({ length: 15 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 4 + 2,
        duration: Math.random() * 20 + 15,
        delay: Math.random() * 5
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
                    25% { transform: translateY(-20px) translateX(10px); }
                    50% { transform: translateY(-10px) translateX(-10px); }
                    75% { transform: translateY(-30px) translateX(5px); }
                }
            `}</style>
        </div>
    );
};

const AnimatedText = ({ text, className }) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setIsVisible(true), 500);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className={`${className} transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            {text.split('').map((char, index) => (
                <span
                    key={index}
                    className="inline-block"
                    style={{
                        animation: `letterGlow 3s ease-in-out infinite ${index * 0.1}s`
                    }}
                >
                    {char === ' ' ? '\u00A0' : char}
                </span>
            ))}
        </div>
    );
};

const AnimatedCounter = ({ target, suffix = '', duration = 2000 }) => {
    const [count, setCount] = useState(0);

    useEffect(() => {
        let start = 0;
        const increment = target / (duration / 16);
        const timer = setInterval(() => {
            start += increment;
            if (start >= target) {
                setCount(target);
                clearInterval(timer);
            } else {
                setCount(Math.floor(start));
            }
        }, 16);

        return () => clearInterval(timer);
    }, [target, duration]);

    return <span>{count}{suffix}</span>;
};

const Button = ({ onClick, variant = 'primary', size = 'md', className = '', children, style = {}, onMouseEnter, onMouseLeave }) => {
    const baseClasses = 'font-semibold rounded-lg transition-all duration-300 focus:outline-none';
    const variants = {
        primary: 'bg-[#f89b01] text-[#181818]',
        secondary: 'bg-[#181818] text-[#f89b01]',
        outline: 'border-2 bg-transparent'
    };
    const sizes = {
        sm: 'px-4 py-2 text-sm',
        md: 'px-6 py-3 text-base',
        lg: 'px-8 py-4 text-lg'
    };

    return (
        <button
            onClick={onClick}
            className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
            style={style}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
        >
            {children}
        </button>
    );
};

const LandingPage: React.FC = () => {
    const [currentFeature, setCurrentFeature] = useState(0);
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const navigate = useNavigate();

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentFeature((prev) => (prev + 1) % features.length);
        }, 4000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const handleMouseMove = (e) => {
            setMousePosition({
                x: (e.clientX / window.innerWidth) * 100,
                y: (e.clientY / window.innerHeight) * 100
            });
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    return (
        <>
            <style>{`
                @keyframes letterGlow {
                    0%, 100% { text-shadow: 0 0 5px #f89b01aa; }
                    50% { text-shadow: 0 0 20px #f89b01cc, 0 0 30px #f89b01aa; }
                }
                @keyframes pulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.05); }
                }
                @keyframes slideInFromLeft {
                    0% { transform: translateX(-100px); opacity: 0; }
                    100% { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideInFromRight {
                    0% { transform: translateX(100px); opacity: 0; }
                    100% { transform: translateX(0); opacity: 1; }
                }
                @keyframes bounceIn {
                    0% { transform: scale(0); opacity: 0; }
                    50% { transform: scale(1.1); }
                    100% { transform: scale(1); opacity: 1; }
                }
                @keyframes rotateGlow {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                .animate-slide-left { animation: slideInFromLeft 1s ease-out; }
                .animate-slide-right { animation: slideInFromRight 1s ease-out; }
                .animate-bounce-in { animation: bounceIn 1s ease-out; }
                .animate-pulse { animation: pulse 2s ease-in-out infinite; }
                .animate-rotate-glow { animation: rotateGlow 10s linear infinite; }
            `}</style>

            {/* Hero Section */}
            <div className="relative bg-gradient-to-br from-[#181818] via-[#232323] to-black pb-4 min-h-screen flex items-center">
                <FloatingParticles />
                <div
                    className="absolute inset-0 opacity-10"
                    style={{
                        background: `radial-gradient(circle at ${mousePosition.x}% ${mousePosition.y}%, #f89b01 0%, transparent 50%)`,
                        transition: 'background 0.3s ease'
                    }}
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-[#181818]/80 pointer-events-none" />

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 z-10">
                    <div className="text-center">
                        {/* Escudo grande con animación de rotación */}
                        <div className="flex justify-center mb-6 animate-bounce-in">
                            <div className="relative">
                                <div className="absolute inset-0 bg-[#f89b01] rounded-full opacity-20 animate-pulse"
                                     style={{ width: '220px', height: '220px', left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }} />
                                <img
                                    src="/escudo-castillo.png"
                                    alt="Castillo de Amaguaña"
                                    className="h-[12.5rem] w-auto drop-shadow-2xl relative z-10 hover:scale-110 transition-transform duration-500"
                                    style={{ filter: "drop-shadow(0 4px 24px #000a)" }}
                                />
                            </div>
                        </div>
                        {/* Título principal animado */}
                        <AnimatedText
                            text="Sistema de Pedidos Digitales"
                            className="text-4xl md:text-5xl font-extrabold mb-2 leading-tight drop-shadow-lg"
                            style={{ color: "#f89b01" }}
                        />
                        <br/>
                        {/* Descripción con efecto de escritura */}
                        <div className="animate-slide-left">
                            <p className="text-lg text-gray-300 mb-6 max-w-2xl mx-auto leading-relaxed drop-shadow">
                                Pide fácil, rápido y seguro en todos los restaurantes del club.
                            </p>
                            <p className="text-lg text-gray-300 mb-10 max-w-2xl mx-auto leading-relaxed drop-shadow animate-slide-right" style={{ animationDelay: '0.5s' }}>
                                ¡Escanea, elige tu plato favorito, sigue tu pedido en tiempo real y vive la mejor experiencia gastronómica!
                            </p>
                        </div>
                        {/* Botones con efectos mejorados */}
                        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-slide-left" style={{ animationDelay: '1.6s' }}>
                            <Button
                                onClick={() => navigate('/login')}
                                variant="primary"
                                size="lg"
                                className="group relative overflow-hidden px-8 py-4 text-lg font-bold border-none transition-all duration-500 hover:-translate-y-1 hover:scale-105"
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.boxShadow = '0 0 30px 8px #f89b01aa';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.boxShadow = 'none';
                                }}
                            >
                                <span className="relative z-10">Iniciar Sesión</span>
                                <div className="absolute inset-0 bg-gradient-to-r from-[#ffb933] to-[#f89b01] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
                            </Button>
                            <Button
                                onClick={() => navigate('/login')}
                                variant="outline"
                                size="lg"
                                className="group relative overflow-hidden px-8 py-4 text-lg !border-[#c7c7c7] !text-[#c7c7c7] bg-transparent font-semibold transition-all duration-500 hover:-translate-y-1 hover:scale-105 hover:!text-white"
                                style={{ borderWidth: 2, fontSize: 16, fontWeight: 600, background: "transparent" }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.boxShadow = '0 0 30px 8px #e3e3e3aa';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.boxShadow = 'none';
                                }}
                            >
                                <span className="relative z-10">Explorar como Invitado</span>
                                <div className="absolute inset-0 bg-gradient-to-r from-[#e3e3e3] to-white transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left opacity-10" />
                            </Button>
                        </div>
                        {/* Estrellas doradas animadas */}
                        <div className="flex justify-center mt-10 animate-bounce-in" style={{ animationDelay: '2s' }}>
                            {Array.from({ length: 5 }).map((_, idx) => (
                                <Star
                                    key={idx}
                                    className="h-8 w-8 text-[#f89b01] drop-shadow hover:scale-125 transition-transform duration-300"
                                    fill="#f89b01"
                                    style={{
                                        animation: `pulse 2s ease-in-out infinite ${idx * 0.2}s`
                                    }}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Features Section Mejorada */}
            <div className="py-20 bg-[#232323] relative overflow-hidden">
                <div className="absolute inset-0 opacity-5">
                    <div className="grid grid-cols-8 gap-4 h-full">
                        {Array.from({ length: 64 }).map((_, i) => (
                            <div
                                key={i}
                                className="bg-[#f89b01] rounded-full"
                                style={{
                                    animation: `pulse ${2 + (i % 3)}s ease-in-out infinite ${i * 0.1}s`
                                }}
                            />
                        ))}
                    </div>
                </div>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold mb-4" style={{ color: "#f89b01" }}>
                            ¿Por qué usar nuestro sistema digital de pedidos?
                        </h2>
                        <p className="text-xl text-gray-300 max-w-2xl mx-auto">
                            Elige, ordena y relájate: nosotros nos encargamos del resto.
                        </p>
                    </div>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {features.map((feature, index) => (
                            <div
                                key={index}
                                className={`group relative bg-gradient-to-br from-[#1d1d1d] to-[#232323] p-8 rounded-2xl border border-[#f89b01]/40 transition-all duration-500 hover:-translate-y-4 hover:shadow-2xl ${
                                    index === currentFeature ? 'scale-105 shadow-[0_0_30px_5px_#f89b01aa]' : ''
                                }`}
                                style={{
                                    animation: `slideInFromLeft 0.8s ease-out ${index * 0.2}s both`
                                }}
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-[#f89b01]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl" />
                                <div className="relative z-10">
                                    <div className="bg-gradient-to-r from-[#f89b01] to-[#ffb933] w-14 h-14 rounded-xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300">
                                        <feature.icon className="h-7 w-7 text-black" />
                                    </div>
                                    <h3 className="text-xl font-bold mb-4 group-hover:text-white transition-colors duration-300" style={{ color: "#f89b01" }}>
                                        {feature.title}
                                    </h3>
                                    <p className="text-gray-300 leading-relaxed group-hover:text-gray-100 transition-colors duration-300">
                                        {feature.description}
                                    </p>
                                </div>
                                {index === currentFeature && (
                                    <div className="absolute -top-2 -right-2 w-4 h-4 bg-[#f89b01] rounded-full animate-pulse shadow-lg" />
                                )}
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-center mt-12 space-x-2">
                        {features.map((_, index) => (
                            <div
                                key={index}
                                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                                    index === currentFeature ? 'bg-[#f89b01] w-8' : 'bg-gray-600'
                                }`}
                            />
                        ))}
                    </div>
                </div>
            </div>

            {/* CTA Section Mejorada */}
            <div className="relative bg-gradient-to-r from-[#f89b01] to-[#181818] py-20 overflow-hidden">
                <div className="absolute inset-0">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div
                            key={i}
                            className="absolute w-32 h-32 border border-white/20 rounded-full"
                            style={{
                                left: `${20 + i * 15}%`,
                                top: `${10 + (i % 2) * 60}%`,
                                animation: `rotateGlow ${15 + i * 2}s linear infinite`
                            }}
                        />
                    ))}
                </div>
                <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8 relative z-10">
                    <h2 className="text-4xl font-bold text-white mb-6 animate-slide-left">
                        ¡Comienza tu pedido ahora!
                    </h2>
                    <p className="text-xl mb-10 leading-relaxed animate-slide-right" style={{ color: "#ffe2b8", animationDelay: '0.3s' }}>
                        Disfruta la comodidad de pedir desde tu mesa, con la calidad y el ambiente del Castillo de Amaguaña.
                    </p>
                    <div className="animate-bounce-in" style={{ animationDelay: '0.6s' }}>
                        <Button
                            onClick={() => navigate('/login')}
                            variant="secondary"
                            size="lg"
                            className="group relative overflow-hidden px-10 py-4 text-lg font-bold rounded-lg border-none bg-[#181818] text-[#f89b01] transition-all duration-500 hover:scale-110 hover:-translate-y-2"
                            onMouseEnter={(e) => {
                                e.currentTarget.style.boxShadow = '0 0 40px 8px #f89b01cc';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.boxShadow = 'none';
                            }}
                        >
                            <span className="relative z-10">Comenzar Ahora</span>
                            <div className="absolute inset-0 bg-gradient-to-r from-[#2e2e2e] to-[#181818] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-center" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Footer Mejorado */}
            <footer className="bg-[#181818] text-white py-12 relative overflow-hidden">
                <div className="absolute inset-0 opacity-5">
                    <div className="grid grid-cols-12 gap-2 h-full">
                        {Array.from({ length: 144 }).map((_, i) => (
                            <div
                                key={i}
                                className="bg-[#f89b01] rounded-sm"
                                style={{
                                    animation: `pulse ${3 + (i % 4)}s ease-in-out infinite ${i * 0.05}s`
                                }}
                            />
                        ))}
                    </div>
                </div>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
                    <div className="flex justify-center items-center mb-6 animate-bounce-in">
                        <div className="relative">
                            <div className="absolute inset-0 bg-[#f89b01] rounded-full opacity-20 animate-pulse"
                                 style={{ width: '100px', height: '100px', left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }} />
                            <img
                                src="/icono-castillo.png"
                                alt="Castillo de Amaguaña"
                                className="h-20 w-auto drop-shadow-2xl relative z-10 hover:scale-110 transition-transform duration-500"
                                style={{ filter: "drop-shadow(0 2px 12px #0007)" }}
                            />
                        </div>
                    </div>
                    <p className="text-sm text-gray-400 mb-2">
                        Copyright © 2025 Club Castillo de Amaguaña
                    </p>
                    <p className="text-sm text-gray-400">
                        Todos los Derechos Reservados
                        <span className="mx-2">-</span>
                        Diseñado por:{' '}
                        <a
                            href="https://linkedin.com/company/kodexaec"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#f89b01] hover:underline hover:text-[#ffb933] transition-all duration-300 hover:shadow-[0_2px_10px_#f89b01aa]"
                        >
                            Kodexa
                        </a>
                    </p>
                </div>
            </footer>
        </>
    );
};

export default LandingPage;
