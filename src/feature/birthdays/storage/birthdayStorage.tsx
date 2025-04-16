import { MMKV } from "react-native-mmkv";
import { Birthday } from "../types";
import { BIRTHDAY_STORAGE_ID } from "../constants";

const birthdayStorage = new MMKV({ id: BIRTHDAY_STORAGE_ID });

export function getContactedBirthdaysByDatestamp(datestamp: string): string[] {
    const todayString = birthdayStorage.getString(datestamp);
    if (todayString) {
        // Clean up storage by deleting all past birthdays
        birthdayStorage.getAllKeys().forEach((key) => {
            if (key !== datestamp) {
                birthdayStorage.delete(key);
            }
        })

        return JSON.parse(todayString) as string[];
    }
    return [];
}

export function markBirthdayContacted(birthday: Birthday) {
    const todayString = birthdayStorage.getString(birthday.listId) ?? '[]';
    const todayBirthdays = JSON.parse(todayString) as string[];
    todayBirthdays.push(birthday.value);
    birthdayStorage.set(birthday.listId, JSON.stringify(todayBirthdays));
}