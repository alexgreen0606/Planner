import { GenericIconProps } from "@/components/icon";
import { IPlannerEvent } from "../listItems/IPlannerEvent";

export type TEventChip = {
    label: string;
    iconConfig: GenericIconProps;
    color: string;
    onClick?: () => void;
    planEvent?: IPlannerEvent;
}