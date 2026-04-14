import { useState, useMemo } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { CanvasElement, DEFAULT_FILTERS } from "@/components/studio/types";
import { LayoutTemplate, Utensils, Tag, Info, Sparkles, Coffee, ShoppingBag, Megaphone, CalendarDays, PartyPopper, Clock, Dumbbell, Store, Hotel, HeartPulse, GraduationCap, Search, Church, Building2, Share2 } from "lucide-react";

/* ── Template category type ── */
type TemplateCategory = "all" | "menu" | "promo" | "info" | "fitness" | "retail" | "hotel" | "health" | "education" | "church" | "corporate" | "social";

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

/* ── Pre-made templates ── */
const TEMPLATES: StudioTemplate[] = [
  /* ─── MENU BOARDS ─── */
  {
    id: "menu-cafe",
    name: "Café Menu",
    category: "menu",
    preview: "☕",
    description: "Clean coffee shop menu with prices and categories",
    bg: { type: "gradient", color: "#1a1a2e", gradient: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)" },
    elements: [
      { id: tid(), type: "text", x: 80, y: 60, width: 600, height: 80, content: "☕ THE DAILY GRIND", style: { fontSize: "56px", fontWeight: "800", color: "#F5DEB3" }, visible: true, locked: false, fontFamily: "Playfair Display", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "shape", x: 80, y: 150, width: 400, height: 3, content: "", style: {}, shapeType: "line", shapeFill: "#F5DEB3", shapeStroke: "#F5DEB3", shapeStrokeWidth: 3, visible: true, locked: false, filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 80, y: 180, width: 500, height: 50, content: "ESPRESSO DRINKS", style: { fontSize: "28px", fontWeight: "700", color: "#D4A574", letterSpacing: "4px" }, visible: true, locked: false, fontFamily: "Bebas Neue", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 80, y: 240, width: 700, height: 280, content: "Espresso ........................ $3.50\nAmericano ..................... $4.00\nCappuccino ................... $4.50\nLatte ............................... $4.75\nMocha ............................ $5.25\nFlat White ...................... $4.50", style: { fontSize: "24px", fontWeight: "400", color: "#E8D5B7", lineHeight: "1.9" }, visible: true, locked: false, fontFamily: "DM Sans", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 80, y: 560, width: 500, height: 50, content: "COLD BREW & ICED", style: { fontSize: "28px", fontWeight: "700", color: "#D4A574", letterSpacing: "4px" }, visible: true, locked: false, fontFamily: "Bebas Neue", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 80, y: 620, width: 700, height: 200, content: "Cold Brew ...................... $4.50\nIced Latte ....................... $5.00\nIced Mocha .................... $5.50\nFrappé ........................... $5.75", style: { fontSize: "24px", fontWeight: "400", color: "#E8D5B7", lineHeight: "1.9" }, visible: true, locked: false, fontFamily: "DM Sans", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 80, y: 880, width: 700, height: 40, content: "✦ Ask about our seasonal specials ✦", style: { fontSize: "18px", fontWeight: "500", color: "#D4A574", textAlign: "center", fontStyle: "italic" }, visible: true, locked: false, fontFamily: "Lora", filters: { ...DEFAULT_FILTERS } },
    ],
  },
  {
    id: "menu-restaurant",
    name: "Restaurant Specials",
    category: "menu",
    preview: "🍽️",
    description: "Elegant daily specials board with bold typography",
    bg: { type: "solid", color: "#0f0f0f" },
    elements: [
      { id: tid(), type: "text", x: 120, y: 80, width: 800, height: 90, content: "TODAY'S SPECIALS", style: { fontSize: "64px", fontWeight: "900", color: "#FFFFFF", letterSpacing: "8px" }, visible: true, locked: false, fontFamily: "Oswald", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "shape", x: 120, y: 180, width: 200, height: 4, content: "", style: {}, shapeType: "line", shapeFill: "#B8860B", shapeStroke: "#B8860B", shapeStrokeWidth: 4, visible: true, locked: false, filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 120, y: 220, width: 700, height: 50, content: "STARTER", style: { fontSize: "20px", fontWeight: "600", color: "#D4A017", letterSpacing: "6px" }, visible: true, locked: false, fontFamily: "Space Grotesk", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 120, y: 270, width: 700, height: 40, content: "Burrata with Heirloom Tomatoes & Basil Oil", style: { fontSize: "28px", fontWeight: "300", color: "#FFFFFF" }, visible: true, locked: false, fontFamily: "Inter", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 120, y: 310, width: 100, height: 35, content: "$14", style: { fontSize: "24px", fontWeight: "700", color: "#D4A017" }, visible: true, locked: false, fontFamily: "Inter", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 120, y: 400, width: 700, height: 50, content: "MAIN", style: { fontSize: "20px", fontWeight: "600", color: "#D4A017", letterSpacing: "6px" }, visible: true, locked: false, fontFamily: "Space Grotesk", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 120, y: 450, width: 700, height: 40, content: "Pan-Seared Salmon with Dill Cream & Asparagus", style: { fontSize: "28px", fontWeight: "300", color: "#FFFFFF" }, visible: true, locked: false, fontFamily: "Inter", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 120, y: 490, width: 100, height: 35, content: "$28", style: { fontSize: "24px", fontWeight: "700", color: "#D4A017" }, visible: true, locked: false, fontFamily: "Inter", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 120, y: 580, width: 700, height: 50, content: "DESSERT", style: { fontSize: "20px", fontWeight: "600", color: "#D4A017", letterSpacing: "6px" }, visible: true, locked: false, fontFamily: "Space Grotesk", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 120, y: 630, width: 700, height: 40, content: "Dark Chocolate Fondant with Salted Caramel", style: { fontSize: "28px", fontWeight: "300", color: "#FFFFFF" }, visible: true, locked: false, fontFamily: "Inter", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 120, y: 670, width: 100, height: 35, content: "$12", style: { fontSize: "24px", fontWeight: "700", color: "#D4A017" }, visible: true, locked: false, fontFamily: "Inter", filters: { ...DEFAULT_FILTERS } },
    ],
  },
  {
    id: "menu-bar",
    name: "Bar & Cocktails",
    category: "menu",
    preview: "🍸",
    description: "Neon-styled cocktail menu with glowing accents",
    bg: { type: "gradient", color: "#0a0a1a", gradient: "linear-gradient(180deg, #0a0a1a 0%, #1a0a2e 100%)" },
    elements: [
      { id: tid(), type: "text", x: 140, y: 60, width: 700, height: 90, content: "COCKTAIL HOUR", style: { fontSize: "60px", fontWeight: "900", color: "#FF6B9D" }, visible: true, locked: false, fontFamily: "Righteous", filters: { ...DEFAULT_FILTERS }, glowIntensity: 80 },
      { id: tid(), type: "text", x: 140, y: 160, width: 500, height: 35, content: "HAPPY HOUR 5–7 PM • ALL $8", style: { fontSize: "18px", fontWeight: "600", color: "#FFD700", letterSpacing: "3px" }, visible: true, locked: false, fontFamily: "Bebas Neue", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 140, y: 240, width: 700, height: 500, content: "🍋 Lemon Drop Martini\nVodka, triple sec, fresh lemon, sugar rim\n\n🌿 Mojito Fresco\nWhite rum, mint, lime, soda, brown sugar\n\n🥃 Old Fashioned\nBourbon, Angostura bitters, orange peel\n\n🍓 Strawberry Daiquiri\nRum, fresh strawberries, lime, simple syrup\n\n🫒 Espresso Martini\nVodka, Kahlúa, fresh espresso, vanilla", style: { fontSize: "22px", fontWeight: "400", color: "#E8D5FF", lineHeight: "1.7" }, visible: true, locked: false, fontFamily: "DM Sans", filters: { ...DEFAULT_FILTERS } },
    ],
  },
  {
    id: "menu-pizza",
    name: "Pizza Menu",
    category: "menu",
    preview: "🍕",
    description: "Animated pizza menu with floating entrance and glowing prices",
    bg: { type: "gradient", color: "#1a0a0a", gradient: "linear-gradient(180deg, #1a0a0a 0%, #2a1510 50%, #1a0a0a 100%)" },
    elements: [
      { id: tid(), type: "text", x: 140, y: 40, width: 740, height: 80, content: "🍕 STONE OVEN PIZZERIA", style: { fontSize: "50px", fontWeight: "900", color: "#FFD700", textAlign: "center", letterSpacing: "3px" }, visible: true, locked: false, fontFamily: "Oswald", filters: { ...DEFAULT_FILTERS }, glowIntensity: 50, animation: "float", entranceAnim: "fade-in", enterDuration: 800 },
      { id: tid(), type: "shape", x: 300, y: 130, width: 420, height: 3, content: "", style: {}, shapeType: "line", shapeFill: "#FF6B35", shapeStroke: "#FF6B35", shapeStrokeWidth: 3, visible: true, locked: false, filters: { ...DEFAULT_FILTERS }, entranceAnim: "fade-in", enterDelay: 200 },
      { id: tid(), type: "text", x: 100, y: 170, width: 400, height: 35, content: "CLASSIC PIZZAS", style: { fontSize: "22px", fontWeight: "700", color: "#FF6B35", letterSpacing: "5px" }, visible: true, locked: false, fontFamily: "Bebas Neue", filters: { ...DEFAULT_FILTERS }, entranceAnim: "fade-in", enterDelay: 300 },
      { id: tid(), type: "text", x: 100, y: 215, width: 500, height: 250, content: "Margherita .......................... $12\nFresh mozzarella, San Marzano, basil\n\nPepperoni ............................. $14\nDouble pepperoni, mozzarella blend\n\nQuattro Formaggi ................ $16\nMozzarella, gorgonzola, parmesan, fontina\n\nDiavola ................................. $15\nSpicy salami, chilli flakes, honey drizzle", style: { fontSize: "18px", fontWeight: "400", color: "#E8D0C0", lineHeight: "1.6" }, visible: true, locked: false, fontFamily: "DM Sans", filters: { ...DEFAULT_FILTERS }, entranceAnim: "fade-in", enterDelay: 500 },
      { id: tid(), type: "text", x: 560, y: 170, width: 400, height: 35, content: "GOURMET PIZZAS", style: { fontSize: "22px", fontWeight: "700", color: "#FF6B35", letterSpacing: "5px" }, visible: true, locked: false, fontFamily: "Bebas Neue", filters: { ...DEFAULT_FILTERS }, entranceAnim: "fade-in", enterDelay: 400 },
      { id: tid(), type: "text", x: 560, y: 215, width: 500, height: 250, content: "Truffle Mushroom ............... $19\nWild mushrooms, truffle oil, fontina\n\nProsciutto & Fig .................. $20\nParma ham, fig jam, arugula, balsamic\n\nSmoked Salmon ................... $21\nCrème fraîche, capers, red onion, dill\n\nBBQ Pulled Pork .................. $18\nSlow-cooked pork, BBQ glaze, jalapeños", style: { fontSize: "18px", fontWeight: "400", color: "#E8D0C0", lineHeight: "1.6" }, visible: true, locked: false, fontFamily: "DM Sans", filters: { ...DEFAULT_FILTERS }, entranceAnim: "fade-in", enterDelay: 600 },
      { id: tid(), type: "shape", x: 100, y: 510, width: 820, height: 3, content: "", style: {}, shapeType: "line", shapeFill: "#FF6B35", shapeStroke: "#FF6B35", shapeStrokeWidth: 2, visible: true, locked: false, filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 100, y: 530, width: 400, height: 35, content: "SIDES & EXTRAS", style: { fontSize: "22px", fontWeight: "700", color: "#FF6B35", letterSpacing: "5px" }, visible: true, locked: false, fontFamily: "Bebas Neue", filters: { ...DEFAULT_FILTERS }, entranceAnim: "fade-in", enterDelay: 700 },
      { id: tid(), type: "text", x: 100, y: 575, width: 820, height: 100, content: "Garlic Bread ........... $6    |    Caesar Salad ............ $9    |    Tiramisu ..................... $8\nChicken Wings ........ $10   |    Bruschetta ................. $8    |    Gelato (3 scoops) ...... $7", style: { fontSize: "18px", fontWeight: "400", color: "#E8D0C0", lineHeight: "2.0" }, visible: true, locked: false, fontFamily: "DM Sans", filters: { ...DEFAULT_FILTERS }, entranceAnim: "fade-in", enterDelay: 800 },
      { id: tid(), type: "text", x: 200, y: 700, width: 620, height: 40, content: "🔥 ALL PIZZAS HAND-STRETCHED & WOOD-FIRED 🔥", style: { fontSize: "16px", fontWeight: "600", color: "#FFD700", textAlign: "center", letterSpacing: "3px" }, visible: true, locked: false, fontFamily: "Space Grotesk", filters: { ...DEFAULT_FILTERS }, animation: "pulse", entranceAnim: "fade-in", enterDelay: 1000 },
    ],
  },
  {
    id: "menu-burger",
    name: "Burger Joint",
    category: "menu",
    preview: "🍔",
    description: "Bold burger menu with neon glow and animated highlights",
    bg: { type: "gradient", color: "#0a0a0a", gradient: "linear-gradient(135deg, #0a0a0a 0%, #1a1a00 50%, #0a0a0a 100%)" },
    elements: [
      { id: tid(), type: "text", x: 100, y: 40, width: 820, height: 90, content: "🍔 SMASH BURGER CO.", style: { fontSize: "56px", fontWeight: "900", color: "#FFD700", textAlign: "center" }, visible: true, locked: false, fontFamily: "Oswald", filters: { ...DEFAULT_FILTERS }, glowIntensity: 60, animation: "float", entranceAnim: "fade-in" },
      { id: tid(), type: "text", x: 100, y: 140, width: 820, height: 30, content: "SMASHED DAILY • SERVED FRESH • SINCE 2018", style: { fontSize: "14px", fontWeight: "600", color: "#FF6B35", letterSpacing: "5px", textAlign: "center" }, visible: true, locked: false, fontFamily: "Space Grotesk", filters: { ...DEFAULT_FILTERS }, entranceAnim: "fade-in", enterDelay: 200 },
      { id: tid(), type: "shape", x: 80, y: 195, width: 400, height: 280, content: "", style: {}, shapeType: "rounded-rect", shapeFill: "#1a1a10", shapeStroke: "#FFD700", shapeStrokeWidth: 1, visible: true, locked: false, filters: { ...DEFAULT_FILTERS }, entranceAnim: "fade-in", enterDelay: 300 },
      { id: tid(), type: "text", x: 100, y: 210, width: 360, height: 30, content: "THE CLASSICS", style: { fontSize: "18px", fontWeight: "700", color: "#FFD700", letterSpacing: "4px" }, visible: true, locked: false, fontFamily: "Bebas Neue", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 100, y: 250, width: 360, height: 200, content: "The O.G. Single .............. $9\nSmash patty, American cheese, pickles\n\nDouble Stack .................. $13\nTwo patties, bacon, cheddar, special sauce\n\nMushroom Swiss ............. $14\nSautéed mushrooms, Swiss, garlic aioli\n\nSpicy Jalapeño ................ $13\nPepper jack, jalapeños, chipotle mayo", style: { fontSize: "16px", fontWeight: "400", color: "#E0D8C0", lineHeight: "1.5" }, visible: true, locked: false, fontFamily: "DM Sans", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "shape", x: 540, y: 195, width: 400, height: 280, content: "", style: {}, shapeType: "rounded-rect", shapeFill: "#1a1a10", shapeStroke: "#FFD700", shapeStrokeWidth: 1, visible: true, locked: false, filters: { ...DEFAULT_FILTERS }, entranceAnim: "fade-in", enterDelay: 400 },
      { id: tid(), type: "text", x: 560, y: 210, width: 360, height: 30, content: "SIGNATURE BURGERS", style: { fontSize: "18px", fontWeight: "700", color: "#FFD700", letterSpacing: "4px" }, visible: true, locked: false, fontFamily: "Bebas Neue", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 560, y: 250, width: 360, height: 200, content: "Truffle Smash .................. $18\nTruffle aioli, gruyère, caramelised onion\n\nBBQ Brisket ..................... $19\n12hr smoked brisket, slaw, pickles\n\nThe Impossible ................. $16\nPlant-based patty, vegan cheese, all fixings\n\nChicken Royale ................ $15\nCrispy chicken, slaw, hot honey", style: { fontSize: "16px", fontWeight: "400", color: "#E0D8C0", lineHeight: "1.5" }, visible: true, locked: false, fontFamily: "DM Sans", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "shape", x: 80, y: 500, width: 860, height: 110, content: "", style: {}, shapeType: "rounded-rect", shapeFill: "#1a1a10", shapeStroke: "#FF6B35", shapeStrokeWidth: 1, visible: true, locked: false, filters: { ...DEFAULT_FILTERS }, entranceAnim: "fade-in", enterDelay: 500 },
      { id: tid(), type: "text", x: 100, y: 510, width: 200, height: 25, content: "LOADED FRIES", style: { fontSize: "16px", fontWeight: "700", color: "#FF6B35", letterSpacing: "3px" }, visible: true, locked: false, fontFamily: "Bebas Neue", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 100, y: 540, width: 820, height: 55, content: "Classic Fries $5  •  Cheese & Bacon $8  •  Truffle Parmesan $9  •  Chilli Cheese $8\nOnion Rings $6  •  Sweet Potato Fries $7  •  Mac & Cheese Bites $8", style: { fontSize: "16px", fontWeight: "400", color: "#E0D8C0", lineHeight: "1.7", textAlign: "center" }, visible: true, locked: false, fontFamily: "DM Sans", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 100, y: 640, width: 820, height: 40, content: "🥤 ADD A SHAKE — Vanilla • Chocolate • Strawberry • Oreo — $7", style: { fontSize: "18px", fontWeight: "600", color: "#FFD700", textAlign: "center" }, visible: true, locked: false, fontFamily: "Space Grotesk", filters: { ...DEFAULT_FILTERS }, animation: "pulse", entranceAnim: "fade-in", enterDelay: 800 },
    ],
  },
  {
    id: "menu-sushi",
    name: "Sushi & Japanese",
    category: "menu",
    preview: "🍣",
    description: "Elegant sushi menu with zen aesthetics and smooth animations",
    bg: { type: "gradient", color: "#0a0a14", gradient: "linear-gradient(180deg, #0a0a14 0%, #0f1420 100%)" },
    elements: [
      { id: tid(), type: "text", x: 200, y: 40, width: 620, height: 80, content: "鮨  SAKURA SUSHI", style: { fontSize: "50px", fontWeight: "300", color: "#FFFFFF", textAlign: "center" }, visible: true, locked: false, fontFamily: "Playfair Display", filters: { ...DEFAULT_FILTERS }, entranceAnim: "fade-in" },
      { id: tid(), type: "shape", x: 420, y: 130, width: 180, height: 2, content: "", style: {}, shapeType: "line", shapeFill: "#E8A0BF", shapeStroke: "#E8A0BF", shapeStrokeWidth: 2, visible: true, locked: false, filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 200, y: 145, width: 620, height: 25, content: "AUTHENTIC JAPANESE CUISINE", style: { fontSize: "13px", fontWeight: "600", color: "#E8A0BF", letterSpacing: "8px", textAlign: "center" }, visible: true, locked: false, fontFamily: "Space Grotesk", filters: { ...DEFAULT_FILTERS }, entranceAnim: "fade-in", enterDelay: 200 },
      { id: tid(), type: "text", x: 80, y: 200, width: 450, height: 30, content: "NIGIRI  (2 pieces)", style: { fontSize: "18px", fontWeight: "600", color: "#E8A0BF", letterSpacing: "4px" }, visible: true, locked: false, fontFamily: "Space Grotesk", filters: { ...DEFAULT_FILTERS }, entranceAnim: "fade-in", enterDelay: 300 },
      { id: tid(), type: "text", x: 80, y: 240, width: 450, height: 180, content: "Salmon (Sake) ...................... $7\nTuna (Maguro) ...................... $8\nYellowtail (Hamachi) ........... $9\nShrimp (Ebi) ......................... $6\nUnagi (Eel) ............................ $10\nOtoro (Fatty Tuna) .............. $14", style: { fontSize: "18px", fontWeight: "400", color: "#C8D0E0", lineHeight: "1.8" }, visible: true, locked: false, fontFamily: "DM Sans", filters: { ...DEFAULT_FILTERS }, entranceAnim: "fade-in", enterDelay: 400 },
      { id: tid(), type: "text", x: 540, y: 200, width: 450, height: 30, content: "SIGNATURE ROLLS", style: { fontSize: "18px", fontWeight: "600", color: "#E8A0BF", letterSpacing: "4px" }, visible: true, locked: false, fontFamily: "Space Grotesk", filters: { ...DEFAULT_FILTERS }, entranceAnim: "fade-in", enterDelay: 350 },
      { id: tid(), type: "text", x: 540, y: 240, width: 450, height: 180, content: "Dragon Roll ........................... $16\nEel, avocado, cucumber, unagi sauce\n\nRainbow Roll ......................... $18\nAssorted sashimi over California roll\n\nSpicy Tuna Crunch ................ $15\nSpicy tuna, tempura flakes, sriracha", style: { fontSize: "18px", fontWeight: "400", color: "#C8D0E0", lineHeight: "1.5" }, visible: true, locked: false, fontFamily: "DM Sans", filters: { ...DEFAULT_FILTERS }, entranceAnim: "fade-in", enterDelay: 500 },
      { id: tid(), type: "shape", x: 80, y: 460, width: 860, height: 2, content: "", style: {}, shapeType: "line", shapeFill: "#E8A0BF", shapeStroke: "#E8A0BF", shapeStrokeWidth: 1, visible: true, locked: false, filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 80, y: 480, width: 400, height: 30, content: "OMAKASE  おまかせ", style: { fontSize: "18px", fontWeight: "600", color: "#E8A0BF", letterSpacing: "4px" }, visible: true, locked: false, fontFamily: "Space Grotesk", filters: { ...DEFAULT_FILTERS }, entranceAnim: "fade-in", enterDelay: 600 },
      { id: tid(), type: "text", x: 80, y: 520, width: 860, height: 80, content: "Chef's Choice 7-Course ...................... $65\nChef's Choice 12-Course .................... $95\nPremium Omakase with Sake Pairing .... $140", style: { fontSize: "18px", fontWeight: "400", color: "#C8D0E0", lineHeight: "1.8" }, visible: true, locked: false, fontFamily: "DM Sans", filters: { ...DEFAULT_FILTERS }, entranceAnim: "fade-in", enterDelay: 700 },
      { id: tid(), type: "text", x: 200, y: 640, width: 620, height: 40, content: "🍶 Sake Menu Available · Ask Your Server", style: { fontSize: "16px", fontWeight: "500", color: "#E8A0BF", textAlign: "center", fontStyle: "italic" }, visible: true, locked: false, fontFamily: "Lora", filters: { ...DEFAULT_FILTERS }, animation: "float", entranceAnim: "fade-in", enterDelay: 900 },
    ],
  },
  {
    id: "menu-brunch",
    name: "Brunch Menu",
    category: "menu",
    preview: "🥞",
    description: "Warm brunch menu with pulsing specials and staggered reveals",
    bg: { type: "gradient", color: "#1a1408", gradient: "linear-gradient(135deg, #1a1408 0%, #2a2010 50%, #1a1408 100%)" },
    elements: [
      { id: tid(), type: "text", x: 140, y: 40, width: 740, height: 80, content: "☀️ WEEKEND BRUNCH", style: { fontSize: "52px", fontWeight: "800", color: "#FFFFFF", textAlign: "center" }, visible: true, locked: false, fontFamily: "Playfair Display", filters: { ...DEFAULT_FILTERS }, entranceAnim: "fade-in" },
      { id: tid(), type: "text", x: 140, y: 130, width: 740, height: 30, content: "SERVED SATURDAY & SUNDAY  •  9 AM – 3 PM", style: { fontSize: "15px", fontWeight: "600", color: "#F59E0B", letterSpacing: "4px", textAlign: "center" }, visible: true, locked: false, fontFamily: "Space Grotesk", filters: { ...DEFAULT_FILTERS }, entranceAnim: "fade-in", enterDelay: 200 },
      { id: tid(), type: "shape", x: 380, y: 175, width: 260, height: 3, content: "", style: {}, shapeType: "line", shapeFill: "#F59E0B", shapeStroke: "#F59E0B", shapeStrokeWidth: 3, visible: true, locked: false, filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 80, y: 210, width: 450, height: 30, content: "SWEET", style: { fontSize: "20px", fontWeight: "700", color: "#F59E0B", letterSpacing: "5px" }, visible: true, locked: false, fontFamily: "Bebas Neue", filters: { ...DEFAULT_FILTERS }, entranceAnim: "fade-in", enterDelay: 300 },
      { id: tid(), type: "text", x: 80, y: 250, width: 450, height: 200, content: "Buttermilk Pancakes ............ $14\nMaple syrup, butter, seasonal berries\n\nFrench Toast .......................... $15\nBrioche, cinnamon, vanilla cream\n\nAçai Bowl ............................... $16\nGranola, banana, coconut, honey\n\nWaffles & Ice Cream ............ $16\nBelgian waffles, vanilla bean gelato", style: { fontSize: "17px", fontWeight: "400", color: "#E8D5B7", lineHeight: "1.55" }, visible: true, locked: false, fontFamily: "DM Sans", filters: { ...DEFAULT_FILTERS }, entranceAnim: "fade-in", enterDelay: 400 },
      { id: tid(), type: "text", x: 540, y: 210, width: 450, height: 30, content: "SAVOURY", style: { fontSize: "20px", fontWeight: "700", color: "#F59E0B", letterSpacing: "5px" }, visible: true, locked: false, fontFamily: "Bebas Neue", filters: { ...DEFAULT_FILTERS }, entranceAnim: "fade-in", enterDelay: 350 },
      { id: tid(), type: "text", x: 540, y: 250, width: 450, height: 200, content: "Eggs Benedict ....................... $16\nHollandaise, ham, English muffin\n\nAvocado Toast ....................... $15\nSourdough, poached egg, chilli flakes\n\nFull English ............................ $18\nBacon, eggs, sausage, beans, toast\n\nShakshuka ............................. $15\nBaked eggs, tomato, feta, herbs", style: { fontSize: "17px", fontWeight: "400", color: "#E8D5B7", lineHeight: "1.55" }, visible: true, locked: false, fontFamily: "DM Sans", filters: { ...DEFAULT_FILTERS }, entranceAnim: "fade-in", enterDelay: 500 },
      { id: tid(), type: "shape", x: 80, y: 490, width: 860, height: 80, content: "", style: {}, shapeType: "rounded-rect", shapeFill: "#2a2010", shapeStroke: "#F59E0B", shapeStrokeWidth: 2, visible: true, locked: false, filters: { ...DEFAULT_FILTERS }, entranceAnim: "fade-in", enterDelay: 600 },
      { id: tid(), type: "text", x: 100, y: 500, width: 820, height: 55, content: "🥂 BOTTOMLESS BRUNCH — $35 per person\nUnlimited mimosas, bellinis & bloody marys for 90 minutes", style: { fontSize: "20px", fontWeight: "600", color: "#FFD700", textAlign: "center", lineHeight: "1.6" }, visible: true, locked: false, fontFamily: "Space Grotesk", filters: { ...DEFAULT_FILTERS }, animation: "pulse" },
      { id: tid(), type: "text", x: 140, y: 600, width: 740, height: 70, content: "☕ All brunch includes complimentary coffee or fresh OJ\n🌿 Gluten-free & vegan options available — just ask!", style: { fontSize: "15px", fontWeight: "500", color: "#C0A880", textAlign: "center", lineHeight: "2.0" }, visible: true, locked: false, fontFamily: "Lora", filters: { ...DEFAULT_FILTERS }, entranceAnim: "fade-in", enterDelay: 800 },
    ],
  },

  /* ─── PROMOTIONS ─── */
  {
    id: "promo-flash-sale",
    name: "Flash Sale",
    category: "promo",
    preview: "⚡",
    description: "Bold flash sale announcement with countdown urgency",
    bg: { type: "gradient", color: "#0f0f0f", gradient: "linear-gradient(135deg, #1a0000 0%, #0f0f0f 50%, #001a1a 100%)" },
    elements: [
      { id: tid(), type: "text", x: 200, y: 100, width: 600, height: 70, content: "⚡ FLASH SALE ⚡", style: { fontSize: "56px", fontWeight: "900", color: "#FF4444", textAlign: "center" }, visible: true, locked: false, fontFamily: "Russo One", filters: { ...DEFAULT_FILTERS }, animation: "pulse" },
      { id: tid(), type: "text", x: 200, y: 220, width: 600, height: 200, content: "50%\nOFF", style: { fontSize: "120px", fontWeight: "900", color: "#FFFFFF", textAlign: "center", lineHeight: "0.9" }, visible: true, locked: false, fontFamily: "Bebas Neue", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 200, y: 460, width: 600, height: 50, content: "EVERYTHING IN STORE", style: { fontSize: "28px", fontWeight: "700", color: "#FF6B35", textAlign: "center", letterSpacing: "6px" }, visible: true, locked: false, fontFamily: "Space Grotesk", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 200, y: 560, width: 600, height: 40, content: "THIS WEEKEND ONLY", style: { fontSize: "22px", fontWeight: "500", color: "#94A3B8", textAlign: "center", letterSpacing: "4px" }, visible: true, locked: false, fontFamily: "Inter", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "widget-countdown", x: 300, y: 650, width: 400, height: 120, content: "", style: {}, visible: true, locked: false, proOnly: true, filters: { ...DEFAULT_FILTERS } },
    ],
  },
  {
    id: "promo-happy-hour",
    name: "Happy Hour",
    category: "promo",
    preview: "🎉",
    description: "Vibrant happy hour promotion with time slot",
    bg: { type: "gradient", color: "#0a1628", gradient: "linear-gradient(135deg, #0a1628 0%, #1a0a28 100%)" },
    elements: [
      { id: tid(), type: "text", x: 100, y: 100, width: 800, height: 80, content: "HAPPY HOUR", style: { fontSize: "72px", fontWeight: "900", color: "#FFD700" }, visible: true, locked: false, fontFamily: "Righteous", filters: { ...DEFAULT_FILTERS }, glowIntensity: 60 },
      { id: tid(), type: "text", x: 100, y: 200, width: 800, height: 60, content: "EVERY FRIDAY 4 PM – 7 PM", style: { fontSize: "32px", fontWeight: "600", color: "#FFFFFF", letterSpacing: "4px" }, visible: true, locked: false, fontFamily: "Bebas Neue", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "shape", x: 100, y: 280, width: 300, height: 3, content: "", style: {}, shapeType: "line", shapeFill: "#FFD700", shapeStroke: "#FFD700", shapeStrokeWidth: 3, visible: true, locked: false, filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 100, y: 320, width: 800, height: 350, content: "🍺 Draft Beers — $4\n🍷 House Wine — $6\n🍹 Well Cocktails — $5\n🍕 Appetizers — Half Price", style: { fontSize: "32px", fontWeight: "400", color: "#E2E8F0", lineHeight: "2.2" }, visible: true, locked: false, fontFamily: "DM Sans", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 100, y: 750, width: 800, height: 40, content: "No reservations needed • Walk-ins welcome", style: { fontSize: "18px", fontWeight: "400", color: "#64748B", textAlign: "center", fontStyle: "italic" }, visible: true, locked: false, fontFamily: "Lora", filters: { ...DEFAULT_FILTERS } },
    ],
  },
  {
    id: "promo-seasonal",
    name: "Seasonal Offer",
    category: "promo",
    preview: "🌸",
    description: "Elegant seasonal promotion with clean layout",
    bg: { type: "gradient", color: "#0f1923", gradient: "linear-gradient(180deg, #0f1923 0%, #1a2332 100%)" },
    elements: [
      { id: tid(), type: "text", x: 120, y: 100, width: 800, height: 50, content: "LIMITED TIME OFFER", style: { fontSize: "18px", fontWeight: "600", color: "#E879A8", letterSpacing: "8px" }, visible: true, locked: false, fontFamily: "Space Grotesk", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 120, y: 170, width: 800, height: 120, content: "Spring\nCollection", style: { fontSize: "72px", fontWeight: "300", color: "#FFFFFF", lineHeight: "1.1" }, visible: true, locked: false, fontFamily: "Playfair Display", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 120, y: 340, width: 600, height: 100, content: "Refresh your space with our curated spring selection. New arrivals weekly.", style: { fontSize: "22px", fontWeight: "400", color: "#94A3B8", lineHeight: "1.6" }, visible: true, locked: false, fontFamily: "Inter", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 120, y: 500, width: 300, height: 80, content: "20% OFF", style: { fontSize: "56px", fontWeight: "900", color: "#E879A8" }, visible: true, locked: false, fontFamily: "Bebas Neue", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 120, y: 580, width: 500, height: 40, content: "Use code: SPRING2026", style: { fontSize: "20px", fontWeight: "500", color: "#FFD700", letterSpacing: "3px" }, visible: true, locked: false, fontFamily: "Space Grotesk", filters: { ...DEFAULT_FILTERS } },
    ],
  },

  /* ─── INFO DISPLAYS ─── */
  {
    id: "info-welcome",
    name: "Welcome Screen",
    category: "info",
    preview: "👋",
    description: "Corporate welcome display with company branding area",
    bg: { type: "gradient", color: "#0a0f1a", gradient: "linear-gradient(135deg, #0a0f1a 0%, #1a1a2e 100%)" },
    elements: [
      { id: tid(), type: "text", x: 160, y: 200, width: 700, height: 60, content: "WELCOME TO", style: { fontSize: "24px", fontWeight: "600", color: "#6B8DD6", letterSpacing: "10px", textAlign: "center" }, visible: true, locked: false, fontFamily: "Space Grotesk", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 160, y: 270, width: 700, height: 120, content: "YOUR\nCOMPANY", style: { fontSize: "80px", fontWeight: "900", color: "#FFFFFF", textAlign: "center", lineHeight: "1" }, visible: true, locked: false, fontFamily: "Oswald", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "shape", x: 380, y: 420, width: 260, height: 3, content: "", style: {}, shapeType: "line", shapeFill: "#4A6FA5", shapeStroke: "#4A6FA5", shapeStrokeWidth: 3, visible: true, locked: false, filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 160, y: 460, width: 700, height: 50, content: "Please check in at reception", style: { fontSize: "26px", fontWeight: "300", color: "#94A3B8", textAlign: "center" }, visible: true, locked: false, fontFamily: "Inter", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "widget-clock", x: 380, y: 600, width: 260, height: 100, content: "", style: {}, visible: true, locked: false, filters: { ...DEFAULT_FILTERS } },
    ],
  },
  {
    id: "info-event",
    name: "Event Schedule",
    category: "info",
    preview: "📅",
    description: "Conference or event schedule with time slots",
    bg: { type: "solid", color: "#0a0a12" },
    elements: [
      { id: tid(), type: "text", x: 80, y: 50, width: 800, height: 70, content: "EVENT SCHEDULE", style: { fontSize: "48px", fontWeight: "900", color: "#FFFFFF", letterSpacing: "4px" }, visible: true, locked: false, fontFamily: "Oswald", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 80, y: 130, width: 500, height: 35, content: "SATURDAY, APRIL 26, 2026", style: { fontSize: "16px", fontWeight: "600", color: "hsl(180, 100%, 45%)", letterSpacing: "4px" }, visible: true, locked: false, fontFamily: "Space Grotesk", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "shape", x: 80, y: 180, width: 800, height: 2, content: "", style: {}, shapeType: "line", shapeFill: "#1E293B", shapeStroke: "#1E293B", shapeStrokeWidth: 2, visible: true, locked: false, filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 80, y: 200, width: 800, height: 550, content: "09:00    Registration & Coffee\n\n10:00    Opening Keynote — Main Stage\n              \"The Future of Digital Experience\"\n\n11:30    Workshop A — Room 1\n              Interactive Design Principles\n\n12:30    Lunch Break — Atrium\n\n14:00    Panel Discussion — Main Stage\n              Industry Leaders Q&A\n\n15:30    Networking & Demos\n\n17:00    Closing Remarks", style: { fontSize: "22px", fontWeight: "400", color: "#CBD5E1", lineHeight: "1.7" }, visible: true, locked: false, fontFamily: "DM Sans", filters: { ...DEFAULT_FILTERS } },
    ],
  },
  {
    id: "info-announcement",
    name: "Office Announcement",
    category: "info",
    preview: "📢",
    description: "Clean internal announcement for office displays",
    bg: { type: "gradient", color: "#0f1218", gradient: "linear-gradient(180deg, #0f1218 0%, #0f1923 100%)" },
    elements: [
      { id: tid(), type: "text", x: 100, y: 80, width: 200, height: 40, content: "📢 NOTICE", style: { fontSize: "16px", fontWeight: "700", color: "#F59E0B", letterSpacing: "5px" }, visible: true, locked: false, fontFamily: "Space Grotesk", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 100, y: 160, width: 800, height: 120, content: "Office Closure\nNotice", style: { fontSize: "64px", fontWeight: "800", color: "#FFFFFF", lineHeight: "1.1" }, visible: true, locked: false, fontFamily: "Outfit", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "shape", x: 100, y: 310, width: 120, height: 4, content: "", style: {}, shapeType: "line", shapeFill: "#D97706", shapeStroke: "#D97706", shapeStrokeWidth: 4, visible: true, locked: false, filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 100, y: 360, width: 700, height: 200, content: "The office will be closed on Monday, April 28th for the bank holiday.\n\nPlease ensure all urgent tasks are completed by Friday EOD. Remote work is available if needed.\n\nContact HR for any questions.", style: { fontSize: "22px", fontWeight: "400", color: "#94A3B8", lineHeight: "1.7" }, visible: true, locked: false, fontFamily: "Inter", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 100, y: 620, width: 400, height: 35, content: "— Management Team", style: { fontSize: "18px", fontWeight: "500", color: "#64748B", fontStyle: "italic" }, visible: true, locked: false, fontFamily: "Lora", filters: { ...DEFAULT_FILTERS } },
    ],
  },
  /* ─── GYM / FITNESS ─── */
  {
    id: "fitness-class",
    name: "Class Schedule",
    category: "fitness",
    preview: "🏋️",
    description: "Gym class timetable with bold time slots",
    bg: { type: "gradient", color: "#0a0a0a", gradient: "linear-gradient(135deg, #0a0a0a 0%, #1a0a0a 100%)" },
    elements: [
      { id: tid(), type: "text", x: 80, y: 50, width: 700, height: 80, content: "TODAY'S CLASSES", style: { fontSize: "56px", fontWeight: "900", color: "#FF4444", letterSpacing: "4px" }, visible: true, locked: false, fontFamily: "Oswald", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "shape", x: 80, y: 140, width: 200, height: 4, content: "", style: {}, shapeType: "line", shapeFill: "#FF4444", shapeStroke: "#FF4444", shapeStrokeWidth: 4, visible: true, locked: false, filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 80, y: 180, width: 800, height: 600, content: "06:00    HIIT Burn — Studio A\n              45 min • All levels • Coach Marcus\n\n07:30    Spin Cycle — Cycle Room\n              50 min • Intermediate • Coach Priya\n\n09:00    Yoga Flow — Studio B\n              60 min • Beginner friendly • Sarah\n\n12:00    Boxing Basics — Ring\n              45 min • All levels • Coach Dex\n\n17:30    CrossFit WOD — Main Floor\n              60 min • Advanced • Coach Liam\n\n19:00    Pilates Core — Studio B\n              45 min • All levels • Mia", style: { fontSize: "20px", fontWeight: "400", color: "#CBD5E1", lineHeight: "1.7" }, visible: true, locked: false, fontFamily: "DM Sans", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 80, y: 840, width: 700, height: 35, content: "Book via app or front desk • Walk-ins welcome", style: { fontSize: "16px", fontWeight: "500", color: "#64748B", fontStyle: "italic" }, visible: true, locked: false, fontFamily: "Inter", filters: { ...DEFAULT_FILTERS } },
    ],
  },
  {
    id: "fitness-promo",
    name: "Membership Offer",
    category: "fitness",
    preview: "💪",
    description: "Gym membership promotion with pricing",
    bg: { type: "gradient", color: "#0f0f0f", gradient: "linear-gradient(180deg, #0f0f0f 0%, #1a0505 100%)" },
    elements: [
      { id: tid(), type: "text", x: 120, y: 80, width: 600, height: 40, content: "NO JOINING FEE", style: { fontSize: "18px", fontWeight: "700", color: "#FF4444", letterSpacing: "8px" }, visible: true, locked: false, fontFamily: "Space Grotesk", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 120, y: 140, width: 800, height: 140, content: "TRANSFORM\nYOUR BODY", style: { fontSize: "72px", fontWeight: "900", color: "#FFFFFF", lineHeight: "1" }, visible: true, locked: false, fontFamily: "Oswald", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "shape", x: 120, y: 300, width: 150, height: 4, content: "", style: {}, shapeType: "line", shapeFill: "#FF4444", shapeStroke: "#FF4444", shapeStrokeWidth: 4, visible: true, locked: false, filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 120, y: 340, width: 500, height: 160, content: "£19.99/mo\nUnlimited access", style: { fontSize: "56px", fontWeight: "800", color: "#FF6B35", lineHeight: "1.3" }, visible: true, locked: false, fontFamily: "Bebas Neue", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 120, y: 520, width: 700, height: 180, content: "✓ Full gym floor & free weights\n✓ All group classes included\n✓ Sauna & steam room\n✓ Free fitness assessment\n✓ Cancel anytime", style: { fontSize: "22px", fontWeight: "400", color: "#94A3B8", lineHeight: "1.9" }, visible: true, locked: false, fontFamily: "Inter", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 120, y: 750, width: 500, height: 40, content: "Scan QR or ask at reception", style: { fontSize: "18px", fontWeight: "500", color: "#64748B", fontStyle: "italic" }, visible: true, locked: false, fontFamily: "Lora", filters: { ...DEFAULT_FILTERS } },
    ],
  },
  {
    id: "fitness-motivation",
    name: "Motivation Board",
    category: "fitness",
    preview: "🔥",
    description: "Motivational display with bold quote",
    bg: { type: "solid", color: "#0a0a0a" },
    elements: [
      { id: tid(), type: "text", x: 100, y: 200, width: 800, height: 250, content: "STRONGER\nTHAN\nYESTERDAY", style: { fontSize: "96px", fontWeight: "900", color: "#FFFFFF", lineHeight: "1", textAlign: "center" }, visible: true, locked: false, fontFamily: "Oswald", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "shape", x: 400, y: 480, width: 200, height: 4, content: "", style: {}, shapeType: "line", shapeFill: "#FF4444", shapeStroke: "#FF4444", shapeStrokeWidth: 4, visible: true, locked: false, filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 200, y: 520, width: 600, height: 50, content: "PUSH YOUR LIMITS • EVERY REP COUNTS", style: { fontSize: "18px", fontWeight: "600", color: "#FF4444", textAlign: "center", letterSpacing: "5px" }, visible: true, locked: false, fontFamily: "Space Grotesk", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "widget-clock", x: 380, y: 700, width: 240, height: 80, content: "", style: {}, visible: true, locked: false, filters: { ...DEFAULT_FILTERS } },
    ],
  },

  /* ─── RETAIL WINDOW DISPLAY ─── */
  {
    id: "retail-new-arrivals",
    name: "New Arrivals",
    category: "retail",
    preview: "🛍️",
    description: "Shop window display for new collection launch",
    bg: { type: "gradient", color: "#0f0f0f", gradient: "linear-gradient(135deg, #0f0f0f 0%, #1a1a2e 100%)" },
    elements: [
      { id: tid(), type: "text", x: 100, y: 80, width: 400, height: 35, content: "JUST DROPPED", style: { fontSize: "16px", fontWeight: "700", color: "#FF6B6B", letterSpacing: "8px" }, visible: true, locked: false, fontFamily: "Space Grotesk", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 100, y: 130, width: 800, height: 140, content: "NEW\nARRIVALS", style: { fontSize: "88px", fontWeight: "900", color: "#FFFFFF", lineHeight: "1" }, visible: true, locked: false, fontFamily: "Oswald", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "shape", x: 100, y: 290, width: 120, height: 4, content: "", style: {}, shapeType: "line", shapeFill: "#FF6B6B", shapeStroke: "#FF6B6B", shapeStrokeWidth: 4, visible: true, locked: false, filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 100, y: 330, width: 600, height: 80, content: "Summer 2026 Collection\nNow in store & online", style: { fontSize: "26px", fontWeight: "300", color: "#94A3B8", lineHeight: "1.6" }, visible: true, locked: false, fontFamily: "Inter", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 100, y: 480, width: 400, height: 80, content: "FROM £29", style: { fontSize: "56px", fontWeight: "800", color: "#FFD700" }, visible: true, locked: false, fontFamily: "Bebas Neue", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 100, y: 580, width: 500, height: 35, content: "Shop now at yourstore.com", style: { fontSize: "18px", fontWeight: "500", color: "#64748B", letterSpacing: "2px" }, visible: true, locked: false, fontFamily: "Inter", filters: { ...DEFAULT_FILTERS } },
    ],
  },
  {
    id: "retail-sale-window",
    name: "Window Sale",
    category: "retail",
    preview: "🏷️",
    description: "Eye-catching sale display for shop windows",
    bg: { type: "gradient", color: "#1a0000", gradient: "linear-gradient(180deg, #1a0000 0%, #0f0f0f 100%)" },
    elements: [
      { id: tid(), type: "text", x: 150, y: 60, width: 700, height: 200, content: "SALE", style: { fontSize: "160px", fontWeight: "900", color: "#FF4444", textAlign: "center", lineHeight: "1" }, visible: true, locked: false, fontFamily: "Bebas Neue", filters: { ...DEFAULT_FILTERS }, animation: "pulse" },
      { id: tid(), type: "text", x: 200, y: 280, width: 600, height: 120, content: "UP TO 70% OFF", style: { fontSize: "56px", fontWeight: "800", color: "#FFFFFF", textAlign: "center" }, visible: true, locked: false, fontFamily: "Oswald", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "shape", x: 350, y: 420, width: 300, height: 3, content: "", style: {}, shapeType: "line", shapeFill: "#FF4444", shapeStroke: "#FF4444", shapeStrokeWidth: 3, visible: true, locked: false, filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 200, y: 460, width: 600, height: 120, content: "FINAL REDUCTIONS\nEVERYTHING MUST GO", style: { fontSize: "32px", fontWeight: "700", color: "#FFD700", textAlign: "center", lineHeight: "1.5", letterSpacing: "4px" }, visible: true, locked: false, fontFamily: "Space Grotesk", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 200, y: 620, width: 600, height: 40, content: "In store only • While stocks last", style: { fontSize: "18px", fontWeight: "400", color: "#64748B", textAlign: "center", fontStyle: "italic" }, visible: true, locked: false, fontFamily: "Lora", filters: { ...DEFAULT_FILTERS } },
    ],
  },
  {
    id: "retail-loyalty",
    name: "Loyalty Programme",
    category: "retail",
    preview: "⭐",
    description: "Customer loyalty programme promotion",
    bg: { type: "gradient", color: "#0a1628", gradient: "linear-gradient(135deg, #0a1628 0%, #1a1a2e 100%)" },
    elements: [
      { id: tid(), type: "text", x: 120, y: 80, width: 300, height: 35, content: "REWARDS", style: { fontSize: "16px", fontWeight: "700", color: "#FFD700", letterSpacing: "8px" }, visible: true, locked: false, fontFamily: "Space Grotesk", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 120, y: 130, width: 800, height: 100, content: "Join Our VIP Club", style: { fontSize: "64px", fontWeight: "800", color: "#FFFFFF" }, visible: true, locked: false, fontFamily: "Playfair Display", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "shape", x: 120, y: 250, width: 160, height: 3, content: "", style: {}, shapeType: "line", shapeFill: "#FFD700", shapeStroke: "#FFD700", shapeStrokeWidth: 3, visible: true, locked: false, filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 120, y: 290, width: 700, height: 250, content: "⭐ Earn 1 point per £1 spent\n⭐ Birthday surprise every year\n⭐ Exclusive member-only sales\n⭐ Free delivery on all orders\n⭐ Early access to new drops", style: { fontSize: "24px", fontWeight: "400", color: "#CBD5E1", lineHeight: "2" }, visible: true, locked: false, fontFamily: "DM Sans", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 120, y: 580, width: 500, height: 40, content: "Scan to sign up — it's free!", style: { fontSize: "20px", fontWeight: "500", color: "#34D399", fontStyle: "italic" }, visible: true, locked: false, fontFamily: "Lora", filters: { ...DEFAULT_FILTERS } },
    ],
  },

  /* ─── HOTEL LOBBY ─── */
  {
    id: "hotel-welcome",
    name: "Hotel Welcome",
    category: "hotel",
    preview: "🏨",
    description: "Elegant hotel lobby welcome screen",
    bg: { type: "gradient", color: "#0f0f1a", gradient: "linear-gradient(180deg, #0f0f1a 0%, #1a1628 100%)" },
    elements: [
      { id: tid(), type: "text", x: 160, y: 150, width: 700, height: 40, content: "WELCOME TO", style: { fontSize: "18px", fontWeight: "600", color: "#D4A574", letterSpacing: "10px", textAlign: "center" }, visible: true, locked: false, fontFamily: "Space Grotesk", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 160, y: 200, width: 700, height: 140, content: "THE GRAND\nHOTEL", style: { fontSize: "80px", fontWeight: "300", color: "#FFFFFF", textAlign: "center", lineHeight: "1.1" }, visible: true, locked: false, fontFamily: "Playfair Display", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "shape", x: 400, y: 370, width: 220, height: 2, content: "", style: {}, shapeType: "line", shapeFill: "#D4A574", shapeStroke: "#D4A574", shapeStrokeWidth: 2, visible: true, locked: false, filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 160, y: 410, width: 700, height: 50, content: "Est. 1923 • Five Star Luxury", style: { fontSize: "20px", fontWeight: "400", color: "#94A3B8", textAlign: "center", letterSpacing: "3px" }, visible: true, locked: false, fontFamily: "Lora", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "widget-clock", x: 380, y: 540, width: 260, height: 100, content: "", style: {}, visible: true, locked: false, filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "widget-weather", x: 380, y: 680, width: 260, height: 100, content: "", style: {}, visible: true, locked: false, filters: { ...DEFAULT_FILTERS } },
    ],
  },
  {
    id: "hotel-amenities",
    name: "Hotel Amenities",
    category: "hotel",
    preview: "🛎️",
    description: "Guest information display with amenities & hours",
    bg: { type: "gradient", color: "#0f0f1a", gradient: "linear-gradient(135deg, #0f0f1a 0%, #1a1628 100%)" },
    elements: [
      { id: tid(), type: "text", x: 80, y: 50, width: 700, height: 70, content: "GUEST SERVICES", style: { fontSize: "48px", fontWeight: "300", color: "#FFFFFF", letterSpacing: "6px" }, visible: true, locked: false, fontFamily: "Playfair Display", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "shape", x: 80, y: 130, width: 120, height: 2, content: "", style: {}, shapeType: "line", shapeFill: "#D4A574", shapeStroke: "#D4A574", shapeStrokeWidth: 2, visible: true, locked: false, filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 80, y: 170, width: 800, height: 550, content: "🍽️  RESTAURANT\n     Breakfast  7:00 – 10:30\n     Lunch  12:00 – 14:30\n     Dinner  18:00 – 22:00\n\n🏊  POOL & SPA\n     Pool  06:00 – 21:00\n     Spa bookings at reception\n\n💪  FITNESS CENTRE\n     Open 24 hours • Key card access\n\n☕  LOUNGE BAR\n     Open 11:00 – midnight\n     Afternoon tea 15:00 – 17:00\n\n🅿️  VALET PARKING\n     Available 24 hours • £15/day", style: { fontSize: "20px", fontWeight: "400", color: "#CBD5E1", lineHeight: "1.65" }, visible: true, locked: false, fontFamily: "DM Sans", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 80, y: 780, width: 700, height: 35, content: "Dial 0 from your room for assistance", style: { fontSize: "16px", fontWeight: "500", color: "#D4A574", fontStyle: "italic" }, visible: true, locked: false, fontFamily: "Lora", filters: { ...DEFAULT_FILTERS } },
    ],
  },
  {
    id: "hotel-checkout",
    name: "Checkout Info",
    category: "hotel",
    preview: "🔑",
    description: "Check-out time and departure information",
    bg: { type: "solid", color: "#0a0a12" },
    elements: [
      { id: tid(), type: "text", x: 160, y: 100, width: 700, height: 40, content: "DEPARTURE INFORMATION", style: { fontSize: "18px", fontWeight: "600", color: "#D4A574", letterSpacing: "8px", textAlign: "center" }, visible: true, locked: false, fontFamily: "Space Grotesk", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 160, y: 180, width: 700, height: 140, content: "CHECK-OUT\nBY 11:00", style: { fontSize: "72px", fontWeight: "800", color: "#FFFFFF", textAlign: "center", lineHeight: "1.1" }, visible: true, locked: false, fontFamily: "Oswald", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "shape", x: 400, y: 350, width: 220, height: 3, content: "", style: {}, shapeType: "line", shapeFill: "#D4A574", shapeStroke: "#D4A574", shapeStrokeWidth: 3, visible: true, locked: false, filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 120, y: 400, width: 760, height: 250, content: "Late check-out available upon request (subject to availability)\n\nLuggage storage available at the concierge desk\n\nAirport transfers can be arranged — please enquire at reception by 9:00 AM\n\nWe hope you enjoyed your stay!", style: { fontSize: "22px", fontWeight: "400", color: "#94A3B8", textAlign: "center", lineHeight: "1.7" }, visible: true, locked: false, fontFamily: "Inter", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "widget-clock", x: 400, y: 700, width: 220, height: 80, content: "", style: {}, visible: true, locked: false, filters: { ...DEFAULT_FILTERS } },
    ],
  },
  /* ─── HEALTHCARE / CLINIC ─── */
  {
    id: "health-waiting",
    name: "Waiting Room Info",
    category: "health",
    preview: "🏥",
    description: "Patient information display for clinic waiting areas",
    bg: { type: "gradient", color: "#0a1520", gradient: "linear-gradient(180deg, #0a1520 0%, #0f1923 100%)" },
    elements: [
      { id: tid(), type: "text", x: 120, y: 60, width: 700, height: 50, content: "PATIENT INFORMATION", style: { fontSize: "18px", fontWeight: "700", color: "#5BA8D6", letterSpacing: "8px" }, visible: true, locked: false, fontFamily: "Space Grotesk", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 120, y: 120, width: 800, height: 100, content: "Welcome to\nBrightcare Clinic", style: { fontSize: "56px", fontWeight: "300", color: "#FFFFFF", lineHeight: "1.15" }, visible: true, locked: false, fontFamily: "Playfair Display", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "shape", x: 120, y: 240, width: 100, height: 3, content: "", style: {}, shapeType: "line", shapeFill: "#5BA8D6", shapeStroke: "#5BA8D6", shapeStrokeWidth: 3, visible: true, locked: false, filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 120, y: 280, width: 750, height: 400, content: "📋  Please check in at the front desk\n\n⏱️  Average wait time: 15 minutes\n\n😷  Masks are recommended in clinical areas\n\n📱  Free Wi-Fi: BrightCare-Guest\n\n💧  Water & refreshments available\n\n🚗  Parking validation at checkout", style: { fontSize: "22px", fontWeight: "400", color: "#CBD5E1", lineHeight: "1.8" }, visible: true, locked: false, fontFamily: "DM Sans", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "widget-clock", x: 700, y: 60, width: 200, height: 80, content: "", style: {}, visible: true, locked: false, filters: { ...DEFAULT_FILTERS } },
    ],
  },
  {
    id: "health-services",
    name: "Clinic Services",
    category: "health",
    preview: "💊",
    description: "Healthcare services overview for lobby displays",
    bg: { type: "gradient", color: "#0a1628", gradient: "linear-gradient(135deg, #0a1628 0%, #0f1a2e 100%)" },
    elements: [
      { id: tid(), type: "text", x: 100, y: 60, width: 800, height: 70, content: "OUR SERVICES", style: { fontSize: "48px", fontWeight: "800", color: "#FFFFFF", letterSpacing: "4px" }, visible: true, locked: false, fontFamily: "Oswald", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "shape", x: 100, y: 140, width: 150, height: 4, content: "", style: {}, shapeType: "line", shapeFill: "#4ECCA3", shapeStroke: "#4ECCA3", shapeStrokeWidth: 4, visible: true, locked: false, filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 100, y: 180, width: 800, height: 550, content: "🩺  General Practice\n     Walk-ins & appointments available\n\n🦷  Dental Care\n     Routine checkups & cosmetic dentistry\n\n👁️  Optometry\n     Eye exams & prescription lenses\n\n💉  Vaccinations\n     Flu, travel & childhood immunisations\n\n🧠  Mental Health\n     Counselling & therapy services\n\n🏃  Physiotherapy\n     Injury rehab & sports medicine", style: { fontSize: "20px", fontWeight: "400", color: "#CBD5E1", lineHeight: "1.65" }, visible: true, locked: false, fontFamily: "DM Sans", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 100, y: 780, width: 700, height: 35, content: "Call 0800 123 456 or book online at brightcare.co.uk", style: { fontSize: "16px", fontWeight: "500", color: "#4ECCA3", fontStyle: "italic" }, visible: true, locked: false, fontFamily: "Lora", filters: { ...DEFAULT_FILTERS } },
    ],
  },
  {
    id: "health-tips",
    name: "Health Tips",
    category: "health",
    preview: "❤️",
    description: "Wellness tips and health reminders for waiting rooms",
    bg: { type: "solid", color: "#0a0a12" },
    elements: [
      { id: tid(), type: "text", x: 140, y: 80, width: 300, height: 35, content: "WELLNESS CORNER", style: { fontSize: "16px", fontWeight: "700", color: "#F97066", letterSpacing: "6px" }, visible: true, locked: false, fontFamily: "Space Grotesk", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 140, y: 130, width: 750, height: 120, content: "5 Daily Habits\nfor Better Health", style: { fontSize: "56px", fontWeight: "800", color: "#FFFFFF", lineHeight: "1.1" }, visible: true, locked: false, fontFamily: "Oswald", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "shape", x: 140, y: 270, width: 120, height: 4, content: "", style: {}, shapeType: "line", shapeFill: "#F97066", shapeStroke: "#F97066", shapeStrokeWidth: 4, visible: true, locked: false, filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 140, y: 320, width: 700, height: 400, content: "1.  Drink 8 glasses of water daily\n\n2.  Get 30 minutes of exercise\n\n3.  Eat 5 portions of fruit & veg\n\n4.  Sleep 7–9 hours per night\n\n5.  Take 10 minutes for mindfulness", style: { fontSize: "26px", fontWeight: "400", color: "#CBD5E1", lineHeight: "1.9" }, visible: true, locked: false, fontFamily: "DM Sans", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 140, y: 760, width: 600, height: 35, content: "Your health is your greatest wealth", style: { fontSize: "18px", fontWeight: "500", color: "#94A3B8", fontStyle: "italic" }, visible: true, locked: false, fontFamily: "Lora", filters: { ...DEFAULT_FILTERS } },
    ],
  },
  {
    id: "health-pharmacy",
    name: "Pharmacy Display",
    category: "health",
    preview: "💊",
    description: "Pharmacy services and prescription information board",
    bg: { type: "gradient", color: "#0a1a14", gradient: "linear-gradient(135deg, #0a1a14 0%, #0f2a1e 50%, #0a1a14 100%)" },
    elements: [
      { id: tid(), type: "text", x: 120, y: 50, width: 780, height: 70, content: "GREENLEAF PHARMACY", style: { fontSize: "44px", fontWeight: "800", color: "#FFFFFF", letterSpacing: "3px", textAlign: "center" }, visible: true, locked: false, fontFamily: "Oswald", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "shape", x: 360, y: 130, width: 300, height: 3, content: "", style: {}, shapeType: "line", shapeFill: "#22C55E", shapeStroke: "#22C55E", shapeStrokeWidth: 3, visible: true, locked: false, filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 120, y: 160, width: 780, height: 40, content: "YOUR TRUSTED HEALTH PARTNER", style: { fontSize: "16px", fontWeight: "600", color: "#22C55E", letterSpacing: "6px", textAlign: "center" }, visible: true, locked: false, fontFamily: "Space Grotesk", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 80, y: 230, width: 860, height: 380, content: "💊  Prescription Collection\n     Ready in 15 minutes · Check counter 2\n\n🩹  Over-the-Counter Advice\n     Speak to our qualified pharmacists\n\n💉  Flu & Travel Vaccinations\n     Walk-ins welcome · No appointment needed\n\n🩸  Blood Pressure Checks\n     Free — available daily 9 AM – 5 PM\n\n📦  Repeat Prescriptions\n     Order online or via our app", style: { fontSize: "20px", fontWeight: "400", color: "#D0E8D8", lineHeight: "1.65" }, visible: true, locked: false, fontFamily: "DM Sans", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 120, y: 650, width: 780, height: 35, content: "OPEN MON–SAT 8 AM – 9 PM  •  SUN 10 AM – 4 PM", style: { fontSize: "15px", fontWeight: "600", color: "#22C55E", letterSpacing: "3px", textAlign: "center" }, visible: true, locked: false, fontFamily: "Space Grotesk", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "widget-clock", x: 780, y: 50, width: 160, height: 60, content: "", style: {}, visible: true, locked: false, filters: { ...DEFAULT_FILTERS } },
    ],
  },
  {
    id: "health-dental",
    name: "Dental Office",
    category: "health",
    preview: "🦷",
    description: "Dental clinic display with services and patient info",
    bg: { type: "gradient", color: "#0c1220", gradient: "linear-gradient(180deg, #0c1220 0%, #141e35 100%)" },
    elements: [
      { id: tid(), type: "text", x: 120, y: 50, width: 780, height: 70, content: "🦷 BRIGHT SMILE DENTAL", style: { fontSize: "46px", fontWeight: "800", color: "#FFFFFF", textAlign: "center" }, visible: true, locked: false, fontFamily: "Playfair Display", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "shape", x: 360, y: 130, width: 300, height: 3, content: "", style: {}, shapeType: "line", shapeFill: "#60A5FA", shapeStroke: "#60A5FA", shapeStrokeWidth: 3, visible: true, locked: false, filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 120, y: 160, width: 780, height: 40, content: "CARING FOR YOUR SMILE SINCE 2005", style: { fontSize: "14px", fontWeight: "600", color: "#60A5FA", letterSpacing: "5px", textAlign: "center" }, visible: true, locked: false, fontFamily: "Space Grotesk", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 100, y: 230, width: 400, height: 30, content: "OUR TREATMENTS", style: { fontSize: "16px", fontWeight: "600", color: "#60A5FA", letterSpacing: "4px" }, visible: true, locked: false, fontFamily: "Space Grotesk", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 100, y: 270, width: 420, height: 300, content: "✦  Routine Check-ups & Cleaning\n✦  Teeth Whitening\n✦  Invisible Braces & Aligners\n✦  Dental Implants\n✦  Root Canal Treatment\n✦  Cosmetic Veneers\n✦  Children's Dentistry", style: { fontSize: "20px", fontWeight: "400", color: "#CBD5E1", lineHeight: "2.0" }, visible: true, locked: false, fontFamily: "DM Sans", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "shape", x: 560, y: 230, width: 380, height: 200, content: "", style: {}, shapeType: "rounded-rect", shapeFill: "#141e35", shapeStroke: "#60A5FA", shapeStrokeWidth: 1, visible: true, locked: false, filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 580, y: 250, width: 340, height: 25, content: "DID YOU KNOW?", style: { fontSize: "14px", fontWeight: "700", color: "#60A5FA", letterSpacing: "4px" }, visible: true, locked: false, fontFamily: "Space Grotesk", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 580, y: 285, width: 340, height: 130, content: "Regular dental check-ups every 6 months can prevent 90% of serious dental conditions. Prevention is always better than cure!", style: { fontSize: "18px", fontWeight: "400", color: "#94A3B8", lineHeight: "1.6" }, visible: true, locked: false, fontFamily: "Lora", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 100, y: 620, width: 820, height: 35, content: "📞 BOOK YOUR APPOINTMENT: 0800 555 SMILE  •  WALK-INS WELCOME", style: { fontSize: "15px", fontWeight: "600", color: "#60A5FA", textAlign: "center", letterSpacing: "2px" }, visible: true, locked: false, fontFamily: "Space Grotesk", filters: { ...DEFAULT_FILTERS } },
    ],
  },
  {
    id: "health-physio",
    name: "Physiotherapy",
    category: "health",
    preview: "🏃",
    description: "Physiotherapy and rehab clinic waiting room display",
    bg: { type: "gradient", color: "#12080a", gradient: "linear-gradient(135deg, #12080a 0%, #1f1018 50%, #12080a 100%)" },
    elements: [
      { id: tid(), type: "text", x: 120, y: 50, width: 780, height: 70, content: "RESTORE PHYSIO", style: { fontSize: "50px", fontWeight: "900", color: "#FFFFFF", textAlign: "center", letterSpacing: "3px" }, visible: true, locked: false, fontFamily: "Oswald", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 120, y: 130, width: 780, height: 35, content: "MOVE BETTER • FEEL STRONGER • LIVE FULLY", style: { fontSize: "15px", fontWeight: "600", color: "#F97316", letterSpacing: "5px", textAlign: "center" }, visible: true, locked: false, fontFamily: "Space Grotesk", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "shape", x: 380, y: 180, width: 260, height: 3, content: "", style: {}, shapeType: "line", shapeFill: "#F97316", shapeStroke: "#F97316", shapeStrokeWidth: 3, visible: true, locked: false, filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 80, y: 220, width: 450, height: 30, content: "SPECIALISATIONS", style: { fontSize: "16px", fontWeight: "600", color: "#F97316", letterSpacing: "4px" }, visible: true, locked: false, fontFamily: "Space Grotesk", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 80, y: 260, width: 450, height: 300, content: "🦴  Sports Injury Rehabilitation\n🏋️  Post-Surgery Recovery\n🧘  Chronic Pain Management\n🤸  Mobility & Flexibility Training\n🏃  Running Gait Analysis\n💆  Dry Needling & Manual Therapy", style: { fontSize: "20px", fontWeight: "400", color: "#E8D0C0", lineHeight: "2.0" }, visible: true, locked: false, fontFamily: "DM Sans", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "shape", x: 560, y: 220, width: 380, height: 160, content: "", style: {}, shapeType: "rounded-rect", shapeFill: "#1f1018", shapeStroke: "#F97316", shapeStrokeWidth: 1, visible: true, locked: false, filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 580, y: 235, width: 340, height: 25, content: "YOUR FIRST VISIT", style: { fontSize: "14px", fontWeight: "700", color: "#F97316", letterSpacing: "4px" }, visible: true, locked: false, fontFamily: "Space Grotesk", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 580, y: 270, width: 340, height: 100, content: "Please arrive 10 minutes early to complete your intake form. Wear comfortable clothing that allows movement.", style: { fontSize: "17px", fontWeight: "400", color: "#C0A898", lineHeight: "1.6" }, visible: true, locked: false, fontFamily: "Lora", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 80, y: 600, width: 860, height: 80, content: "⏱️ Average session: 45 mins  •  📱 Book online: restorephysio.com\n🅿️ Free parking available  •  ♿ Fully accessible facility", style: { fontSize: "15px", fontWeight: "500", color: "#F97316", textAlign: "center", lineHeight: "2.0" }, visible: true, locked: false, fontFamily: "Space Grotesk", filters: { ...DEFAULT_FILTERS } },
    ],
  },

  /* ─── EDUCATION / SCHOOL ─── */
  {
    id: "edu-notice",
    name: "School Notice Board",
    category: "education",
    preview: "📚",
    description: "School announcements and daily notices",
    bg: { type: "gradient", color: "#0f1228", gradient: "linear-gradient(135deg, #0f1228 0%, #1a1a2e 100%)" },
    elements: [
      { id: tid(), type: "text", x: 80, y: 50, width: 800, height: 70, content: "DAILY NOTICES", style: { fontSize: "48px", fontWeight: "900", color: "#FFFFFF", letterSpacing: "4px" }, visible: true, locked: false, fontFamily: "Oswald", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 80, y: 130, width: 500, height: 30, content: "MONDAY 14 APRIL 2026", style: { fontSize: "16px", fontWeight: "600", color: "hsl(180, 100%, 45%)", letterSpacing: "4px" }, visible: true, locked: false, fontFamily: "Space Grotesk", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "shape", x: 80, y: 175, width: 800, height: 2, content: "", style: {}, shapeType: "line", shapeFill: "#1E293B", shapeStroke: "#1E293B", shapeStrokeWidth: 2, visible: true, locked: false, filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 80, y: 200, width: 800, height: 550, content: "📢  Assembly at 9:00 AM — Main Hall\n     Guest speaker: Local MP on civic leadership\n\n📝  Year 11 Mock Results\n     Collect from form tutors today\n\n⚽  Football Trial — 3:30 PM\n     Meet at the sports pavilion\n\n🎭  Drama Club Auditions\n     Thursday lunch in the theatre\n\n🍕  Canteen Special: Pizza Friday!\n     Pre-order by Wednesday\n\n📅  Parents Evening — 22 April\n     Book slots via the school app", style: { fontSize: "20px", fontWeight: "400", color: "#CBD5E1", lineHeight: "1.65" }, visible: true, locked: false, fontFamily: "DM Sans", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "widget-clock", x: 750, y: 50, width: 180, height: 70, content: "", style: {}, visible: true, locked: false, filters: { ...DEFAULT_FILTERS } },
    ],
  },
  {
    id: "edu-timetable",
    name: "Class Timetable",
    category: "education",
    preview: "🕐",
    description: "Period-by-period class schedule display",
    bg: { type: "solid", color: "#0a0a12" },
    elements: [
      { id: tid(), type: "text", x: 100, y: 50, width: 700, height: 70, content: "TODAY'S TIMETABLE", style: { fontSize: "48px", fontWeight: "900", color: "#FFFFFF", letterSpacing: "4px" }, visible: true, locked: false, fontFamily: "Oswald", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 100, y: 130, width: 400, height: 30, content: "YEAR 10 — FORM 10B", style: { fontSize: "16px", fontWeight: "600", color: "#FFD700", letterSpacing: "4px" }, visible: true, locked: false, fontFamily: "Space Grotesk", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "shape", x: 100, y: 175, width: 800, height: 2, content: "", style: {}, shapeType: "line", shapeFill: "#1E293B", shapeStroke: "#1E293B", shapeStrokeWidth: 2, visible: true, locked: false, filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 100, y: 200, width: 800, height: 550, content: "P1    08:45    English Literature — Mrs Thompson\n                   Room 204 · Bring poetry anthology\n\nP2    09:45    Mathematics — Mr Patel\n                   Room 112 · Calculator needed\n\nP3    10:55    Biology — Dr Chen\n                   Lab 3 · Practical session\n\n         12:00    LUNCH\n\nP4    13:00    History — Ms Williams\n                   Room 301 · Essay due\n\nP5    14:00    Physical Education\n                   Sports Hall · Kit required", style: { fontSize: "20px", fontWeight: "400", color: "#CBD5E1", lineHeight: "1.65" }, visible: true, locked: false, fontFamily: "DM Sans", filters: { ...DEFAULT_FILTERS } },
    ],
  },
  {
    id: "edu-achievement",
    name: "Achievement Board",
    category: "education",
    preview: "🏆",
    description: "Student achievements and recognition display",
    bg: { type: "gradient", color: "#0f0f0f", gradient: "linear-gradient(180deg, #0f0f0f 0%, #1a1628 100%)" },
    elements: [
      { id: tid(), type: "text", x: 120, y: 60, width: 300, height: 35, content: "STAR STUDENTS", style: { fontSize: "16px", fontWeight: "700", color: "#FFD700", letterSpacing: "8px" }, visible: true, locked: false, fontFamily: "Space Grotesk", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 120, y: 110, width: 800, height: 100, content: "This Week's\nAchievements", style: { fontSize: "64px", fontWeight: "800", color: "#FFFFFF", lineHeight: "1.1" }, visible: true, locked: false, fontFamily: "Oswald", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "shape", x: 120, y: 230, width: 150, height: 4, content: "", style: {}, shapeType: "line", shapeFill: "#FFD700", shapeStroke: "#FFD700", shapeStrokeWidth: 4, visible: true, locked: false, filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 120, y: 280, width: 750, height: 400, content: "🥇  Student of the Week\n     Amara K. — Outstanding science project\n\n📖  Reading Challenge Winner\n     Jake M. — 50 books this term!\n\n🎨  Art Exhibition Star\n     Lily T. — Selected for regional gallery\n\n🏅  Sports Achievement\n     Year 9 Girls — District netball champions\n\n🎵  Music Excellence\n     School Orchestra — Grade A at festival", style: { fontSize: "22px", fontWeight: "400", color: "#CBD5E1", lineHeight: "1.75" }, visible: true, locked: false, fontFamily: "DM Sans", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 120, y: 730, width: 600, height: 35, content: "Congratulations to all our achievers! 🌟", style: { fontSize: "18px", fontWeight: "500", color: "#FFD700", fontStyle: "italic" }, visible: true, locked: false, fontFamily: "Lora", filters: { ...DEFAULT_FILTERS } },
    ],
  },
  {
    id: "edu-library",
    name: "Library Display",
    category: "education",
    preview: "📖",
    description: "Library hours, new arrivals, and reading recommendations",
    bg: { type: "gradient", color: "#0f1a14", gradient: "linear-gradient(135deg, #0f1a14 0%, #1a2a1e 50%, #0f1a14 100%)" },
    elements: [
      { id: tid(), type: "text", x: 120, y: 40, width: 780, height: 35, content: "SCHOOL LIBRARY", style: { fontSize: "16px", fontWeight: "700", color: "#6EE7B7", letterSpacing: "8px", textAlign: "center" }, visible: true, locked: false, fontFamily: "Space Grotesk", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 80, y: 80, width: 860, height: 70, content: "📖 READ · DISCOVER · GROW", style: { fontSize: "48px", fontWeight: "900", color: "#FFFFFF", textAlign: "center" }, visible: true, locked: false, fontFamily: "Playfair Display", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "shape", x: 350, y: 165, width: 320, height: 3, content: "", style: {}, shapeType: "line", shapeFill: "#6EE7B7", shapeStroke: "#6EE7B7", shapeStrokeWidth: 3, visible: true, locked: false, filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "shape", x: 80, y: 195, width: 400, height: 200, content: "", style: {}, shapeType: "rounded-rect", shapeFill: "#1a2a1e", shapeStroke: "#2a3a30", shapeStrokeWidth: 1, visible: true, locked: false, filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 100, y: 210, width: 360, height: 25, content: "📚 NEW ARRIVALS", style: { fontSize: "14px", fontWeight: "700", color: "#6EE7B7", letterSpacing: "3px" }, visible: true, locked: false, fontFamily: "Space Grotesk", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 100, y: 245, width: 360, height: 130, content: "The Wild Robot — Peter Brown\nLong Walk to Freedom — N. Mandela\nCosmos — Carl Sagan\nThe Midnight Library — Matt Haig\nSapiens — Yuval Noah Harari", style: { fontSize: "16px", fontWeight: "400", color: "#D0E8D8", lineHeight: "1.7" }, visible: true, locked: false, fontFamily: "DM Sans", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "shape", x: 520, y: 195, width: 420, height: 200, content: "", style: {}, shapeType: "rounded-rect", shapeFill: "#1a2a1e", shapeStroke: "#2a3a30", shapeStrokeWidth: 1, visible: true, locked: false, filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 540, y: 210, width: 380, height: 25, content: "🕐 OPENING HOURS", style: { fontSize: "14px", fontWeight: "700", color: "#6EE7B7", letterSpacing: "3px" }, visible: true, locked: false, fontFamily: "Space Grotesk", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 540, y: 245, width: 380, height: 130, content: "Monday–Thursday  8:00 AM – 5:00 PM\nFriday  8:00 AM – 3:30 PM\nSaturday  9:00 AM – 1:00 PM\nSunday  Closed\n\nQuiet Study Zone: Upper Floor", style: { fontSize: "16px", fontWeight: "400", color: "#D0E8D8", lineHeight: "1.7" }, visible: true, locked: false, fontFamily: "DM Sans", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "shape", x: 80, y: 425, width: 860, height: 130, content: "", style: {}, shapeType: "rounded-rect", shapeFill: "#1a2a1e", shapeStroke: "#6EE7B7", shapeStrokeWidth: 1, visible: true, locked: false, filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 100, y: 440, width: 820, height: 25, content: "⭐ READING CHALLENGE — SPRING 2026", style: { fontSize: "14px", fontWeight: "700", color: "#6EE7B7", letterSpacing: "3px", textAlign: "center" }, visible: true, locked: false, fontFamily: "Space Grotesk", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 100, y: 475, width: 820, height: 65, content: "Read 10 books by June to earn your Gold Reader Badge!\n342 students participating · 1,876 books read so far", style: { fontSize: "18px", fontWeight: "400", color: "#D0E8D8", lineHeight: "1.7", textAlign: "center" }, visible: true, locked: false, fontFamily: "DM Sans", filters: { ...DEFAULT_FILTERS }, animation: "pulse" },
      { id: tid(), type: "text", x: 80, y: 590, width: 860, height: 40, content: "RETURN BOOKS ON TIME · RESPECT THE QUIET ZONES · ASK A LIBRARIAN FOR HELP", style: { fontSize: "12px", fontWeight: "600", color: "#6EE7B7", letterSpacing: "2px", textAlign: "center" }, visible: true, locked: false, fontFamily: "Space Grotesk", filters: { ...DEFAULT_FILTERS } },
    ],
  },
  {
    id: "edu-campus-events",
    name: "Campus Events",
    category: "education",
    preview: "🎉",
    description: "Upcoming campus events, clubs, and activities calendar",
    bg: { type: "gradient", color: "#0a0a1a", gradient: "linear-gradient(135deg, #0a0a1a 0%, #1a1040 50%, #0a0a1a 100%)" },
    elements: [
      { id: tid(), type: "text", x: 120, y: 40, width: 780, height: 35, content: "WHAT'S HAPPENING ON CAMPUS", style: { fontSize: "16px", fontWeight: "700", color: "#A78BFA", letterSpacing: "6px", textAlign: "center" }, visible: true, locked: false, fontFamily: "Space Grotesk", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 80, y: 80, width: 860, height: 70, content: "🎓 CAMPUS EVENTS", style: { fontSize: "52px", fontWeight: "900", color: "#FFFFFF", textAlign: "center" }, visible: true, locked: false, fontFamily: "Oswald", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "shape", x: 350, y: 165, width: 320, height: 3, content: "", style: {}, shapeType: "line", shapeFill: "#A78BFA", shapeStroke: "#A78BFA", shapeStrokeWidth: 3, visible: true, locked: false, filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "shape", x: 80, y: 195, width: 420, height: 140, content: "", style: {}, shapeType: "rounded-rect", shapeFill: "#1a1040", shapeStroke: "#A78BFA", shapeStrokeWidth: 1, visible: true, locked: false, filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 100, y: 205, width: 380, height: 20, content: "🎭 THIS WEEK", style: { fontSize: "13px", fontWeight: "700", color: "#A78BFA", letterSpacing: "3px" }, visible: true, locked: false, fontFamily: "Space Grotesk", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 100, y: 235, width: 380, height: 85, content: "Mon — Debate Club Tryouts · 4 PM\nWed — Spring Art Exhibition · All Day\nThu — Guest Speaker: Dr. Lin · 2 PM\nFri — Movie Night · 7 PM · Auditorium", style: { fontSize: "15px", fontWeight: "400", color: "#D0DEF0", lineHeight: "1.6" }, visible: true, locked: false, fontFamily: "DM Sans", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "shape", x: 520, y: 195, width: 420, height: 140, content: "", style: {}, shapeType: "rounded-rect", shapeFill: "#1a1040", shapeStroke: "#F59E0B", shapeStrokeWidth: 1, visible: true, locked: false, filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 540, y: 205, width: 380, height: 20, content: "🏆 UPCOMING", style: { fontSize: "13px", fontWeight: "700", color: "#F59E0B", letterSpacing: "3px" }, visible: true, locked: false, fontFamily: "Space Grotesk", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 540, y: 235, width: 380, height: 85, content: "Apr 22 — Earth Day Campus Cleanup\nApr 28 — Science Fair Finals\nMay 5 — Talent Show · Sign up NOW!\nMay 12 — Sports Day · All Years", style: { fontSize: "15px", fontWeight: "400", color: "#D0DEF0", lineHeight: "1.6" }, visible: true, locked: false, fontFamily: "DM Sans", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "shape", x: 80, y: 365, width: 860, height: 140, content: "", style: {}, shapeType: "rounded-rect", shapeFill: "#1a1040", shapeStroke: "#22C55E", shapeStrokeWidth: 1, visible: true, locked: false, filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 100, y: 375, width: 820, height: 20, content: "🎯 CLUBS & SOCIETIES — JOIN TODAY", style: { fontSize: "13px", fontWeight: "700", color: "#22C55E", letterSpacing: "3px", textAlign: "center" }, visible: true, locked: false, fontFamily: "Space Grotesk", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 100, y: 405, width: 820, height: 85, content: "Robotics Club · Chess Club · Environmental Society · Drama Society\nPhotography Club · Coding Club · Creative Writing · Book Club\nSign up at the Student Activities Office or scan the QR code on the noticeboard", style: { fontSize: "16px", fontWeight: "400", color: "#D0E8D8", lineHeight: "1.7", textAlign: "center" }, visible: true, locked: false, fontFamily: "DM Sans", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 80, y: 540, width: 860, height: 45, content: "📢 FOLLOW @CAMPUSLIFE FOR UPDATES · STUDENT UNION OFFICE: ROOM 104", style: { fontSize: "13px", fontWeight: "600", color: "#A78BFA", letterSpacing: "2px", textAlign: "center" }, visible: true, locked: false, fontFamily: "Space Grotesk", filters: { ...DEFAULT_FILTERS }, animation: "pulse" },
    ],
  },
  {
    id: "edu-exams",
    name: "Exam Schedule",
    category: "education",
    preview: "📝",
    description: "Exam timetable with dates, subjects, and room allocations",
    bg: { type: "gradient", color: "#0a0a0a", gradient: "linear-gradient(180deg, #0a0a0a 0%, #1a0a0a 100%)" },
    elements: [
      { id: tid(), type: "text", x: 120, y: 40, width: 780, height: 70, content: "📝 EXAM SCHEDULE", style: { fontSize: "48px", fontWeight: "900", color: "#FFFFFF", textAlign: "center" }, visible: true, locked: false, fontFamily: "Oswald", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 120, y: 115, width: 780, height: 30, content: "SPRING SEMESTER 2026 — FINAL EXAMINATIONS", style: { fontSize: "14px", fontWeight: "700", color: "#EF4444", letterSpacing: "5px", textAlign: "center" }, visible: true, locked: false, fontFamily: "Space Grotesk", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "shape", x: 350, y: 160, width: 320, height: 3, content: "", style: {}, shapeType: "line", shapeFill: "#EF4444", shapeStroke: "#EF4444", shapeStrokeWidth: 3, visible: true, locked: false, filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "shape", x: 80, y: 190, width: 860, height: 330, content: "", style: {}, shapeType: "rounded-rect", shapeFill: "#1a1212", shapeStroke: "#2a1a1a", shapeStrokeWidth: 1, visible: true, locked: false, filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 100, y: 200, width: 820, height: 25, content: "DATE              SUBJECT                    TIME              ROOM", style: { fontSize: "13px", fontWeight: "700", color: "#EF4444", letterSpacing: "2px" }, visible: true, locked: false, fontFamily: "Space Grotesk", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "shape", x: 100, y: 230, width: 800, height: 1, content: "", style: {}, shapeType: "line", shapeFill: "#EF4444", shapeStroke: "#EF4444", shapeStrokeWidth: 1, visible: true, locked: false, filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 100, y: 240, width: 820, height: 260, content: "May 12        Mathematics              9:00 AM          Hall A\nMay 13        English Literature        9:00 AM          Hall B\nMay 14        Physics                   9:00 AM          Lab 1\nMay 15        History                   9:00 AM          Hall A\nMay 16        Computer Science          2:00 PM          Lab 3\nMay 19        Biology                   9:00 AM          Lab 2\nMay 20        Chemistry                 9:00 AM          Lab 1\nMay 21        Geography                 2:00 PM          Hall B\nMay 22        Art & Design              9:00 AM          Studio", style: { fontSize: "17px", fontWeight: "400", color: "#D0C8C8", lineHeight: "1.9" }, visible: true, locked: false, fontFamily: "DM Sans", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 80, y: 545, width: 860, height: 50, content: "⚠️ Arrive 15 minutes early · Bring student ID · No phones in exam halls", style: { fontSize: "16px", fontWeight: "600", color: "#EF4444", textAlign: "center" }, visible: true, locked: false, fontFamily: "DM Sans", filters: { ...DEFAULT_FILTERS }, animation: "pulse" },
      { id: tid(), type: "text", x: 80, y: 600, width: 860, height: 35, content: "EXAM OFFICE: BLOCK C, ROOM 12 · HELPLINE: EXT 2400", style: { fontSize: "12px", fontWeight: "600", color: "#F87171", letterSpacing: "3px", textAlign: "center" }, visible: true, locked: false, fontFamily: "Space Grotesk", filters: { ...DEFAULT_FILTERS } },
    ],
  },
  /* ─── CHURCH / WORSHIP ─── */
  {
    id: "church-service",
    name: "Sunday Service",
    category: "church",
    preview: "⛪",
    description: "Worship service schedule with warm, inviting tones",
    bg: { type: "gradient", color: "#1a1025", gradient: "linear-gradient(135deg, #1a1025 0%, #2d1b3d 50%, #1a1025 100%)" },
    elements: [
      { id: tid(), type: "text", x: 120, y: 60, width: 780, height: 80, content: "✦ SUNDAY WORSHIP ✦", style: { fontSize: "52px", fontWeight: "800", color: "#F0D48A", textAlign: "center", letterSpacing: "4px" }, visible: true, locked: false, fontFamily: "Playfair Display", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "shape", x: 350, y: 150, width: 320, height: 3, content: "", style: {}, shapeType: "line", shapeFill: "#F0D48A", shapeStroke: "#F0D48A", shapeStrokeWidth: 3, visible: true, locked: false, filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 120, y: 190, width: 780, height: 50, content: "SERVICE TIMES", style: { fontSize: "22px", fontWeight: "600", color: "#C9A0DC", letterSpacing: "6px", textAlign: "center" }, visible: true, locked: false, fontFamily: "Space Grotesk", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 120, y: 260, width: 780, height: 200, content: "🕊️  Early Morning Prayer — 7:00 AM\n🎵  Contemporary Service — 9:00 AM\n⛪  Traditional Service — 11:00 AM\n🌙  Evening Vespers — 6:00 PM", style: { fontSize: "26px", fontWeight: "400", color: "#E8D5F0", lineHeight: "2.2", textAlign: "center" }, visible: true, locked: false, fontFamily: "DM Sans", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 120, y: 520, width: 780, height: 60, content: "\"For where two or three gather in my name,\nthere am I with them.\" — Matthew 18:20", style: { fontSize: "18px", fontWeight: "400", color: "#F0D48A", textAlign: "center", fontStyle: "italic", lineHeight: "1.6" }, visible: true, locked: false, fontFamily: "Lora", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 120, y: 640, width: 780, height: 45, content: "ALL ARE WELCOME • CHILDCARE AVAILABLE", style: { fontSize: "16px", fontWeight: "600", color: "#C9A0DC", letterSpacing: "4px", textAlign: "center" }, visible: true, locked: false, fontFamily: "Bebas Neue", filters: { ...DEFAULT_FILTERS } },
    ],
  },
  {
    id: "church-events",
    name: "Church Events",
    category: "church",
    preview: "📖",
    description: "Weekly events and community gatherings bulletin",
    bg: { type: "gradient", color: "#0f1a2e", gradient: "linear-gradient(180deg, #0f1a2e 0%, #1a2744 100%)" },
    elements: [
      { id: tid(), type: "text", x: 100, y: 50, width: 820, height: 70, content: "THIS WEEK AT GRACE CHURCH", style: { fontSize: "42px", fontWeight: "800", color: "#FFFFFF", textAlign: "center" }, visible: true, locked: false, fontFamily: "Oswald", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "shape", x: 100, y: 130, width: 820, height: 3, content: "", style: {}, shapeType: "line", shapeFill: "#5B9BD5", shapeStroke: "#5B9BD5", shapeStrokeWidth: 3, visible: true, locked: false, filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 100, y: 160, width: 820, height: 400, content: "MON — Bible Study Group · 7:00 PM · Room 201\n\nTUE — Youth Ministry · 6:30 PM · Fellowship Hall\n\nWED — Choir Rehearsal · 7:30 PM · Sanctuary\n\nTHU — Women's Prayer Circle · 10:00 AM · Chapel\n\nFRI — Community Meal · 5:30 PM · Dining Hall\n\nSAT — Volunteer Day · 9:00 AM · Main Campus", style: { fontSize: "22px", fontWeight: "400", color: "#D0DEF0", lineHeight: "2.0" }, visible: true, locked: false, fontFamily: "DM Sans", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 100, y: 620, width: 820, height: 40, content: "🙏 Serving our community with love and faith", style: { fontSize: "18px", fontWeight: "500", color: "#5B9BD5", textAlign: "center", fontStyle: "italic" }, visible: true, locked: false, fontFamily: "Lora", filters: { ...DEFAULT_FILTERS } },
    ],
  },
  {
    id: "church-verse",
    name: "Scripture Display",
    category: "church",
    preview: "✝️",
    description: "Featured Bible verse with elegant typography",
    bg: { type: "gradient", color: "#1a0f0a", gradient: "linear-gradient(135deg, #1a0f0a 0%, #2a1a10 50%, #1a0f0a 100%)" },
    elements: [
      { id: tid(), type: "text", x: 120, y: 120, width: 780, height: 60, content: "✦ VERSE OF THE DAY ✦", style: { fontSize: "24px", fontWeight: "600", color: "#D4A574", letterSpacing: "8px", textAlign: "center" }, visible: true, locked: false, fontFamily: "Bebas Neue", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 80, y: 240, width: 860, height: 220, content: "\"Trust in the Lord with all\nyour heart and lean not on\nyour own understanding.\"", style: { fontSize: "48px", fontWeight: "700", color: "#F5E6D3", textAlign: "center", lineHeight: "1.5" }, visible: true, locked: false, fontFamily: "Playfair Display", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 120, y: 500, width: 780, height: 50, content: "— Proverbs 3:5", style: { fontSize: "28px", fontWeight: "400", color: "#D4A574", textAlign: "center" }, visible: true, locked: false, fontFamily: "Lora", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "shape", x: 420, y: 580, width: 180, height: 3, content: "", style: {}, shapeType: "line", shapeFill: "#D4A574", shapeStroke: "#D4A574", shapeStrokeWidth: 2, visible: true, locked: false, filters: { ...DEFAULT_FILTERS } },
    ],
  },
  {
    id: "church-sermon",
    name: "Sermon Series",
    category: "church",
    preview: "🎤",
    description: "Current sermon series display with speaker and schedule",
    bg: { type: "gradient", color: "#0a0a1a", gradient: "linear-gradient(135deg, #0a0a1a 0%, #1a1030 50%, #0a0a1a 100%)" },
    elements: [
      { id: tid(), type: "text", x: 120, y: 50, width: 780, height: 35, content: "CURRENT SERMON SERIES", style: { fontSize: "16px", fontWeight: "700", color: "#A78BFA", letterSpacing: "8px", textAlign: "center" }, visible: true, locked: false, fontFamily: "Space Grotesk", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 80, y: 110, width: 860, height: 110, content: "UNSHAKEABLE\nFAITH", style: { fontSize: "72px", fontWeight: "900", color: "#FFFFFF", textAlign: "center", lineHeight: "1.1" }, visible: true, locked: false, fontFamily: "Oswald", filters: { ...DEFAULT_FILTERS }, glowIntensity: 40 },
      { id: tid(), type: "shape", x: 380, y: 240, width: 260, height: 3, content: "", style: {}, shapeType: "line", shapeFill: "#A78BFA", shapeStroke: "#A78BFA", shapeStrokeWidth: 3, visible: true, locked: false, filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 120, y: 270, width: 780, height: 45, content: "A 6-Week Journey Through the Book of James", style: { fontSize: "22px", fontWeight: "400", color: "#C4B5FD", textAlign: "center", fontStyle: "italic" }, visible: true, locked: false, fontFamily: "Lora", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "shape", x: 160, y: 350, width: 700, height: 250, content: "", style: {}, shapeType: "rounded-rect", shapeFill: "#1a1030", shapeStroke: "#A78BFA", shapeStrokeWidth: 1, visible: true, locked: false, filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 190, y: 365, width: 640, height: 25, content: "UPCOMING WEEKS", style: { fontSize: "14px", fontWeight: "700", color: "#A78BFA", letterSpacing: "5px", textAlign: "center" }, visible: true, locked: false, fontFamily: "Space Grotesk", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 190, y: 400, width: 640, height: 180, content: "Week 3 — \"Taming the Tongue\" · James 3:1-12\nPastor David Mitchell · This Sunday\n\nWeek 4 — \"Wisdom From Above\" · James 3:13-18\nGuest Speaker: Rev. Sarah Chen\n\nWeek 5 — \"Drawing Near to God\" · James 4:1-10\nPastor David Mitchell", style: { fontSize: "18px", fontWeight: "400", color: "#D0DEF0", lineHeight: "1.7" }, visible: true, locked: false, fontFamily: "DM Sans", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 120, y: 630, width: 780, height: 40, content: "🕐 SUNDAYS AT 9 AM & 11 AM  •  LIVESTREAM AVAILABLE", style: { fontSize: "15px", fontWeight: "600", color: "#A78BFA", letterSpacing: "3px", textAlign: "center" }, visible: true, locked: false, fontFamily: "Space Grotesk", filters: { ...DEFAULT_FILTERS }, animation: "pulse" },
    ],
  },
  {
    id: "church-prayer",
    name: "Prayer Request Board",
    category: "church",
    preview: "🙏",
    description: "Community prayer requests and prayer chain information",
    bg: { type: "gradient", color: "#0f1a14", gradient: "linear-gradient(180deg, #0f1a14 0%, #1a2a20 100%)" },
    elements: [
      { id: tid(), type: "text", x: 120, y: 50, width: 780, height: 70, content: "🙏 PRAYER REQUESTS", style: { fontSize: "48px", fontWeight: "800", color: "#FFFFFF", textAlign: "center" }, visible: true, locked: false, fontFamily: "Playfair Display", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 120, y: 130, width: 780, height: 30, content: "LIFTING EACH OTHER UP IN PRAYER", style: { fontSize: "14px", fontWeight: "600", color: "#6EE7B7", letterSpacing: "6px", textAlign: "center" }, visible: true, locked: false, fontFamily: "Space Grotesk", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "shape", x: 380, y: 175, width: 260, height: 3, content: "", style: {}, shapeType: "line", shapeFill: "#6EE7B7", shapeStroke: "#6EE7B7", shapeStrokeWidth: 3, visible: true, locked: false, filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "shape", x: 80, y: 210, width: 420, height: 160, content: "", style: {}, shapeType: "rounded-rect", shapeFill: "#1a2a20", shapeStroke: "#2a3a30", shapeStrokeWidth: 1, visible: true, locked: false, filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 100, y: 225, width: 380, height: 25, content: "🕊️ HEALING & COMFORT", style: { fontSize: "14px", fontWeight: "700", color: "#6EE7B7", letterSpacing: "3px" }, visible: true, locked: false, fontFamily: "Space Grotesk", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 100, y: 260, width: 380, height: 90, content: "The Thompson family — strength during recovery\nSister Margaret — peace and healing\nBrother James — comfort in loss", style: { fontSize: "17px", fontWeight: "400", color: "#D0E8D8", lineHeight: "1.7" }, visible: true, locked: false, fontFamily: "DM Sans", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "shape", x: 520, y: 210, width: 420, height: 160, content: "", style: {}, shapeType: "rounded-rect", shapeFill: "#1a2a20", shapeStroke: "#2a3a30", shapeStrokeWidth: 1, visible: true, locked: false, filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 540, y: 225, width: 380, height: 25, content: "✨ GRATITUDE & PRAISE", style: { fontSize: "14px", fontWeight: "700", color: "#6EE7B7", letterSpacing: "3px" }, visible: true, locked: false, fontFamily: "Space Grotesk", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 540, y: 260, width: 380, height: 90, content: "New baby — welcome baby Sophia!\nSuccessful surgery — thank you Lord\nJob promotion — God's provision", style: { fontSize: "17px", fontWeight: "400", color: "#D0E8D8", lineHeight: "1.7" }, visible: true, locked: false, fontFamily: "DM Sans", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "shape", x: 80, y: 400, width: 860, height: 160, content: "", style: {}, shapeType: "rounded-rect", shapeFill: "#1a2a20", shapeStroke: "#2a3a30", shapeStrokeWidth: 1, visible: true, locked: false, filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 100, y: 415, width: 820, height: 25, content: "🌍 MISSIONS & OUTREACH", style: { fontSize: "14px", fontWeight: "700", color: "#6EE7B7", letterSpacing: "3px" }, visible: true, locked: false, fontFamily: "Space Grotesk", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 100, y: 450, width: 820, height: 90, content: "Mission team in Guatemala — safe travels & fruitful work\nLocal food bank — provision for those in need\nPartner church in Kenya — growth and resources", style: { fontSize: "17px", fontWeight: "400", color: "#D0E8D8", lineHeight: "1.7" }, visible: true, locked: false, fontFamily: "DM Sans", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 80, y: 600, width: 860, height: 70, content: "📝 Submit your prayer request at the welcome desk\nor email prayers@gracechurch.org\n24/7 Prayer Chain: (555) 012-3456", style: { fontSize: "16px", fontWeight: "500", color: "#6EE7B7", textAlign: "center", lineHeight: "1.7" }, visible: true, locked: false, fontFamily: "Lora", filters: { ...DEFAULT_FILTERS } },
    ],
  },

  /* ─── CORPORATE / OFFICE ─── */
  {
    id: "corporate-welcome",
    name: "Office Welcome",
    category: "corporate",
    preview: "🏢",
    description: "Professional lobby welcome screen with company branding",
    bg: { type: "gradient", color: "#0a0f1a", gradient: "linear-gradient(135deg, #0a0f1a 0%, #141e30 50%, #0a0f1a 100%)" },
    elements: [
      { id: tid(), type: "text", x: 120, y: 100, width: 780, height: 70, content: "WELCOME TO", style: { fontSize: "28px", fontWeight: "600", color: "#6B8DD6", letterSpacing: "10px", textAlign: "center" }, visible: true, locked: false, fontFamily: "Space Grotesk", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 120, y: 180, width: 780, height: 100, content: "ACME CORPORATION", style: { fontSize: "64px", fontWeight: "900", color: "#FFFFFF", textAlign: "center" }, visible: true, locked: false, fontFamily: "Oswald", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "shape", x: 380, y: 300, width: 260, height: 3, content: "", style: {}, shapeType: "line", shapeFill: "#6B8DD6", shapeStroke: "#6B8DD6", shapeStrokeWidth: 3, visible: true, locked: false, filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 120, y: 340, width: 780, height: 50, content: "Innovation • Excellence • Integrity", style: { fontSize: "22px", fontWeight: "400", color: "#8899BB", textAlign: "center", fontStyle: "italic" }, visible: true, locked: false, fontFamily: "Lora", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "widget-clock", x: 380, y: 440, width: 260, height: 80, content: "clock", style: { fontSize: "48px", color: "#FFFFFF", textAlign: "center" }, visible: true, locked: false, filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 120, y: 560, width: 780, height: 45, content: "VISITOR CHECK-IN AT RECEPTION • FLOOR DIRECTORY ON RIGHT", style: { fontSize: "14px", fontWeight: "500", color: "#6B8DD6", letterSpacing: "3px", textAlign: "center" }, visible: true, locked: false, fontFamily: "Space Grotesk", filters: { ...DEFAULT_FILTERS } },
    ],
  },
  {
    id: "corporate-meeting",
    name: "Meeting Room",
    category: "corporate",
    preview: "📊",
    description: "Meeting room schedule and availability display",
    bg: { type: "solid", color: "#0f0f0f" },
    elements: [
      { id: tid(), type: "text", x: 100, y: 50, width: 820, height: 60, content: "CONFERENCE ROOM A", style: { fontSize: "40px", fontWeight: "800", color: "#FFFFFF", letterSpacing: "4px" }, visible: true, locked: false, fontFamily: "Oswald", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "shape", x: 100, y: 120, width: 160, height: 4, content: "", style: {}, shapeType: "line", shapeFill: "#22C55E", shapeStroke: "#22C55E", shapeStrokeWidth: 4, visible: true, locked: false, filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "shape", x: 100, y: 150, width: 820, height: 80, content: "", style: {}, shapeType: "rounded-rect", shapeFill: "#16291C", shapeStroke: "#22C55E", shapeStrokeWidth: 2, visible: true, locked: false, filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 130, y: 165, width: 400, height: 50, content: "✅ AVAILABLE NOW", style: { fontSize: "32px", fontWeight: "700", color: "#22C55E" }, visible: true, locked: false, fontFamily: "Space Grotesk", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 100, y: 270, width: 400, height: 40, content: "TODAY'S SCHEDULE", style: { fontSize: "18px", fontWeight: "600", color: "#6B8DD6", letterSpacing: "4px" }, visible: true, locked: false, fontFamily: "Space Grotesk", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 100, y: 320, width: 820, height: 300, content: "09:00 – 10:00    Q1 Planning Review — Marketing Team\n10:30 – 11:30    Client Onboarding Call — Sales\n12:00 – 13:00    Lunch & Learn: AI Tools — Engineering\n14:00 – 15:00    Sprint Retrospective — Product\n15:30 – 16:30    Board Prep — Leadership\n17:00 – 17:30    1-on-1 — HR", style: { fontSize: "20px", fontWeight: "400", color: "#C0CDE0", lineHeight: "2.1" }, visible: true, locked: false, fontFamily: "DM Sans", filters: { ...DEFAULT_FILTERS } },
    ],
  },
  {
    id: "corporate-kpi",
    name: "KPI Dashboard",
    category: "corporate",
    preview: "📈",
    description: "Key performance metrics display for office TVs",
    bg: { type: "gradient", color: "#0a0a12", gradient: "linear-gradient(180deg, #0a0a12 0%, #12121f 100%)" },
    elements: [
      { id: tid(), type: "text", x: 100, y: 40, width: 820, height: 60, content: "COMPANY DASHBOARD", style: { fontSize: "36px", fontWeight: "800", color: "#FFFFFF", letterSpacing: "4px" }, visible: true, locked: false, fontFamily: "Oswald", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 100, y: 100, width: 300, height: 30, content: "LIVE METRICS • Q2 2026", style: { fontSize: "14px", fontWeight: "500", color: "#6B8DD6", letterSpacing: "3px" }, visible: true, locked: false, fontFamily: "Space Grotesk", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "shape", x: 80, y: 160, width: 220, height: 140, content: "", style: {}, shapeType: "rounded-rect", shapeFill: "#1a1a2e", shapeStroke: "#22C55E", shapeStrokeWidth: 1, visible: true, locked: false, filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 100, y: 175, width: 180, height: 25, content: "REVENUE", style: { fontSize: "12px", fontWeight: "600", color: "#22C55E", letterSpacing: "3px" }, visible: true, locked: false, fontFamily: "Space Grotesk", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 100, y: 210, width: 180, height: 50, content: "$2.4M", style: { fontSize: "42px", fontWeight: "800", color: "#FFFFFF" }, visible: true, locked: false, fontFamily: "Oswald", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 100, y: 265, width: 180, height: 25, content: "↑ 18% vs last quarter", style: { fontSize: "13px", fontWeight: "500", color: "#22C55E" }, visible: true, locked: false, fontFamily: "DM Sans", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "shape", x: 320, y: 160, width: 220, height: 140, content: "", style: {}, shapeType: "rounded-rect", shapeFill: "#1a1a2e", shapeStroke: "#3B82F6", shapeStrokeWidth: 1, visible: true, locked: false, filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 340, y: 175, width: 180, height: 25, content: "CUSTOMERS", style: { fontSize: "12px", fontWeight: "600", color: "#3B82F6", letterSpacing: "3px" }, visible: true, locked: false, fontFamily: "Space Grotesk", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 340, y: 210, width: 180, height: 50, content: "12,847", style: { fontSize: "42px", fontWeight: "800", color: "#FFFFFF" }, visible: true, locked: false, fontFamily: "Oswald", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 340, y: 265, width: 180, height: 25, content: "↑ 340 new this month", style: { fontSize: "13px", fontWeight: "500", color: "#3B82F6" }, visible: true, locked: false, fontFamily: "DM Sans", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "shape", x: 560, y: 160, width: 220, height: 140, content: "", style: {}, shapeType: "rounded-rect", shapeFill: "#1a1a2e", shapeStroke: "#F59E0B", shapeStrokeWidth: 1, visible: true, locked: false, filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 580, y: 175, width: 180, height: 25, content: "NPS SCORE", style: { fontSize: "12px", fontWeight: "600", color: "#F59E0B", letterSpacing: "3px" }, visible: true, locked: false, fontFamily: "Space Grotesk", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 580, y: 210, width: 180, height: 50, content: "72", style: { fontSize: "42px", fontWeight: "800", color: "#FFFFFF" }, visible: true, locked: false, fontFamily: "Oswald", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 580, y: 265, width: 180, height: 25, content: "↑ 5 pts improvement", style: { fontSize: "13px", fontWeight: "500", color: "#F59E0B" }, visible: true, locked: false, fontFamily: "DM Sans", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 100, y: 360, width: 700, height: 30, content: "TOP PRIORITIES THIS QUARTER", style: { fontSize: "16px", fontWeight: "600", color: "#6B8DD6", letterSpacing: "3px" }, visible: true, locked: false, fontFamily: "Space Grotesk", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 100, y: 400, width: 700, height: 160, content: "1. Launch v3.0 platform — On Track ✅\n2. Expand EMEA sales team — In Progress 🔄\n3. Achieve SOC2 compliance — 85% Complete\n4. Customer retention > 95% — Currently 96.2% ✅", style: { fontSize: "20px", fontWeight: "400", color: "#C0CDE0", lineHeight: "2.0" }, visible: true, locked: false, fontFamily: "DM Sans", filters: { ...DEFAULT_FILTERS } },
    ],
  },
  {
    id: "corporate-spotlight",
    name: "Employee Spotlight",
    category: "corporate",
    preview: "🌟",
    description: "Employee of the month spotlight with bio and achievements",
    bg: { type: "gradient", color: "#0a0f1a", gradient: "linear-gradient(135deg, #0a0f1a 0%, #1a1030 50%, #0a0f1a 100%)" },
    elements: [
      { id: tid(), type: "text", x: 120, y: 40, width: 780, height: 35, content: "EMPLOYEE SPOTLIGHT", style: { fontSize: "16px", fontWeight: "700", color: "#F59E0B", letterSpacing: "8px", textAlign: "center" }, visible: true, locked: false, fontFamily: "Space Grotesk", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 120, y: 80, width: 780, height: 70, content: "⭐ STAR OF THE MONTH ⭐", style: { fontSize: "44px", fontWeight: "900", color: "#FFFFFF", textAlign: "center" }, visible: true, locked: false, fontFamily: "Oswald", filters: { ...DEFAULT_FILTERS }, animation: "pulse" },
      { id: tid(), type: "shape", x: 350, y: 170, width: 320, height: 3, content: "", style: {}, shapeType: "line", shapeFill: "#F59E0B", shapeStroke: "#F59E0B", shapeStrokeWidth: 3, visible: true, locked: false, filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "shape", x: 120, y: 200, width: 200, height: 200, content: "", style: {}, shapeType: "circle", shapeFill: "#1a1a2e", shapeStroke: "#F59E0B", shapeStrokeWidth: 3, visible: true, locked: false, filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 140, y: 270, width: 160, height: 60, content: "📸\nPhoto", style: { fontSize: "32px", fontWeight: "400", color: "#555", textAlign: "center" }, visible: true, locked: false, filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 360, y: 200, width: 540, height: 50, content: "SARAH JOHNSON", style: { fontSize: "38px", fontWeight: "800", color: "#FFFFFF" }, visible: true, locked: false, fontFamily: "Oswald", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 360, y: 255, width: 540, height: 30, content: "SENIOR PRODUCT DESIGNER • 3 YEARS", style: { fontSize: "14px", fontWeight: "600", color: "#F59E0B", letterSpacing: "3px" }, visible: true, locked: false, fontFamily: "Space Grotesk", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 360, y: 300, width: 540, height: 90, content: "\"Sarah led the redesign of our customer portal, resulting in a 40% increase in user satisfaction. Her creativity and dedication inspire the entire team.\"", style: { fontSize: "17px", fontWeight: "400", color: "#C0CDE0", lineHeight: "1.7", fontStyle: "italic" }, visible: true, locked: false, fontFamily: "Lora", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "shape", x: 120, y: 440, width: 260, height: 100, content: "", style: {}, shapeType: "rounded-rect", shapeFill: "#1a1a2e", shapeStroke: "#22C55E", shapeStrokeWidth: 1, visible: true, locked: false, filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 140, y: 455, width: 220, height: 20, content: "🏆 ACHIEVEMENTS", style: { fontSize: "12px", fontWeight: "700", color: "#22C55E", letterSpacing: "3px" }, visible: true, locked: false, fontFamily: "Space Grotesk", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 140, y: 480, width: 220, height: 50, content: "Q1 Innovation Award\nBest Team Collaboration", style: { fontSize: "15px", fontWeight: "400", color: "#D0DEF0", lineHeight: "1.7" }, visible: true, locked: false, fontFamily: "DM Sans", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "shape", x: 400, y: 440, width: 260, height: 100, content: "", style: {}, shapeType: "rounded-rect", shapeFill: "#1a1a2e", shapeStroke: "#3B82F6", shapeStrokeWidth: 1, visible: true, locked: false, filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 420, y: 455, width: 220, height: 20, content: "💡 FUN FACT", style: { fontSize: "12px", fontWeight: "700", color: "#3B82F6", letterSpacing: "3px" }, visible: true, locked: false, fontFamily: "Space Grotesk", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 420, y: 480, width: 220, height: 50, content: "Runs marathons &\npaints watercolours", style: { fontSize: "15px", fontWeight: "400", color: "#D0DEF0", lineHeight: "1.7" }, visible: true, locked: false, fontFamily: "DM Sans", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "shape", x: 680, y: 440, width: 240, height: 100, content: "", style: {}, shapeType: "rounded-rect", shapeFill: "#1a1a2e", shapeStroke: "#A78BFA", shapeStrokeWidth: 1, visible: true, locked: false, filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 700, y: 455, width: 200, height: 20, content: "❤️ TEAM SAYS", style: { fontSize: "12px", fontWeight: "700", color: "#A78BFA", letterSpacing: "3px" }, visible: true, locked: false, fontFamily: "Space Grotesk", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 700, y: 480, width: 200, height: 50, content: "\"Always brings positive\nenergy to every project\"", style: { fontSize: "15px", fontWeight: "400", color: "#D0DEF0", lineHeight: "1.7", fontStyle: "italic" }, visible: true, locked: false, fontFamily: "DM Sans", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 120, y: 580, width: 780, height: 40, content: "NOMINATE A COLLEAGUE → HR PORTAL OR EMAIL PEOPLE@ACME.COM", style: { fontSize: "13px", fontWeight: "600", color: "#F59E0B", letterSpacing: "3px", textAlign: "center" }, visible: true, locked: false, fontFamily: "Space Grotesk", filters: { ...DEFAULT_FILTERS } },
    ],
  },
  {
    id: "corporate-safety",
    name: "Safety Dashboard",
    category: "corporate",
    preview: "🦺",
    description: "Workplace safety metrics, days without incident, and reminders",
    bg: { type: "gradient", color: "#0a0a0a", gradient: "linear-gradient(180deg, #0a0a0a 0%, #1a1208 100%)" },
    elements: [
      { id: tid(), type: "text", x: 120, y: 40, width: 780, height: 70, content: "🦺 SAFETY DASHBOARD", style: { fontSize: "44px", fontWeight: "900", color: "#FFFFFF", textAlign: "center" }, visible: true, locked: false, fontFamily: "Oswald", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 120, y: 115, width: 780, height: 30, content: "SAFETY IS EVERYONE'S RESPONSIBILITY", style: { fontSize: "14px", fontWeight: "700", color: "#F59E0B", letterSpacing: "6px", textAlign: "center" }, visible: true, locked: false, fontFamily: "Space Grotesk", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "shape", x: 260, y: 170, width: 500, height: 180, content: "", style: {}, shapeType: "rounded-rect", shapeFill: "#162016", shapeStroke: "#22C55E", shapeStrokeWidth: 2, visible: true, locked: false, filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 280, y: 185, width: 460, height: 30, content: "DAYS WITHOUT INCIDENT", style: { fontSize: "14px", fontWeight: "700", color: "#22C55E", letterSpacing: "5px", textAlign: "center" }, visible: true, locked: false, fontFamily: "Space Grotesk", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 280, y: 220, width: 460, height: 90, content: "247", style: { fontSize: "96px", fontWeight: "900", color: "#22C55E", textAlign: "center" }, visible: true, locked: false, fontFamily: "Oswald", filters: { ...DEFAULT_FILTERS }, animation: "pulse", glowIntensity: 30 },
      { id: tid(), type: "text", x: 280, y: 320, width: 460, height: 25, content: "🎯 GOAL: 365 DAYS", style: { fontSize: "14px", fontWeight: "600", color: "#86EFAC", textAlign: "center" }, visible: true, locked: false, fontFamily: "DM Sans", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "shape", x: 80, y: 380, width: 270, height: 120, content: "", style: {}, shapeType: "rounded-rect", shapeFill: "#1a1a2e", shapeStroke: "#3B82F6", shapeStrokeWidth: 1, visible: true, locked: false, filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 100, y: 395, width: 230, height: 20, content: "INCIDENTS YTD", style: { fontSize: "12px", fontWeight: "700", color: "#3B82F6", letterSpacing: "3px" }, visible: true, locked: false, fontFamily: "Space Grotesk", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 100, y: 420, width: 230, height: 45, content: "2", style: { fontSize: "42px", fontWeight: "800", color: "#FFFFFF" }, visible: true, locked: false, fontFamily: "Oswald", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 100, y: 470, width: 230, height: 20, content: "↓ 75% vs last year", style: { fontSize: "13px", fontWeight: "500", color: "#22C55E" }, visible: true, locked: false, fontFamily: "DM Sans", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "shape", x: 375, y: 380, width: 270, height: 120, content: "", style: {}, shapeType: "rounded-rect", shapeFill: "#1a1a2e", shapeStroke: "#F59E0B", shapeStrokeWidth: 1, visible: true, locked: false, filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 395, y: 395, width: 230, height: 20, content: "TRAINING RATE", style: { fontSize: "12px", fontWeight: "700", color: "#F59E0B", letterSpacing: "3px" }, visible: true, locked: false, fontFamily: "Space Grotesk", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 395, y: 420, width: 230, height: 45, content: "98%", style: { fontSize: "42px", fontWeight: "800", color: "#FFFFFF" }, visible: true, locked: false, fontFamily: "Oswald", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 395, y: 470, width: 230, height: 20, content: "All staff certified ✅", style: { fontSize: "13px", fontWeight: "500", color: "#F59E0B" }, visible: true, locked: false, fontFamily: "DM Sans", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "shape", x: 670, y: 380, width: 270, height: 120, content: "", style: {}, shapeType: "rounded-rect", shapeFill: "#1a1a2e", shapeStroke: "#EF4444", shapeStrokeWidth: 1, visible: true, locked: false, filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 690, y: 395, width: 230, height: 20, content: "NEAR MISSES", style: { fontSize: "12px", fontWeight: "700", color: "#EF4444", letterSpacing: "3px" }, visible: true, locked: false, fontFamily: "Space Grotesk", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 690, y: 420, width: 230, height: 45, content: "5", style: { fontSize: "42px", fontWeight: "800", color: "#FFFFFF" }, visible: true, locked: false, fontFamily: "Oswald", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 690, y: 470, width: 230, height: 20, content: "All resolved & reviewed", style: { fontSize: "13px", fontWeight: "500", color: "#EF4444" }, visible: true, locked: false, fontFamily: "DM Sans", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 80, y: 540, width: 860, height: 50, content: "⚠️ TODAY'S REMINDER: Wear PPE in all warehouse zones • Report hazards immediately", style: { fontSize: "18px", fontWeight: "600", color: "#F59E0B", textAlign: "center" }, visible: true, locked: false, fontFamily: "DM Sans", filters: { ...DEFAULT_FILTERS }, animation: "pulse" },
      { id: tid(), type: "text", x: 80, y: 600, width: 860, height: 40, content: "EMERGENCY: DIAL 911 • FIRST AID KIT: BREAK ROOM • AED: MAIN LOBBY", style: { fontSize: "13px", fontWeight: "600", color: "#EF4444", letterSpacing: "2px", textAlign: "center" }, visible: true, locked: false, fontFamily: "Space Grotesk", filters: { ...DEFAULT_FILTERS } },
    ],
  },
  /* ─── SOCIAL / INTERACTIVE ─── */
  {
    id: "social-followers",
    name: "Social Media Counts",
    category: "social",
    preview: "📱",
    description: "Live follower counts across social platforms",
    bg: { type: "gradient", color: "#0a0a1a", gradient: "linear-gradient(135deg, #0a0a1a 0%, #1a0a2e 50%, #0a0a1a 100%)" },
    elements: [
      { id: tid(), type: "text", x: 120, y: 50, width: 780, height: 70, content: "FOLLOW US", style: { fontSize: "52px", fontWeight: "900", color: "#FFFFFF", textAlign: "center", letterSpacing: "6px" }, visible: true, locked: false, fontFamily: "Oswald", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 120, y: 130, width: 780, height: 35, content: "JOIN OUR GROWING COMMUNITY", style: { fontSize: "15px", fontWeight: "600", color: "#A78BFA", letterSpacing: "5px", textAlign: "center" }, visible: true, locked: false, fontFamily: "Space Grotesk", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "shape", x: 80, y: 200, width: 270, height: 180, content: "", style: {}, shapeType: "rounded-rect", shapeFill: "#1a1a2e", shapeStroke: "#E1306C", shapeStrokeWidth: 2, visible: true, locked: false, filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 100, y: 220, width: 230, height: 30, content: "📸 INSTAGRAM", style: { fontSize: "16px", fontWeight: "700", color: "#E1306C", letterSpacing: "3px" }, visible: true, locked: false, fontFamily: "Space Grotesk", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 100, y: 260, width: 230, height: 55, content: "24.8K", style: { fontSize: "48px", fontWeight: "800", color: "#FFFFFF" }, visible: true, locked: false, fontFamily: "Oswald", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 100, y: 325, width: 230, height: 25, content: "↑ 1,200 this week", style: { fontSize: "14px", fontWeight: "500", color: "#E1306C" }, visible: true, locked: false, fontFamily: "DM Sans", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "shape", x: 375, y: 200, width: 270, height: 180, content: "", style: {}, shapeType: "rounded-rect", shapeFill: "#1a1a2e", shapeStroke: "#1DA1F2", shapeStrokeWidth: 2, visible: true, locked: false, filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 395, y: 220, width: 230, height: 30, content: "🐦 TWITTER / X", style: { fontSize: "16px", fontWeight: "700", color: "#1DA1F2", letterSpacing: "3px" }, visible: true, locked: false, fontFamily: "Space Grotesk", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 395, y: 260, width: 230, height: 55, content: "18.3K", style: { fontSize: "48px", fontWeight: "800", color: "#FFFFFF" }, visible: true, locked: false, fontFamily: "Oswald", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 395, y: 325, width: 230, height: 25, content: "↑ 890 this week", style: { fontSize: "14px", fontWeight: "500", color: "#1DA1F2" }, visible: true, locked: false, fontFamily: "DM Sans", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "shape", x: 670, y: 200, width: 270, height: 180, content: "", style: {}, shapeType: "rounded-rect", shapeFill: "#1a1a2e", shapeStroke: "#FF0000", shapeStrokeWidth: 2, visible: true, locked: false, filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 690, y: 220, width: 230, height: 30, content: "▶️ YOUTUBE", style: { fontSize: "16px", fontWeight: "700", color: "#FF0000", letterSpacing: "3px" }, visible: true, locked: false, fontFamily: "Space Grotesk", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 690, y: 260, width: 230, height: 55, content: "52.1K", style: { fontSize: "48px", fontWeight: "800", color: "#FFFFFF" }, visible: true, locked: false, fontFamily: "Oswald", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 690, y: 325, width: 230, height: 25, content: "↑ 3,400 this week", style: { fontSize: "14px", fontWeight: "500", color: "#FF0000" }, visible: true, locked: false, fontFamily: "DM Sans", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "shape", x: 80, y: 420, width: 270, height: 180, content: "", style: {}, shapeType: "rounded-rect", shapeFill: "#1a1a2e", shapeStroke: "#0077B5", shapeStrokeWidth: 2, visible: true, locked: false, filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 100, y: 440, width: 230, height: 30, content: "💼 LINKEDIN", style: { fontSize: "16px", fontWeight: "700", color: "#0077B5", letterSpacing: "3px" }, visible: true, locked: false, fontFamily: "Space Grotesk", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 100, y: 480, width: 230, height: 55, content: "8.9K", style: { fontSize: "48px", fontWeight: "800", color: "#FFFFFF" }, visible: true, locked: false, fontFamily: "Oswald", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 100, y: 545, width: 230, height: 25, content: "↑ 450 this week", style: { fontSize: "14px", fontWeight: "500", color: "#0077B5" }, visible: true, locked: false, fontFamily: "DM Sans", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "shape", x: 375, y: 420, width: 270, height: 180, content: "", style: {}, shapeType: "rounded-rect", shapeFill: "#1a1a2e", shapeStroke: "#25D366", shapeStrokeWidth: 2, visible: true, locked: false, filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 395, y: 440, width: 230, height: 30, content: "🎵 TIKTOK", style: { fontSize: "16px", fontWeight: "700", color: "#25D366", letterSpacing: "3px" }, visible: true, locked: false, fontFamily: "Space Grotesk", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 395, y: 480, width: 230, height: 55, content: "96.5K", style: { fontSize: "48px", fontWeight: "800", color: "#FFFFFF" }, visible: true, locked: false, fontFamily: "Oswald", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 395, y: 545, width: 230, height: 25, content: "↑ 5,200 this week", style: { fontSize: "14px", fontWeight: "500", color: "#25D366" }, visible: true, locked: false, fontFamily: "DM Sans", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "shape", x: 670, y: 420, width: 270, height: 180, content: "", style: {}, shapeType: "rounded-rect", shapeFill: "#1a1a2e", shapeStroke: "#4267B2", shapeStrokeWidth: 2, visible: true, locked: false, filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 690, y: 440, width: 230, height: 30, content: "👍 FACEBOOK", style: { fontSize: "16px", fontWeight: "700", color: "#4267B2", letterSpacing: "3px" }, visible: true, locked: false, fontFamily: "Space Grotesk", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 690, y: 480, width: 230, height: 55, content: "31.2K", style: { fontSize: "48px", fontWeight: "800", color: "#FFFFFF" }, visible: true, locked: false, fontFamily: "Oswald", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 690, y: 545, width: 230, height: 25, content: "↑ 780 this week", style: { fontSize: "14px", fontWeight: "500", color: "#4267B2" }, visible: true, locked: false, fontFamily: "DM Sans", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 120, y: 650, width: 780, height: 35, content: "@YOURBRAND ON ALL PLATFORMS", style: { fontSize: "18px", fontWeight: "600", color: "#A78BFA", letterSpacing: "4px", textAlign: "center" }, visible: true, locked: false, fontFamily: "Bebas Neue", filters: { ...DEFAULT_FILTERS } },
    ],
  },
  {
    id: "social-latest-posts",
    name: "Latest Posts Feed",
    category: "social",
    preview: "📰",
    description: "Showcase recent social media posts and updates",
    bg: { type: "gradient", color: "#0f0f1a", gradient: "linear-gradient(180deg, #0f0f1a 0%, #1a1a30 100%)" },
    elements: [
      { id: tid(), type: "text", x: 100, y: 50, width: 820, height: 60, content: "📱 LATEST FROM OUR FEED", style: { fontSize: "40px", fontWeight: "800", color: "#FFFFFF", textAlign: "center" }, visible: true, locked: false, fontFamily: "Oswald", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "shape", x: 380, y: 120, width: 260, height: 3, content: "", style: {}, shapeType: "line", shapeFill: "#E1306C", shapeStroke: "#E1306C", shapeStrokeWidth: 3, visible: true, locked: false, filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "shape", x: 80, y: 160, width: 420, height: 200, content: "", style: {}, shapeType: "rounded-rect", shapeFill: "#1a1a2e", shapeStroke: "#333355", shapeStrokeWidth: 1, visible: true, locked: false, filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 100, y: 175, width: 380, height: 25, content: "📸 @yourbrand · 2 hours ago", style: { fontSize: "13px", fontWeight: "600", color: "#E1306C" }, visible: true, locked: false, fontFamily: "DM Sans", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 100, y: 210, width: 380, height: 120, content: "Excited to announce our new summer collection! 🌴☀️ Fresh styles, vibrant colors, and sustainable materials. Shop now in-store or online.\n\n#NewCollection #Summer2026 #Fashion", style: { fontSize: "16px", fontWeight: "400", color: "#CBD5E1", lineHeight: "1.5" }, visible: true, locked: false, fontFamily: "DM Sans", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 100, y: 335, width: 380, height: 20, content: "❤️ 2,847   💬 186   🔄 94", style: { fontSize: "13px", fontWeight: "500", color: "#6B7280" }, visible: true, locked: false, fontFamily: "DM Sans", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "shape", x: 520, y: 160, width: 420, height: 200, content: "", style: {}, shapeType: "rounded-rect", shapeFill: "#1a1a2e", shapeStroke: "#333355", shapeStrokeWidth: 1, visible: true, locked: false, filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 540, y: 175, width: 380, height: 25, content: "🐦 @yourbrand · 5 hours ago", style: { fontSize: "13px", fontWeight: "600", color: "#1DA1F2" }, visible: true, locked: false, fontFamily: "DM Sans", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 540, y: 210, width: 380, height: 120, content: "We just hit 50K followers! 🎉 Thank you for being part of our journey. To celebrate, enjoy 20% off everything this weekend with code THANKYOU50.\n\n#Milestone #Community", style: { fontSize: "16px", fontWeight: "400", color: "#CBD5E1", lineHeight: "1.5" }, visible: true, locked: false, fontFamily: "DM Sans", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 540, y: 335, width: 380, height: 20, content: "❤️ 5,102   💬 423   🔄 312", style: { fontSize: "13px", fontWeight: "500", color: "#6B7280" }, visible: true, locked: false, fontFamily: "DM Sans", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "shape", x: 80, y: 390, width: 860, height: 200, content: "", style: {}, shapeType: "rounded-rect", shapeFill: "#1a1a2e", shapeStroke: "#333355", shapeStrokeWidth: 1, visible: true, locked: false, filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 100, y: 405, width: 380, height: 25, content: "▶️ YouTube · 1 day ago", style: { fontSize: "13px", fontWeight: "600", color: "#FF0000" }, visible: true, locked: false, fontFamily: "DM Sans", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 100, y: 440, width: 820, height: 80, content: "🎬 NEW VIDEO: Behind the Scenes of Our Summer Campaign\nTake a sneak peek at how we created this year's most vibrant collection.\nGo behind the lens with our creative team!", style: { fontSize: "18px", fontWeight: "400", color: "#CBD5E1", lineHeight: "1.6" }, visible: true, locked: false, fontFamily: "DM Sans", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 100, y: 545, width: 820, height: 20, content: "👁️ 12.4K views   👍 1,892   💬 247", style: { fontSize: "13px", fontWeight: "500", color: "#6B7280" }, visible: true, locked: false, fontFamily: "DM Sans", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 120, y: 630, width: 780, height: 35, content: "FOLLOW @YOURBRAND FOR MORE UPDATES", style: { fontSize: "16px", fontWeight: "600", color: "#A78BFA", letterSpacing: "4px", textAlign: "center" }, visible: true, locked: false, fontFamily: "Space Grotesk", filters: { ...DEFAULT_FILTERS } },
    ],
  },
  {
    id: "social-wifi-qr",
    name: "WiFi QR Code",
    category: "social",
    preview: "📶",
    description: "Scan-to-connect WiFi display with QR code placeholder",
    bg: { type: "gradient", color: "#0a1628", gradient: "linear-gradient(135deg, #0a1628 0%, #141e35 100%)" },
    elements: [
      { id: tid(), type: "text", x: 120, y: 60, width: 780, height: 70, content: "📶 FREE WiFi", style: { fontSize: "56px", fontWeight: "900", color: "#FFFFFF", textAlign: "center" }, visible: true, locked: false, fontFamily: "Oswald", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 120, y: 140, width: 780, height: 35, content: "SCAN TO CONNECT INSTANTLY", style: { fontSize: "16px", fontWeight: "600", color: "#60A5FA", letterSpacing: "6px", textAlign: "center" }, visible: true, locked: false, fontFamily: "Space Grotesk", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "shape", x: 340, y: 210, width: 340, height: 340, content: "", style: {}, shapeType: "rounded-rect", shapeFill: "#FFFFFF", shapeStroke: "#60A5FA", shapeStrokeWidth: 4, visible: true, locked: false, filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 370, y: 320, width: 280, height: 120, content: "[ QR CODE ]\n\nReplace with your\nWiFi QR image", style: { fontSize: "22px", fontWeight: "600", color: "#1a1a2e", textAlign: "center", lineHeight: "1.4" }, visible: true, locked: false, fontFamily: "DM Sans", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "shape", x: 180, y: 590, width: 660, height: 120, content: "", style: {}, shapeType: "rounded-rect", shapeFill: "#141e35", shapeStroke: "#1E293B", shapeStrokeWidth: 1, visible: true, locked: false, filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 200, y: 605, width: 620, height: 25, content: "OR CONNECT MANUALLY", style: { fontSize: "13px", fontWeight: "600", color: "#60A5FA", letterSpacing: "4px", textAlign: "center" }, visible: true, locked: false, fontFamily: "Space Grotesk", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 200, y: 640, width: 620, height: 55, content: "Network: GuestWiFi-5G\nPassword: Welcome2026!", style: { fontSize: "24px", fontWeight: "500", color: "#FFFFFF", textAlign: "center", lineHeight: "1.6" }, visible: true, locked: false, fontFamily: "DM Sans", filters: { ...DEFAULT_FILTERS } },
    ],
  },
  {
    id: "social-review-wall",
    name: "Review Wall",
    category: "social",
    preview: "⭐",
    description: "Customer reviews and ratings social proof display",
    bg: { type: "gradient", color: "#0a0a12", gradient: "linear-gradient(180deg, #0a0a12 0%, #1a1020 100%)" },
    elements: [
      { id: tid(), type: "text", x: 120, y: 50, width: 780, height: 60, content: "WHAT OUR CUSTOMERS SAY", style: { fontSize: "38px", fontWeight: "800", color: "#FFFFFF", textAlign: "center" }, visible: true, locked: false, fontFamily: "Oswald", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 120, y: 120, width: 780, height: 35, content: "⭐⭐⭐⭐⭐  4.9 / 5  •  2,847 REVIEWS", style: { fontSize: "18px", fontWeight: "600", color: "#F59E0B", textAlign: "center" }, visible: true, locked: false, fontFamily: "Space Grotesk", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "shape", x: 80, y: 190, width: 420, height: 170, content: "", style: {}, shapeType: "rounded-rect", shapeFill: "#1a1a2e", shapeStroke: "#2a2a4e", shapeStrokeWidth: 1, visible: true, locked: false, filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 100, y: 205, width: 380, height: 20, content: "⭐⭐⭐⭐⭐", style: { fontSize: "16px" }, visible: true, locked: false, filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 100, y: 230, width: 380, height: 80, content: "\"Absolutely amazing service! The team went above and beyond. Will definitely be coming back.\"", style: { fontSize: "17px", fontWeight: "400", color: "#E2E8F0", lineHeight: "1.5", fontStyle: "italic" }, visible: true, locked: false, fontFamily: "Lora", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 100, y: 325, width: 380, height: 20, content: "— Sarah M. · Google Review", style: { fontSize: "13px", fontWeight: "500", color: "#6B7280" }, visible: true, locked: false, fontFamily: "DM Sans", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "shape", x: 520, y: 190, width: 420, height: 170, content: "", style: {}, shapeType: "rounded-rect", shapeFill: "#1a1a2e", shapeStroke: "#2a2a4e", shapeStrokeWidth: 1, visible: true, locked: false, filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 540, y: 205, width: 380, height: 20, content: "⭐⭐⭐⭐⭐", style: { fontSize: "16px" }, visible: true, locked: false, filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 540, y: 230, width: 380, height: 80, content: "\"Best in town, hands down! Quality is outstanding and the attention to detail is incredible.\"", style: { fontSize: "17px", fontWeight: "400", color: "#E2E8F0", lineHeight: "1.5", fontStyle: "italic" }, visible: true, locked: false, fontFamily: "Lora", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 540, y: 325, width: 380, height: 20, content: "— James T. · Yelp Review", style: { fontSize: "13px", fontWeight: "500", color: "#6B7280" }, visible: true, locked: false, fontFamily: "DM Sans", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "shape", x: 80, y: 390, width: 860, height: 170, content: "", style: {}, shapeType: "rounded-rect", shapeFill: "#1a1a2e", shapeStroke: "#2a2a4e", shapeStrokeWidth: 1, visible: true, locked: false, filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 100, y: 405, width: 380, height: 20, content: "⭐⭐⭐⭐⭐", style: { fontSize: "16px" }, visible: true, locked: false, filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 100, y: 430, width: 820, height: 80, content: "\"I've tried many places but nothing compares. The staff are friendly, prices are fair, and the results speak for themselves. Highly recommend to everyone!\"", style: { fontSize: "17px", fontWeight: "400", color: "#E2E8F0", lineHeight: "1.5", fontStyle: "italic" }, visible: true, locked: false, fontFamily: "Lora", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 100, y: 525, width: 820, height: 20, content: "— Emma R. · TripAdvisor", style: { fontSize: "13px", fontWeight: "500", color: "#6B7280" }, visible: true, locked: false, fontFamily: "DM Sans", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 120, y: 610, width: 780, height: 35, content: "LEAVE A REVIEW • SCAN QR AT THE COUNTER", style: { fontSize: "15px", fontWeight: "600", color: "#F59E0B", letterSpacing: "4px", textAlign: "center" }, visible: true, locked: false, fontFamily: "Space Grotesk", filters: { ...DEFAULT_FILTERS } },
    ],
  },
  {
    id: "social-hashtag",
    name: "Hashtag Wall",
    category: "social",
    preview: "#️⃣",
    description: "Encourage customers to post with your branded hashtag",
    bg: { type: "gradient", color: "#1a0520", gradient: "linear-gradient(135deg, #1a0520 0%, #0a1a30 50%, #1a0520 100%)" },
    elements: [
      { id: tid(), type: "text", x: 120, y: 80, width: 780, height: 100, content: "#YOURBRAND", style: { fontSize: "72px", fontWeight: "900", color: "#FFFFFF", textAlign: "center" }, visible: true, locked: false, fontFamily: "Oswald", filters: { ...DEFAULT_FILTERS }, glowIntensity: 60 },
      { id: tid(), type: "text", x: 120, y: 200, width: 780, height: 50, content: "Share your experience with us!", style: { fontSize: "28px", fontWeight: "400", color: "#C4B5FD", textAlign: "center", fontStyle: "italic" }, visible: true, locked: false, fontFamily: "Lora", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "shape", x: 380, y: 270, width: 260, height: 3, content: "", style: {}, shapeType: "line", shapeFill: "#A78BFA", shapeStroke: "#A78BFA", shapeStrokeWidth: 3, visible: true, locked: false, filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 120, y: 310, width: 780, height: 40, content: "HOW IT WORKS", style: { fontSize: "18px", fontWeight: "700", color: "#A78BFA", letterSpacing: "6px", textAlign: "center" }, visible: true, locked: false, fontFamily: "Space Grotesk", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 120, y: 370, width: 780, height: 180, content: "1️⃣  Take a photo or video of your experience\n\n2️⃣  Post it on Instagram, TikTok, or Twitter\n\n3️⃣  Tag us @YourBrand + use #YourBrand\n\n4️⃣  Your post could appear on our screens! 📺", style: { fontSize: "22px", fontWeight: "400", color: "#E2E8F0", lineHeight: "1.8", textAlign: "center" }, visible: true, locked: false, fontFamily: "DM Sans", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 120, y: 600, width: 780, height: 50, content: "🏆 BEST POST OF THE WEEK WINS A PRIZE!", style: { fontSize: "24px", fontWeight: "700", color: "#F59E0B", textAlign: "center" }, visible: true, locked: false, fontFamily: "Space Grotesk", filters: { ...DEFAULT_FILTERS } },
    ],
  },
];

/* ── Tag map for searchability ── */
const TEMPLATE_TAGS: Record<string, string[]> = {
  "menu-cafe": ["coffee", "cafe", "drinks", "espresso", "latte", "beverages", "shop", "prices"],
  "menu-restaurant": ["dinner", "food", "specials", "dining", "elegant", "fine dining", "starter", "dessert"],
  "menu-bar": ["cocktail", "bar", "drinks", "nightclub", "happy hour", "neon", "pub", "alcohol"],
  "menu-pizza": ["pizza", "italian", "food", "restaurant", "wood-fired", "oven", "pepperoni", "margherita", "prices", "animated"],
  "menu-burger": ["burger", "fast food", "fries", "shakes", "smash", "grill", "american", "prices", "animated"],
  "menu-sushi": ["sushi", "japanese", "nigiri", "sashimi", "rolls", "omakase", "sake", "asian", "prices", "animated"],
  "menu-brunch": ["brunch", "breakfast", "pancakes", "eggs", "weekend", "mimosa", "bottomless", "cafe", "prices", "animated"],
  "promo-flash-sale": ["sale", "discount", "deal", "offer", "limited", "flash", "shopping", "clearance"],
  "promo-new-product": ["launch", "product", "new", "release", "announcement", "reveal"],
  "promo-loyalty": ["loyalty", "rewards", "membership", "points", "VIP", "customer", "program"],
  "info-welcome": ["welcome", "lobby", "reception", "visitor", "entrance", "wayfinding"],
  "info-hours": ["hours", "schedule", "opening", "closing", "times", "business hours"],
  "info-event": ["event", "conference", "seminar", "workshop", "meeting", "calendar"],
  "fitness-class": ["gym", "class", "workout", "exercise", "schedule", "HIIT", "yoga", "spin"],
  "fitness-membership": ["membership", "pricing", "plan", "subscription", "join", "sign up"],
  "fitness-motivational": ["motivation", "quote", "inspiration", "goals", "strength", "training"],
  "retail-window": ["window", "display", "storefront", "fashion", "clothing", "boutique", "shop"],
  "retail-seasonal": ["seasonal", "summer", "winter", "spring", "collection", "trend"],
  "retail-loyalty": ["loyalty", "rewards", "card", "discount", "member", "VIP"],
  "hotel-welcome": ["hotel", "lobby", "guest", "hospitality", "resort", "check-in", "concierge"],
  "hotel-amenities": ["amenities", "spa", "pool", "gym", "room service", "facilities", "wifi"],
  "hotel-checkout": ["checkout", "departure", "luggage", "parking", "transfer", "airport"],
  "health-waiting": ["waiting room", "clinic", "patient", "doctor", "medical", "hospital", "check-in"],
  "health-services": ["services", "medical", "dental", "optometry", "vaccination", "GP", "practice"],
  "health-tips": ["wellness", "health tips", "lifestyle", "nutrition", "exercise", "mindfulness"],
  "health-pharmacy": ["pharmacy", "prescription", "medicine", "chemist", "drugstore", "vaccination", "flu"],
  "health-dental": ["dental", "dentist", "teeth", "orthodontics", "braces", "whitening", "oral health"],
  "health-physio": ["physiotherapy", "rehab", "rehabilitation", "sports injury", "mobility", "massage", "therapy"],
  "edu-notice": ["school", "notice", "announcement", "student", "principal", "campus", "bulletin"],
  "edu-timetable": ["timetable", "schedule", "class", "period", "lesson", "subject", "classroom"],
  "edu-achievement": ["achievement", "award", "recognition", "honor", "star", "student of the month"],
  "edu-library": ["library", "books", "reading", "study", "hours", "new arrivals", "quiet zone", "librarian"],
  "edu-campus-events": ["campus", "events", "clubs", "activities", "society", "talent show", "sports day", "college"],
  "edu-exams": ["exam", "test", "finals", "schedule", "timetable", "revision", "hall", "assessment", "grade"],
  "church-service": ["church", "worship", "service", "prayer", "sunday", "mass", "congregation", "faith"],
  "church-events": ["church", "events", "community", "bible study", "youth", "choir", "fellowship"],
  "church-verse": ["scripture", "bible", "verse", "quote", "faith", "inspirational", "devotional"],
  "church-sermon": ["sermon", "series", "preaching", "pastor", "speaker", "teaching", "message", "sunday"],
  "church-prayer": ["prayer", "request", "intercession", "healing", "praise", "missions", "community", "support"],
  "corporate-welcome": ["office", "lobby", "corporate", "company", "reception", "visitor", "professional"],
  "corporate-meeting": ["meeting", "conference room", "boardroom", "schedule", "booking", "available"],
  "corporate-kpi": ["dashboard", "KPI", "metrics", "analytics", "performance", "revenue", "data"],
  "corporate-spotlight": ["employee", "spotlight", "star", "recognition", "team", "achievement", "staff", "of the month", "bio"],
  "corporate-safety": ["safety", "incident", "PPE", "hazard", "workplace", "dashboard", "training", "warehouse", "construction"],
  "social-followers": ["social media", "followers", "instagram", "twitter", "youtube", "tiktok", "facebook", "linkedin", "counts", "stats"],
  "social-latest-posts": ["posts", "feed", "social media", "instagram", "twitter", "youtube", "updates", "timeline"],
  "social-wifi-qr": ["wifi", "QR code", "scan", "connect", "internet", "password", "network", "guest"],
  "social-review-wall": ["reviews", "ratings", "testimonials", "google", "yelp", "tripadvisor", "social proof", "stars"],
  "social-hashtag": ["hashtag", "user generated", "UGC", "instagram", "tiktok", "share", "photo", "contest"],
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
];

/* ── Mini canvas thumbnail ── */
const CANVAS_W = 1024;
const CANVAS_H = 768;

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
    // Re-generate IDs so each application is unique
    const freshElements = tpl.elements.map((el) => ({
      ...el,
      id: `el-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    }));
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
              <p className="text-xs text-muted-foreground">Start with a pre-built layout and customize it</p>
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
