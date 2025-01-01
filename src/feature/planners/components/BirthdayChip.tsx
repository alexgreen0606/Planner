import React, { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { getBirthday } from '../storage/plannerStorage';
import colors from '../../../theme/colors';

interface BirthdayChipProps {
    timestamp: string; // YYYY-MM-DD
}

const BirthdayChip = ({ timestamp }: BirthdayChipProps) => {
    const [birthday, setBirthday] = useState<string | undefined>();

    // Load in the first birthday for this date
    useEffect(() => {
        const loadBirthday = async () => {
            setBirthday(await getBirthday(timestamp));
        }
        loadBirthday();
    }, [])

    if (!birthday) return;

    return (
        <Text
            adjustsFontSizeToFit
            numberOfLines={1}
            style={styles.text}
        >
            {birthday}
        </Text>
    );
};

const styles = StyleSheet.create({
    text: {
        fontSize: 12,
        color: colors.purple
    },
});

export default BirthdayChip;