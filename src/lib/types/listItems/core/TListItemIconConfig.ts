import { GenericIconProps } from "@/components/icon";
import { IListItem } from "@/types/listItems/core/TListItem";

export type TListItemIconConfig<T extends IListItem> = {
    icon?: GenericIconProps;
    onClick?: (item: T) => void;
    customIcon?: React.ReactNode;
    hideIcon?: boolean;
}
