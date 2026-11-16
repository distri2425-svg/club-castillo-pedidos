import { Bot } from "lucide-react";

export default function AiChatButton({ onClick }: { onClick: () => void }) {
    return (
        <button
            className="fixed bottom-6 right-6 z-50 bg-gradient-to-r from-[#f89b01] to-[#ff8c00] rounded-full shadow-lg p-4 hover:scale-105 transition"
            title="Asistente IA"
            onClick={onClick}
        >
            <Bot className="w-6 h-6 text-white" />
        </button>
    );
}
