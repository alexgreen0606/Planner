import { GenericIconProps } from "@/components/icon";

// ✅ 

export type TPlannerChip = {
    id: string;
    title: string;
    color: string;
    iconConfig: GenericIconProps;
    onClick?: () => void;
};