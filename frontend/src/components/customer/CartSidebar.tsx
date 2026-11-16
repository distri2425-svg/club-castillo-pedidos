// components/customer/CartSidebar.tsx
import { useCart } from './CartProvider';
import { ShoppingCart, X } from 'lucide-react';

export const CartSidebar: React.FC = () => {
    const { cart, updateQuantity, removeFromCart, clearCart } = useCart();
    const total = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);

    return (
        <div className="fixed right-8 bottom-8 w-80 max-w-full z-50 bg-white rounded-2xl shadow-2xl p-4 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
                <div className="font-bold text-lg flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5" /> Tu Pedido
                </div>
                <button className="text-gray-400 hover:text-red-500" onClick={clearCart}>
                    <X />
                </button>
            </div>
            <div className="space-y-2 max-h-72 overflow-y-auto">
                {cart.length === 0
                    ? <div className="text-gray-500 text-center py-8">Tu carrito está vacío</div>
                    : cart.map(item => (
                        <div key={item.id} className="flex items-center gap-2 border-b pb-2">
                            {item.imageBase64 &&
                                <img src={`data:image/jpeg;base64,${item.imageBase64}`} className="w-12 h-12 rounded" />}
                            <div className="flex-1">
                                <div className="font-semibold">{item.name}</div>
                                <div className="text-sm text-gray-500">${item.price.toFixed(2)} x {item.quantity}</div>
                            </div>
                            <input type="number" value={item.quantity}
                                   min={1} max={10}
                                   className="w-12 p-1 border rounded"
                                   onChange={e => updateQuantity(item.id, Math.max(1, Number(e.target.value)))} />
                            <button className="text-red-500" onClick={() => removeFromCart(item.id)} title="Eliminar">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
            </div>
            <div className="font-bold text-right mt-4 text-lg">
                Total: <span className="text-green-600">${total.toFixed(2)}</span>
            </div>
            <button
                className="w-full mt-4 bg-green-600 text-white rounded-lg p-3 font-bold hover:bg-green-700"
                // Aquí luego abres modal de pedido, o rediriges a login, etc.
                disabled={cart.length === 0}
            >
                Confirmar Pedido
            </button>
        </div>
    );
};
