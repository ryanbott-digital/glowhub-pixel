

## Add Terms & Privacy Links to Download Email Capture Card

### Change
Update the consent checkbox text in `src/pages/Download.tsx` (line 205-207) to include linked references to Terms of Service and Privacy Policy.

### File: `src/pages/Download.tsx`
- **Line 205-207**: Update the consent `<span>` to include `<Link to="/terms">Terms of Service</Link>` and `<Link to="/terms?tab=privacy">Privacy Policy</Link>` with subtle cyan hover styling, matching the existing pattern used in the page footer.
- Updated text: *"I agree to the Terms of Service & Privacy Policy and to receive product updates, setup guides, and promotional offers from Glow. You can unsubscribe at any time."*

Single file, ~3 lines changed.

