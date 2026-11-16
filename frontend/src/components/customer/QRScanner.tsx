import React from "react";
import { useNavigate } from "react-router-dom";

const QRScanner: React.FC = () => {
    const navigate = useNavigate();

    const handleScan = () => {
        const fakeQR = "CASTILLO-LA-TERRAZA"; // prueba temporal
        localStorage.setItem("qrCode", fakeQR);
        alert("QR escaneado: " + fakeQR);
        navigate("/customer/cart");
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen text-center p-6">
            <h1 className="text-2xl font-bold mb-4">Escanea tu QR</h1>
            <p className="text-gray-500 mb-6">Presiona para simular escaneo QR del restaurante</p>
            <button
                onClick={handleScan}
                className="px-6 py-3 bg-[#f89b01] text-white font-semibold rounded-lg hover:bg-[#181818] transition"
            >
                Escanear QR
            </button>
        </div>
    );
};

export default QRScanner;
