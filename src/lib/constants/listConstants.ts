import { THIN_LINE_HEIGHT } from "./miscLayout";

// ✅ 

export const SCROLL_THROTTLE = 16;

export const OVERSCROLL_RELOAD_THRESHOLD = 64;

export const NAVBAR_OVERFLOW_FADE_THRESHOLD = 10;

export const DELETE_ITEMS_DELAY_MS = 3000;

export const LIST_SPRING_CONFIG = {
    overshootClamping: true,
    mass: 3,
};

export const LIST_ITEM_HEIGHT = 40;
export const LIST_ICON_SPACING = 8;
export const LIST_CONTENT_HEIGHT = LIST_ITEM_HEIGHT - THIN_LINE_HEIGHT;