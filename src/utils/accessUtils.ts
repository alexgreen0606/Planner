import { jotaiStore } from 'app/_layout';

import { permissionsAtom } from '@/atoms/userAccessAtoms';
import { EAccess } from '@/lib/enums/EAccess';

// ✅

/**
 * Validates if the user has granted calendar access.
 *
 * @returns True if calendar access is granted, false if denied.
 */
export function hasCalendarAccess(): boolean {
  const userAccess = jotaiStore.get(permissionsAtom);
  return userAccess.get(EAccess.CALENDAR) === true;
}

/**
 * Validates if the user has granted contacts access.
 *
 * @returns True if contacts access is granted, false if denied.
 */
export function hasContactsAccess(): boolean {
  const userAccess = jotaiStore.get(permissionsAtom);
  return userAccess.get(EAccess.CONTACTS) === true;
}
