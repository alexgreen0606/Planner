import { filteredUpcomingDatesMapAtom } from '@/atoms/calendarAtoms';
import UpcomingDateCard from '@/components/UpcomingDateCard';
import { useAtomValue } from 'jotai';
import React from 'react';
import { ScrollView } from 'react-native';

// ✅ 

const UpcomingDatesPage = () => {
    const filteredUpcomingDates = useAtomValue(filteredUpcomingDatesMapAtom);
    return (
        <ScrollView className="flex-1">
            {Object.entries(filteredUpcomingDates).map(([datestamp, events], index) => (
                <UpcomingDateCard
                    key={`${datestamp}-upcoming-date`}
                    datestamp={datestamp}
                    events={events}
                    index={index}
                />
            ))}
        </ScrollView>
    );
};

export default UpcomingDatesPage;