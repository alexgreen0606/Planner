export const LIST_ITEM_TOOLBAR_HEIGHT = 50;

export const LIST_ITEM_HEIGHT = 40;

export const AUTO_SCROLL_SPEED = 2;

export const SCROLL_THROTTLE = 16;

export const SCROLL_OUT_OF_BOUNDS_RESISTANCE = 0.4;

export const LIST_SPRING_CONFIG = {
    overshootClamping: true,
    mass: .5
};

export const DECELERATION_RATE = 0.998;

export enum ItemStatus {
    NEW = 'NEW',
    EDIT = 'EDIT',
    TRANSFER = 'TRANSFER',
    STATIC = 'STATIC',
    HIDDEN = 'HIDDEN'
};

export const OVERSCROLL_RELOAD_THRESHOLD = 64;