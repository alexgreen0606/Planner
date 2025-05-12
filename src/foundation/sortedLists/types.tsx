import { GenericIconProps } from "../components/GenericIcon";
import { ItemStatus } from "./constants";

export interface ListItem {
    id: string;
    value: string;
    sortId: number;
    status: ItemStatus;
    listId: string;
};

export type ListItemIconConfig<T extends ListItem> = {
    icon?: GenericIconProps;
    onClick?: (item: T) => void;
    customIcon?: React.ReactNode;
    hideIcon?: boolean;
}

export interface ListItemUpdateComponentProps<T extends ListItem> {
    item: T;
}

export type ModifyItemConfig<T extends ListItem, P extends ListItemUpdateComponentProps<T>> = {
    component: React.ComponentType<P>;
    props: P;
}