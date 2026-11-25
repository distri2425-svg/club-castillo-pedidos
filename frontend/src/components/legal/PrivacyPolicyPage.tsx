import React from 'react';
import { Shield, Mail, User, Database, Trash2, Download, FileText, Lock } from 'lucide-react';

/**
 * Página de Política de Privacidad — LOPDP Ecuador
 * Artículo 9: Información obligatoria que debe tener el responsable del tratamiento.
 */
const PrivacyPolicyPage: React.FC = () => {
    const sections = [
        {
            icon: <User className="h-6 w-6" />,
            title: '1. Responsable del Tratamiento',
            content: (
                <div className="space-y-2 text-gray-300">
                    <p><strong className="text-white">Club Castillo de Amaguaña</strong></p>
                    <p>Amaguaña, Quito, Ecuador</p>
                    <p>Correo de contacto: <a href="mailto:privacidad@clubcastillo.com" className="text-[#f89b01] underline">privacidad@clubcastillo.com</a></p>
                </div>
            ),
        },
        {
            icon: <Database className="h-6 w-6" />,
            title: '2. Datos que Recopilamos (Art. 10 LOPDP — Principios)',
            content: (
                <div className="space-y-3 text-gray-300">
                    <p>Recopilamos únicamente los datos necesarios para el correcto funcionamiento del sistema de pedidos digitales:</p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                        <li><strong className="text-white">Nombre y apellido</strong>: para personalizar tu experiencia y asociar pedidos.</li>
                        <li><strong className="text-white">Correo electrónico</strong>: para autenticación e identificación dentro del sistema.</li>
                        <li><strong className="text-white">Contraseña</strong>: almacenada de forma cifrada (BCrypt). Nunca se guarda en texto plano.</li>
                        <li><strong className="text-white">Imagen de perfil</strong>: opcional, para personalizar tu cuenta.</li>
                        <li><strong className="text-white">Historial de pedidos</strong>: para el seguimiento de tus órdenes activas e históricas.</li>
                    </ul>
                    <p className="text-sm italic text-gray-400 mt-2">
                        No recopilamos datos sensibles como datos de salud, cédula de identidad, ni información bancaria.
                    </p>
                </div>
            ),
        },
        {
            icon: <FileText className="h-6 w-6" />,
            title: '3. Finalidad del Tratamiento',
            content: (
                <p className="text-gray-300">
                    Tus datos son utilizados <strong className="text-white">exclusivamente</strong> para:
                    <ul className="list-disc list-inside space-y-1 ml-2 mt-2">
                        <li>Autenticarte e identificarte en el sistema de pedidos del club.</li>
                        <li>Gestionar y realizar el seguimiento de tus pedidos en los restaurantes del club.</li>
                        <li>Administración interna del personal del club (roles OWNER y RESTAURANT_ADMIN).</li>
                    </ul>
                    <span className="block mt-2 text-sm italic text-gray-400">
                        Tus datos NO serán vendidos, cedidos ni utilizados para publicidad de terceros.
                    </span>
                </p>
            ),
        },
        {
            icon: <Lock className="h-6 w-6" />,
            title: '4. Plazo de Conservación',
            content: (
                <p className="text-gray-300">
                    Tus datos personales se conservarán mientras tu cuenta esté activa en el sistema.
                    El historial de pedidos se conserva por motivos de auditoría contable por un período de
                    <strong className="text-white"> 7 años</strong>, conforme a la legislación tributaria ecuatoriana.
                    Una vez ejercido el derecho de supresión, los datos personales serán anonimizados de forma inmediata
                    y el historial de pedidos quedará desvinculado de tu identidad.
                </p>
            ),
        },
        {
            icon: <Shield className="h-6 w-6" />,
            title: '5. Tus Derechos (Arts. 13–17 LOPDP)',
            content: (
                <div className="space-y-3 text-gray-300">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div className="bg-[#252525] rounded-xl p-4 border border-[#f89b01]/20">
                            <div className="flex items-center gap-2 mb-1 text-[#f89b01] font-semibold">
                                <User className="h-4 w-4" /> Derecho de Acceso (Art. 13)
                            </div>
                            <p className="text-sm">Puedes consultar todos tus datos en <strong>Mi Perfil</strong>.</p>
                            <p className="text-xs text-gray-500 mt-1">API: <code className="text-[#f89b01]">GET /api/users/me</code></p>
                        </div>
                        <div className="bg-[#252525] rounded-xl p-4 border border-[#f89b01]/20">
                            <div className="flex items-center gap-2 mb-1 text-[#f89b01] font-semibold">
                                <FileText className="h-4 w-4" /> Derecho de Rectificación (Art. 14)
                            </div>
                            <p className="text-sm">Puedes actualizar tu nombre, apellido e imagen en <strong>Mi Perfil</strong>.</p>
                            <p className="text-xs text-gray-500 mt-1">API: <code className="text-[#f89b01]">PUT /api/users/me</code></p>
                        </div>
                        <div className="bg-[#252525] rounded-xl p-4 border border-[#f89b01]/20">
                            <div className="flex items-center gap-2 mb-1 text-red-400 font-semibold">
                                <Trash2 className="h-4 w-4" /> Derecho de Supresión (Art. 15)
                            </div>
                            <p className="text-sm">Puedes solicitar la eliminación total de tus datos personales.</p>
                            <p className="text-xs text-gray-500 mt-1">Escríbenos a: <a href="mailto:privacidad@clubcastillo.com" className="text-[#f89b01] underline">privacidad@clubcastillo.com</a></p>
                            <p className="text-xs text-gray-500 mt-1">API: <code className="text-[#f89b01]">DELETE /api/users/me</code></p>
                        </div>
                        <div className="bg-[#252525] rounded-xl p-4 border border-[#f89b01]/20">
                            <div className="flex items-center gap-2 mb-1 text-green-400 font-semibold">
                                <Download className="h-4 w-4" /> Derecho de Portabilidad (Art. 17)
                            </div>
                            <p className="text-sm">Puedes descargar todos tus datos en formato JSON.</p>
                            <p className="text-xs text-gray-500 mt-1">API: <code className="text-[#f89b01]">GET /api/users/me/export</code></p>
                        </div>
                    </div>
                </div>
            ),
        },
        {
            icon: <Lock className="h-6 w-6" />,
            title: '6. Seguridad de los Datos (Art. 37 LOPDP)',
            content: (
                <ul className="list-disc list-inside space-y-1 text-gray-300 ml-2">
                    <li>Las contraseñas se almacenan cifradas con <strong className="text-white">BCrypt</strong>.</li>
                    <li>La autenticación se realiza mediante tokens <strong className="text-white">JWT</strong> firmados.</li>
                    <li>La comunicación en producción se realiza sobre <strong className="text-white">HTTPS</strong>.</li>
                    <li>El acceso a la API está restringido a los orígenes autorizados del club.</li>
                </ul>
            ),
        },
        {
            icon: <Mail className="h-6 w-6" />,
            title: '7. Contacto y Reclamaciones',
            content: (
                <div className="text-gray-300 space-y-2">
                    <p>Para ejercer cualquiera de tus derechos o realizar una consulta sobre el tratamiento de tus datos, puedes contactarnos en:</p>
                    <a href="mailto:privacidad@clubcastillo.com" className="text-[#f89b01] underline font-semibold">
                        privacidad@clubcastillo.com
                    </a>
                    <p className="text-sm text-gray-400 mt-2">
                        Si consideras que tus derechos no han sido atendidos, puedes presentar una reclamación ante la
                        <strong className="text-white"> Superintendencia de Protección de Datos Personales del Ecuador</strong>,
                        autoridad de control competente conforme a la LOPDP.
                    </p>
                </div>
            ),
        },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#181818] via-[#232323] to-black py-12 px-4">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="text-center mb-10">
                    <div className="flex justify-center mb-4">
                        <div className="bg-[#f89b01]/10 border border-[#f89b01]/30 rounded-full p-4">
                            <Shield className="h-10 w-10 text-[#f89b01]" />
                        </div>
                    </div>
                    <h1 className="text-4xl font-extrabold text-[#f89b01] mb-2">Política de Privacidad</h1>
                    <p className="text-gray-400 max-w-xl mx-auto">
                        Club Castillo de Amaguaña — Sistema de Gestión de Pedidos Digitales
                    </p>
                    <div className="flex justify-center gap-3 mt-4 flex-wrap">
                        <span className="text-xs bg-[#f89b01]/10 border border-[#f89b01]/30 text-[#f89b01] rounded-full px-3 py-1">
                            LOPDP Ecuador — Ley Orgánica de Protección de Datos Personales
                        </span>
                        <span className="text-xs bg-white/5 border border-white/10 text-gray-400 rounded-full px-3 py-1">
                            Última actualización: {new Date().toLocaleDateString('es-EC', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </span>
                    </div>
                </div>

                {/* Sections */}
                <div className="space-y-6">
                    {sections.map((section, idx) => (
                        <div
                            key={idx}
                            className="bg-[#1e1e1e]/90 border border-[#f89b01]/20 rounded-2xl p-6 backdrop-blur-sm
                                       hover:border-[#f89b01]/40 transition-all duration-300"
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <div className="text-[#f89b01]">{section.icon}</div>
                                <h2 className="text-lg font-bold text-white">{section.title}</h2>
                            </div>
                            <div className="text-sm leading-relaxed">{section.content}</div>
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <p className="text-center text-xs text-gray-600 mt-10">
                    © {new Date().getFullYear()} Club Castillo de Amaguaña · Todos los derechos reservados ·{' '}
                    <a href="/login" className="text-[#f89b01] hover:underline">Volver al inicio</a>
                </p>
            </div>
        </div>
    );
};

export default PrivacyPolicyPage;
