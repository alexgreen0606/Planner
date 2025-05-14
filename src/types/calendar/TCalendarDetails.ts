import { IconType } from "@/components/GenericIcon";

export type TCalendarDetails = {
    id: string;
    color: string;
    iconType: IconType;
    isPrimary: boolean;
    isBirthday: boolean;
}