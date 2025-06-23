import { userAccessAtom } from "@/atoms/userAccess";
import { EAccess } from "@/lib/enums/EAccess";
import { jotaiStore } from "app/_layout";

/**
 * Checks if the user has granted calendar access
 * @returns boolean - true if access is granted, false if denied or undetermined
 */
export const hasCalendarAccess = (): boolean => {
    const userAccess = jotaiStore.get(userAccessAtom);
    return userAccess.get(EAccess.CALENDAR) === true;
};

/**
 * Checks if the user has granted contacts access
 * @returns boolean - true if access is granted, false if denied or undetermined
 */
export const hasContactsAccess = (): boolean => {
    const userAccess = jotaiStore.get(userAccessAtom);
    return userAccess.get(EAccess.CONTACTS) === true;
};