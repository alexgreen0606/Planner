import { GenericIconProps } from "@/components/icon";
import { Event as CalendarEvent } from 'expo-calendar';

// export type TEventChip = {
//     label: string;
//     iconConfig: GenericIconProps;
//     color: string;
//     onClick?: () => void;
//     planEvent?: IPlannerEvent;
// }

export type TCalendarEventChip = {
    event: CalendarEvent;
    color: string;
    iconConfig: GenericIconProps;
    onClick?: () => void;
};