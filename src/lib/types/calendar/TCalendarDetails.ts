import { IconType } from "@/components/icon";

export type TCalendarDetails = {
    id: string;
    color: string;
    iconType: IconType;
    isPrimary: boolean;
    isBirthday: boolean;
}