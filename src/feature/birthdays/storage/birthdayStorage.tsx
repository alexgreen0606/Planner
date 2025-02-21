import { uuid } from "expo-modules-core";
import { generateSortId } from "../../../foundation/sortedLists/sortedListUtils";
import { ItemStatus, ListItem } from "../../../foundation/sortedLists/types";

/**
* Generates or updates a checklist of birthdays for the current day
* @param currentBirthdayChecklist The existing checklist of birthday items
* @param birthdays Array of birthday strings to process
* @param datestamp Timestamp for the date of birthdays in the list (e.g. 2000-12-31)
* @returns A Promise resolving to an array of ListItems for today's birthdays
*/
export async function buildBirthdayChecklist(
    currentBirthdayChecklist: ListItem[],
    birthdays: string[],
    datestamp: string
): Promise<ListItem[]> {
    if (!birthdays?.length) return [];

    // Filter existing items that match today's date and a valid birthday
    const todayBirthdayChecklist = currentBirthdayChecklist.filter(item =>
        item.listId === datestamp &&
        birthdays.includes(item.value)
    );

    // Add new items for birthdays not already in the list
    birthdays.forEach(birthday => {
        const birthdayExists = todayBirthdayChecklist.some(item => item.value === birthday);

        if (!birthdayExists) {
            // Calculate the sort ID based on the last item or default value
            const lastSortId = todayBirthdayChecklist[todayBirthdayChecklist.length - 1]?.sortId ?? -1;
            const sortId = generateSortId(lastSortId, todayBirthdayChecklist);

            // Create new birthday item
            const newBirthdayItem: ListItem = {
                id: uuid.v4(),
                sortId,
                value: birthday,
                status: ItemStatus.STATIC,
                listId: datestamp
            };

            todayBirthdayChecklist.push(newBirthdayItem);
        }
    });

    return todayBirthdayChecklist;
};