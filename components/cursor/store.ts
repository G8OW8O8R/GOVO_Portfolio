/**
 * What the cursor can't read from the DOM under it: a desktop file being
 * dragged (the dot then stretches along the motion). Plain mutable flags –
 * the cursor reads them in its animation frame, nothing re-renders.
 */
export const cursorFlags = { dragging: false };
