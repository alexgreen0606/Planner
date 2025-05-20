import { GenericIconProps } from "@/components/GenericIcon";
import { IListItem } from "@/types/listItems/core/TListItem";

export type ListItemIconConfig<T extends IListItem> = {
    icon?: GenericIconProps;
    onClick?: (item: T) => void;
    customIcon?: React.ReactNode;
    hideIcon?: boolean;
}

export interface ListItemUpdateComponentProps<T extends IListItem> {
    item: T;
}

export type ModifyItemConfig<T extends IListItem, P extends ListItemUpdateComponentProps<T>> = {
    component: React.ComponentType<P>;
    props: P;
}