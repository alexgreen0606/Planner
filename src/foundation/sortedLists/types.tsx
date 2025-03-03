import { GenericIconProps } from "../components/GenericIcon";

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
    DELETE = 'DELETE',
    TRANSFER = 'TRANSFER',
    STATIC = 'STATIC',
    HIDDEN = 'HIDDEN'
};

export interface ListItem {
    id: string;
    value: string;
    sortId: number;
    status: ItemStatus;
    listId: string;
};

export type RowIconConfig<T extends ListItem> = {
    icon?: GenericIconProps;
    onClick?: (item: T) => void;
    customIcon?: React.ReactNode;
    hideIcon?: boolean;
};

export interface ListItemUpdateComponentProps<T extends ListItem> {
    item: T;
    onSave: (item: T) => T | undefined;
};

export type ModifyItemConfig<T extends ListItem, P extends ListItemUpdateComponentProps<T>> = {
    component: React.ComponentType<P>;
    props: P;
};