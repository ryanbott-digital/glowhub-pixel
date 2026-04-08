

## Add Data Deletion Request Link to Terms Page

### What We're Building
A glassmorphism "Data Requests" card at the bottom of the Privacy Policy tab with a direct link to the homepage contact form, plus a matching note in the "Your Rights" section. Also adding a small note in the Terms footer.

### Changes

**1. Update `src/pages/Terms.tsx`**

- In "Section 6: Your Rights" — update the existing paragraph (line 228-233) to be more explicit about data deletion, linking to the homepage `#contact` anchor:
  - "To request data deletion or exercise any of these rights, use our contact form" → links to `/home#contact`
- Add a new glassmorphism callout card after Section 6 (before `</TabsContent>`) styled like the SummaryBox but with a mail icon:
  - Headline: "Data Deletion Requests"
  - Body: "Want your data removed? Submit a request via our contact form and we'll process it within 30 days."
  - CTA link to `/home#contact`
- Update the page footer to include a small "Need help? Contact us" link pointing to `/home#contact`

**2. Update `src/pages/Home.tsx`**
- Add `id="contact"` to the "Get in Touch" section element so anchor links scroll directly to it

### Technical Details
- Uses existing `Link` component with hash navigation (`/home#contact`)
- No new components — reuses GlassCard styling with cyan accent border
- The Home page contact section already exists with a form that saves to the database

