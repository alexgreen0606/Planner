import { MMKV } from "react-native-mmkv";
import { BIRTHDAY_STORAGE_ID } from "../utils";
import { getTodayTimestamp } from "../../../foundation/planners/timeUtils";
import { generateBirthdaysMap } from "../../../foundation/planners/calendarUtils";
import { uuid } from "expo-modules-core";
import { generateSortId, ItemStatus, ListItem } from "../../../foundation/sortedLists/utils";

const storage = new MMKV({ id: BIRTHDAY_STORAGE_ID });

export async function buildBirthdayChecklist(currentBirthdayChecklist: ListItem[]): Promise<ListItem[]> {
    const todayTimestamp = getTodayTimestamp();
    const birthdayMap = await generateBirthdaysMap([todayTimestamp]);
    const todayBirthdays = birthdayMap[todayTimestamp];
    if (todayBirthdays && todayBirthdays.length !== 0) {
        const todayBirthdayChecklist = currentBirthdayChecklist.filter(birthdayItem => birthdayItem.listId === todayTimestamp);

        todayBirthdays.forEach(birthday => {
            if (!todayBirthdayChecklist.find(currentItem => currentItem.value === birthday)) {
                // add in an item for this birthday
                const newBirthdayItem: ListItem = {
                    id: uuid.v4(),
                    sortId: generateSortId(todayBirthdayChecklist[todayBirthdayChecklist.length - 1]?.sortId ?? -1, todayBirthdayChecklist),
                    value: birthday,
                    status: ItemStatus.STATIC,
                    listId: todayTimestamp
                };
                todayBirthdayChecklist.push(newBirthdayItem);
            }
        })
        return todayBirthdayChecklist;
    }
    return [];
}