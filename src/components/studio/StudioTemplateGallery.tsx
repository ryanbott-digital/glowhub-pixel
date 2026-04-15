import { useState, useMemo } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { CanvasElement, DEFAULT_FILTERS } from "@/components/studio/types";
import { LayoutTemplate, Utensils, Tag, Info, Sparkles, Coffee, ShoppingBag, Megaphone, CalendarDays, PartyPopper, Clock, Dumbbell, Store, Hotel, HeartPulse, GraduationCap, Search, Church, Building2, Share2, Home } from "lucide-react";

/* ── Template category type ── */
type TemplateCategory = "all" | "menu" | "promo" | "info" | "fitness" | "retail" | "hotel" | "health" | "education" | "church" | "corporate" | "social" | "realestate";

interface StudioTemplate {
  id: string;
  name: string;
  category: TemplateCategory;
  preview: string;
  description: string;
  tags?: string[];
  elements: CanvasElement[];
  bg?: { type: "solid" | "gradient" | "image"; color: string; gradient?: string };
}

/* ── Helper to generate element IDs ── */
let _tid = 0;
const tid = () => `tpl-${Date.now()}-${++_tid}`;

/* ── Refined image placeholder: subtle gradient fill, dashed border, centered label ── */
const imgPlaceholder = (x: number, y: number, w: number, h: number, label = "YOUR IMAGE", accent = "#475569"): CanvasElement[] => [
  {
    id: tid(), type: "shape", x, y, width: w, height: h, content: "", style: {},
    shapeType: "rounded-rect",
    shapeFill: `${accent}12`,
    shapeStroke: accent,
    shapeStrokeWidth: 1,
    visible: true, locked: false, filters: { ...DEFAULT_FILTERS },
  },
  {
    id: tid(), type: "text", x, y: y + h / 2 - 14, width: w, height: 28,
    content: `📷 ${label}`,
    style: { fontSize: "11px", fontWeight: "600", color: `${accent}99`, textAlign: "center", letterSpacing: "1px" },
    visible: true, locked: false, fontFamily: "Inter", filters: { ...DEFAULT_FILTERS },
  },
];

/* ── Divider helper ── */
const divider = (x: number, y: number, w: number, color: string): CanvasElement => ({
  id: tid(), type: "shape", x, y, width: w, height: 2, content: "", style: {},
  shapeType: "line", shapeFill: color, shapeStroke: color, shapeStrokeWidth: 2,
  visible: true, locked: false, filters: { ...DEFAULT_FILTERS },
});

/* ── Card helper ── */
const card = (x: number, y: number, w: number, h: number, fill = "#111827", stroke = "#1E293B"): CanvasElement => ({
  id: tid(), type: "shape", x, y, width: w, height: h, content: "", style: {},
  shapeType: "rounded-rect", shapeFill: fill, shapeStroke: stroke, shapeStrokeWidth: 1,
  visible: true, locked: false, filters: { ...DEFAULT_FILTERS },
});

/* ── Text helper ── */
const txt = (x: number, y: number, w: number, h: number, content: string, style: Record<string, string>, font = "Inter"): CanvasElement => ({
  id: tid(), type: "text", x, y, width: w, height: h, content,
  style: { fontWeight: "400", ...style },
  visible: true, locked: false, fontFamily: font, filters: { ...DEFAULT_FILTERS },
});

/* ── Pre-made templates ── */
const TEMPLATES: StudioTemplate[] = [
  /* ─── CAFÉ MENU ─── */
  {
    id: "menu-cafe",
    name: "Café Menu",
    category: "menu",
    preview: "☕",
    description: "Modern coffee shop menu with hero image and pricing",
    bg: { type: "gradient", color: "#1a1a2e", gradient: "linear-gradient(160deg, #1a1a2e 0%, #0f1628 100%)" },
    elements: [
      ...imgPlaceholder(40, 24, 280, 180, "HERO PHOTO", "#C8A97E"),
      txt(350, 28, 570, 44, "THE DAILY GRIND", { fontSize: "38px", fontWeight: "800", color: "#F5DEB3", letterSpacing: "2px" }, "Playfair Display"),
      divider(350, 78, 180, "#C8A97E"),
      txt(350, 92, 570, 18, "CRAFTED COFFEE  •  BAKED DAILY", { fontSize: "11px", fontWeight: "600", color: "#C8A97E", letterSpacing: "4px" }, "Space Grotesk"),
      txt(350, 118, 280, 86, "Espresso .................... $3.50\nAmericano ................. $4.00\nCappuccino ............... $4.50\nLatte .......................... $4.75", { fontSize: "14px", color: "#E8D5B7", lineHeight: "1.75" }, "DM Sans"),
      txt(650, 118, 260, 86, "Flat White .................. $4.50\nMocha ........................ $5.00\nChai Latte .................. $4.75\nMatcha Latte ............. $5.25", { fontSize: "14px", color: "#E8D5B7", lineHeight: "1.75" }, "DM Sans"),
      divider(40, 218, 880, "#1E293B"),
      txt(40, 230, 200, 22, "COLD BREW & ICED", { fontSize: "15px", fontWeight: "700", color: "#C8A97E", letterSpacing: "3px" }, "Bebas Neue"),
      txt(40, 258, 440, 86, "Cold Brew .................. $4.50\nIced Latte ................... $5.00\nIced Mocha ................ $5.50\nFrappé ....................... $5.75", { fontSize: "14px", color: "#E8D5B7", lineHeight: "1.75" }, "DM Sans"),
      ...imgPlaceholder(500, 230, 420, 130, "PASTRY / FOOD PHOTO", "#C8A97E"),
      txt(40, 375, 140, 22, "PASTRIES", { fontSize: "15px", fontWeight: "700", color: "#C8A97E", letterSpacing: "3px" }, "Bebas Neue"),
      txt(40, 400, 440, 70, "Croissant ................... $3.50\nPain au Chocolat ...... $4.00\nCinnamon Roll ........... $4.50", { fontSize: "14px", color: "#E8D5B7", lineHeight: "1.75" }, "DM Sans"),
      ...imgPlaceholder(500, 375, 200, 100, "PASTRY CLOSE-UP", "#C8A97E"),
      ...imgPlaceholder(720, 375, 200, 100, "COFFEE ART", "#C8A97E"),
      divider(40, 490, 880, "#1E293B"),
      txt(40, 500, 880, 22, "✦  Ask about our seasonal specials  •  Oat & almond milk available  •  All beans ethically sourced  ✦", { fontSize: "12px", fontWeight: "500", color: "#8B7355", textAlign: "center", fontStyle: "italic" }, "Lora"),
    ],
  },

  /* ─── RESTAURANT SPECIALS ─── */
  {
    id: "menu-restaurant",
    name: "Restaurant Specials",
    category: "menu",
    preview: "🍽️",
    description: "Elegant specials board with dish photography zones",
    bg: { type: "solid", color: "#0C0C0C" },
    elements: [
      txt(50, 24, 500, 44, "TODAY'S SPECIALS", { fontSize: "40px", fontWeight: "900", color: "#FFFFFF", letterSpacing: "4px" }, "Oswald"),
      divider(50, 72, 140, "#B8860B"),
      txt(50, 84, 200, 16, "STARTER", { fontSize: "12px", fontWeight: "700", color: "#D4A017", letterSpacing: "5px" }, "Space Grotesk"),
      ...imgPlaceholder(50, 106, 170, 120, "DISH PHOTO", "#D4A017"),
      txt(240, 110, 360, 22, "Burrata with Heirloom Tomatoes", { fontSize: "19px", fontWeight: "300", color: "#FFFFFF" }, "Playfair Display"),
      txt(240, 136, 360, 16, "Fresh basil oil, aged balsamic, micro herbs", { fontSize: "12px", color: "#94A3B8" }),
      txt(240, 160, 80, 22, "$14", { fontSize: "20px", fontWeight: "700", color: "#D4A017" }, "Oswald"),
      divider(50, 236, 560, "#1E293B"),
      txt(50, 248, 200, 16, "MAIN", { fontSize: "12px", fontWeight: "700", color: "#D4A017", letterSpacing: "5px" }, "Space Grotesk"),
      ...imgPlaceholder(50, 270, 170, 120, "DISH PHOTO", "#D4A017"),
      txt(240, 274, 360, 22, "Pan-Seared Salmon", { fontSize: "19px", fontWeight: "300", color: "#FFFFFF" }, "Playfair Display"),
      txt(240, 300, 360, 16, "Dill cream, grilled asparagus, lemon butter", { fontSize: "12px", color: "#94A3B8" }),
      txt(240, 324, 80, 22, "$28", { fontSize: "20px", fontWeight: "700", color: "#D4A017" }, "Oswald"),
      // Right column
      ...imgPlaceholder(640, 84, 280, 306, "AMBIANCE PHOTO", "#B8860B"),
      divider(50, 400, 870, "#1E293B"),
      txt(50, 412, 120, 16, "DESSERT", { fontSize: "12px", fontWeight: "700", color: "#D4A017", letterSpacing: "5px" }, "Space Grotesk"),
      txt(50, 434, 500, 20, "Dark Chocolate Fondant with Salted Caramel — $12", { fontSize: "16px", fontWeight: "300", color: "#FFFFFF" }),
      txt(50, 462, 500, 20, "Lemon Tart, Crème Fraîche, Raspberry Coulis — $10", { fontSize: "16px", fontWeight: "300", color: "#FFFFFF" }),
      txt(640, 416, 280, 70, "Reservations\n020 7123 4567", { fontSize: "14px", fontWeight: "500", color: "#94A3B8", textAlign: "center", lineHeight: "1.6" }),
      ...imgPlaceholder(720, 478, 100, 40, "LOGO", "#B8860B"),
    ],
  },

  /* ─── BAR & COCKTAILS ─── */
  {
    id: "menu-bar",
    name: "Bar & Cocktails",
    category: "menu",
    preview: "🍸",
    description: "Neon-accented cocktail menu with drink photography",
    bg: { type: "gradient", color: "#0a0a1a", gradient: "linear-gradient(180deg, #080818 0%, #150a28 100%)" },
    elements: [
      txt(60, 24, 460, 48, "COCKTAIL HOUR", { fontSize: "44px", fontWeight: "900", color: "#FF6B9D" }, "Righteous"),
      txt(60, 76, 460, 18, "HAPPY HOUR 5–7 PM  •  ALL CLASSICS $8", { fontSize: "12px", fontWeight: "600", color: "#FFD700", letterSpacing: "3px" }, "Space Grotesk"),
      divider(60, 100, 200, "#FF6B9D"),
      ...imgPlaceholder(600, 20, 320, 170, "COCKTAIL HERO", "#FF6B9D"),
      txt(60, 112, 500, 20, "SIGNATURE COCKTAILS", { fontSize: "14px", fontWeight: "700", color: "#A855F7", letterSpacing: "3px" }, "Space Grotesk"),
      txt(60, 140, 500, 280, "🍋 Lemon Drop Martini ..................... $12\n     Vodka, triple sec, fresh lemon, sugar rim\n\n🌿 Mojito Fresco ................................. $11\n     White rum, mint, lime, soda\n\n🥃 Old Fashioned ................................. $14\n     Bourbon, Angostura bitters, orange peel\n\n🍓 Strawberry Daiquiri ....................... $12\n     Rum, fresh strawberries, lime\n\n🫒 Espresso Martini ............................ $13\n     Vodka, Kahlúa, fresh espresso", { fontSize: "14px", color: "#E0D0F0", lineHeight: "1.5" }, "DM Sans"),
      ...imgPlaceholder(600, 210, 155, 120, "DRINK 1", "#A855F7"),
      ...imgPlaceholder(765, 210, 155, 120, "DRINK 2", "#A855F7"),
      card(600, 345, 320, 80, "#120a20", "#2D1B4E"),
      txt(620, 355, 280, 60, "🍺 CRAFT BEERS ON TAP\nAsk your bartender about\nour rotating selection", { fontSize: "13px", fontWeight: "500", color: "#FFD700", textAlign: "center", lineHeight: "1.6" }, "DM Sans"),
      divider(60, 440, 860, "#1E1030"),
      txt(60, 456, 860, 20, "Must be 21+  •  Please drink responsibly  •  Tips appreciated", { fontSize: "11px", fontWeight: "500", color: "#64748B", textAlign: "center" }),
      ...imgPlaceholder(60, 484, 100, 40, "LOGO", "#FF6B9D"),
    ],
  },

  /* ─── PIZZA MENU ─── */
  {
    id: "menu-pizza",
    name: "Pizza Menu",
    category: "menu",
    preview: "🍕",
    description: "Wood-fired pizza menu with rustic styling",
    bg: { type: "gradient", color: "#1a0a0a", gradient: "linear-gradient(180deg, #140808 0%, #1E1210 50%, #140808 100%)" },
    elements: [
      ...imgPlaceholder(0, 0, 960, 130, "WOOD-FIRED OVEN HERO", "#FF6B35"),
      txt(180, 30, 600, 60, "STONE OVEN PIZZERIA", { fontSize: "44px", fontWeight: "900", color: "#FFD700", textAlign: "center" }, "Oswald"),
      txt(180, 95, 600, 18, "HAND-STRETCHED  •  WOOD-FIRED  •  STONE BAKED", { fontSize: "10px", fontWeight: "600", color: "#FF6B35", letterSpacing: "4px", textAlign: "center" }, "Space Grotesk"),
      txt(50, 146, 200, 22, "CLASSIC PIZZAS", { fontSize: "16px", fontWeight: "700", color: "#FF6B35", letterSpacing: "3px" }, "Bebas Neue"),
      txt(50, 174, 400, 150, "Margherita ........................ $12\nFresh mozzarella, San Marzano, basil\n\nPepperoni ........................... $14\nDouble pepperoni, mozzarella blend\n\nQuattro Formaggi .............. $16\nMozzarella, gorgonzola, parmesan, fontina", { fontSize: "14px", color: "#E8D0C0", lineHeight: "1.5" }, "DM Sans"),
      txt(500, 146, 200, 22, "GOURMET PIZZAS", { fontSize: "16px", fontWeight: "700", color: "#FF6B35", letterSpacing: "3px" }, "Bebas Neue"),
      txt(500, 174, 420, 150, "Truffle Mushroom ............... $19\nWild mushrooms, truffle oil, fontina\n\nProsciutto & Fig .................. $20\nParma ham, fig jam, arugula, balsamic\n\nBBQ Pulled Pork .................. $18\nSlow-cooked pork, BBQ glaze, jalapeños", { fontSize: "14px", color: "#E8D0C0", lineHeight: "1.5" }, "DM Sans"),
      divider(50, 340, 860, "#331A0A"),
      txt(50, 355, 200, 20, "SIDES & DESSERTS", { fontSize: "14px", fontWeight: "700", color: "#FF6B35", letterSpacing: "2px" }, "Bebas Neue"),
      txt(50, 380, 860, 60, "Garlic Bread $6  •  Caesar Salad $9  •  Tiramisu $8  •  Gelato $7  •  Bruschetta $7  •  Arancini $8", { fontSize: "15px", color: "#E8D0C0", textAlign: "center", lineHeight: "1.6" }, "DM Sans"),
      ...imgPlaceholder(50, 450, 280, 75, "PIZZA CLOSE-UP", "#FF6B35"),
      ...imgPlaceholder(350, 450, 280, 75, "INTERIOR PHOTO", "#FF6B35"),
      ...imgPlaceholder(650, 450, 260, 75, "LOGO / QR CODE", "#FFD700"),
    ],
  },

  /* ─── FLASH SALE ─── */
  {
    id: "promo-flash-sale",
    name: "Flash Sale",
    category: "promo",
    preview: "⚡",
    description: "Bold promotional layout with product image grid",
    bg: { type: "gradient", color: "#0f0f0f", gradient: "linear-gradient(135deg, #1a0000 0%, #0f0f0f 50%, #001a1a 100%)" },
    elements: [
      txt(50, 28, 500, 50, "⚡ FLASH SALE", { fontSize: "46px", fontWeight: "900", color: "#FF4444", textAlign: "center" }, "Russo One"),
      txt(50, 88, 500, 140, "50%\nOFF", { fontSize: "100px", fontWeight: "900", color: "#FFFFFF", textAlign: "center", lineHeight: "0.9" }, "Bebas Neue"),
      txt(50, 240, 500, 28, "EVERYTHING IN STORE", { fontSize: "20px", fontWeight: "700", color: "#FF6B35", textAlign: "center", letterSpacing: "5px" }, "Space Grotesk"),
      txt(50, 276, 500, 24, "THIS WEEKEND ONLY", { fontSize: "16px", fontWeight: "500", color: "#94A3B8", textAlign: "center", letterSpacing: "3px" }),
      ...imgPlaceholder(600, 28, 320, 140, "PRODUCT 1", "#FF4444"),
      ...imgPlaceholder(600, 180, 155, 130, "PRODUCT 2", "#FF6B35"),
      ...imgPlaceholder(765, 180, 155, 130, "PRODUCT 3", "#FF6B35"),
      txt(600, 324, 320, 50, "Shop in-store or online\nwww.yourstore.com", { fontSize: "14px", fontWeight: "500", color: "#94A3B8", textAlign: "center", lineHeight: "1.6" }),
      divider(50, 320, 500, "#1E293B"),
      ...imgPlaceholder(80, 350, 110, 110, "QR CODE", "#FF4444"),
      txt(210, 375, 300, 44, "Scan for exclusive\nonline-only deals", { fontSize: "15px", fontWeight: "500", color: "#FFD700", lineHeight: "1.5" }, "DM Sans"),
      ...imgPlaceholder(80, 475, 120, 45, "BRAND LOGO", "#FFFFFF"),
      txt(600, 390, 320, 130, "Terms & conditions apply.\nExcludes sale items.\nCannot be combined with other offers.", { fontSize: "11px", color: "#4B5563", textAlign: "center", lineHeight: "1.6" }),
    ],
  },

  /* ─── HAPPY HOUR ─── */
  {
    id: "promo-happy-hour",
    name: "Happy Hour",
    category: "promo",
    preview: "🎉",
    description: "Vibrant happy hour promotion with drink images",
    bg: { type: "gradient", color: "#0a1628", gradient: "linear-gradient(135deg, #0a1628 0%, #1a0a28 100%)" },
    elements: [
      txt(50, 34, 480, 60, "HAPPY HOUR", { fontSize: "56px", fontWeight: "900", color: "#FFD700" }, "Righteous"),
      txt(50, 100, 480, 28, "EVERY FRIDAY 4 PM – 7 PM", { fontSize: "20px", fontWeight: "600", color: "#FFFFFF", letterSpacing: "3px" }, "Bebas Neue"),
      divider(50, 136, 180, "#FFD700"),
      ...imgPlaceholder(590, 28, 330, 200, "DRINKS PHOTO", "#FFD700"),
      txt(50, 154, 500, 240, "🍺  Draft Beers .......................... $4\n\n🍷  House Wine .......................... $6\n\n🍹  Well Cocktails ...................... $5\n\n🍕  Appetizers ................. Half Price\n\n🥜  Bar Snacks ...................... FREE", { fontSize: "22px", color: "#E2E8F0", lineHeight: "1.8" }, "DM Sans"),
      ...imgPlaceholder(590, 244, 160, 100, "FOOD PHOTO", "#FFD700"),
      ...imgPlaceholder(760, 244, 160, 100, "YOUR LOGO", "#FFD700"),
      divider(50, 410, 870, "#1E293B"),
      txt(50, 424, 870, 24, "No reservations needed  •  Walk-ins welcome  •  Live music every Friday", { fontSize: "13px", fontWeight: "400", color: "#64748B", textAlign: "center", fontStyle: "italic" }, "Lora"),
      txt(590, 360, 330, 40, "📍 123 Main Street  •  Downtown", { fontSize: "13px", fontWeight: "500", color: "#94A3B8", textAlign: "center" }),
    ],
  },

  /* ─── SEASONAL OFFER ─── */
  {
    id: "promo-seasonal",
    name: "Seasonal Offer",
    category: "promo",
    preview: "🌸",
    description: "Elegant seasonal promotion with collection imagery",
    bg: { type: "gradient", color: "#0f1923", gradient: "linear-gradient(180deg, #0C141E 0%, #162030 100%)" },
    elements: [
      ...imgPlaceholder(500, 30, 420, 320, "COLLECTION PHOTO", "#E879A8"),
      txt(50, 40, 420, 24, "LIMITED TIME OFFER", { fontSize: "13px", fontWeight: "600", color: "#E879A8", letterSpacing: "6px" }, "Space Grotesk"),
      txt(50, 80, 420, 100, "Spring\nCollection", { fontSize: "58px", fontWeight: "300", color: "#FFFFFF", lineHeight: "1.05" }, "Playfair Display"),
      txt(50, 195, 420, 55, "Refresh your space with our curated spring selection. New arrivals weekly.", { fontSize: "16px", color: "#94A3B8", lineHeight: "1.6" }),
      txt(50, 270, 200, 50, "20% OFF", { fontSize: "48px", fontWeight: "900", color: "#E879A8" }, "Bebas Neue"),
      txt(50, 330, 400, 24, "Use code: SPRING2026", { fontSize: "16px", fontWeight: "500", color: "#FFD700", letterSpacing: "3px" }, "Space Grotesk"),
      divider(50, 370, 400, "#1E293B"),
      ...imgPlaceholder(50, 390, 100, 100, "QR CODE", "#E879A8"),
      txt(170, 410, 250, 40, "Scan to shop the\ncollection online", { fontSize: "13px", color: "#94A3B8", lineHeight: "1.5" }),
      ...imgPlaceholder(500, 370, 200, 80, "BRAND LOGO", "#E879A8"),
      txt(500, 460, 420, 30, "In-store & online  •  Free shipping over $50", { fontSize: "12px", color: "#64748B", textAlign: "center" }),
    ],
  },

  /* ─── WELCOME SCREEN ─── */
  {
    id: "info-welcome",
    name: "Welcome Screen",
    category: "info",
    preview: "👋",
    description: "Corporate welcome display with logo and directions",
    bg: { type: "gradient", color: "#0a0f1a", gradient: "linear-gradient(135deg, #080D18 0%, #141A2E 100%)" },
    elements: [
      ...imgPlaceholder(350, 40, 260, 90, "YOUR LOGO", "#6B8DD6"),
      txt(160, 150, 640, 28, "WELCOME TO", { fontSize: "18px", fontWeight: "600", color: "#6B8DD6", letterSpacing: "10px", textAlign: "center" }, "Space Grotesk"),
      txt(160, 185, 640, 70, "YOUR\nCOMPANY", { fontSize: "60px", fontWeight: "900", color: "#FFFFFF", textAlign: "center", lineHeight: "1" }, "Oswald"),
      divider(400, 270, 160, "#4A6FA5"),
      txt(160, 290, 640, 30, "Please check in at reception", { fontSize: "20px", fontWeight: "300", color: "#94A3B8", textAlign: "center" }),
      { id: tid(), type: "widget-clock", x: 380, y: 340, width: 200, height: 70, content: "", style: {}, visible: true, locked: false, filters: { ...DEFAULT_FILTERS } },
      ...imgPlaceholder(60, 430, 260, 90, "OFFICE PHOTO", "#4A6FA5"),
      { id: tid(), type: "widget-weather", x: 680, y: 440, width: 240, height: 70, content: "", style: {}, visible: true, locked: false, filters: { ...DEFAULT_FILTERS } },
    ],
  },

  /* ─── EVENT SCHEDULE ─── */
  {
    id: "info-event",
    name: "Event Schedule",
    category: "info",
    preview: "📅",
    description: "Conference schedule with speaker photo zones",
    bg: { type: "solid", color: "#08080F" },
    elements: [
      txt(50, 24, 560, 44, "EVENT SCHEDULE", { fontSize: "40px", fontWeight: "900", color: "#FFFFFF", letterSpacing: "3px" }, "Oswald"),
      txt(50, 72, 400, 20, "SATURDAY, APRIL 26, 2026", { fontSize: "13px", fontWeight: "600", color: "#6B8DD6", letterSpacing: "3px" }, "Space Grotesk"),
      ...imgPlaceholder(700, 20, 220, 80, "EVENT LOGO", "#6B8DD6"),
      divider(50, 100, 870, "#1E293B"),
      txt(50, 114, 600, 340, "09:00    Registration & Coffee\n\n10:00    Opening Keynote — Main Stage\n              \"The Future of Digital Experience\"\n\n11:30    Workshop A — Room 1\n              Interactive Design Principles\n\n12:30    Lunch Break — Atrium\n\n14:00    Panel Discussion — Main Stage\n              Industry Leaders Q&A\n\n15:30    Networking & Demos\n\n17:00    Closing Remarks", { fontSize: "16px", color: "#CBD5E1", lineHeight: "1.55" }, "DM Sans"),
      txt(680, 114, 240, 16, "KEYNOTE SPEAKERS", { fontSize: "10px", fontWeight: "700", color: "#6B8DD6", letterSpacing: "3px" }, "Space Grotesk"),
      ...imgPlaceholder(680, 138, 110, 90, "SPEAKER 1", "#6B8DD6"),
      ...imgPlaceholder(800, 138, 110, 90, "SPEAKER 2", "#6B8DD6"),
      ...imgPlaceholder(680, 240, 110, 90, "SPEAKER 3", "#6B8DD6"),
      ...imgPlaceholder(800, 240, 110, 90, "SPEAKER 4", "#6B8DD6"),
      txt(680, 345, 240, 60, "Sponsored by\nYour Company Inc.", { fontSize: "12px", color: "#64748B", textAlign: "center", lineHeight: "1.6" }),
      ...imgPlaceholder(730, 410, 140, 60, "SPONSOR LOGO", "#6B8DD6"),
    ],
  },

  /* ─── GYM CLASS SCHEDULE ─── */
  {
    id: "fitness-class",
    name: "Class Schedule",
    category: "fitness",
    preview: "🏋️",
    description: "Gym class timetable with trainer photo zones",
    bg: { type: "gradient", color: "#0a0a0a", gradient: "linear-gradient(135deg, #0a0a0a 0%, #1a0808 100%)" },
    elements: [
      ...imgPlaceholder(0, 0, 960, 80, "GYM HERO — ACTION SHOT", "#FF4444"),
      txt(200, 18, 560, 42, "TODAY'S CLASSES", { fontSize: "40px", fontWeight: "900", color: "#FF4444", textAlign: "center" }, "Oswald"),
      txt(200, 56, 560, 16, "IRON FORGE FITNESS  •  PUSH YOUR LIMITS", { fontSize: "10px", fontWeight: "600", color: "#FFD700", letterSpacing: "3px", textAlign: "center" }, "Space Grotesk"),
      txt(40, 94, 580, 320, "06:00    🔥 HIIT Burn — Studio A\n              Coach Marcus · 45 min · All levels\n\n07:30    🚴 Spin Cycle — Studio B\n              Coach Priya · 50 min · Intermediate\n\n09:00    🧘 Yoga Flow — Studio A\n              Sarah · 60 min · All levels\n\n12:00    🥊 Boxing — Studio C\n              Coach Dex · 45 min · Advanced\n\n17:30    💪 CrossFit — Main Floor\n              Coach Liam · 60 min · All levels\n\n19:00    🤸 Pilates — Studio A\n              Mia · 45 min · All levels", { fontSize: "14px", color: "#E0D8C0", lineHeight: "1.45" }, "DM Sans"),
      txt(650, 94, 270, 14, "OUR COACHES", { fontSize: "10px", fontWeight: "700", color: "#FF4444", letterSpacing: "4px" }, "Space Grotesk"),
      ...imgPlaceholder(650, 114, 130, 90, "COACH 1", "#FF4444"),
      ...imgPlaceholder(790, 114, 130, 90, "COACH 2", "#FF4444"),
      ...imgPlaceholder(650, 216, 130, 90, "COACH 3", "#FF6B35"),
      ...imgPlaceholder(790, 216, 130, 90, "COACH 4", "#FF6B35"),
      card(650, 320, 270, 70, "#1a0808", "#331A0A"),
      txt(660, 328, 250, 55, "📱 Book via the app\n🆓 First class FREE\nfor new members", { fontSize: "13px", fontWeight: "500", color: "#FFD700", textAlign: "center", lineHeight: "1.5" }, "DM Sans"),
      divider(40, 430, 880, "#1E1010"),
      txt(40, 444, 880, 18, "🟡 HIIT    🟢 Spin    🟣 Yoga    🔴 Boxing    🔵 CrossFit    🟠 Pilates", { fontSize: "11px", fontWeight: "500", color: "#64748B", textAlign: "center" }, "DM Sans"),
      txt(40, 470, 880, 18, "OPEN 5 AM – 10 PM MON–FRI  •  7 AM – 8 PM WEEKENDS", { fontSize: "10px", fontWeight: "600", color: "#FF4444", letterSpacing: "2px", textAlign: "center" }, "Space Grotesk"),
    ],
  },

  /* ─── RETAIL WINDOW ─── */
  {
    id: "retail-window",
    name: "Window Display",
    category: "retail",
    preview: "🛍️",
    description: "Storefront window with product image grid",
    bg: { type: "solid", color: "#080808" },
    elements: [
      ...imgPlaceholder(40, 24, 540, 290, "HERO PRODUCT IMAGE", "#F59E0B"),
      txt(610, 28, 310, 18, "NEW ARRIVAL", { fontSize: "12px", fontWeight: "700", color: "#F59E0B", letterSpacing: "5px" }, "Space Grotesk"),
      txt(610, 52, 310, 80, "Summer\nEssentials", { fontSize: "48px", fontWeight: "300", color: "#FFFFFF", lineHeight: "1.1" }, "Playfair Display"),
      txt(610, 142, 310, 45, "Curated pieces for the\nmodern wardrobe", { fontSize: "15px", color: "#94A3B8", lineHeight: "1.5" }),
      divider(610, 196, 100, "#F59E0B"),
      txt(610, 212, 310, 36, "FROM $49.99", { fontSize: "30px", fontWeight: "800", color: "#FFFFFF" }, "Oswald"),
      txt(610, 256, 310, 20, "Limited edition • While stocks last", { fontSize: "12px", color: "#64748B", fontStyle: "italic" }, "Lora"),
      ...imgPlaceholder(40, 330, 200, 120, "PRODUCT 1", "#F59E0B"),
      ...imgPlaceholder(256, 330, 200, 120, "PRODUCT 2", "#F59E0B"),
      ...imgPlaceholder(472, 330, 200, 120, "PRODUCT 3", "#F59E0B"),
      ...imgPlaceholder(700, 330, 100, 100, "QR CODE", "#FFFFFF"),
      txt(700, 434, 100, 14, "Shop online", { fontSize: "10px", fontWeight: "500", color: "#64748B", textAlign: "center" }),
      ...imgPlaceholder(830, 330, 90, 80, "LOGO", "#FFFFFF"),
      divider(40, 466, 880, "#1E293B"),
      txt(40, 480, 880, 18, "Free shipping on orders over $75  •  Easy returns within 30 days", { fontSize: "11px", color: "#64748B", textAlign: "center" }),
    ],
  },

  /* ─── HOTEL WELCOME ─── */
  {
    id: "hotel-welcome",
    name: "Hotel Welcome",
    category: "hotel",
    preview: "🏨",
    description: "Luxury hotel lobby with amenities and concierge info",
    bg: { type: "gradient", color: "#08060e", gradient: "linear-gradient(180deg, #06050C 0%, #10101E 50%, #08060E 100%)" },
    elements: [
      ...imgPlaceholder(0, 0, 960, 120, "HOTEL EXTERIOR / LOBBY", "#C9A96E"),
      divider(380, 134, 200, "#C9A96E"),
      txt(200, 148, 560, 18, "WELCOME TO", { fontSize: "12px", fontWeight: "600", color: "#C9A96E", letterSpacing: "10px", textAlign: "center" }, "Space Grotesk"),
      txt(120, 170, 720, 50, "THE ROSEMONT", { fontSize: "50px", fontWeight: "300", color: "#FFFFFF", textAlign: "center", letterSpacing: "4px" }, "Playfair Display"),
      txt(200, 226, 560, 16, "BOUTIQUE HOTEL & SPA  •  EST. 1897", { fontSize: "10px", fontWeight: "500", color: "#94A3B8", letterSpacing: "4px", textAlign: "center" }, "Space Grotesk"),
      // Three info cards
      card(40, 260, 280, 130, "#0C0A14", "#1E1A2E"),
      txt(54, 270, 250, 14, "DINING", { fontSize: "10px", fontWeight: "700", color: "#C9A96E", letterSpacing: "3px" }, "Space Grotesk"),
      txt(54, 290, 250, 90, "Breakfast  7:00 – 10:30\nLunch  12:00 – 14:30\nDinner  18:30 – 22:00\nRoom service 24 hours", { fontSize: "12px", color: "#CBD5E1", lineHeight: "1.7" }, "DM Sans"),
      card(340, 260, 280, 130, "#0C0A14", "#1E1A2E"),
      txt(354, 270, 250, 14, "SPA & WELLNESS", { fontSize: "10px", fontWeight: "700", color: "#C9A96E", letterSpacing: "3px" }, "Space Grotesk"),
      txt(354, 290, 250, 90, "Pool  06:00 – 21:00\nSpa  09:00 – 20:00\nFitness  24 hours\nYoga class  08:00 daily", { fontSize: "12px", color: "#CBD5E1", lineHeight: "1.7" }, "DM Sans"),
      card(640, 260, 280, 130, "#0C0A14", "#1E1A2E"),
      txt(654, 270, 250, 14, "CONCIERGE", { fontSize: "10px", fontWeight: "700", color: "#C9A96E", letterSpacing: "3px" }, "Space Grotesk"),
      txt(654, 290, 250, 90, "Airport transfers\nTour bookings\nRestaurant reservations\nDial 0 for assistance", { fontSize: "12px", color: "#CBD5E1", lineHeight: "1.7" }, "DM Sans"),
      txt(200, 410, 560, 16, "WI-FI: ROSEMONT-GUEST  •  NO PASSWORD REQUIRED", { fontSize: "10px", fontWeight: "500", color: "#64748B", letterSpacing: "3px", textAlign: "center" }, "Space Grotesk"),
      { id: tid(), type: "widget-clock", x: 340, y: 440, width: 140, height: 50, content: "", style: {}, visible: true, locked: false, filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "widget-weather", x: 490, y: 440, width: 140, height: 50, content: "", style: {}, visible: true, locked: false, filters: { ...DEFAULT_FILTERS } },
    ],
  },

  /* ─── CLINIC WELCOME ─── */
  {
    id: "health-waiting",
    name: "Clinic Welcome",
    category: "health",
    preview: "🏥",
    description: "Patient waiting room display with facility info",
    bg: { type: "gradient", color: "#0a1520", gradient: "linear-gradient(180deg, #081218 0%, #0E1822 100%)" },
    elements: [
      ...imgPlaceholder(40, 24, 330, 180, "CLINIC PHOTO", "#5BA8D6"),
      txt(400, 24, 520, 18, "PATIENT INFORMATION", { fontSize: "12px", fontWeight: "700", color: "#5BA8D6", letterSpacing: "6px" }, "Space Grotesk"),
      txt(400, 50, 520, 70, "Welcome to\nBrightcare Clinic", { fontSize: "38px", fontWeight: "300", color: "#FFFFFF", lineHeight: "1.15" }, "Playfair Display"),
      divider(400, 126, 80, "#5BA8D6"),
      txt(400, 142, 520, 50, "Please check in at the front desk.\nAverage wait time: 15 minutes.", { fontSize: "14px", color: "#CBD5E1", lineHeight: "1.6" }, "DM Sans"),
      divider(40, 220, 880, "#1E293B"),
      txt(40, 234, 880, 180, "📋  Check in at the front desk\n\n😷  Masks are recommended in clinical areas\n\n📱  Free Wi-Fi: BrightCare-Guest\n\n💧  Water & refreshments available in the waiting area\n\n🚗  Parking validation available at checkout", { fontSize: "16px", color: "#CBD5E1", lineHeight: "1.7" }, "DM Sans"),
      { id: tid(), type: "widget-clock", x: 780, y: 24, width: 140, height: 50, content: "", style: {}, visible: true, locked: false, filters: { ...DEFAULT_FILTERS } },
      divider(40, 430, 880, "#1E293B"),
      ...imgPlaceholder(40, 446, 150, 50, "CLINIC LOGO", "#5BA8D6"),
      txt(210, 452, 710, 22, "Call 0800 123 456  •  www.brightcare.co.uk  •  Open Mon–Sat 8 AM – 6 PM", { fontSize: "11px", fontWeight: "500", color: "#64748B", letterSpacing: "1px" }, "Space Grotesk"),
    ],
  },

  /* ─── SCHOOL NOTICE BOARD ─── */
  {
    id: "edu-notice",
    name: "School Notice Board",
    category: "education",
    preview: "📚",
    description: "Daily school notices with event photos",
    bg: { type: "gradient", color: "#0f1228", gradient: "linear-gradient(135deg, #0C0F22 0%, #161A2E 100%)" },
    elements: [
      ...imgPlaceholder(40, 24, 110, 70, "SCHOOL CREST", "#3B82F6"),
      txt(168, 28, 560, 42, "DAILY NOTICES", { fontSize: "38px", fontWeight: "900", color: "#FFFFFF", letterSpacing: "3px" }, "Oswald"),
      txt(168, 72, 400, 18, "MONDAY 14 APRIL 2026", { fontSize: "12px", fontWeight: "600", color: "#3B82F6", letterSpacing: "3px" }, "Space Grotesk"),
      { id: tid(), type: "widget-clock", x: 800, y: 30, width: 120, height: 50, content: "", style: {}, visible: true, locked: false, filters: { ...DEFAULT_FILTERS } },
      divider(40, 100, 880, "#1E293B"),
      txt(40, 114, 580, 310, "📢  Assembly at 9:00 AM — Main Hall\n     Guest speaker: Local MP on civic leadership\n\n📝  Year 11 Mock Results\n     Collect from form tutors today\n\n⚽  Football Trial — 3:30 PM\n     Meet at the sports pavilion\n\n🎭  Drama Club Auditions\n     Thursday lunch in the theatre\n\n📅  Parents Evening — 22 April\n     Book slots via the school app", { fontSize: "15px", color: "#CBD5E1", lineHeight: "1.55" }, "DM Sans"),
      txt(650, 114, 270, 14, "UPCOMING EVENTS", { fontSize: "10px", fontWeight: "700", color: "#3B82F6", letterSpacing: "3px" }, "Space Grotesk"),
      ...imgPlaceholder(650, 136, 270, 115, "EVENT PHOTO 1", "#3B82F6"),
      ...imgPlaceholder(650, 264, 270, 115, "EVENT PHOTO 2", "#3B82F6"),
      divider(40, 440, 880, "#1E293B"),
      txt(40, 454, 880, 20, "🍕  Canteen Special: Pizza Friday!  Pre-order by Wednesday via the app", { fontSize: "13px", fontWeight: "500", color: "#FFD700", textAlign: "center" }, "DM Sans"),
      txt(40, 482, 880, 16, "Greenwood Academy  •  Excellence in Education Since 1952", { fontSize: "10px", color: "#64748B", textAlign: "center", letterSpacing: "2px" }, "Space Grotesk"),
    ],
  },

  /* ─── CHURCH SERVICE TIMES ─── */
  {
    id: "church-service",
    name: "Service Times",
    category: "church",
    preview: "⛪",
    description: "Church service times with sanctuary photography",
    bg: { type: "gradient", color: "#0a0a14", gradient: "linear-gradient(180deg, #080810 0%, #121028 100%)" },
    elements: [
      ...imgPlaceholder(0, 0, 960, 140, "CHURCH / SANCTUARY", "#A78BFA"),
      ...imgPlaceholder(420, 150, 120, 55, "CHURCH LOGO", "#A78BFA"),
      txt(180, 214, 600, 42, "GRACE COMMUNITY CHURCH", { fontSize: "32px", fontWeight: "800", color: "#FFFFFF", textAlign: "center" }, "Oswald"),
      txt(180, 260, 600, 16, "ALL ARE WELCOME  •  COME AS YOU ARE", { fontSize: "11px", fontWeight: "600", color: "#A78BFA", letterSpacing: "4px", textAlign: "center" }, "Space Grotesk"),
      divider(400, 286, 160, "#A78BFA"),
      txt(180, 302, 600, 120, "SUNDAY SERVICES\n8:30 AM  •  Traditional Worship\n10:30 AM  •  Contemporary Worship\n6:00 PM  •  Evening Service\n\nWEDNESDAY  •  7:00 PM  •  Bible Study", { fontSize: "16px", color: "#CBD5E1", textAlign: "center", lineHeight: "1.65" }, "DM Sans"),
      txt(180, 436, 600, 20, "Children's Ministry & Nursery Available at All Services", { fontSize: "12px", fontWeight: "500", color: "#64748B", textAlign: "center", fontStyle: "italic" }, "Lora"),
      txt(180, 470, 600, 20, "📍 125 Oak Lane  •  📞 (555) 123-4567  •  www.gracechurch.org", { fontSize: "11px", color: "#64748B", textAlign: "center" }),
    ],
  },

  /* ─── CORPORATE LOBBY ─── */
  {
    id: "corporate-welcome",
    name: "Corporate Lobby",
    category: "corporate",
    preview: "🏢",
    description: "Professional office lobby with company branding",
    bg: { type: "gradient", color: "#0a0f1a", gradient: "linear-gradient(135deg, #080D18 0%, #101A2E 100%)" },
    elements: [
      ...imgPlaceholder(0, 0, 960, 160, "OFFICE / TEAM PHOTO", "#6B8DD6"),
      ...imgPlaceholder(380, 174, 200, 70, "COMPANY LOGO", "#6B8DD6"),
      txt(120, 256, 720, 38, "ACME CORPORATION", { fontSize: "44px", fontWeight: "900", color: "#FFFFFF", textAlign: "center" }, "Oswald"),
      txt(120, 300, 720, 24, "Innovation  •  Excellence  •  Integrity", { fontSize: "16px", fontWeight: "400", color: "#8899BB", textAlign: "center", fontStyle: "italic" }, "Lora"),
      divider(400, 336, 160, "#6B8DD6"),
      { id: tid(), type: "widget-clock", x: 380, y: 354, width: 200, height: 60, content: "", style: {}, visible: true, locked: false, filters: { ...DEFAULT_FILTERS } },
      txt(120, 430, 720, 24, "VISITOR CHECK-IN AT RECEPTION  •  FLOOR DIRECTORY ON RIGHT", { fontSize: "11px", fontWeight: "500", color: "#6B8DD6", letterSpacing: "3px", textAlign: "center" }, "Space Grotesk"),
      { id: tid(), type: "widget-weather", x: 380, y: 466, width: 200, height: 50, content: "", style: {}, visible: true, locked: false, filters: { ...DEFAULT_FILTERS } },
    ],
  },

  /* ─── KPI DASHBOARD ─── */
  {
    id: "corporate-kpi",
    name: "KPI Dashboard",
    category: "corporate",
    preview: "📈",
    description: "Key performance metrics with branded data cards",
    bg: { type: "gradient", color: "#0a0a12", gradient: "linear-gradient(180deg, #08080F 0%, #10101E 100%)" },
    elements: [
      ...imgPlaceholder(40, 20, 55, 36, "LOGO", "#6B8DD6"),
      txt(110, 20, 500, 34, "COMPANY DASHBOARD", { fontSize: "28px", fontWeight: "800", color: "#FFFFFF", letterSpacing: "3px" }, "Oswald"),
      txt(110, 56, 300, 16, "LIVE METRICS • Q2 2026", { fontSize: "11px", fontWeight: "500", color: "#6B8DD6", letterSpacing: "3px" }, "Space Grotesk"),
      // Metric cards row
      card(40, 84, 210, 110, "#141420", "#22C55E30"),
      txt(54, 94, 180, 14, "REVENUE", { fontSize: "10px", fontWeight: "600", color: "#22C55E", letterSpacing: "3px" }, "Space Grotesk"),
      txt(54, 114, 180, 36, "$2.4M", { fontSize: "34px", fontWeight: "800", color: "#FFFFFF" }, "Oswald"),
      txt(54, 160, 180, 16, "↑ 18% vs last quarter", { fontSize: "11px", fontWeight: "500", color: "#22C55E" }, "DM Sans"),
      card(268, 84, 210, 110, "#141420", "#3B82F630"),
      txt(282, 94, 180, 14, "CUSTOMERS", { fontSize: "10px", fontWeight: "600", color: "#3B82F6", letterSpacing: "3px" }, "Space Grotesk"),
      txt(282, 114, 180, 36, "12,847", { fontSize: "34px", fontWeight: "800", color: "#FFFFFF" }, "Oswald"),
      txt(282, 160, 180, 16, "↑ 340 new this month", { fontSize: "11px", fontWeight: "500", color: "#3B82F6" }, "DM Sans"),
      card(496, 84, 210, 110, "#141420", "#F59E0B30"),
      txt(510, 94, 180, 14, "NPS SCORE", { fontSize: "10px", fontWeight: "600", color: "#F59E0B", letterSpacing: "3px" }, "Space Grotesk"),
      txt(510, 114, 180, 36, "72", { fontSize: "34px", fontWeight: "800", color: "#FFFFFF" }, "Oswald"),
      txt(510, 160, 180, 16, "↑ 5 pts improvement", { fontSize: "11px", fontWeight: "500", color: "#F59E0B" }, "DM Sans"),
      card(724, 84, 196, 110, "#141420", "#A78BFA30"),
      txt(738, 94, 168, 14, "CHURN", { fontSize: "10px", fontWeight: "600", color: "#A78BFA", letterSpacing: "3px" }, "Space Grotesk"),
      txt(738, 114, 168, 36, "1.2%", { fontSize: "34px", fontWeight: "800", color: "#FFFFFF" }, "Oswald"),
      txt(738, 160, 168, 16, "↓ Best ever quarter", { fontSize: "11px", fontWeight: "500", color: "#A78BFA" }, "DM Sans"),
      divider(40, 208, 880, "#1E293B"),
      txt(40, 220, 500, 16, "TOP PRIORITIES THIS QUARTER", { fontSize: "11px", fontWeight: "600", color: "#6B8DD6", letterSpacing: "3px" }, "Space Grotesk"),
      txt(40, 244, 550, 180, "1. Launch v3.0 platform — On Track ✅\n2. Expand EMEA sales team — In Progress 🔄\n3. Achieve SOC2 compliance — 85% Complete\n4. Customer retention > 95% — Currently 96.2% ✅", { fontSize: "15px", color: "#C0CDE0", lineHeight: "1.9" }, "DM Sans"),
      ...imgPlaceholder(630, 224, 290, 190, "TEAM / OFFICE PHOTO", "#6B8DD6"),
      divider(40, 438, 880, "#1E293B"),
      txt(40, 452, 880, 16, "Auto-updated every 15 minutes  •  Data powered by your analytics platform", { fontSize: "10px", color: "#64748B", textAlign: "center" }),
    ],
  },

  /* ─── FREE WiFi ─── */
  {
    id: "social-wifi-qr",
    name: "Free WiFi",
    category: "social",
    preview: "📶",
    description: "WiFi connection screen with QR code",
    bg: { type: "gradient", color: "#0a1628", gradient: "linear-gradient(135deg, #081420 0%, #0E1E3A 100%)" },
    elements: [
      ...imgPlaceholder(380, 24, 200, 70, "YOUR LOGO", "#3B82F6"),
      txt(280, 110, 400, 48, "📶 FREE WiFi", { fontSize: "44px", fontWeight: "900", color: "#FFFFFF", textAlign: "center" }, "Oswald"),
      txt(280, 166, 400, 22, "SCAN TO CONNECT INSTANTLY", { fontSize: "13px", fontWeight: "600", color: "#3B82F6", letterSpacing: "4px", textAlign: "center" }, "Space Grotesk"),
      divider(400, 196, 160, "#3B82F6"),
      ...imgPlaceholder(350, 212, 260, 170, "QR CODE\n(WiFi auto-connect)", "#3B82F6"),
      card(280, 400, 400, 60, "#0E1E3A", "#1E3A5F"),
      txt(300, 410, 360, 40, "Network: YourBusiness-Guest\nPassword: welcome2026", { fontSize: "15px", fontWeight: "500", color: "#CBD5E1", textAlign: "center", lineHeight: "1.7" }, "DM Sans"),
      txt(280, 476, 400, 16, "By connecting you agree to our usage policy", { fontSize: "10px", color: "#4B5563", textAlign: "center" }),
    ],
  },

  /* ─── REVIEW WALL ─── */
  {
    id: "social-review-wall",
    name: "Review Wall",
    category: "social",
    preview: "⭐",
    description: "Customer testimonials with profile photos",
    bg: { type: "solid", color: "#08080F" },
    elements: [
      txt(200, 20, 560, 34, "WHAT OUR CUSTOMERS SAY", { fontSize: "26px", fontWeight: "800", color: "#FFFFFF", textAlign: "center", letterSpacing: "2px" }, "Oswald"),
      txt(350, 58, 260, 18, "⭐⭐⭐⭐⭐  4.9 / 5.0", { fontSize: "14px", fontWeight: "600", color: "#FFD700", textAlign: "center" }, "DM Sans"),
      divider(400, 84, 160, "#FFD700"),
      // Review 1
      card(40, 100, 280, 220, "#10101A", "#1E293B"),
      ...imgPlaceholder(120, 112, 80, 70, "PHOTO", "#FFD700"),
      txt(60, 190, 240, 18, "Sarah M.", { fontSize: "15px", fontWeight: "700", color: "#FFFFFF", textAlign: "center" }, "DM Sans"),
      txt(60, 210, 240, 14, "⭐⭐⭐⭐⭐", { fontSize: "11px", textAlign: "center", color: "#FFD700" }),
      txt(60, 230, 240, 70, "\"Absolutely fantastic service. Would highly recommend to everyone.\"", { fontSize: "12px", color: "#94A3B8", textAlign: "center", fontStyle: "italic", lineHeight: "1.5" }, "Lora"),
      // Review 2
      card(340, 100, 280, 220, "#10101A", "#1E293B"),
      ...imgPlaceholder(420, 112, 80, 70, "PHOTO", "#FFD700"),
      txt(360, 190, 240, 18, "James R.", { fontSize: "15px", fontWeight: "700", color: "#FFFFFF", textAlign: "center" }, "DM Sans"),
      txt(360, 210, 240, 14, "⭐⭐⭐⭐⭐", { fontSize: "11px", textAlign: "center", color: "#FFD700" }),
      txt(360, 230, 240, 70, "\"Best in the business. Professional and friendly from start to finish.\"", { fontSize: "12px", color: "#94A3B8", textAlign: "center", fontStyle: "italic", lineHeight: "1.5" }, "Lora"),
      // Review 3
      card(640, 100, 280, 220, "#10101A", "#1E293B"),
      ...imgPlaceholder(720, 112, 80, 70, "PHOTO", "#FFD700"),
      txt(660, 190, 240, 18, "Emma L.", { fontSize: "15px", fontWeight: "700", color: "#FFFFFF", textAlign: "center" }, "DM Sans"),
      txt(660, 210, 240, 14, "⭐⭐⭐⭐⭐", { fontSize: "11px", textAlign: "center", color: "#FFD700" }),
      txt(660, 230, 240, 70, "\"A truly premium experience. Can't fault a single thing.\"", { fontSize: "12px", color: "#94A3B8", textAlign: "center", fontStyle: "italic", lineHeight: "1.5" }, "Lora"),
      divider(40, 340, 880, "#1E293B"),
      ...imgPlaceholder(40, 360, 100, 80, "QR CODE", "#FFD700"),
      txt(160, 374, 280, 40, "Leave us a review!\nScan the QR code", { fontSize: "14px", fontWeight: "500", color: "#CBD5E1", lineHeight: "1.5" }, "DM Sans"),
      ...imgPlaceholder(780, 360, 140, 70, "YOUR LOGO", "#FFFFFF"),
    ],
  },

  /* ─── PROPERTY LISTINGS ─── */
  {
    id: "realestate-listings",
    name: "Property Listings",
    category: "realestate",
    preview: "🏠",
    description: "Property listing board with photo zones and details",
    bg: { type: "solid", color: "#080808" },
    elements: [
      ...imgPlaceholder(40, 16, 150, 44, "AGENCY LOGO", "#C9A96E"),
      txt(210, 18, 480, 30, "FEATURED PROPERTIES", { fontSize: "26px", fontWeight: "800", color: "#FFFFFF", letterSpacing: "3px" }, "Oswald"),
      txt(210, 50, 300, 14, "WILLIAMS ESTATES", { fontSize: "11px", fontWeight: "600", color: "#C9A96E", letterSpacing: "4px" }, "Space Grotesk"),
      // Property 1 — Large
      ...imgPlaceholder(40, 76, 450, 200, "PROPERTY PHOTO 1", "#C9A96E"),
      card(40, 280, 450, 90, "#101018", "#1E293B"),
      txt(54, 288, 300, 20, "Riverside Penthouse", { fontSize: "18px", fontWeight: "700", color: "#FFFFFF" }, "Playfair Display"),
      txt(54, 312, 300, 14, "3 bed  •  2 bath  •  1,850 sq ft  •  River views", { fontSize: "11px", color: "#94A3B8" }),
      txt(54, 334, 180, 24, "$1,250,000", { fontSize: "22px", fontWeight: "800", color: "#C9A96E" }, "Oswald"),
      txt(350, 334, 130, 18, "FOR SALE", { fontSize: "11px", fontWeight: "700", color: "#22C55E", letterSpacing: "3px" }, "Space Grotesk"),
      // Property 2
      ...imgPlaceholder(510, 76, 410, 130, "PROPERTY PHOTO 2", "#C9A96E"),
      txt(510, 212, 300, 18, "Victorian Townhouse", { fontSize: "16px", fontWeight: "700", color: "#FFFFFF" }, "Playfair Display"),
      txt(510, 234, 300, 12, "4 bed  •  3 bath  •  Garden  •  Garage", { fontSize: "10px", color: "#94A3B8" }),
      txt(510, 250, 180, 22, "$875,000", { fontSize: "20px", fontWeight: "800", color: "#C9A96E" }, "Oswald"),
      // Property 3
      ...imgPlaceholder(510, 280, 410, 90, "PROPERTY PHOTO 3", "#C9A96E"),
      txt(510, 376, 300, 18, "Modern City Apartment", { fontSize: "16px", fontWeight: "700", color: "#FFFFFF" }, "Playfair Display"),
      txt(510, 398, 300, 12, "2 bed  •  1 bath  •  Balcony  •  Parking", { fontSize: "10px", color: "#94A3B8" }),
      txt(510, 414, 180, 22, "$425,000", { fontSize: "20px", fontWeight: "800", color: "#C9A96E" }, "Oswald"),
      divider(40, 446, 880, "#C9A96E"),
      txt(40, 460, 880, 18, "📞 020 7123 4567  •  📧 info@williamsestates.co.uk  •  🌐 williamsestates.co.uk", { fontSize: "11px", fontWeight: "500", color: "#94A3B8", textAlign: "center" }),
    ],
  },
];

/* ── Tag map for searchability ── */
const TEMPLATE_TAGS: Record<string, string[]> = {
  "menu-cafe": ["coffee", "cafe", "drinks", "espresso", "latte", "beverages", "shop", "prices"],
  "menu-restaurant": ["dinner", "food", "specials", "dining", "elegant", "fine dining", "starter", "dessert"],
  "menu-bar": ["cocktail", "bar", "drinks", "nightclub", "happy hour", "neon", "pub", "alcohol"],
  "menu-pizza": ["pizza", "italian", "food", "restaurant", "wood-fired", "oven", "pepperoni", "prices"],
  "promo-flash-sale": ["sale", "discount", "deal", "offer", "limited", "flash", "shopping"],
  "promo-happy-hour": ["happy hour", "drinks", "bar", "cocktails", "friday", "promotion"],
  "promo-seasonal": ["seasonal", "collection", "spring", "summer", "fashion", "limited"],
  "info-welcome": ["welcome", "lobby", "reception", "visitor", "entrance"],
  "info-event": ["event", "conference", "seminar", "workshop", "schedule", "speakers"],
  "fitness-class": ["gym", "class", "workout", "exercise", "HIIT", "yoga", "spin", "boxing"],
  "retail-window": ["window", "display", "storefront", "fashion", "boutique", "shop", "product"],
  "hotel-welcome": ["hotel", "lobby", "guest", "hospitality", "resort", "concierge", "spa"],
  "health-waiting": ["waiting room", "clinic", "patient", "doctor", "medical", "hospital"],
  "edu-notice": ["school", "notice", "announcement", "student", "campus", "bulletin"],
  "church-service": ["church", "worship", "service", "prayer", "sunday", "mass"],
  "corporate-welcome": ["office", "lobby", "corporate", "company", "reception", "professional"],
  "corporate-kpi": ["dashboard", "KPI", "metrics", "analytics", "performance", "revenue"],
  "social-wifi-qr": ["wifi", "QR code", "scan", "connect", "internet", "password", "network"],
  "social-review-wall": ["reviews", "ratings", "testimonials", "google", "yelp", "stars"],
  "realestate-listings": ["real estate", "property", "house", "apartment", "listing", "agent", "for sale"],
};

/* ── Category config ── */
const CATEGORIES: { id: TemplateCategory; label: string; icon: React.FC<{ className?: string }> }[] = [
  { id: "all", label: "All Templates", icon: LayoutTemplate },
  { id: "menu", label: "Menu Boards", icon: Utensils },
  { id: "promo", label: "Promotions", icon: Tag },
  { id: "info", label: "Info Displays", icon: Info },
  { id: "social", label: "Social & QR", icon: Share2 },
  { id: "fitness", label: "Gym & Fitness", icon: Dumbbell },
  { id: "retail", label: "Retail", icon: Store },
  { id: "hotel", label: "Hotel Lobby", icon: Hotel },
  { id: "health", label: "Healthcare", icon: HeartPulse },
  { id: "education", label: "Education", icon: GraduationCap },
  { id: "church", label: "Church", icon: Church },
  { id: "corporate", label: "Corporate", icon: Building2 },
  { id: "realestate", label: "Real Estate", icon: Home },
];

/* ── Mini canvas thumbnail ── */
const CANVAS_W = 960;
const CANVAS_H = 540;

function MiniCanvasPreview({ elements }: { elements: CanvasElement[] }) {
  const rendered = useMemo(() => {
    return elements
      .filter((el) => el.visible && (el.type === "text" || el.type === "shape"))
      .map((el) => {
        const scaleX = 100 / CANVAS_W;
        const scaleY = 100 / CANVAS_H;
        const left = `${el.x * scaleX}%`;
        const top = `${el.y * scaleY}%`;
        const width = `${el.width * scaleX}%`;
        const height = `${el.height * scaleY}%`;

        if (el.type === "shape" && el.shapeType === "line") {
          return (
            <div
              key={el.id}
              className="absolute"
              style={{
                left, top, width, height: `${Math.max(el.shapeStrokeWidth || 2, 1) * scaleY}%`,
                minHeight: "1px",
                backgroundColor: el.shapeFill || el.shapeStroke || "#fff",
              }}
            />
          );
        }

        if (el.type === "shape") {
          return (
            <div
              key={el.id}
              className="absolute"
              style={{
                left, top, width, height,
                backgroundColor: el.shapeFill || "transparent",
                border: el.shapeStroke ? `1px solid ${el.shapeStroke}` : undefined,
                borderRadius: el.shapeType === "circle" ? "50%" : el.shapeType === "rounded-rect" ? "4px" : undefined,
              }}
            />
          );
        }

        // Text — render at tiny scale
        const fontSize = parseFloat(el.style.fontSize || "16");
        const scaledFontSize = Math.max(fontSize * scaleX * 0.9, 1.5);

        return (
          <div
            key={el.id}
            className="absolute overflow-hidden"
            style={{
              left, top, width, height,
              fontSize: `${scaledFontSize}px`,
              fontWeight: el.style.fontWeight || "400",
              color: el.style.color || "#fff",
              lineHeight: el.style.lineHeight || "1.4",
              textAlign: (el.style.textAlign as any) || "left",
              letterSpacing: el.style.letterSpacing ? `${parseFloat(el.style.letterSpacing) * scaleX}px` : undefined,
              fontFamily: el.fontFamily || "sans-serif",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
            }}
          >
            {el.content}
          </div>
        );
      });
  }, [elements]);

  return (
    <div className="absolute inset-0 pointer-events-none select-none" style={{ contain: "layout style" }}>
      {rendered}
    </div>
  );
}

/* ── Component ── */
interface StudioTemplateGalleryProps {
  open: boolean;
  onClose: () => void;
  onApply: (elements: CanvasElement[], bg?: StudioTemplate["bg"]) => void;
}

export function StudioTemplateGallery({ open, onClose, onApply }: StudioTemplateGalleryProps) {
  const [category, setCategory] = useState<TemplateCategory>("all");
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    let list = category === "all" ? TEMPLATES : TEMPLATES.filter((t) => t.category === category);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((t) => {
        const tags = (t.tags || TEMPLATE_TAGS[t.id] || []).join(" ").toLowerCase();
        return t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q) || tags.includes(q);
      });
    }
    return list;
  }, [category, search]);

  const handleApply = (tpl: StudioTemplate) => {
    // Preload all template fonts before applying
    const fonts = new Set<string>();
    tpl.elements.forEach((el) => {
      if (el.fontFamily && el.fontFamily !== "Satoshi") fonts.add(el.fontFamily);
    });
    fonts.forEach((f) => {
      const existing = document.querySelector(`link[href*="${encodeURIComponent(f)}"]`);
      if (!existing) {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(f)}:wght@300;400;500;600;700;800;900&display=swap`;
        document.head.appendChild(link);
      }
    });
    // Auto-scale elements to fit 960x540 canvas
    const TARGET_W = 960;
    const TARGET_H = 540;
    let maxRight = 0, maxBottom = 0;
    tpl.elements.forEach((el) => {
      maxRight = Math.max(maxRight, el.x + el.width);
      maxBottom = Math.max(maxBottom, el.y + el.height);
    });
    const scaleX = maxRight > TARGET_W ? TARGET_W / maxRight : 1;
    const scaleY = maxBottom > TARGET_H ? TARGET_H / maxBottom : 1;
    const scale = Math.min(scaleX, scaleY);

    // Re-generate IDs and scale coordinates if needed
    const freshElements = tpl.elements.map((el) => {
      const scaled = scale < 1 ? {
        x: Math.round(el.x * scale),
        y: Math.round(el.y * scale),
        width: Math.round(el.width * scale),
        height: Math.round(el.height * scale),
        style: {
          ...el.style,
          ...(el.style.fontSize ? { fontSize: `${Math.round(parseFloat(el.style.fontSize) * scale)}px` } : {}),
        },
      } : {};
      return {
        ...el,
        ...scaled,
        id: `el-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      };
    });
    onApply(freshElements, tpl.bg);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-4xl max-h-[85vh] p-0 overflow-hidden bg-card border-border/30">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-border/20">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-xl bg-primary/10">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">Template Gallery</h2>
              <p className="text-xs text-muted-foreground">Professional layouts with image placeholders — customize everything</p>
            </div>
          </div>

          {/* Search */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search templates…"
              className="pl-9 h-9 text-sm bg-muted/30 border-border/20"
            />
          </div>

          {/* Category tabs */}
          <div className="flex gap-2 flex-wrap">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  category === cat.id
                    ? "bg-primary/15 text-primary border border-primary/30"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/40 border border-transparent"
                }`}
              >
                <cat.icon className="h-3.5 w-3.5" />
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {filtered.map((tpl) => {
              const q = search.trim().toLowerCase();
              const tags = tpl.tags || TEMPLATE_TAGS[tpl.id] || [];
              const matchingTags = q ? tags.filter(tag => tag.toLowerCase().includes(q)) : [];
              return (
              <button
                key={tpl.id}
                onClick={() => handleApply(tpl)}
                onMouseEnter={() => setHoveredId(tpl.id)}
                onMouseLeave={() => setHoveredId(null)}
                className="group relative rounded-xl border border-border/20 bg-muted/20 overflow-hidden text-left transition-all hover:border-primary/40 hover:shadow-[0_0_20px_hsl(var(--primary)/0.1)] focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                {/* Mini canvas preview */}
                <div
                  className="aspect-video relative overflow-hidden"
                  style={{
                    background: tpl.bg?.gradient || tpl.bg?.color || "#0a0a12",
                  }}
                >
                  <MiniCanvasPreview elements={tpl.elements} />
                  {/* Hover overlay */}
                  <div className={`absolute inset-0 bg-primary/10 flex items-center justify-center transition-opacity ${hoveredId === tpl.id ? "opacity-100" : "opacity-0"}`}>
                    <span className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold">
                      Use Template
                    </span>
                  </div>
                </div>

                {/* Info */}
                <div className="p-3">
                  <p className="text-sm font-semibold text-foreground">{tpl.name}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">{tpl.description}</p>
                  {matchingTags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {matchingTags.slice(0, 4).map((tag) => (
                        <span
                          key={tag}
                          className="inline-block px-1.5 py-0.5 rounded text-[10px] font-medium bg-primary/15 text-primary border border-primary/20"
                        >
                          {tag}
                        </span>
                      ))}
                      {matchingTags.length > 4 && (
                        <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-medium text-muted-foreground">
                          +{matchingTags.length - 4}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </button>
              );
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
