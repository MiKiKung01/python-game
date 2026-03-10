import { useNavigate } from "react-router-dom";

export default function MainMenu() {
    const navigate = useNavigate();
    const menus = [
        { name: "เริ่มการจำลอง (Simulation)", action: () => navigate("/simulation") },
        { name: "โหมดออนไลน์", action: () => navigate("/online") },
        { name: "การตั้งค่า", action: () => alert("เปิด Modal ตั้งค่า") }, // ทำเป็น Modal Popup
        { name: "ความสำเร็จ", action: () => navigate("/achievements") },
        { name: "ออกจากเว็บ", action: () => navigate("/") },
    ];

    return (
        <div className="flex flex-col items-center justify-center h-screen space-y-4">
            <h1 className="text-4xl font-bold mb-8 text-yellow-400">PYTHON CODER</h1>
            {menus.map((menu, index) => (
                <button
                    key={index}
                    onClick={menu.action}
                    className="w-64 py-3 bg-blue-600 hover:bg-blue-500 rounded-lg text-xl font-bold transition transform hover:scale-105 shadow-lg"
                >
                    {menu.name}
                </button>
            ))}
        </div>
    );
}
