

## Plan: Haptic feedback on snap boundary crossing during drag

### What changes

**`src/pages/Studio.tsx`** — In the `onDrag` callback (~line 1035), after calling `computeSnapGuides`, check if a snap guide appeared that wasn't present before. If a new snap engaged (snapX or snapY changed from null to a value), fire `hapticLight()`. Track the previous snap state with a ref.

### Implementation details

1. Add a `useRef` to track previous snap state: `prevSnap = useRef<{ x: number | null; y: number | null }>({ x: null, y: null })`
2. In `onDrag`, after computing guides, check if `result.snapX` or `result.snapY` transitioned from null to non-null (or changed value) compared to `prevSnap.current`. If so, call `hapticLight()`.
3. Update `prevSnap.current` with current snap values.
4. In `onDragStop`, reset `prevSnap.current` to `{ x: null, y: null }`.

This gives a subtle tactile "click" each time the element crosses a snap boundary during touch drag, without firing continuously.

