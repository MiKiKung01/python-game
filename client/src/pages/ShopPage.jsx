// src/ShopPage.jsx
import React, { useState } from "react";
import { motion } from "framer-motion";
import { Palette, MousePointer2, Zap } from "lucide-react";
import { useTranslation } from "react-i18next"; // <-- 1. Import

// --- Mock Data (อัปเดต: ลบ name ออก) ---
const shopItems = [
    { id: 'theme-default', type: 'theme', price: 0, previewImage: '/images/theme-default.png' },
    { id: 'theme-sakura', type: 'theme', price: 0, previewImage: '/images/theme-sakura.png' },
    { id: 'theme-ocean', type: 'theme', price: 0, previewImage: '/images/theme-ocean.png' },
    { id: 'cursor-sparkle', type: 'cursor', price: 0, previewImage: '/images/cursor-sparkle.png' },
    { id: 'cursor-ghost', type: 'cursor', price: 0, previewImage: '/images/cursor-ghost.png' },
    { id: 'click-ripple', type: 'click', price: 0, previewImage: '/images/click-ripple.png' },
    { id: 'click-burst', type: 'click', price: 0, previewImage: '/images/click-burst.png' },
];

// --- 1. Shop Page (Main Component) ---
export default function ShopPage({ onTry }) {
    const [filters, setFilters] = useState({
        theme: true,
        cursor: true,
        click: true,
    });

    const filteredItems = shopItems.filter(item => {
        if (item.type === 'theme') return filters.theme;
        if (item.type === 'cursor') return filters.cursor;
        if (item.type === 'click') return filters.click;
        return true;
    });

    return (
        <main className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

                {/* --- Sidebar (ซ้าย) --- */}
                <FilterSidebar filters={filters} setFilters={setFilters} />

                {/* --- Grid (ขวา) --- */}
                <div className="lg:col-span-3">
                    <motion.div
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                        variants={{
                            hidden: { opacity: 0 },
                            visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
                        }}
                        initial="hidden"
                        animate="visible"
                    >
                        {filteredItems.map(item => (
                            <ShopItemCard key={item.id} item={item} onTry={onTry} />
                        ))}
                    </motion.div>
                </div>

            </div>
        </main>
    );
};

// --- 2. Components ย่อยของ ShopPage ---
const FilterSidebar = ({ filters, setFilters }) => {
    const { t } = useTranslation(); // <-- 2. เรียกใช้ t()

    const toggleFilter = (key) => {
        setFilters(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const FilterButton = ({ labelKey, type }) => ( // <-- เปลี่ยน label เป็น labelKey
        <button
            onClick={() => toggleFilter(type)}
            className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-colors ${filters[type]
                    ? 'bg-primary text-white'
                    : 'bg-bg-secondary text-text-primary hover:bg-opacity-70'
                }`}
        >
            {t(labelKey)} {/* <-- 3. ใช้ t() ในการแปล */}
        </button>
    );

    return (
        <aside className="p-6 bg-bg-secondary rounded-xl shadow-lg h-fit">
            <h3 className="text-xl font-bold text-text-primary mb-4">{t('shop.sidebar.title')}</h3> {/* <-- 3. ใช้ t() */}
            <div className="space-y-3">
                <FilterButton labelKey="shop.sidebar.themes" type="theme" /> {/* <-- 3. ใช้ t() */}
                <FilterButton labelKey="shop.sidebar.cursors" type="cursor" /> {/* <-- 3. ใช้ t() */}
                <FilterButton labelKey="shop.sidebar.clicks" type="click" /> {/* <-- 3. ใช้ t() */}
            </div>
        </aside>
    );
};

const ShopItemCard = ({ item, onTry }) => {
    const { t } = useTranslation(); // <-- 2. เรียกใช้ t()
    const { id, price, previewImage, type } = item; // <-- เอา name ออก

    const Icon = type === 'theme' ? Palette : type === 'cursor' ? MousePointer2 : Zap;

    // 3. ใช้ t() แปลชื่อ Item โดยใช้ ID เป็น Key
    const name = t(`shop.items.${id}`);

    return (
        <motion.div
            variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 }
            }}
            className="bg-bg-secondary rounded-lg shadow-lg overflow-hidden flex flex-col"
        >
            <div className="relative w-full h-40 bg-bg-primary overflow-hidden">
                <img src={previewImage} alt={name} className="w-full h-full object-cover" />
                <div className="absolute top-2 left-2 bg-black/50 backdrop-blur-sm p-1.5 rounded-full">
                    <Icon className="w-4 h-4 text-white" />
                </div>
            </div>
            <div className="p-4 flex flex-col flex-grow">
                <h4 className="text-lg font-bold text-text-primary truncate">{name}</h4> {/* <-- 3. ใช้ t() */}
                <div className="flex items-center text-accent mt-1">
                    <span className="font-bold">
                        {price === 0 ? t('shop.card.free') : price} {/* <-- 3. ใช้ t() */}
                    </span>
                </div>
                <button
                    onClick={() => onTry(item)}
                    className="w-full mt-4 bg-primary text-white font-bold py-2 px-4 rounded-lg hover:brightness-110 transition-all"
                >
                    {t('shop.card.try')} {/* <-- 3. ใช้ t() */}
                </button>
            </div>
        </motion.div>
    );
};