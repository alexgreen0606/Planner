import * as Contacts from 'expo-contacts';
import * as Linking from 'expo-linking';
import { EventChipProps } from '../../foundation/calendarEvents/components/EventChip';
import { Birthday } from './types';
import { ItemStatus } from '../../foundation/sortedLists/constants';

export function eventChipToBirthday(chip: EventChipProps, datestamp: string): Birthday {
    const age = chip.label.match(/\d+/);
    return {
        id: `${chip.label}-list_item-${age}`,
        value: extractNameFromBirthdayText(chip.label),
        age: age ? parseInt(age[0], 10) : 0,
        contacted: false,
        listId: datestamp,
        sortId: -1,
        status: ItemStatus.STATIC,
    }
}

/**
 * Extracts a person's name from a birthday text string
 * @param birthdayText String containing a person's name followed by "'s" (e.g. "John's Birthday")
 * @returns The extracted person name or empty string if not found
 */
export function extractNameFromBirthdayText(birthdayText: string) {
    return birthdayText.split(/['’]s /)[0] ?? '';
};

/**
 * Opens the device's Messages app for a specific contact
 * @param personName The name of the person to find in contacts
 * @returns A Promise that resolves when the operation completes
 */
export async function openBirthdayMessage(personName: string) {
    try {
        if (!personName?.trim()) return;

        const { status } = await Contacts.requestPermissionsAsync();
        if (status !== 'granted') return;

        const { data: contacts } = await Contacts.getContactsAsync({
            name: personName,
            fields: [Contacts.Fields.PhoneNumbers],
        });

        if (!contacts.length) return;

        const contact = contacts[0];
        const phoneNumber = contact.phoneNumbers?.[0]?.digits;
        if (!phoneNumber) return;

        const url = `sms://${phoneNumber}&body=Happy Birthday`;

        await Linking.openURL(url);
    } catch (error) {
        console.error(error);
    }
};

/**
 * Opens the device's Contacts app for a specific contact
 * @param personName The name of the person to find in contacts
 * @returns A Promise that resolves when the operation completes
 */
export async function openMessage(personName: string) {
    try {
        if (!personName?.trim()) return;

        const { status } = await Contacts.requestPermissionsAsync();
        if (status !== 'granted') return;

        const { data: contacts } = await Contacts.getContactsAsync({
            fields: [Contacts.Fields.PhoneNumbers],
        });

        if (!contacts.length) return;

        const contact = contacts[0];
        const phoneNumber = contact.phoneNumbers?.[0]?.digits;
        if (!phoneNumber) return;

        const url = `sms://${phoneNumber}`;
        await Linking.openURL(url);
    } catch (error) {
        console.error(error);
    }
}
