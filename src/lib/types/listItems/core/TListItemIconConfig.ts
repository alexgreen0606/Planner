import { GenericIconProps } from "@/components/icon";
import { TListItem } from "./TListItem";

// ✅ 

export type TListItemIconConfig<T extends TListItem> = {
    icon?: GenericIconProps;
    onClick?: (item: T) => void;
    customIcon?: React.ReactNode;
    hideIcon?: boolean;
};
