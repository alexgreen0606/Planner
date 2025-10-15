import useAppTheme from "@/hooks/useAppTheme";
import { TPlannerPageParams } from "@/lib/types/routeParams/TPlannerPageParams";
import { DateTimePicker, Host } from '@expo/ui/swift-ui';
import { useGlobalSearchParams } from "expo-router";
import { DateTime } from "luxon";
import { View } from "react-native";
import Icon from "../Icon";

// ✅ 

type TOpenPlannerButtonProps = {
    onOpenPlanner: (datestamp: string) => void;
}

const OpenPlannerButton = ({ onOpenPlanner }: TOpenPlannerButtonProps) => {
    const { datestamp } = useGlobalSearchParams<TPlannerPageParams>();

    const { CssColor: { background } } = useAppTheme();

    function handleOpenPlanner(date: Date) {
        const newDatestamp = DateTime.fromJSDate(date).toISODate()!;
        onOpenPlanner(newDatestamp);
    }

    return (
        <View className='relative h-full'>

            {/* Calendar Icon */}
            <View
                className='pointer-events-none z-[1] pr-4 h-full justify-center'
                style={{ backgroundColor: background }}
            >
                <Icon
                    name='calendar'
                    size={28}
                    color="label"
                />
            </View>

            {/* Date Picker */}
            <View className="absolute left-0">
                <Host matchContents>
                    <DateTimePicker
                        key={`${datestamp}-selector`}
                        onDateSelected={handleOpenPlanner}
                        displayedComponents='date'
                        initialDate={datestamp}
                        variant='automatic'
                    />
                </Host>
            </View>

        </View>
    )
};

export default OpenPlannerButton;