import React, { useState, useEffect } from "react";
import { BarChart3, TrendingUp, PieChart, Activity, Settings } from "lucide-react";

const ReportesEnConstruccion: React.FC = () => {
    const [progress, setProgress] = useState(0);
    const [activeFeature, setActiveFeature] = useState(0);

    useEffect(() => {
        const timer = setTimeout(() => setProgress(75), 500);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            setActiveFeature(prev => (prev + 1) % 4);
        }, 2500); // Más suave el cambio
        return () => clearInterval(interval);
    }, []);

    const features = [
        { icon: BarChart3, title: "Análisis Avanzado", desc: "Gráficos interactivos" },
        { icon: TrendingUp, title: "Métricas en Tiempo Real", desc: "Datos actualizados" },
        { icon: PieChart, title: "Reportes Personalizados", desc: "Filtros inteligentes" },
        { icon: Activity, title: "Dashboard Intuitivo", desc: "Visualización clara" }
    ];

    return (
        <div className="w-full min-h-[70vh] bg-gray-50 flex flex-col items-center py-8 px-2 md:px-10">
            {/* Rueda dentada animada */}
            <div className="mb-8 flex flex-col items-center justify-center">
                <Settings className="h-20 w-20 text-[#f89b01] animate-spin-slow mb-2" />
            </div>
            {/* Título grande */}
            <h1 className="text-3xl md:text-5xl font-extrabold text-[#f89b01] mb-2 text-center">
                Módulo de Reportes
            </h1>
            <div className="text-lg md:text-2xl font-bold text-gray-700 mb-4 text-center">
                En Desarrollo
            </div>
            {/* Descripción grande */}
            <p className="text-gray-700 mb-8 max-w-3xl text-center mx-auto leading-relaxed text-base md:text-xl">
                El módulo de reportes estará disponible próximamente.
            </p>
            {/* Progreso */}
            <div className="w-full max-w-xl mx-auto mb-10">
                <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-gray-400">Progreso de desarrollo</span>
                    <span className="text-sm font-bold text-[#f89b01]">{progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                        className="bg-gradient-to-r from-[#f89b01] to-[#ffb933] h-3 rounded-full transition-all duration-1000"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>
            {/* Features: solo uno visible en mobile */}
            <div className="w-full max-w-3xl mx-auto mb-2">
                {/* Mobile: solo un feature */}
                <div className="block md:hidden">
                    <div className="flex justify-center mb-3">
                        {/* Indicadores tipo slider */}
                        {features.map((_, idx) => (
                            <span
                                key={idx}
                                className={`h-2 w-2 mx-1 rounded-full transition-all duration-300
                                    ${activeFeature === idx ? 'bg-[#f89b01]' : 'bg-gray-300'}`}
                            />
                        ))}
                    </div>
                    <div className="flex flex-col items-center p-5 rounded-2xl border bg-[#fff7e6] border-[#f89b01]/60 shadow-md transition-all">
                        <div className="w-14 h-14 rounded-lg flex items-center justify-center mb-3 bg-gradient-to-br from-[#f89b01] to-[#ffb933] text-[#181818]">
                            {React.createElement(features[activeFeature].icon, { className: "w-8 h-8" })}
                        </div>
                        <h3 className="font-semibold text-gray-800 text-lg mb-1">{features[activeFeature].title}</h3>
                        <p className="text-base text-gray-600">{features[activeFeature].desc}</p>
                    </div>
                </div>
                {/* Desktop: todos los features */}
                <div className="hidden md:grid grid-cols-4 gap-8">
                    {features.map((feature, index) => {
                        const Icon = feature.icon;
                        const isActive = activeFeature === index;
                        return (
                            <div
                                key={index}
                                className={`p-7 rounded-2xl border text-center flex flex-col items-center transition-all duration-500
                                    ${isActive ? 'bg-[#fff7e6] border-[#f89b01]/60 shadow-md' : 'bg-gray-50 border-gray-200'}
                                `}
                            >
                                <div className={`w-16 h-16 rounded-lg flex items-center justify-center mb-3 transition-all
                                    ${isActive ? 'bg-gradient-to-br from-[#f89b01] to-[#ffb933] text-[#181818]' : 'bg-gray-200 text-gray-400'}
                                `}>
                                    <Icon className="w-8 h-8" />
                                </div>
                                <h3 className="font-semibold text-gray-800 text-lg mb-1">{feature.title}</h3>
                                <p className="text-base text-gray-600">{feature.desc}</p>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default ReportesEnConstruccion;
