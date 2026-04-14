import { useState, useMemo } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { CanvasElement, DEFAULT_FILTERS } from "@/components/studio/types";
import { LayoutTemplate, Utensils, Tag, Info, Sparkles, Coffee, ShoppingBag, Megaphone, CalendarDays, PartyPopper, Clock, Dumbbell, Store, Hotel, HeartPulse, GraduationCap } from "lucide-react";

/* ── Template category type ── */
type TemplateCategory = "all" | "menu" | "promo" | "info" | "fitness" | "retail" | "hotel" | "health" | "education";

interface StudioTemplate {
  id: string;
  name: string;
  category: TemplateCategory;
  preview: string; // emoji/icon representation
  description: string;
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
      { id: tid(), type: "shape", x: 120, y: 180, width: 200, height: 4, content: "", style: {}, shapeType: "line", shapeFill: "hsl(180, 100%, 32%)", shapeStroke: "hsl(180, 100%, 32%)", shapeStrokeWidth: 4, visible: true, locked: false, filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 120, y: 220, width: 700, height: 50, content: "STARTER", style: { fontSize: "20px", fontWeight: "600", color: "hsl(180, 100%, 45%)", letterSpacing: "6px" }, visible: true, locked: false, fontFamily: "Space Grotesk", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 120, y: 270, width: 700, height: 40, content: "Burrata with Heirloom Tomatoes & Basil Oil", style: { fontSize: "28px", fontWeight: "300", color: "#FFFFFF" }, visible: true, locked: false, fontFamily: "Inter", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 120, y: 310, width: 100, height: 35, content: "$14", style: { fontSize: "24px", fontWeight: "700", color: "hsl(180, 100%, 45%)" }, visible: true, locked: false, fontFamily: "Inter", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 120, y: 400, width: 700, height: 50, content: "MAIN", style: { fontSize: "20px", fontWeight: "600", color: "hsl(180, 100%, 45%)", letterSpacing: "6px" }, visible: true, locked: false, fontFamily: "Space Grotesk", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 120, y: 450, width: 700, height: 40, content: "Pan-Seared Salmon with Dill Cream & Asparagus", style: { fontSize: "28px", fontWeight: "300", color: "#FFFFFF" }, visible: true, locked: false, fontFamily: "Inter", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 120, y: 490, width: 100, height: 35, content: "$28", style: { fontSize: "24px", fontWeight: "700", color: "hsl(180, 100%, 45%)" }, visible: true, locked: false, fontFamily: "Inter", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 120, y: 580, width: 700, height: 50, content: "DESSERT", style: { fontSize: "20px", fontWeight: "600", color: "hsl(180, 100%, 45%)", letterSpacing: "6px" }, visible: true, locked: false, fontFamily: "Space Grotesk", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 120, y: 630, width: 700, height: 40, content: "Dark Chocolate Fondant with Salted Caramel", style: { fontSize: "28px", fontWeight: "300", color: "#FFFFFF" }, visible: true, locked: false, fontFamily: "Inter", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 120, y: 670, width: 100, height: 35, content: "$12", style: { fontSize: "24px", fontWeight: "700", color: "hsl(180, 100%, 45%)" }, visible: true, locked: false, fontFamily: "Inter", filters: { ...DEFAULT_FILTERS } },
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
      { id: tid(), type: "text", x: 200, y: 460, width: 600, height: 50, content: "EVERYTHING IN STORE", style: { fontSize: "28px", fontWeight: "700", color: "hsl(180, 100%, 45%)", textAlign: "center", letterSpacing: "6px" }, visible: true, locked: false, fontFamily: "Space Grotesk", filters: { ...DEFAULT_FILTERS } },
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
      { id: tid(), type: "text", x: 120, y: 100, width: 800, height: 50, content: "LIMITED TIME OFFER", style: { fontSize: "18px", fontWeight: "600", color: "hsl(180, 100%, 45%)", letterSpacing: "8px" }, visible: true, locked: false, fontFamily: "Space Grotesk", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 120, y: 170, width: 800, height: 120, content: "Spring\nCollection", style: { fontSize: "72px", fontWeight: "300", color: "#FFFFFF", lineHeight: "1.1" }, visible: true, locked: false, fontFamily: "Playfair Display", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 120, y: 340, width: 600, height: 100, content: "Refresh your space with our curated spring selection. New arrivals weekly.", style: { fontSize: "22px", fontWeight: "400", color: "#94A3B8", lineHeight: "1.6" }, visible: true, locked: false, fontFamily: "Inter", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 120, y: 500, width: 300, height: 80, content: "20% OFF", style: { fontSize: "56px", fontWeight: "900", color: "hsl(180, 100%, 45%)" }, visible: true, locked: false, fontFamily: "Bebas Neue", filters: { ...DEFAULT_FILTERS } },
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
    bg: { type: "gradient", color: "#0B1120", gradient: "linear-gradient(135deg, #0B1120 0%, #1a1a2e 100%)" },
    elements: [
      { id: tid(), type: "text", x: 160, y: 200, width: 700, height: 60, content: "WELCOME TO", style: { fontSize: "24px", fontWeight: "600", color: "hsl(180, 100%, 45%)", letterSpacing: "10px", textAlign: "center" }, visible: true, locked: false, fontFamily: "Space Grotesk", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 160, y: 270, width: 700, height: 120, content: "YOUR\nCOMPANY", style: { fontSize: "80px", fontWeight: "900", color: "#FFFFFF", textAlign: "center", lineHeight: "1" }, visible: true, locked: false, fontFamily: "Oswald", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "shape", x: 380, y: 420, width: 260, height: 3, content: "", style: {}, shapeType: "line", shapeFill: "hsl(180, 100%, 32%)", shapeStroke: "hsl(180, 100%, 32%)", shapeStrokeWidth: 3, visible: true, locked: false, filters: { ...DEFAULT_FILTERS } },
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
    bg: { type: "gradient", color: "#0B1120", gradient: "linear-gradient(180deg, #0B1120 0%, #0f1923 100%)" },
    elements: [
      { id: tid(), type: "text", x: 100, y: 80, width: 200, height: 40, content: "📢 NOTICE", style: { fontSize: "16px", fontWeight: "700", color: "hsl(180, 100%, 45%)", letterSpacing: "5px" }, visible: true, locked: false, fontFamily: "Space Grotesk", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 100, y: 160, width: 800, height: 120, content: "Office Closure\nNotice", style: { fontSize: "64px", fontWeight: "800", color: "#FFFFFF", lineHeight: "1.1" }, visible: true, locked: false, fontFamily: "Outfit", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "shape", x: 100, y: 310, width: 120, height: 4, content: "", style: {}, shapeType: "line", shapeFill: "hsl(180, 100%, 32%)", shapeStroke: "hsl(180, 100%, 32%)", shapeStrokeWidth: 4, visible: true, locked: false, filters: { ...DEFAULT_FILTERS } },
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
      { id: tid(), type: "text", x: 120, y: 340, width: 500, height: 160, content: "£19.99/mo\nUnlimited access", style: { fontSize: "56px", fontWeight: "800", color: "hsl(180, 100%, 45%)", lineHeight: "1.3" }, visible: true, locked: false, fontFamily: "Bebas Neue", filters: { ...DEFAULT_FILTERS } },
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
      { id: tid(), type: "text", x: 100, y: 80, width: 400, height: 35, content: "JUST DROPPED", style: { fontSize: "16px", fontWeight: "700", color: "hsl(180, 100%, 45%)", letterSpacing: "8px" }, visible: true, locked: false, fontFamily: "Space Grotesk", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "text", x: 100, y: 130, width: 800, height: 140, content: "NEW\nARRIVALS", style: { fontSize: "88px", fontWeight: "900", color: "#FFFFFF", lineHeight: "1" }, visible: true, locked: false, fontFamily: "Oswald", filters: { ...DEFAULT_FILTERS } },
      { id: tid(), type: "shape", x: 100, y: 290, width: 120, height: 4, content: "", style: {}, shapeType: "line", shapeFill: "hsl(180, 100%, 45%)", shapeStroke: "hsl(180, 100%, 45%)", shapeStrokeWidth: 4, visible: true, locked: false, filters: { ...DEFAULT_FILTERS } },
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
      { id: tid(), type: "text", x: 120, y: 580, width: 500, height: 40, content: "Scan to sign up — it's free!", style: { fontSize: "20px", fontWeight: "500", color: "hsl(180, 100%, 45%)", fontStyle: "italic" }, visible: true, locked: false, fontFamily: "Lora", filters: { ...DEFAULT_FILTERS } },
    ],
  },

  /* ─── HOTEL LOBBY ─── */
  {
    id: "hotel-welcome",
    name: "Hotel Welcome",
    category: "hotel",
    preview: "🏨",
    description: "Elegant hotel lobby welcome screen",
    bg: { type: "gradient", color: "#0B1120", gradient: "linear-gradient(180deg, #0B1120 0%, #1a1628 100%)" },
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
];

/* ── Category config ── */
const CATEGORIES: { id: TemplateCategory; label: string; icon: React.FC<{ className?: string }> }[] = [
  { id: "all", label: "All Templates", icon: LayoutTemplate },
  { id: "menu", label: "Menu Boards", icon: Utensils },
  { id: "promo", label: "Promotions", icon: Tag },
  { id: "info", label: "Info Displays", icon: Info },
  { id: "fitness", label: "Gym & Fitness", icon: Dumbbell },
  { id: "retail", label: "Retail", icon: Store },
  { id: "hotel", label: "Hotel Lobby", icon: Hotel },
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

  const filtered = category === "all" ? TEMPLATES : TEMPLATES.filter((t) => t.category === category);

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

          {/* Category tabs */}
          <div className="flex gap-2">
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
            {filtered.map((tpl) => (
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
                    background: tpl.bg?.gradient || tpl.bg?.color || "#0B1120",
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
                </div>
              </button>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
