import Contacts from 'react-native-contacts';
import { Linking } from 'react-native'

/**
* Extracts a person's name from a birthday text string
* @param birthdayText String containing a person's name followed by "'s" (e.g. "John's Birthday")
* @returns The extracted person name or empty string if not found
*/
export function extractNameFromBirthdayText(birthdayText: string) {
    return birthdayText.split(/['']s /)[0] ?? '';
};

/**
* Formats a phone number by removing all non-digit characters
* @param phoneNumber The phone number string to format
* @returns A string containing only the digits from the phone number
*/
export function sanitizePhoneNumber(phoneNumber: string) {
    const digitsOnly = phoneNumber.replace(/\D/g, '');
    return digitsOnly;
};

/**
* Opens the device's Messages app for a specific contact
* @param personName The name of the person to find in contacts
* @returns A Promise that resolves when the operation completes
*/
export async function openBirthdayMessage(personName: string) {
    try {
        if (!personName?.trim()) return;

        const permission = await Contacts.requestPermission();
        if (permission !== 'authorized') return;

        const contacts = await Contacts.getContactsMatchingString(personName);

        if (!contacts?.length) return;

        const contact = contacts[0];
        const phoneNumber = contact.phoneNumbers[0]?.number;

        if (!phoneNumber) return;

        const formattedPhone = sanitizePhoneNumber(phoneNumber);
        const url = `sms:${formattedPhone}&body=Happy Birthday`;

        const canOpen = await Linking.canOpenURL(url);
        if (canOpen) {
            await Linking.openURL(url);
        }
    } catch (error) { }
};