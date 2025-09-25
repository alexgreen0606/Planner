import { currentPlannerDatestamp } from '@/atoms/currentPlannerDatestamp';
import { mountedDatestampsAtom } from '@/atoms/mountedDatestamps';
import useAppTheme from '@/hooks/useAppTheme';
import { HEADER_HEIGHT } from '@/lib/constants/miscLayout';
import { getDayOfWeekFromDatestamp, getDayShiftedDatestamp, getDaysUntilIso, getTodayDatestamp, getTomorrowDatestamp } from '@/utils/dateUtils';
import { useAtomValue, useSetAtom } from 'jotai';
import React, { useMemo } from 'react';
import { PlatformColor, View } from 'react-native';
import GlassIconButton from '../icon/GlassButtonIcon';
import PlannerDateIcon from '../PlannerCarousel/PlannerDateIcon';
import PlannerChipSets from '../PlannerChip/PlannerChipSets';
import CustomText from '../text/CustomText';

// ✅ 

type TPlannerBannerProps = {
    datestamp: string;
};

const PlannerBanner = ({ datestamp }: TPlannerBannerProps) => {
    const setCurrentDatestamp = useSetAtom(currentPlannerDatestamp);
    const { today } = useAtomValue(mountedDatestampsAtom);

    const { background } = useAppTheme();

    const { label, dayOfWeek } = useMemo(() => {
        let label = '';

        const daysUntilDate = getDaysUntilIso(datestamp);

        if (datestamp === getTodayDatestamp()) {
            label = 'Today';
        } else if (datestamp === getTomorrowDatestamp()) {
            label = 'Tomorrow';
        } else if (daysUntilDate > 0) {
            label = `${daysUntilDate} days away`;
        } else {
            const absDays = Math.abs(daysUntilDate);
            label = `${absDays} day${absDays > 1 ? 's' : ''} ago`;
        }

        return { label, dayOfWeek: getDayOfWeekFromDatestamp(datestamp) };
    }, [today, datestamp]);

    return (
        <View>
            <View
                className='flex-row items-start justify-between w-full px-2'
                style={{ height: HEADER_HEIGHT }}
            >
                <GlassIconButton systemImage='chevron.left' onPress={() => setCurrentDatestamp(getDayShiftedDatestamp(datestamp, -1))} />

                <View className='flex-row w-40 gap-1 items-center'>
                    <PlannerDateIcon datestamp={datestamp} platformColor='systemRed' />
                    <View>
                        <CustomText variant='pageLabel'>
                            {dayOfWeek}
                        </CustomText>
                        <CustomText variant='detail' className='-mt-0.5' style={{ color: PlatformColor('secondaryLabel') }}>
                            {label}
                        </CustomText>
                    </View>
                </View>

                <GlassIconButton systemImage='chevron.right' onPress={() => setCurrentDatestamp(getDayShiftedDatestamp(datestamp, 1))} />
            </View>

            <PlannerChipSets
                datestamp={datestamp}
                backgroundPlatformColor={background}
            />
        </View>
    )
};

export default PlannerBanner;