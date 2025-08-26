import { GenericIconProps } from "@/components/icon";
import { Event as CalendarEvent } from 'expo-calendar';
import { Router } from "expo-router";

// ✅ 

export type TCalendarEventChip = {
    event: CalendarEvent;
    color: string;
    iconConfig: GenericIconProps;
    onClick?: () => void;
    hasClickAccess?: boolean;
};