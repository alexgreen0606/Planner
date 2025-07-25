import * as Contacts from 'expo-contacts';
import * as SMS from 'expo-sms';

// ✅ 

/**
 * Opens the device's Messages app for a specific contact with a default message.
 * 
 * @param personName - The name of the person to find in contacts.
 * @param message - Message to pre-populate. Default is empty.
 * @returns True if SMS was sent, else false.
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
            return true;
        } else if (result === 'cancelled') {
            return false;
        } else {
            return false;
        }
    } catch (error) {
        console.error('Error in openMessageForContact:', error);
        return false;
    }
}

/**
 * Extracts a person's name from a birthday text string.
 * 
 * @param birthdayText - Event title from a birthday event in the device calendar.
 * @returns A person's first and last name, or an empty string.
 */
export function extractNameFromBirthdayText(birthdayText: string): string {
    return birthdayText.split(/['’]s /)[0] ?? '';
}