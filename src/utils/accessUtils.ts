import { userAccessAtom } from "@/atoms/userAccess";
import { EAccess } from "@/lib/enums/EAccess";
import { jotaiStore } from "app/_layout";

// ✅ 

/**
 * Validates if the user has granted calendar access.
 * 
 * @returns True if calendar access is granted, false if denied.
 */
export function hasCalendarAccess(): boolean {
    const userAccess = jotaiStore.get(userAccessAtom);
    return userAccess.get(EAccess.CALENDAR) === true;
}

/**
 * Validates if the user has granted contacts access.
 * 
 * @returns True if contacts access is granted, false if denied.
 */
export function hasContactsAccess(): boolean {
    const userAccess = jotaiStore.get(userAccessAtom);
    return userAccess.get(EAccess.CONTACTS) === true;
}