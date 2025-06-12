import { GenericIconProps } from "@/components/GenericIcon";
import { IPlannerEvent } from "../listItems/IPlannerEvent";

export type TEventChip = {
    label: string;
    iconConfig: GenericIconProps;
    color: string;
    onClick?: () => void;
    planEvent?: IPlannerEvent;
}