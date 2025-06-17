import { datestampToMonthDate, getTodayDatestamp } from "@/utils/dateUtils";
import { PlatformColor, Text, View } from "react-native";
import GenericIcon from ".";
import CustomText from "../text/CustomText";
import { useMemo } from "react";
import { DateTime } from "luxon";

interface TodayIconProps {
    platformColor: string;
}

const TodayIcon = ({ platformColor }: TodayIconProps) => {
    const todayDatestamp = useMemo(() => getTodayDatestamp(), []);

    const month = useMemo(() => {
        const monthFormat = 'MMM';
        const date = DateTime.fromISO(todayDatestamp);
        return date.toFormat(monthFormat).toUpperCase();
    }, [todayDatestamp]);

    const day = useMemo(() => {
        const monthFormat = 'dd';
        const date = DateTime.fromISO(todayDatestamp);
        return date.toFormat(monthFormat).toUpperCase();
    }, [todayDatestamp]);

    return (
        <View className='relative scale-[1.12]'>
            <GenericIcon
                type='note'
                size='xl'
                hideRipple
                platformColor={platformColor}
            />
            <View className='absolute top-[13%] left-0 w-full h-full items-center justify-center'>
                <CustomText
                    type='time'
                    style={{ fontSize: 7, color: PlatformColor(platformColor) }}
                >
                    {month}
                </CustomText>
                <CustomText
                    type='time'
                    style={{ fontSize: 12, color: PlatformColor(platformColor) }}
                >
                    {day}
                </CustomText>
            </View>
        </View>
    )
}

export default TodayIcon;