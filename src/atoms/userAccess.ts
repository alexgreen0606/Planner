import { EAccess } from "@/lib/enums/EAccess";
import { atom } from "jotai";

export const userAccessAtom = atom<Map<EAccess, boolean | undefined>>(
    new Map([
        [EAccess.CALENDAR, undefined],
        [EAccess.CONTACTS, undefined]
    ])
);