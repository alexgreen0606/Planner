import * as Contacts from 'expo-contacts';
import * as SMS from 'expo-sms';

/**
 * Extracts a person's name from a birthday text string
 * @param birthdayText String containing a person's name followed by "'s" (e.g. "John's Birthday")
 * @returns The extracted person name or empty string if not found
 */
export function extractNameFromBirthdayText(birthdayText: string) {
    return birthdayText.split(/['’]s /)[0] ?? '';
}

/**
 * Opens the device's Messages app for a specific contact with an optional message
 * @param personName The name of the person to find in contacts
 * @param message Optional message to pre-populate (leave empty for no default text)
 * @returns A Promise that resolves to true if SMS was sent, false otherwise
 */
export async function openMessageForContact(
    personName: string,
    message: string = ''
): Promise<boolean> {
    try {
        if (!personName?.trim()) {
            console.warn('No person name provided');
            return false;
        }

        // Check SMS availability first
        const isAvailable = await SMS.isAvailableAsync();
        if (!isAvailable) {
            console.warn('SMS is not available on this device');
            return false;
        }

        // Request contacts permission
        const { status } = await Contacts.requestPermissionsAsync();
        if (status !== 'granted') {
            console.warn('Contacts permission not granted');
            return false;
        }

        // Find contact by name
        const { data: contacts } = await Contacts.getContactsAsync({
            name: personName,
            fields: [Contacts.Fields.PhoneNumbers],
        });

        if (!contacts.length) {
            console.warn(`No contact found with name: ${personName}`);
            return false;
        }

        const contact = contacts[0];
        const phoneNumber = contact.phoneNumbers?.[0]?.digits;

        if (!phoneNumber) {
            console.warn(`No phone number found for contact: ${personName}`);
            return false;
        }

        // Send SMS with or without message
        const { result } = await SMS.sendSMSAsync(
            [phoneNumber],
            message // Will be empty string if not provided
        );

        // Log result
        if (result === 'sent') {
            console.log('SMS sent successfully');
            return true;
        } else if (result === 'cancelled') {
            console.log('SMS cancelled by user');
            return false;
        } else {
            console.log('SMS result unknown');
            return false;
        }
    } catch (error) {
        console.error('Error in openMessageForContact:', error);
        return false;
    }
}

/**
 * Opens the device's Messages app for a birthday message
 * @param personName The name of the person to find in contacts
 * @returns A Promise that resolves to true if SMS was sent, false otherwise
 */
export async function openBirthdayMessage(personName: string): Promise<boolean> {
    return openMessageForContact(personName, 'Happy Birthday!');
}

/**
 * Opens the device's Messages app without a pre-filled message
 * @param personName The name of the person to find in contacts
 * @returns A Promise that resolves to true if SMS was sent, false otherwise
 */
export async function openMessage(personName: string): Promise<boolean> {
    return openMessageForContact(personName);
}