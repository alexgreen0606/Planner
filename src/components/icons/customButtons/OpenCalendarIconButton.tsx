import { PLANNER_SELECT_MODAL_PATHNAME } from "@/lib/constants/pathnames";
import { useRouter } from "expo-router";
import { TouchableOpacity } from "react-native";
import Icon from "../Icon";

// ✅ 

const OpenCalendarButton = () => {
    const router = useRouter();
    return (
        <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.push(PLANNER_SELECT_MODAL_PATHNAME)}
            className='flex-row items-center'
        >
            <Icon
                name='calendar'
                size={22}
                color="label"
            />
            <Icon
                name='chevron.right'
                size={12}
                color="label"
            />
        </TouchableOpacity>
    )
};

export default OpenCalendarButton;