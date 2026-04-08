

## Add Enterprise CTA to Billing Page

### Change
Add a subtle glassmorphism box below the pricing cards in `src/pages/Billing.tsx` with enterprise messaging and a contact link.

### File: `src/pages/Billing.tsx`
- After the pricing grid (and the Secure Checkout badge), add a small card:
  - Glassmorphism style: `bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl`
  - Icon: `Building2` from lucide-react
  - Heading: "Have more than 10 locations?"
  - Subtext: "Contact us for Enterprise Glow — custom pricing, dedicated support, and unlimited screens."
  - "Contact Us" link pointing to `/home#contact` with subtle cyan hover styling
- Always visible regardless of current tier

