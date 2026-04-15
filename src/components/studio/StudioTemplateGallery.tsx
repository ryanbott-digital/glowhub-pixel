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

/* ── Image placeholder helper: creates a rounded-rect zone + camera icon label ── */
const imgPlaceholder = (x: number, y: number, w: number, h: number, label = "YOUR IMAGE", borderColor = "#334155"): CanvasElement[] => [
  { id: tid(), type: "shape", x, y, width: w, height: h, content: "", style: {}, shapeType: "rounded-rect", shapeFill: "#0f1219", shapeStroke: borderColor, shapeStrokeWidth: 2, visible: true, locked: false, filters: { ...DEFAULT_FILTERS } },
  { id: tid(), type: "text", x, y: y + h / 2 - 18, width: w, height: 36, content: `📸\n${label}`, style: { fontSize: "13px", fontWeight: "500", color: "#475569", textAlign: "center", lineHeight: "1.4" }, visible: true, locked: false, fontFamily: "DM Sans", filters: { ...DEFAULT_FILTERS } },
];

/* ── Pre-made templates ── */
const TEMPLATES: StudioTemplate[] = [
  /* ─── MENU BOARDS ─── */
  {
    id: "menu-cafe",
    name: "Café Menu",
    category: "menu",
    preview: "☕",
    description: "Modern coffee shop menu with hero image and pricing columns",
    bg: { type: "gradient", color: "#1a1a2e", gradient: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)" },
    elements: [
      // Hero image area
      ...imgPlaceholder(40, 20, 300, 200, "HERO PHOTO", "#D4A574"),
      // Title
      { id: tid(), type: "text", x: 370, y: 30, width: 550, height: 50, content: "THE DAILY GRIND", style: { fontSize: "42px", fontWeight: "800", color: "#F5DEB3" }, visible: true, locked: false, fontFamily: "Playfair Display", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "shape", x: 370, y: 85, width: 200, height: 3, content: "", style: {}, shapeType: "line", shapeFill: "#D4A574", shapeStroke: "#D4A574", shapeStrokeWidth: 3, visible: true, locked: false, filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 370, y: 100, width: 550, height: 22, content: "CRAFTED COFFEE  •  BAKED DAILY", style: { fontSize: "12px", fontWeight: "600", color: "#D4A574", letterSpacing: "4px" }, visible: true, locked: false, fontFamily: "Space Grotesk", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 370, y: 135, width: 550, height: 90, content: "Espresso ........................ $3.50\nAmericano ..................... $4.00\nCappuccino ................... $4.50\nLatte ............................... $4.75", style: { fontSize: "15px", fontWeight: "400", color: "#E8D5B7", lineHeight: "1.8" }, visible: true, locked: false, fontFamily: "DM Sans", filters: { ...DEFAULT_FILTERS } },
      // Second column
      { id: tid(), type: "text", x: 40, y: 240, width: 400, height: 28, content: "COLD BREW & ICED", style: { fontSize: "18px", fontWeight: "700", color: "#D4A574", letterSpacing: "4px" }, visible: true, locked: false, fontFamily: "Bebas Neue", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 40, y: 275, width: 400, height: 120, content: "Cold Brew ...................... $4.50\nIced Latte ....................... $5.00\nIced Mocha .................... $5.50\nFrappé ........................... $5.75", style: { fontSize: "15px", fontWeight: "400", color: "#E8D5B7", lineHeight: "1.8" }, visible: true, locked: false, fontFamily: "DM Sans", filters: { ...DEFAULT_FILTERS } },
      // Pastry image zone
      ...imgPlaceholder(500, 240, 420, 160, "PASTRY PHOTO", "#D4A574"),
      // Footer
      { id: tid(), type: "text", x: 40, y: 420, width: 880, height: 28, content: "✦ Ask about our seasonal specials  •  Oat & soy milk available ✦", style: { fontSize: "14px", fontWeight: "500", color: "#D4A574", textAlign: "center", fontStyle: "italic" }, visible: true, locked: false, fontFamily: "Lora", filters: { ...DEFAULT_FILTERS } },
    ],
  },
  {
    id: "menu-restaurant",
    name: "Restaurant Specials",
    category: "menu",
    preview: "🍽️",
    description: "Elegant specials board with dish photography zones",
    bg: { type: "solid", color: "#0f0f0f" },
    elements: [
      { id: tid(), type: "text", x: 60, y: 25, width: 500, height: 50, content: "TODAY'S SPECIALS", style: { fontSize: "44px", fontWeight: "900", color: "#FFFFFF", letterSpacing: "6px" }, visible: true, locked: false, fontFamily: "Oswald", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "shape", x: 60, y: 80, width: 160, height: 4, content: "", style: {}, shapeType: "line", shapeFill: "#B8860B", shapeStroke: "#B8860B", shapeStrokeWidth: 4, visible: true, locked: false, filters: { ...DEFAULT_FILTERS } },
      // Starter row
      { id: tid(), type: "text", x: 60, y: 100, width: 120, height: 20, content: "STARTER", style: { fontSize: "13px", fontWeight: "600", color: "#D4A017", letterSpacing: "5px" }, visible: true, locked: false, fontFamily: "Space Grotesk", filters: { ...DEFAULT_FILTERS } },
      ...imgPlaceholder(60, 125, 180, 120, "DISH PHOTO", "#D4A017"),
      { id: tid(), type: "text", x: 260, y: 130, width: 350, height: 25, content: "Burrata with Heirloom Tomatoes", style: { fontSize: "20px", fontWeight: "300", color: "#FFFFFF" }, visible: true, locked: false, fontFamily: "Playfair Display", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 260, y: 160, width: 350, height: 20, content: "Fresh basil oil, aged balsamic, micro herbs", style: { fontSize: "13px", fontWeight: "400", color: "#94A3B8" }, visible: true, locked: false, fontFamily: "Inter", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 260, y: 190, width: 80, height: 25, content: "$14", style: { fontSize: "22px", fontWeight: "700", color: "#D4A017" }, visible: true, locked: false, fontFamily: "Oswald", filters: { ...DEFAULT_FILTERS } },
      // Main row
      { id: tid(), type: "text", x: 60, y: 260, width: 120, height: 20, content: "MAIN", style: { fontSize: "13px", fontWeight: "600", color: "#D4A017", letterSpacing: "5px" }, visible: true, locked: false, fontFamily: "Space Grotesk", filters: { ...DEFAULT_FILTERS } },
      ...imgPlaceholder(60, 285, 180, 120, "DISH PHOTO", "#D4A017"),
      { id: tid(), type: "text", x: 260, y: 290, width: 350, height: 25, content: "Pan-Seared Salmon", style: { fontSize: "20px", fontWeight: "300", color: "#FFFFFF" }, visible: true, locked: false, fontFamily: "Playfair Display", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 260, y: 320, width: 350, height: 20, content: "Dill cream, grilled asparagus, lemon butter", style: { fontSize: "13px", fontWeight: "400", color: "#94A3B8" }, visible: true, locked: false, fontFamily: "Inter", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 260, y: 350, width: 80, height: 25, content: "$28", style: { fontSize: "22px", fontWeight: "700", color: "#D4A017" }, visible: true, locked: false, fontFamily: "Oswald", filters: { ...DEFAULT_FILTERS } },
      // Right side image
      ...imgPlaceholder(660, 100, 260, 310, "AMBIANCE PHOTO", "#B8860B"),
      // Dessert
      { id: tid(), type: "text", x: 60, y: 425, width: 120, height: 20, content: "DESSERT", style: { fontSize: "13px", fontWeight: "600", color: "#D4A017", letterSpacing: "5px" }, visible: true, locked: false, fontFamily: "Space Grotesk", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 60, y: 450, width: 450, height: 22, content: "Dark Chocolate Fondant with Salted Caramel — $12", style: { fontSize: "17px", fontWeight: "300", color: "#FFFFFF" }, visible: true, locked: false, fontFamily: "Inter", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 660, y: 425, width: 260, height: 40, content: "Reservations: 020 7123 4567", style: { fontSize: "14px", fontWeight: "500", color: "#94A3B8", textAlign: "center" }, visible: true, locked: false, fontFamily: "Inter", filters: { ...DEFAULT_FILTERS } },
    ],
  },
  {
    id: "menu-bar",
    name: "Bar & Cocktails",
    category: "menu",
    preview: "🍸",
    description: "Neon cocktail menu with drink photography zones",
    bg: { type: "gradient", color: "#0a0a1a", gradient: "linear-gradient(180deg, #0a0a1a 0%, #1a0a2e 100%)" },
    elements: [
      { id: tid(), type: "text", x: 80, y: 25, width: 500, height: 55, content: "COCKTAIL HOUR", style: { fontSize: "48px", fontWeight: "900", color: "#FF6B9D" }, visible: true, locked: false, fontFamily: "Righteous", filters: { ...DEFAULT_FILTERS }, glowIntensity: 80 },
      { id: tid(), type: "text", x: 80, y: 85, width: 500, height: 22, content: "HAPPY HOUR 5–7 PM • ALL $8", style: { fontSize: "14px", fontWeight: "600", color: "#FFD700", letterSpacing: "3px" }, visible: true, locked: false, fontFamily: "Bebas Neue", filters: { ...DEFAULT_FILTERS } },
      // Cocktail images row
      ...imgPlaceholder(640, 20, 280, 180, "COCKTAIL PHOTO", "#FF6B9D"),
      // Drink list
      { id: tid(), type: "text", x: 80, y: 120, width: 520, height: 350, content: "🍋 Lemon Drop Martini ............... $12\nVodka, triple sec, fresh lemon, sugar rim\n\n🌿 Mojito Fresco ........................... $11\nWhite rum, mint, lime, soda\n\n🥃 Old Fashioned .......................... $14\nBourbon, Angostura bitters, orange peel\n\n🍓 Strawberry Daiquiri .................. $12\nRum, fresh strawberries, lime\n\n🫒 Espresso Martini ....................... $13\nVodka, Kahlúa, fresh espresso", style: { fontSize: "16px", fontWeight: "400", color: "#E8D5FF", lineHeight: "1.55" }, visible: true, locked: false, fontFamily: "DM Sans", filters: { ...DEFAULT_FILTERS } },
      // Bottom cocktail images
      ...imgPlaceholder(640, 220, 135, 120, "DRINK 1", "#A855F7"),
      ...imgPlaceholder(785, 220, 135, 120, "DRINK 2", "#A855F7"),
      { id: tid(), type: "text", x: 640, y: 360, width: 280, height: 100, content: "🍺 CRAFT BEERS\nAsk your bartender about\nour rotating tap selection", style: { fontSize: "15px", fontWeight: "500", color: "#FFD700", textAlign: "center", lineHeight: "1.7" }, visible: true, locked: false, fontFamily: "DM Sans", filters: { ...DEFAULT_FILTERS } },
    ],
  },
  {
    id: "menu-pizza",
    name: "Pizza Menu",
    category: "menu",
    preview: "🍕",
    description: "Wood-fired pizza menu with hero food photography",
    bg: { type: "gradient", color: "#1a0a0a", gradient: "linear-gradient(180deg, #1a0a0a 0%, #2a1510 50%, #1a0a0a 100%)" },
    elements: [
      // Hero banner
      ...imgPlaceholder(0, 0, 960, 160, "HERO — WOOD-FIRED OVEN PHOTO", "#FF6B35"),
      // Overlay title on hero
      { id: tid(), type: "text", x: 200, y: 40, width: 560, height: 70, content: "STONE OVEN PIZZERIA", style: { fontSize: "48px", fontWeight: "900", color: "#FFD700", textAlign: "center" }, visible: true, locked: false, fontFamily: "Oswald", filters: { ...DEFAULT_FILTERS }, glowIntensity: 30, entranceAnim: "fade-in" },
      { id: tid(), type: "text", x: 200, y: 115, width: 560, height: 22, content: "HAND-STRETCHED  •  WOOD-FIRED  •  STONE BAKED", style: { fontSize: "11px", fontWeight: "600", color: "#FF6B35", letterSpacing: "4px", textAlign: "center" }, visible: true, locked: false, fontFamily: "Space Grotesk", filters: { ...DEFAULT_FILTERS } },
      // Classic column
      { id: tid(), type: "text", x: 50, y: 175, width: 300, height: 28, content: "CLASSIC PIZZAS", style: { fontSize: "18px", fontWeight: "700", color: "#FF6B35", letterSpacing: "4px" }, visible: true, locked: false, fontFamily: "Bebas Neue", filters: { ...DEFAULT_FILTERS }, entranceAnim: "fade-in", enterDelay: 200 },
      { id: tid(), type: "text", x: 50, y: 210, width: 400, height: 200, content: "Margherita .......................... $12\nFresh mozzarella, San Marzano, basil\n\nPepperoni ............................. $14\nDouble pepperoni, mozzarella blend\n\nQuattro Formaggi ................ $16\nMozzarella, gorgonzola, parmesan, fontina", style: { fontSize: "15px", fontWeight: "400", color: "#E8D0C0", lineHeight: "1.55" }, visible: true, locked: false, fontFamily: "DM Sans", filters: { ...DEFAULT_FILTERS }, entranceAnim: "fade-in", enterDelay: 300 },
      // Gourmet column
      { id: tid(), type: "text", x: 500, y: 175, width: 300, height: 28, content: "GOURMET PIZZAS", style: { fontSize: "18px", fontWeight: "700", color: "#FF6B35", letterSpacing: "4px" }, visible: true, locked: false, fontFamily: "Bebas Neue", filters: { ...DEFAULT_FILTERS }, entranceAnim: "fade-in", enterDelay: 250 },
      { id: tid(), type: "text", x: 500, y: 210, width: 420, height: 200, content: "Truffle Mushroom ............... $19\nWild mushrooms, truffle oil, fontina\n\nProsciutto & Fig .................. $20\nParma ham, fig jam, arugula, balsamic\n\nBBQ Pulled Pork .................. $18\nSlow-cooked pork, BBQ glaze, jalapeños", style: { fontSize: "15px", fontWeight: "400", color: "#E8D0C0", lineHeight: "1.55" }, visible: true, locked: false, fontFamily: "DM Sans", filters: { ...DEFAULT_FILTERS }, entranceAnim: "fade-in", enterDelay: 400 },
      // Bottom bar
      { id: tid(), type: "shape", x: 50, y: 430, width: 860, height: 3, content: "", style: {}, shapeType: "line", shapeFill: "#FF6B35", shapeStroke: "#FF6B35", shapeStrokeWidth: 2, visible: true, locked: false, filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 50, y: 445, width: 860, height: 50, content: "Garlic Bread $6  •  Caesar Salad $9  •  Tiramisu $8  •  Gelato $7", style: { fontSize: "16px", fontWeight: "400", color: "#E8D0C0", textAlign: "center", lineHeight: "1.8" }, visible: true, locked: false, fontFamily: "DM Sans", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 200, y: 500, width: 560, height: 28, content: "🔥 ALL PIZZAS HAND-STRETCHED & WOOD-FIRED 🔥", style: { fontSize: "13px", fontWeight: "600", color: "#FFD700", textAlign: "center", letterSpacing: "2px" }, visible: true, locked: false, fontFamily: "Space Grotesk", filters: { ...DEFAULT_FILTERS }, animation: "pulse" },
    ],
  },

  /* ─── PROMOTIONS ─── */
  {
    id: "promo-flash-sale",
    name: "Flash Sale",
    category: "promo",
    preview: "⚡",
    description: "Bold flash sale with product image zones",
    bg: { type: "gradient", color: "#0f0f0f", gradient: "linear-gradient(135deg, #1a0000 0%, #0f0f0f 50%, #001a1a 100%)" },
    elements: [
      { id: tid(), type: "text", x: 50, y: 30, width: 500, height: 60, content: "⚡ FLASH SALE ⚡", style: { fontSize: "52px", fontWeight: "900", color: "#FF4444", textAlign: "center" }, visible: true, locked: false, fontFamily: "Russo One", filters: { ...DEFAULT_FILTERS }, animation: "pulse" },
      { id: tid(), type: "text", x: 50, y: 100, width: 500, height: 180, content: "50%\nOFF", style: { fontSize: "110px", fontWeight: "900", color: "#FFFFFF", textAlign: "center", lineHeight: "0.9" }, visible: true, locked: false, fontFamily: "Bebas Neue", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 50, y: 290, width: 500, height: 35, content: "EVERYTHING IN STORE", style: { fontSize: "22px", fontWeight: "700", color: "#FF6B35", textAlign: "center", letterSpacing: "5px" }, visible: true, locked: false, fontFamily: "Space Grotesk", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 50, y: 340, width: 500, height: 30, content: "THIS WEEKEND ONLY", style: { fontSize: "18px", fontWeight: "500", color: "#94A3B8", textAlign: "center", letterSpacing: "3px" }, visible: true, locked: false, fontFamily: "Inter", filters: { ...DEFAULT_FILTERS } },
      // Product images grid
      ...imgPlaceholder(600, 30, 320, 155, "PRODUCT 1", "#FF4444"),
      ...imgPlaceholder(600, 200, 155, 155, "PRODUCT 2", "#FF6B35"),
      ...imgPlaceholder(765, 200, 155, 155, "PRODUCT 3", "#FF6B35"),
      { id: tid(), type: "text", x: 600, y: 375, width: 320, height: 60, content: "Shop in-store or online\nwww.yourstore.com", style: { fontSize: "16px", fontWeight: "500", color: "#94A3B8", textAlign: "center", lineHeight: "1.6" }, visible: true, locked: false, fontFamily: "Inter", filters: { ...DEFAULT_FILTERS } },
      // QR code zone
      ...imgPlaceholder(100, 390, 120, 120, "QR CODE", "#FF4444"),
      { id: tid(), type: "text", x: 240, y: 420, width: 300, height: 50, content: "Scan for exclusive\nonline-only deals", style: { fontSize: "16px", fontWeight: "500", color: "#FFD700", lineHeight: "1.5" }, visible: true, locked: false, fontFamily: "DM Sans", filters: { ...DEFAULT_FILTERS } },
    ],
  },
  {
    id: "promo-happy-hour",
    name: "Happy Hour",
    category: "promo",
    preview: "🎉",
    description: "Vibrant happy hour with drink images and offers",
    bg: { type: "gradient", color: "#0a1628", gradient: "linear-gradient(135deg, #0a1628 0%, #1a0a28 100%)" },
    elements: [
      { id: tid(), type: "text", x: 60, y: 40, width: 500, height: 70, content: "HAPPY HOUR", style: { fontSize: "64px", fontWeight: "900", color: "#FFD700" }, visible: true, locked: false, fontFamily: "Righteous", filters: { ...DEFAULT_FILTERS }, glowIntensity: 60 },
      { id: tid(), type: "text", x: 60, y: 115, width: 500, height: 35, content: "EVERY FRIDAY 4 PM – 7 PM", style: { fontSize: "22px", fontWeight: "600", color: "#FFFFFF", letterSpacing: "3px" }, visible: true, locked: false, fontFamily: "Bebas Neue", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "shape", x: 60, y: 160, width: 200, height: 3, content: "", style: {}, shapeType: "line", shapeFill: "#FFD700", shapeStroke: "#FFD700", shapeStrokeWidth: 3, visible: true, locked: false, filters: { ...DEFAULT_FILTERS } },
      // Drink images
      ...imgPlaceholder(620, 30, 300, 220, "DRINKS PHOTO", "#FFD700"),
      // Offers
      { id: tid(), type: "text", x: 60, y: 180, width: 520, height: 280, content: "🍺 Draft Beers — $4\n🍷 House Wine — $6\n🍹 Well Cocktails — $5\n🍕 Appetizers — Half Price", style: { fontSize: "28px", fontWeight: "400", color: "#E2E8F0", lineHeight: "2.2" }, visible: true, locked: false, fontFamily: "DM Sans", filters: { ...DEFAULT_FILTERS } },
      // Logo area
      ...imgPlaceholder(660, 280, 220, 100, "YOUR LOGO", "#FFD700"),
      { id: tid(), type: "text", x: 60, y: 470, width: 860, height: 30, content: "No reservations needed  •  Walk-ins welcome  •  Live music every Friday", style: { fontSize: "15px", fontWeight: "400", color: "#64748B", textAlign: "center", fontStyle: "italic" }, visible: true, locked: false, fontFamily: "Lora", filters: { ...DEFAULT_FILTERS } },
    ],
  },
  {
    id: "promo-seasonal",
    name: "Seasonal Offer",
    category: "promo",
    preview: "🌸",
    description: "Elegant seasonal promotion with collection imagery",
    bg: { type: "gradient", color: "#0f1923", gradient: "linear-gradient(180deg, #0f1923 0%, #1a2332 100%)" },
    elements: [
      // Full-width hero image
      ...imgPlaceholder(500, 40, 420, 350, "COLLECTION PHOTO", "#E879A8"),
      { id: tid(), type: "text", x: 60, y: 50, width: 400, height: 30, content: "LIMITED TIME OFFER", style: { fontSize: "14px", fontWeight: "600", color: "#E879A8", letterSpacing: "6px" }, visible: true, locked: false, fontFamily: "Space Grotesk", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 60, y: 100, width: 400, height: 110, content: "Spring\nCollection", style: { fontSize: "64px", fontWeight: "300", color: "#FFFFFF", lineHeight: "1.1" }, visible: true, locked: false, fontFamily: "Playfair Display", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 60, y: 230, width: 400, height: 70, content: "Refresh your space with our curated spring selection. New arrivals weekly.", style: { fontSize: "18px", fontWeight: "400", color: "#94A3B8", lineHeight: "1.6" }, visible: true, locked: false, fontFamily: "Inter", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 60, y: 320, width: 200, height: 60, content: "20% OFF", style: { fontSize: "52px", fontWeight: "900", color: "#E879A8" }, visible: true, locked: false, fontFamily: "Bebas Neue", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 60, y: 385, width: 400, height: 30, content: "Use code: SPRING2026", style: { fontSize: "18px", fontWeight: "500", color: "#FFD700", letterSpacing: "3px" }, visible: true, locked: false, fontFamily: "Space Grotesk", filters: { ...DEFAULT_FILTERS } },
      // QR code
      ...imgPlaceholder(60, 430, 100, 80, "QR CODE", "#E879A8"),
      { id: tid(), type: "text", x: 175, y: 445, width: 250, height: 40, content: "Scan to shop the\ncollection online", style: { fontSize: "14px", fontWeight: "400", color: "#94A3B8", lineHeight: "1.5" }, visible: true, locked: false, fontFamily: "Inter", filters: { ...DEFAULT_FILTERS } },
    ],
  },

  /* ─── INFO DISPLAYS ─── */
  {
    id: "info-welcome",
    name: "Welcome Screen",
    category: "info",
    preview: "👋",
    description: "Corporate welcome with logo zone and visitor directions",
    bg: { type: "gradient", color: "#0a0f1a", gradient: "linear-gradient(135deg, #0a0f1a 0%, #1a1a2e 100%)" },
    elements: [
      // Logo placeholder
      ...imgPlaceholder(350, 60, 260, 100, "YOUR LOGO", "#6B8DD6"),
      { id: tid(), type: "text", x: 160, y: 180, width: 640, height: 35, content: "WELCOME TO", style: { fontSize: "20px", fontWeight: "600", color: "#6B8DD6", letterSpacing: "10px", textAlign: "center" }, visible: true, locked: false, fontFamily: "Space Grotesk", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 160, y: 220, width: 640, height: 80, content: "YOUR\nCOMPANY", style: { fontSize: "68px", fontWeight: "900", color: "#FFFFFF", textAlign: "center", lineHeight: "1" }, visible: true, locked: false, fontFamily: "Oswald", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "shape", x: 380, y: 320, width: 200, height: 3, content: "", style: {}, shapeType: "line", shapeFill: "#4A6FA5", shapeStroke: "#4A6FA5", shapeStrokeWidth: 3, visible: true, locked: false, filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 160, y: 340, width: 640, height: 40, content: "Please check in at reception", style: { fontSize: "22px", fontWeight: "300", color: "#94A3B8", textAlign: "center" }, visible: true, locked: false, fontFamily: "Inter", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "widget-clock", x: 380, y: 400, width: 200, height: 80, content: "", style: {}, visible: true, locked: false, filters: { ...DEFAULT_FILTERS } },
      // Office image
      ...imgPlaceholder(40, 400, 280, 120, "OFFICE PHOTO", "#4A6FA5"),
    ],
  },
  {
    id: "info-event",
    name: "Event Schedule",
    category: "info",
    preview: "📅",
    description: "Conference schedule with speaker photo zones",
    bg: { type: "solid", color: "#0a0a12" },
    elements: [
      { id: tid(), type: "text", x: 50, y: 30, width: 600, height: 55, content: "EVENT SCHEDULE", style: { fontSize: "44px", fontWeight: "900", color: "#FFFFFF", letterSpacing: "3px" }, visible: true, locked: false, fontFamily: "Oswald", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 50, y: 90, width: 400, height: 25, content: "SATURDAY, APRIL 26, 2026", style: { fontSize: "14px", fontWeight: "600", color: "#6B8DD6", letterSpacing: "3px" }, visible: true, locked: false, fontFamily: "Space Grotesk", filters: { ...DEFAULT_FILTERS } },
      // Sponsor/event logo
      ...imgPlaceholder(700, 25, 220, 90, "EVENT LOGO", "#6B8DD6"),
      { id: tid(), type: "shape", x: 50, y: 125, width: 860, height: 2, content: "", style: {}, shapeType: "line", shapeFill: "#1E293B", shapeStroke: "#1E293B", shapeStrokeWidth: 2, visible: true, locked: false, filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 50, y: 140, width: 560, height: 370, content: "09:00    Registration & Coffee\n\n10:00    Opening Keynote — Main Stage\n              \"The Future of Digital Experience\"\n\n11:30    Workshop A — Room 1\n              Interactive Design Principles\n\n12:30    Lunch Break — Atrium\n\n14:00    Panel Discussion — Main Stage\n              Industry Leaders Q&A\n\n15:30    Networking & Demos\n\n17:00    Closing Remarks", style: { fontSize: "18px", fontWeight: "400", color: "#CBD5E1", lineHeight: "1.6" }, visible: true, locked: false, fontFamily: "DM Sans", filters: { ...DEFAULT_FILTERS } },
      // Speaker photos
      { id: tid(), type: "text", x: 680, y: 140, width: 240, height: 20, content: "KEYNOTE SPEAKERS", style: { fontSize: "11px", fontWeight: "700", color: "#6B8DD6", letterSpacing: "3px" }, visible: true, locked: false, fontFamily: "Space Grotesk", filters: { ...DEFAULT_FILTERS } },
      ...imgPlaceholder(680, 165, 100, 100, "SPEAKER 1", "#6B8DD6"),
      ...imgPlaceholder(800, 165, 100, 100, "SPEAKER 2", "#6B8DD6"),
      ...imgPlaceholder(680, 280, 100, 100, "SPEAKER 3", "#6B8DD6"),
      ...imgPlaceholder(800, 280, 100, 100, "SPEAKER 4", "#6B8DD6"),
    ],
  },

  /* ─── GYM / FITNESS ─── */
  {
    id: "fitness-class",
    name: "Class Schedule",
    category: "fitness",
    preview: "🏋️",
    description: "Gym class timetable with trainer photo zones",
    bg: { type: "gradient", color: "#0a0a0a", gradient: "linear-gradient(135deg, #0a0a0a 0%, #1a0a0a 100%)" },
    elements: [
      // Hero banner
      ...imgPlaceholder(0, 0, 960, 100, "GYM HERO — ACTION SHOT", "#FF4444"),
      { id: tid(), type: "text", x: 200, y: 20, width: 560, height: 55, content: "TODAY'S CLASSES", style: { fontSize: "48px", fontWeight: "900", color: "#FF4444", textAlign: "center" }, visible: true, locked: false, fontFamily: "Oswald", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 200, y: 70, width: 560, height: 22, content: "IRON FORGE FITNESS  •  PUSH YOUR LIMITS", style: { fontSize: "11px", fontWeight: "600", color: "#FFD700", letterSpacing: "3px", textAlign: "center" }, visible: true, locked: false, fontFamily: "Space Grotesk", filters: { ...DEFAULT_FILTERS } },
      // Schedule
      { id: tid(), type: "text", x: 50, y: 115, width: 550, height: 340, content: "06:00    🔥 HIIT Burn — Studio A\n              Coach Marcus · 45 min · All levels\n\n07:30    🚴 Spin Cycle — Studio B\n              Coach Priya · 50 min · Intermediate\n\n09:00    🧘 Yoga Flow — Studio A\n              Sarah · 60 min · All levels\n\n12:00    🥊 Boxing — Studio C\n              Coach Dex · 45 min · Advanced\n\n17:30    💪 CrossFit — Main Floor\n              Coach Liam · 60 min · All levels\n\n19:00    🤸 Pilates — Studio A\n              Mia · 45 min · All levels", style: { fontSize: "15px", fontWeight: "400", color: "#E0D8C0", lineHeight: "1.5" }, visible: true, locked: false, fontFamily: "DM Sans", filters: { ...DEFAULT_FILTERS } },
      // Trainer photos
      { id: tid(), type: "text", x: 650, y: 115, width: 270, height: 18, content: "OUR COACHES", style: { fontSize: "11px", fontWeight: "700", color: "#FF4444", letterSpacing: "4px" }, visible: true, locked: false, fontFamily: "Space Grotesk", filters: { ...DEFAULT_FILTERS } },
      ...imgPlaceholder(650, 140, 130, 100, "COACH 1", "#FF4444"),
      ...imgPlaceholder(790, 140, 130, 100, "COACH 2", "#FF4444"),
      ...imgPlaceholder(650, 255, 130, 100, "COACH 3", "#FF6B35"),
      ...imgPlaceholder(790, 255, 130, 100, "COACH 4", "#FF6B35"),
      // CTA
      { id: tid(), type: "text", x: 650, y: 375, width: 270, height: 70, content: "📱 Book via the app\n🆓 First class FREE\nfor new members", style: { fontSize: "14px", fontWeight: "500", color: "#FFD700", textAlign: "center", lineHeight: "1.6" }, visible: true, locked: false, fontFamily: "DM Sans", filters: { ...DEFAULT_FILTERS } },
      // Bottom
      { id: tid(), type: "text", x: 50, y: 470, width: 860, height: 25, content: "🟡 HIIT    🟢 Spin    🟣 Yoga    🔴 Boxing    🔵 CrossFit    🟠 Pilates", style: { fontSize: "12px", fontWeight: "500", color: "#64748B", textAlign: "center" }, visible: true, locked: false, fontFamily: "DM Sans", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 50, y: 500, width: 860, height: 22, content: "OPEN 5 AM – 10 PM MON–FRI  •  7 AM – 8 PM WEEKENDS", style: { fontSize: "11px", fontWeight: "600", color: "#FF4444", letterSpacing: "2px", textAlign: "center" }, visible: true, locked: false, fontFamily: "Space Grotesk", filters: { ...DEFAULT_FILTERS } },
    ],
  },

  /* ─── RETAIL ─── */
  {
    id: "retail-window",
    name: "Window Display",
    category: "retail",
    preview: "🛍️",
    description: "Storefront window display with product image grid",
    bg: { type: "solid", color: "#0a0a0a" },
    elements: [
      // Large hero product
      ...imgPlaceholder(40, 30, 560, 320, "HERO PRODUCT IMAGE", "#FFFFFF"),
      // Right side info
      { id: tid(), type: "text", x: 630, y: 30, width: 300, height: 22, content: "NEW ARRIVAL", style: { fontSize: "13px", fontWeight: "700", color: "#F59E0B", letterSpacing: "5px" }, visible: true, locked: false, fontFamily: "Space Grotesk", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 630, y: 60, width: 300, height: 90, content: "Summer\nEssentials", style: { fontSize: "52px", fontWeight: "300", color: "#FFFFFF", lineHeight: "1.1" }, visible: true, locked: false, fontFamily: "Playfair Display", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 630, y: 165, width: 300, height: 60, content: "Curated pieces for the\nmodern wardrobe", style: { fontSize: "17px", fontWeight: "400", color: "#94A3B8", lineHeight: "1.5" }, visible: true, locked: false, fontFamily: "Inter", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "shape", x: 630, y: 240, width: 100, height: 3, content: "", style: {}, shapeType: "line", shapeFill: "#F59E0B", shapeStroke: "#F59E0B", shapeStrokeWidth: 3, visible: true, locked: false, filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 630, y: 260, width: 300, height: 40, content: "FROM $49.99", style: { fontSize: "32px", fontWeight: "800", color: "#FFFFFF" }, visible: true, locked: false, fontFamily: "Oswald", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 630, y: 310, width: 300, height: 25, content: "Limited edition • While stocks last", style: { fontSize: "13px", fontWeight: "400", color: "#64748B", fontStyle: "italic" }, visible: true, locked: false, fontFamily: "Lora", filters: { ...DEFAULT_FILTERS } },
      // Bottom product row
      ...imgPlaceholder(40, 370, 200, 140, "PRODUCT 1", "#F59E0B"),
      ...imgPlaceholder(260, 370, 200, 140, "PRODUCT 2", "#F59E0B"),
      ...imgPlaceholder(480, 370, 200, 140, "PRODUCT 3", "#F59E0B"),
      // Logo + QR
      ...imgPlaceholder(720, 370, 100, 100, "QR CODE", "#FFFFFF"),
      { id: tid(), type: "text", x: 720, y: 475, width: 100, height: 18, content: "Shop online", style: { fontSize: "11px", fontWeight: "500", color: "#64748B", textAlign: "center" }, visible: true, locked: false, fontFamily: "Inter", filters: { ...DEFAULT_FILTERS } },
      ...imgPlaceholder(840, 370, 80, 80, "LOGO", "#FFFFFF"),
    ],
  },

  /* ─── HOTEL ─── */
  {
    id: "hotel-welcome",
    name: "Hotel Welcome",
    category: "hotel",
    preview: "🏨",
    description: "Luxury hotel lobby welcome with amenities and concierge",
    bg: { type: "gradient", color: "#08060e", gradient: "linear-gradient(180deg, #08060e 0%, #141020 50%, #0a0810 100%)" },
    elements: [
      // Hotel photo
      ...imgPlaceholder(0, 0, 960, 140, "HOTEL EXTERIOR / LOBBY PHOTO", "#C9A96E"),
      { id: tid(), type: "shape", x: 380, y: 155, width: 200, height: 1, content: "", style: {}, shapeType: "line", shapeFill: "#C9A96E", shapeStroke: "#C9A96E", shapeStrokeWidth: 1, visible: true, locked: false, filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 200, y: 165, width: 560, height: 22, content: "WELCOME TO", style: { fontSize: "13px", fontWeight: "600", color: "#C9A96E", letterSpacing: "10px", textAlign: "center" }, visible: true, locked: false, fontFamily: "Space Grotesk", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 120, y: 190, width: 720, height: 65, content: "THE ROSEMONT", style: { fontSize: "56px", fontWeight: "300", color: "#FFFFFF", textAlign: "center", letterSpacing: "5px" }, visible: true, locked: false, fontFamily: "Playfair Display", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 200, y: 260, width: 560, height: 18, content: "BOUTIQUE HOTEL & SPA  •  EST. 1897", style: { fontSize: "10px", fontWeight: "500", color: "#94A3B8", letterSpacing: "4px", textAlign: "center" }, visible: true, locked: false, fontFamily: "Space Grotesk", filters: { ...DEFAULT_FILTERS } },
      // Three info columns
      { id: tid(), type: "shape", x: 40, y: 295, width: 280, height: 150, content: "", style: {}, shapeType: "rounded-rect", shapeFill: "#0f0d18", shapeStroke: "#1E1A2E", shapeStrokeWidth: 1, visible: true, locked: false, filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 55, y: 308, width: 250, height: 16, content: "DINING", style: { fontSize: "11px", fontWeight: "700", color: "#C9A96E", letterSpacing: "3px" }, visible: true, locked: false, fontFamily: "Space Grotesk", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 55, y: 330, width: 250, height: 100, content: "Breakfast  7:00 – 10:30\nLunch  12:00 – 14:30\nDinner  18:30 – 22:00\nRoom service 24 hours", style: { fontSize: "12px", fontWeight: "400", color: "#CBD5E1", lineHeight: "1.8" }, visible: true, locked: false, fontFamily: "DM Sans", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "shape", x: 340, y: 295, width: 280, height: 150, content: "", style: {}, shapeType: "rounded-rect", shapeFill: "#0f0d18", shapeStroke: "#1E1A2E", shapeStrokeWidth: 1, visible: true, locked: false, filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 355, y: 308, width: 250, height: 16, content: "SPA & WELLNESS", style: { fontSize: "11px", fontWeight: "700", color: "#C9A96E", letterSpacing: "3px" }, visible: true, locked: false, fontFamily: "Space Grotesk", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 355, y: 330, width: 250, height: 100, content: "Pool  06:00 – 21:00\nSpa  09:00 – 20:00\nFitness  24 hours\nYoga class  08:00 daily", style: { fontSize: "12px", fontWeight: "400", color: "#CBD5E1", lineHeight: "1.8" }, visible: true, locked: false, fontFamily: "DM Sans", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "shape", x: 640, y: 295, width: 280, height: 150, content: "", style: {}, shapeType: "rounded-rect", shapeFill: "#0f0d18", shapeStroke: "#1E1A2E", shapeStrokeWidth: 1, visible: true, locked: false, filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 655, y: 308, width: 250, height: 16, content: "CONCIERGE", style: { fontSize: "11px", fontWeight: "700", color: "#C9A96E", letterSpacing: "3px" }, visible: true, locked: false, fontFamily: "Space Grotesk", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 655, y: 330, width: 250, height: 100, content: "Airport transfers\nTour bookings\nRestaurant reservations\nDial 0 for assistance", style: { fontSize: "12px", fontWeight: "400", color: "#CBD5E1", lineHeight: "1.8" }, visible: true, locked: false, fontFamily: "DM Sans", filters: { ...DEFAULT_FILTERS } },
      // Wi-Fi + widgets
      { id: tid(), type: "text", x: 200, y: 465, width: 560, height: 18, content: "WI-FI: ROSEMONT-GUEST  •  NO PASSWORD REQUIRED", style: { fontSize: "10px", fontWeight: "500", color: "#64748B", letterSpacing: "3px", textAlign: "center" }, visible: true, locked: false, fontFamily: "Space Grotesk", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "widget-clock", x: 340, y: 490, width: 140, height: 40, content: "", style: {}, visible: true, locked: false, filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "widget-weather", x: 490, y: 490, width: 140, height: 40, content: "", style: {}, visible: true, locked: false, filters: { ...DEFAULT_FILTERS } },
    ],
  },

  /* ─── HEALTHCARE ─── */
  {
    id: "health-waiting",
    name: "Clinic Welcome",
    category: "health",
    preview: "🏥",
    description: "Patient waiting room display with facility photos",
    bg: { type: "gradient", color: "#0a1520", gradient: "linear-gradient(180deg, #0a1520 0%, #0f1923 100%)" },
    elements: [
      // Clinic photo
      ...imgPlaceholder(40, 30, 350, 200, "CLINIC PHOTO", "#5BA8D6"),
      { id: tid(), type: "text", x: 420, y: 30, width: 500, height: 22, content: "PATIENT INFORMATION", style: { fontSize: "13px", fontWeight: "700", color: "#5BA8D6", letterSpacing: "6px" }, visible: true, locked: false, fontFamily: "Space Grotesk", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 420, y: 60, width: 500, height: 80, content: "Welcome to\nBrightcare Clinic", style: { fontSize: "44px", fontWeight: "300", color: "#FFFFFF", lineHeight: "1.15" }, visible: true, locked: false, fontFamily: "Playfair Display", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "shape", x: 420, y: 150, width: 80, height: 3, content: "", style: {}, shapeType: "line", shapeFill: "#5BA8D6", shapeStroke: "#5BA8D6", shapeStrokeWidth: 3, visible: true, locked: false, filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 420, y: 170, width: 500, height: 60, content: "Please check in at the front desk.\nAverage wait time: 15 minutes.", style: { fontSize: "16px", fontWeight: "400", color: "#CBD5E1", lineHeight: "1.7" }, visible: true, locked: false, fontFamily: "DM Sans", filters: { ...DEFAULT_FILTERS } },
      // Info grid
      { id: tid(), type: "text", x: 40, y: 260, width: 880, height: 200, content: "📋  Check in at the front desk\n\n😷  Masks are recommended in clinical areas\n\n📱  Free Wi-Fi: BrightCare-Guest\n\n💧  Water & refreshments available in the waiting area\n\n🚗  Parking validation available at checkout", style: { fontSize: "18px", fontWeight: "400", color: "#CBD5E1", lineHeight: "1.8" }, visible: true, locked: false, fontFamily: "DM Sans", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "widget-clock", x: 780, y: 30, width: 140, height: 50, content: "", style: {}, visible: true, locked: false, filters: { ...DEFAULT_FILTERS } },
      // Logo
      ...imgPlaceholder(40, 475, 160, 50, "CLINIC LOGO", "#5BA8D6"),
      { id: tid(), type: "text", x: 220, y: 480, width: 700, height: 35, content: "Call 0800 123 456  •  www.brightcare.co.uk  •  Open Mon–Sat 8 AM – 6 PM", style: { fontSize: "12px", fontWeight: "500", color: "#64748B", letterSpacing: "1px" }, visible: true, locked: false, fontFamily: "Space Grotesk", filters: { ...DEFAULT_FILTERS } },
    ],
  },

  /* ─── EDUCATION ─── */
  {
    id: "edu-notice",
    name: "School Notice Board",
    category: "education",
    preview: "📚",
    description: "Daily school notices with event photo zones",
    bg: { type: "gradient", color: "#0f1228", gradient: "linear-gradient(135deg, #0f1228 0%, #1a1a2e 100%)" },
    elements: [
      // School crest/logo
      ...imgPlaceholder(40, 30, 120, 80, "SCHOOL CREST", "#3B82F6"),
      { id: tid(), type: "text", x: 180, y: 35, width: 600, height: 50, content: "DAILY NOTICES", style: { fontSize: "42px", fontWeight: "900", color: "#FFFFFF", letterSpacing: "3px" }, visible: true, locked: false, fontFamily: "Oswald", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 180, y: 85, width: 400, height: 22, content: "MONDAY 14 APRIL 2026", style: { fontSize: "13px", fontWeight: "600", color: "#3B82F6", letterSpacing: "3px" }, visible: true, locked: false, fontFamily: "Space Grotesk", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "widget-clock", x: 800, y: 35, width: 120, height: 50, content: "", style: {}, visible: true, locked: false, filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "shape", x: 40, y: 120, width: 880, height: 2, content: "", style: {}, shapeType: "line", shapeFill: "#1E293B", shapeStroke: "#1E293B", shapeStrokeWidth: 2, visible: true, locked: false, filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 40, y: 135, width: 560, height: 340, content: "📢  Assembly at 9:00 AM — Main Hall\n     Guest speaker: Local MP on civic leadership\n\n📝  Year 11 Mock Results\n     Collect from form tutors today\n\n⚽  Football Trial — 3:30 PM\n     Meet at the sports pavilion\n\n🎭  Drama Club Auditions\n     Thursday lunch in the theatre\n\n📅  Parents Evening — 22 April\n     Book slots via the school app", style: { fontSize: "16px", fontWeight: "400", color: "#CBD5E1", lineHeight: "1.6" }, visible: true, locked: false, fontFamily: "DM Sans", filters: { ...DEFAULT_FILTERS } },
      // Event photos
      { id: tid(), type: "text", x: 640, y: 135, width: 280, height: 18, content: "UPCOMING EVENTS", style: { fontSize: "11px", fontWeight: "700", color: "#3B82F6", letterSpacing: "3px" }, visible: true, locked: false, fontFamily: "Space Grotesk", filters: { ...DEFAULT_FILTERS } },
      ...imgPlaceholder(640, 160, 280, 130, "EVENT PHOTO 1", "#3B82F6"),
      ...imgPlaceholder(640, 305, 280, 130, "EVENT PHOTO 2", "#3B82F6"),
      // Bottom
      { id: tid(), type: "text", x: 40, y: 490, width: 880, height: 22, content: "🍕 Canteen Special: Pizza Friday! Pre-order by Wednesday via the app", style: { fontSize: "14px", fontWeight: "500", color: "#FFD700", textAlign: "center" }, visible: true, locked: false, fontFamily: "DM Sans", filters: { ...DEFAULT_FILTERS }, animation: "pulse" },
    ],
  },

  /* ─── CHURCH ─── */
  {
    id: "church-service",
    name: "Service Times",
    category: "church",
    preview: "⛪",
    description: "Church service times with sanctuary photography",
    bg: { type: "gradient", color: "#0a0a14", gradient: "linear-gradient(180deg, #0a0a14 0%, #141028 100%)" },
    elements: [
      // Sanctuary photo
      ...imgPlaceholder(0, 0, 960, 160, "CHURCH / SANCTUARY PHOTO", "#A78BFA"),
      // Logo
      ...imgPlaceholder(420, 170, 120, 60, "CHURCH LOGO", "#A78BFA"),
      { id: tid(), type: "text", x: 180, y: 240, width: 600, height: 50, content: "GRACE COMMUNITY CHURCH", style: { fontSize: "36px", fontWeight: "800", color: "#FFFFFF", textAlign: "center" }, visible: true, locked: false, fontFamily: "Oswald", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 180, y: 295, width: 600, height: 22, content: "ALL ARE WELCOME  •  COME AS YOU ARE", style: { fontSize: "12px", fontWeight: "600", color: "#A78BFA", letterSpacing: "4px", textAlign: "center" }, visible: true, locked: false, fontFamily: "Space Grotesk", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "shape", x: 400, y: 330, width: 160, height: 2, content: "", style: {}, shapeType: "line", shapeFill: "#A78BFA", shapeStroke: "#A78BFA", shapeStrokeWidth: 2, visible: true, locked: false, filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 180, y: 345, width: 600, height: 130, content: "SUNDAY SERVICES\n8:30 AM  •  Traditional Worship\n10:30 AM  •  Contemporary Worship\n6:00 PM  •  Evening Service\n\nWEDNESDAY  •  7:00 PM  •  Bible Study", style: { fontSize: "18px", fontWeight: "400", color: "#CBD5E1", textAlign: "center", lineHeight: "1.7" }, visible: true, locked: false, fontFamily: "DM Sans", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 180, y: 490, width: 600, height: 25, content: "Children's Ministry & Nursery Available at All Services", style: { fontSize: "13px", fontWeight: "500", color: "#64748B", textAlign: "center", fontStyle: "italic" }, visible: true, locked: false, fontFamily: "Lora", filters: { ...DEFAULT_FILTERS } },
    ],
  },

  /* ─── CORPORATE ─── */
  {
    id: "corporate-welcome",
    name: "Corporate Lobby",
    category: "corporate",
    preview: "🏢",
    description: "Professional office lobby with company branding zones",
    bg: { type: "gradient", color: "#0a0f1a", gradient: "linear-gradient(135deg, #0a0f1a 0%, #121a2e 100%)" },
    elements: [
      // Full-width hero
      ...imgPlaceholder(0, 0, 960, 180, "OFFICE / TEAM PHOTO", "#6B8DD6"),
      // Company logo
      ...imgPlaceholder(380, 195, 200, 80, "COMPANY LOGO", "#6B8DD6"),
      { id: tid(), type: "text", x: 120, y: 290, width: 720, height: 40, content: "ACME CORPORATION", style: { fontSize: "48px", fontWeight: "900", color: "#FFFFFF", textAlign: "center" }, visible: true, locked: false, fontFamily: "Oswald", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 120, y: 340, width: 720, height: 30, content: "Innovation  •  Excellence  •  Integrity", style: { fontSize: "18px", fontWeight: "400", color: "#8899BB", textAlign: "center", fontStyle: "italic" }, visible: true, locked: false, fontFamily: "Lora", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "shape", x: 400, y: 385, width: 160, height: 3, content: "", style: {}, shapeType: "line", shapeFill: "#6B8DD6", shapeStroke: "#6B8DD6", shapeStrokeWidth: 3, visible: true, locked: false, filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "widget-clock", x: 380, y: 400, width: 200, height: 70, content: "", style: {}, visible: true, locked: false, filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 120, y: 480, width: 720, height: 30, content: "VISITOR CHECK-IN AT RECEPTION  •  FLOOR DIRECTORY ON RIGHT", style: { fontSize: "12px", fontWeight: "500", color: "#6B8DD6", letterSpacing: "3px", textAlign: "center" }, visible: true, locked: false, fontFamily: "Space Grotesk", filters: { ...DEFAULT_FILTERS } },
    ],
  },
  {
    id: "corporate-kpi",
    name: "KPI Dashboard",
    category: "corporate",
    preview: "📈",
    description: "Key performance metrics with branded data cards",
    bg: { type: "gradient", color: "#0a0a12", gradient: "linear-gradient(180deg, #0a0a12 0%, #12121f 100%)" },
    elements: [
      // Header
      ...imgPlaceholder(40, 25, 60, 40, "LOGO", "#6B8DD6"),
      { id: tid(), type: "text", x: 115, y: 25, width: 500, height: 40, content: "COMPANY DASHBOARD", style: { fontSize: "32px", fontWeight: "800", color: "#FFFFFF", letterSpacing: "3px" }, visible: true, locked: false, fontFamily: "Oswald", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 115, y: 65, width: 300, height: 22, content: "LIVE METRICS • Q2 2026", style: { fontSize: "12px", fontWeight: "500", color: "#6B8DD6", letterSpacing: "3px" }, visible: true, locked: false, fontFamily: "Space Grotesk", filters: { ...DEFAULT_FILTERS } },
      // Metric cards
      { id: tid(), type: "shape", x: 40, y: 100, width: 210, height: 120, content: "", style: {}, shapeType: "rounded-rect", shapeFill: "#1a1a2e", shapeStroke: "#22C55E", shapeStrokeWidth: 1, visible: true, locked: false, filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 55, y: 112, width: 180, height: 18, content: "REVENUE", style: { fontSize: "11px", fontWeight: "600", color: "#22C55E", letterSpacing: "3px" }, visible: true, locked: false, fontFamily: "Space Grotesk", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 55, y: 135, width: 180, height: 40, content: "$2.4M", style: { fontSize: "38px", fontWeight: "800", color: "#FFFFFF" }, visible: true, locked: false, fontFamily: "Oswald", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 55, y: 185, width: 180, height: 20, content: "↑ 18% vs last quarter", style: { fontSize: "12px", fontWeight: "500", color: "#22C55E" }, visible: true, locked: false, fontFamily: "DM Sans", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "shape", x: 270, y: 100, width: 210, height: 120, content: "", style: {}, shapeType: "rounded-rect", shapeFill: "#1a1a2e", shapeStroke: "#3B82F6", shapeStrokeWidth: 1, visible: true, locked: false, filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 285, y: 112, width: 180, height: 18, content: "CUSTOMERS", style: { fontSize: "11px", fontWeight: "600", color: "#3B82F6", letterSpacing: "3px" }, visible: true, locked: false, fontFamily: "Space Grotesk", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 285, y: 135, width: 180, height: 40, content: "12,847", style: { fontSize: "38px", fontWeight: "800", color: "#FFFFFF" }, visible: true, locked: false, fontFamily: "Oswald", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 285, y: 185, width: 180, height: 20, content: "↑ 340 new this month", style: { fontSize: "12px", fontWeight: "500", color: "#3B82F6" }, visible: true, locked: false, fontFamily: "DM Sans", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "shape", x: 500, y: 100, width: 210, height: 120, content: "", style: {}, shapeType: "rounded-rect", shapeFill: "#1a1a2e", shapeStroke: "#F59E0B", shapeStrokeWidth: 1, visible: true, locked: false, filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 515, y: 112, width: 180, height: 18, content: "NPS SCORE", style: { fontSize: "11px", fontWeight: "600", color: "#F59E0B", letterSpacing: "3px" }, visible: true, locked: false, fontFamily: "Space Grotesk", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 515, y: 135, width: 180, height: 40, content: "72", style: { fontSize: "38px", fontWeight: "800", color: "#FFFFFF" }, visible: true, locked: false, fontFamily: "Oswald", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 515, y: 185, width: 180, height: 20, content: "↑ 5 pts improvement", style: { fontSize: "12px", fontWeight: "500", color: "#F59E0B" }, visible: true, locked: false, fontFamily: "DM Sans", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "shape", x: 730, y: 100, width: 190, height: 120, content: "", style: {}, shapeType: "rounded-rect", shapeFill: "#1a1a2e", shapeStroke: "#A78BFA", shapeStrokeWidth: 1, visible: true, locked: false, filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 745, y: 112, width: 160, height: 18, content: "CHURN", style: { fontSize: "11px", fontWeight: "600", color: "#A78BFA", letterSpacing: "3px" }, visible: true, locked: false, fontFamily: "Space Grotesk", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 745, y: 135, width: 160, height: 40, content: "1.2%", style: { fontSize: "38px", fontWeight: "800", color: "#FFFFFF" }, visible: true, locked: false, fontFamily: "Oswald", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 745, y: 185, width: 160, height: 20, content: "↓ Best ever quarter", style: { fontSize: "12px", fontWeight: "500", color: "#A78BFA" }, visible: true, locked: false, fontFamily: "DM Sans", filters: { ...DEFAULT_FILTERS } },
      // Priorities
      { id: tid(), type: "text", x: 40, y: 245, width: 500, height: 22, content: "TOP PRIORITIES THIS QUARTER", style: { fontSize: "13px", fontWeight: "600", color: "#6B8DD6", letterSpacing: "3px" }, visible: true, locked: false, fontFamily: "Space Grotesk", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 40, y: 275, width: 550, height: 200, content: "1. Launch v3.0 platform — On Track ✅\n2. Expand EMEA sales team — In Progress 🔄\n3. Achieve SOC2 compliance — 85% Complete\n4. Customer retention > 95% — Currently 96.2% ✅", style: { fontSize: "17px", fontWeight: "400", color: "#C0CDE0", lineHeight: "2.0" }, visible: true, locked: false, fontFamily: "DM Sans", filters: { ...DEFAULT_FILTERS } },
      // Team photo
      ...imgPlaceholder(640, 250, 280, 210, "TEAM / OFFICE PHOTO", "#6B8DD6"),
    ],
  },

  /* ─── SOCIAL & QR ─── */
  {
    id: "social-wifi-qr",
    name: "Free WiFi",
    category: "social",
    preview: "📶",
    description: "WiFi connection screen with QR code and branding",
    bg: { type: "gradient", color: "#0a1628", gradient: "linear-gradient(135deg, #0a1628 0%, #0f1e3a 100%)" },
    elements: [
      // Logo
      ...imgPlaceholder(380, 30, 200, 80, "YOUR LOGO", "#3B82F6"),
      // WiFi icon area
      { id: tid(), type: "text", x: 280, y: 130, width: 400, height: 55, content: "📶 FREE WiFi", style: { fontSize: "48px", fontWeight: "900", color: "#FFFFFF", textAlign: "center" }, visible: true, locked: false, fontFamily: "Oswald", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 280, y: 195, width: 400, height: 28, content: "SCAN TO CONNECT INSTANTLY", style: { fontSize: "14px", fontWeight: "600", color: "#3B82F6", letterSpacing: "4px", textAlign: "center" }, visible: true, locked: false, fontFamily: "Space Grotesk", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "shape", x: 400, y: 235, width: 160, height: 2, content: "", style: {}, shapeType: "line", shapeFill: "#3B82F6", shapeStroke: "#3B82F6", shapeStrokeWidth: 2, visible: true, locked: false, filters: { ...DEFAULT_FILTERS } },
      // QR code - large central
      ...imgPlaceholder(340, 250, 280, 180, "QR CODE\n(WiFi auto-connect)", "#3B82F6"),
      // Network details
      { id: tid(), type: "shape", x: 280, y: 445, width: 400, height: 70, content: "", style: {}, shapeType: "rounded-rect", shapeFill: "#0f1e3a", shapeStroke: "#1E3A5F", shapeStrokeWidth: 1, visible: true, locked: false, filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 300, y: 455, width: 360, height: 50, content: "Network: YourBusiness-Guest\nPassword: welcome2026", style: { fontSize: "16px", fontWeight: "500", color: "#CBD5E1", textAlign: "center", lineHeight: "1.8" }, visible: true, locked: false, fontFamily: "DM Sans", filters: { ...DEFAULT_FILTERS } },
    ],
  },
  {
    id: "social-review-wall",
    name: "Review Wall",
    category: "social",
    preview: "⭐",
    description: "Customer testimonials with profile photo zones",
    bg: { type: "solid", color: "#0a0a12" },
    elements: [
      { id: tid(), type: "text", x: 200, y: 25, width: 560, height: 40, content: "WHAT OUR CUSTOMERS SAY", style: { fontSize: "28px", fontWeight: "800", color: "#FFFFFF", textAlign: "center", letterSpacing: "2px" }, visible: true, locked: false, fontFamily: "Oswald", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 350, y: 70, width: 260, height: 22, content: "⭐⭐⭐⭐⭐  4.9 / 5.0", style: { fontSize: "16px", fontWeight: "600", color: "#FFD700", textAlign: "center" }, visible: true, locked: false, fontFamily: "DM Sans", filters: { ...DEFAULT_FILTERS } },
      // Review 1
      { id: tid(), type: "shape", x: 40, y: 110, width: 280, height: 240, content: "", style: {}, shapeType: "rounded-rect", shapeFill: "#12121f", shapeStroke: "#1E293B", shapeStrokeWidth: 1, visible: true, locked: false, filters: { ...DEFAULT_FILTERS } },
      ...imgPlaceholder(115, 125, 80, 80, "PHOTO", "#FFD700"),
      { id: tid(), type: "text", x: 60, y: 215, width: 240, height: 20, content: "Sarah M.", style: { fontSize: "16px", fontWeight: "700", color: "#FFFFFF", textAlign: "center" }, visible: true, locked: false, fontFamily: "DM Sans", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 60, y: 235, width: 240, height: 16, content: "⭐⭐⭐⭐⭐", style: { fontSize: "12px", textAlign: "center", color: "#FFD700" }, visible: true, locked: false, filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 60, y: 260, width: 240, height: 70, content: "\"Absolutely fantastic service. The team went above and beyond!\"", style: { fontSize: "13px", fontWeight: "400", color: "#94A3B8", textAlign: "center", fontStyle: "italic", lineHeight: "1.5" }, visible: true, locked: false, fontFamily: "Lora", filters: { ...DEFAULT_FILTERS } },
      // Review 2
      { id: tid(), type: "shape", x: 340, y: 110, width: 280, height: 240, content: "", style: {}, shapeType: "rounded-rect", shapeFill: "#12121f", shapeStroke: "#1E293B", shapeStrokeWidth: 1, visible: true, locked: false, filters: { ...DEFAULT_FILTERS } },
      ...imgPlaceholder(415, 125, 80, 80, "PHOTO", "#FFD700"),
      { id: tid(), type: "text", x: 360, y: 215, width: 240, height: 20, content: "James T.", style: { fontSize: "16px", fontWeight: "700", color: "#FFFFFF", textAlign: "center" }, visible: true, locked: false, fontFamily: "DM Sans", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 360, y: 235, width: 240, height: 16, content: "⭐⭐⭐⭐⭐", style: { fontSize: "12px", textAlign: "center", color: "#FFD700" }, visible: true, locked: false, filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 360, y: 260, width: 240, height: 70, content: "\"Best in the business. Would recommend to everyone.\"", style: { fontSize: "13px", fontWeight: "400", color: "#94A3B8", textAlign: "center", fontStyle: "italic", lineHeight: "1.5" }, visible: true, locked: false, fontFamily: "Lora", filters: { ...DEFAULT_FILTERS } },
      // Review 3
      { id: tid(), type: "shape", x: 640, y: 110, width: 280, height: 240, content: "", style: {}, shapeType: "rounded-rect", shapeFill: "#12121f", shapeStroke: "#1E293B", shapeStrokeWidth: 1, visible: true, locked: false, filters: { ...DEFAULT_FILTERS } },
      ...imgPlaceholder(715, 125, 80, 80, "PHOTO", "#FFD700"),
      { id: tid(), type: "text", x: 660, y: 215, width: 240, height: 20, content: "Emma L.", style: { fontSize: "16px", fontWeight: "700", color: "#FFFFFF", textAlign: "center" }, visible: true, locked: false, fontFamily: "DM Sans", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 660, y: 235, width: 240, height: 16, content: "⭐⭐⭐⭐⭐", style: { fontSize: "12px", textAlign: "center", color: "#FFD700" }, visible: true, locked: false, filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 660, y: 260, width: 240, height: 70, content: "\"A truly premium experience. Can't fault a single thing.\"", style: { fontSize: "13px", fontWeight: "400", color: "#94A3B8", textAlign: "center", fontStyle: "italic", lineHeight: "1.5" }, visible: true, locked: false, fontFamily: "Lora", filters: { ...DEFAULT_FILTERS } },
      // Bottom CTA
      ...imgPlaceholder(40, 380, 100, 80, "QR CODE", "#FFD700"),
      { id: tid(), type: "text", x: 160, y: 390, width: 300, height: 50, content: "Leave us a review!\nScan the QR code", style: { fontSize: "16px", fontWeight: "500", color: "#CBD5E1", lineHeight: "1.5" }, visible: true, locked: false, fontFamily: "DM Sans", filters: { ...DEFAULT_FILTERS } },
      ...imgPlaceholder(780, 380, 140, 80, "YOUR LOGO", "#FFFFFF"),
    ],
  },

  /* ─── REAL ESTATE ─── */
  {
    id: "realestate-listings",
    name: "Property Listings",
    category: "realestate",
    preview: "🏠",
    description: "Property listing board with large photo zones and details",
    bg: { type: "solid", color: "#0a0a0a" },
    elements: [
      // Agency branding
      ...imgPlaceholder(40, 20, 160, 50, "AGENCY LOGO", "#FFFFFF"),
      { id: tid(), type: "text", x: 220, y: 25, width: 500, height: 35, content: "FEATURED PROPERTIES", style: { fontSize: "28px", fontWeight: "800", color: "#FFFFFF", letterSpacing: "3px" }, visible: true, locked: false, fontFamily: "Oswald", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 220, y: 58, width: 300, height: 18, content: "WILLIAMS ESTATES", style: { fontSize: "12px", fontWeight: "600", color: "#C9A96E", letterSpacing: "4px" }, visible: true, locked: false, fontFamily: "Space Grotesk", filters: { ...DEFAULT_FILTERS } },
      // Property 1 — Large
      ...imgPlaceholder(40, 90, 460, 220, "PROPERTY PHOTO 1", "#C9A96E"),
      { id: tid(), type: "shape", x: 40, y: 315, width: 460, height: 100, content: "", style: {}, shapeType: "rounded-rect", shapeFill: "#12121f", shapeStroke: "#1E293B", shapeStrokeWidth: 1, visible: true, locked: false, filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 55, y: 325, width: 300, height: 22, content: "Riverside Penthouse", style: { fontSize: "20px", fontWeight: "700", color: "#FFFFFF" }, visible: true, locked: false, fontFamily: "Playfair Display", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 55, y: 350, width: 300, height: 16, content: "3 bed  •  2 bath  •  1,850 sq ft  •  River views", style: { fontSize: "12px", fontWeight: "400", color: "#94A3B8" }, visible: true, locked: false, fontFamily: "Inter", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 55, y: 375, width: 200, height: 28, content: "$1,250,000", style: { fontSize: "24px", fontWeight: "800", color: "#C9A96E" }, visible: true, locked: false, fontFamily: "Oswald", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 350, y: 375, width: 140, height: 22, content: "FOR SALE", style: { fontSize: "12px", fontWeight: "700", color: "#22C55E", letterSpacing: "3px" }, visible: true, locked: false, fontFamily: "Space Grotesk", filters: { ...DEFAULT_FILTERS } },
      // Property 2
      ...imgPlaceholder(520, 90, 400, 140, "PROPERTY PHOTO 2", "#C9A96E"),
      { id: tid(), type: "text", x: 520, y: 235, width: 300, height: 20, content: "Victorian Townhouse", style: { fontSize: "18px", fontWeight: "700", color: "#FFFFFF" }, visible: true, locked: false, fontFamily: "Playfair Display", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 520, y: 258, width: 300, height: 14, content: "4 bed  •  3 bath  •  Garden  •  Garage", style: { fontSize: "11px", fontWeight: "400", color: "#94A3B8" }, visible: true, locked: false, fontFamily: "Inter", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 520, y: 278, width: 200, height: 25, content: "$875,000", style: { fontSize: "22px", fontWeight: "800", color: "#C9A96E" }, visible: true, locked: false, fontFamily: "Oswald", filters: { ...DEFAULT_FILTERS } },
      // Property 3
      ...imgPlaceholder(520, 315, width = 400, 100, "PROPERTY PHOTO 3", "#C9A96E"),
      { id: tid(), type: "text", x: 520, y: 420, width: 300, height: 20, content: "Modern City Apartment", style: { fontSize: "18px", fontWeight: "700", color: "#FFFFFF" }, visible: true, locked: false, fontFamily: "Playfair Display", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 520, y: 443, width: 300, height: 14, content: "2 bed  •  1 bath  •  Balcony  •  Parking", style: { fontSize: "11px", fontWeight: "400", color: "#94A3B8" }, visible: true, locked: false, fontFamily: "Inter", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 520, y: 462, width: 200, height: 25, content: "$425,000", style: { fontSize: "22px", fontWeight: "800", color: "#C9A96E" }, visible: true, locked: false, fontFamily: "Oswald", filters: { ...DEFAULT_FILTERS } },
      // Contact bar
      { id: tid(), type: "shape", x: 40, y: 500, width: 880, height: 2, content: "", style: {}, shapeType: "line", shapeFill: "#C9A96E", shapeStroke: "#C9A96E", shapeStrokeWidth: 1, visible: true, locked: false, filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 40, y: 510, width: 880, height: 22, content: "📞 020 7123 4567  •  📧 info@williamsestates.co.uk  •  🌐 williamsestates.co.uk", style: { fontSize: "12px", fontWeight: "500", color: "#94A3B8", textAlign: "center" }, visible: true, locked: false, fontFamily: "Inter", filters: { ...DEFAULT_FILTERS } },
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
