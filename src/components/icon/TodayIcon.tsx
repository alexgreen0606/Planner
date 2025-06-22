import { DateTime } from "luxon";
import { useMemo } from "react";
import { PlatformColor, View } from "react-native";
import GenericIcon from ".";
import CustomText from "../text/CustomText";
import { useAtomValue } from "jotai";
import { mountedDatestampsAtom } from "@/atoms/mountedDatestamps";

interface TodayIconProps {
    platformColor: string;
}

const TodayIcon = ({ platformColor }: TodayIconProps) => {
    const { today: todayDatestamp } = useAtomValue(mountedDatestampsAtom);

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
            <View className='absolute w-full h-full items-center pt-[2.5px] gap-1'>
                <CustomText
                    type='time'
                    style={{ fontSize: 7, color: PlatformColor('systemBackground') }}
                >
                    {month}
                </CustomText>
                <CustomText
                    type='time'
                    style={{ fontSize: 14, color: PlatformColor(platformColor), paddingLeft: 1 }}
                >
                    {day}
                </CustomText>
            </View>
        </View>
    )
}

export default TodayIcon;