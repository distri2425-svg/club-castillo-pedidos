import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

interface QRScannerModalProps {
    open: boolean;
    onScan: (qr: string) => void;
    onClose: () => void;
}

const QRScannerModal: React.FC<QRScannerModalProps> = ({ open, onScan, onClose }) => {
    const scannerRef = useRef<HTMLDivElement>(null);
    const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
    const [isScanning, setIsScanning] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const isMountedRef = useRef(true);

    // Cleanup cuando el componente se desmonta
    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
        };
    }, []);

    useEffect(() => {
        if (!open) {
            // Limpiar cuando se cierra el modal
            cleanupScanner();
            return;
        }

        // Resetear estados
        setError(null);
        setIsScanning(false);

        const initScanner = async () => {
            if (!scannerRef.current || !isMountedRef.current) return;

            try {
                const qrRegionId = "qr-reader-region";
                scannerRef.current.innerHTML = `<div id="${qrRegionId}" style="width:280px;"></div>`;

                const html5QrCode = new Html5Qrcode(qrRegionId);
                html5QrCodeRef.current = html5QrCode;

                await html5QrCode.start(
                    { facingMode: "environment" },
                    {
                        fps: 10,
                        qrbox: { width: 200, height: 200 },
                        aspectRatio: 1.0
                    },
                    (qrCodeMessage) => {
                        // Solo procesar si el componente sigue montado
                        if (!isMountedRef.current) return;

                        setIsScanning(false);
                        // Detener el escáner antes de llamar onScan
                        stopScanner().then(() => {
                            if (isMountedRef.current) {
                                onScan(qrCodeMessage);
                            }
                        });
                    },
                    (errorMessage) => {
                        // Manejar errores de escaneo silenciosamente
                        // console.log('QR scan error:', errorMessage);
                    }
                );

                if (isMountedRef.current) {
                    setIsScanning(true);
                }
            } catch (err) {
                if (isMountedRef.current) {
                    console.error('Error inicializando escáner:', err);
                    setError("No se pudo acceder a la cámara. Verifica los permisos.");
                }
            }
        };

        initScanner();

        return () => {
            cleanupScanner();
        };
    }, [open, onScan]);

    const stopScanner = async (): Promise<void> => {
        if (html5QrCodeRef.current) {
            try {
                const state = html5QrCodeRef.current.getState();
                if (state === 2) { // Html5QrcodeScannerState.SCANNING
                    await html5QrCodeRef.current.stop();
                }
            } catch (err) {
                console.log('Error deteniendo escáner:', err);
                // Ignorar errores de detención
            }
        }
        setIsScanning(false);
    };

    const cleanupScanner = async () => {
        if (html5QrCodeRef.current) {
            try {
                await stopScanner();
                await html5QrCodeRef.current.clear();
            } catch (err) {
                console.log('Error limpiando escáner:', err);
            } finally {
                html5QrCodeRef.current = null;
            }
        }
    };

    const handleClose = async () => {
        await cleanupScanner();
        onClose();
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-xs flex flex-col items-center relative">
                <button
                    className="absolute top-2 right-2 text-gray-500 hover:text-red-600 w-8 h-8 flex items-center justify-center"
                    onClick={handleClose}
                    aria-label="Cerrar"
                    type="button"
                >
                    ✖
                </button>

                <h2 className="text-lg font-bold mb-4">Escanea el QR del restaurante</h2>

                {error ? (
                    <div className="text-red-600 text-sm mb-4 text-center">
                        {error}
                        <button
                            onClick={handleClose}
                            className="block mt-2 px-4 py-2 bg-red-100 text-red-700 rounded"
                        >
                            Cerrar
                        </button>
                    </div>
                ) : (
                    <>
                        <div ref={scannerRef} className="mb-4" />

                        {isScanning && (
                            <div className="text-xs text-gray-500 text-center">
                                Alinea el código QR dentro del recuadro
                            </div>
                        )}

                        {!isScanning && !error && (
                            <div className="text-xs text-gray-500 text-center">
                                Iniciando cámara...
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default QRScannerModal;