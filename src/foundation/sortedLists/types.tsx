import { GenericIconProps } from "../components/GenericIcon";

export const LIST_ITEM_HEIGHT = 40;

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