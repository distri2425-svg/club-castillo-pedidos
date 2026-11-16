import React, { useState, useEffect } from 'react';
import { QrCode, Download, Copy, Eye, RotateCw } from 'lucide-react';
import QRCodeLib from 'qrcode';
import Button from '../common/Button';
import toast, { Toaster } from 'react-hot-toast';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

const API_URL = "";

const QRCodeGenerator: React.FC = () => {
    const { user } = useAuth();
    const restaurantId = user?.restaurantId;
    const [restaurantName, setRestaurantName] = useState<string>('');
    const [qrCodeDataURL, setQRCodeDataURL] = useState<string>('');
    const [generated, setGenerated] = useState(false);
    const [loading, setLoading] = useState(false);
    const [qrCodeValue, setQrCodeValue] = useState<string>("");

    useEffect(() => {
        if (!restaurantId) return;

        const fetchRestaurant = async () => {
            try {
                const token = localStorage.getItem("token");
                const res = await axios.get(`${API_URL}/restaurants/${restaurantId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setRestaurantName(res.data.name || "");
            } catch {
                setRestaurantName("Restaurante");
            }
        };

        fetchRestaurant();
    }, [restaurantId]);

    const handleGenerateQR = async () => {
        if (!restaurantId) return;
        setLoading(true);
        setGenerated(false);

        try {
            const token = localStorage.getItem("token");
            const res = await axios.post(
                `${API_URL}/orders/generate-permanent-qr`,
                {},
                {
                    params: { restaurantId },
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            const code = res.data;
            setQrCodeValue(code);

            const qrUrl = `${window.location.origin}/customer/restaurant/${restaurantId}?qrCode=${code}`;
            const dataURL = await QRCodeLib.toDataURL(qrUrl, {
                width: 320,
                margin: 2,
                color: {
                    dark: '#1f2937',
                    light: '#ffffff'
                }
            });

            setQRCodeDataURL(dataURL);
            setGenerated(true);
            toast.success("QR generado correctamente");

        } catch (error) {
            toast.error("Error al generar el código QR");
            setQRCodeDataURL('');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const downloadQRCode = () => {
        if (qrCodeDataURL) {
            const link = document.createElement('a');
            link.download = `QR-${(restaurantName || "Restaurante").replace(/\s+/g, '-')}.png`;
            link.href = qrCodeDataURL;
            link.click();
        }
    };

    const copyQRCodeURL = async () => {
        if (!qrCodeValue) return toast.error("QR no generado aún");
        const qrUrl = `${window.location.origin}/customer/restaurant/${restaurantId}?qrCode=${qrCodeValue}`;
        try {
            await navigator.clipboard.writeText(qrUrl);
            toast.success("¡URL copiada al portapapeles!");
        } catch {
            toast.error("Error al copiar la URL");
        }
    };

    const previewMenu = () => {
        if (!qrCodeValue) return toast.error("QR no generado aún");
        const qrUrl = `${window.location.origin}/customer/restaurant/${restaurantId}?qrCode=${qrCodeValue}`;
        window.open(qrUrl, '_blank');
    };

    return (
        <div className="p-3 sm:p-6 space-y-6">
            <Toaster position="top-right" />
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Códigos QR</h1>
                    <p className="text-gray-600 mt-2 text-base sm:text-lg">Genera códigos QR para acceso directo al menú</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 sm:p-8 text-center flex flex-col items-center">
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Código QR del Restaurante</h2>
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-[300px] sm:h-[420px] w-full">
                            <div className="animate-spin rounded-full h-14 w-14 sm:h-16 sm:w-16 border-t-4 border-b-4 border-blue-600 mb-4"></div>
                            <p className="text-lg sm:text-xl font-semibold text-gray-600 mt-2">
                                Generando código QR...
                            </p>
                        </div>
                    ) : generated && qrCodeDataURL ? (
                        <>
                            <div className="bg-gray-50 p-3 sm:p-6 rounded-xl inline-block w-full flex justify-center">
                                <img
                                    src={qrCodeDataURL}
                                    alt={`QR Code for ${restaurantName}`}
                                    className="mx-auto"
                                    style={{
                                        width: 'min(80vw, 320px)',
                                        maxWidth: 320,
                                        maxHeight: 320
                                    }}
                                />
                            </div>
                            <div className="text-center mt-3 sm:mt-4 w-full">
                                <h3 className="font-bold text-base sm:text-lg text-gray-900 mb-2">{restaurantName}</h3>
                                <p className="text-gray-600 text-sm">
                                    Escanea este código para acceder directamente al menú
                                </p>
                                <div className="mt-6 flex justify-center">
                                    <Button
                                        variant="outline"
                                        icon={RotateCw}
                                        className="mx-auto"
                                        onClick={handleGenerateQR}
                                    >
                                        Volver a generar QR
                                    </Button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-[300px] sm:h-[420px] w-full">
                            <QrCode className="w-20 h-20 sm:w-28 sm:h-28 opacity-20 mb-4" />
                            <div className="font-medium text-gray-500 mb-2 text-center">
                                Haz clic en <span className="text-blue-600 font-bold">Generar QR</span> para crear tu código
                            </div>
                            <Button
                                variant="gradient"
                                onClick={handleGenerateQR}
                                icon={QrCode}
                                className="mt-4"
                                disabled={loading}
                            >
                                Generar QR
                            </Button>
                        </div>
                    )}
                </div>

                <div className="space-y-6">
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 sm:p-6">
                        <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">Acciones</h3>
                        <div className="space-y-3">
                            <Button
                                onClick={downloadQRCode}
                                icon={Download}
                                variant="primary"
                                className="w-full"
                                disabled={!qrCodeDataURL}
                            >
                                Descargar QR Code
                            </Button>
                            <Button
                                onClick={copyQRCodeURL}
                                icon={Copy}
                                variant="outline"
                                className="w-full"
                                disabled={!qrCodeValue}
                            >
                                Copiar URL del Menú
                            </Button>
                            <Button
                                onClick={previewMenu}
                                icon={Eye}
                                variant="secondary"
                                className="w-full"
                                disabled={!qrCodeValue}
                            >
                                Vista Previa del Menú
                            </Button>
                        </div>
                    </div>

                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-4 sm:p-6 border border-blue-100">
                        <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 sm:mb-3">Instrucciones de Uso</h3>
                        <div className="space-y-3 text-sm text-gray-700">
                            {[
                                "Descarga el código QR y colócalo en un lugar visible.",
                                "Los clientes lo escanearán para ver el menú.",
                                "Pueden armar pedidos desde su celular.",
                                "Los pedidos llegarán automáticamente a tu dashboard en tiempo real."
                            ].map((text, index) => (
                                <div className="flex items-start space-x-3" key={index}>
                                    <div className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mt-0.5">{index + 1}</div>
                                    <p>{text}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 sm:p-6">
                        <h4 className="font-bold text-yellow-800 mb-2">📝 Nota Importante</h4>
                        <p className="text-yellow-700 text-sm">
                            Cada código QR está vinculado específicamente a tu restaurante. No lo compartas ni lo cambies después de imprimirlo.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QRCodeGenerator;
