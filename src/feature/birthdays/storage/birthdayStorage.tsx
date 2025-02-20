import { uuid } from "expo-modules-core";
import { generateSortId} from "../../../foundation/sortedLists/sortedListUtils";
import { ItemStatus, ListItem } from "../../../foundation/sortedLists/types";
import { getTodayDatestamp } from "../../../foundation/calendarEvents/timestampUtils";

export async function buildBirthdayChecklist(
    currentBirthdayChecklist: ListItem[],
    birthdays: string[]
): Promise<ListItem[]> {
    const todayTimestamp = getTodayDatestamp();
    if (birthdays && birthdays.length !== 0) {
        const todayBirthdayChecklist = currentBirthdayChecklist.filter(birthdayItem =>
            birthdayItem.listId === todayTimestamp &&
            birthdays.find(bday => bday === birthdayItem.value)
        );
        birthdays.forEach(bday => {
            if (!todayBirthdayChecklist.find(currentItem => currentItem.value === bday)) {
                // Add in an item for this birthday
                const newBirthdayItem: ListItem = {
                    id: uuid.v4(),
                    sortId: generateSortId(todayBirthdayChecklist[todayBirthdayChecklist.length - 1]?.sortId ?? -1, todayBirthdayChecklist),
                    value: bday,
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