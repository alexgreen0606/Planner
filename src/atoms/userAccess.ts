import { EAccess } from "@/lib/enums/EAccess";
import { atom } from "jotai";

// ✅ 

export type TUserAccess = Map<EAccess, boolean | undefined>;

export const userAccessAtom = atom<TUserAccess>(
    new Map([
        [EAccess.CALENDAR, undefined],
        [EAccess.CONTACTS, undefined]
    ])
);