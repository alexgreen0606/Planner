import React, { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { getHoliday } from '../storage/plannerStorage';
import colors from '../../../theme/colors';

interface HolidayChipProps {
    timestamp: string; // YYYY-MM-DD
}

const HolidayChip = ({ timestamp }: HolidayChipProps) => {
    const [holiday, setHoliday] = useState<string | undefined>();

    // Load in the first holiday for this date
    useEffect(() => {
        const loadHoliday = async () => {
            setHoliday(await getHoliday(timestamp));
        }
        loadHoliday();
    }, [])

    if (!holiday) return;

    return (
        <Text
            adjustsFontSizeToFit
            numberOfLines={1}
            style={styles.text}
        >
            {holiday}
        </Text>
    );
};

const styles = StyleSheet.create({
    text: {
        fontSize: 12,
        color: colors.green
    },
});

export default HolidayChip;