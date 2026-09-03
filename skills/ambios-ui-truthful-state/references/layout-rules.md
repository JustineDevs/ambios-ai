# Layout rules

1. Prefer content-driven height; reserve fixed heights only for bounded scroll regions.
2. A modal, drawer, or popover must have a viewport-safe max size, internal scrolling, visible close behavior, and focus management.
3. Chat surfaces need a stable message region and composer; context panels must not cover or squeeze the composer into unusable dimensions.
4. Dense metadata belongs behind a deliberate disclosure control or a compact summary, not a repeated wall above the primary task.
5. Long labels wrap predictably; badges do not force horizontal overflow.
6. Responsive layouts should reflow at content breakpoints and preserve the primary action.
7. Use semantic HTML and accessible names before styling fixes. Never use color alone for state.

