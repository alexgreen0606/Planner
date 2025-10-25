import ListToolbar from "@/components/lists/ListToolbar";
import { EStorageId } from "@/lib/enums/EStorageId";
import { IPlannerEvent } from "@/lib/types/listItems/IPlannerEvent";
import { openEditEventModal } from "@/utils/plannerUtils";
import { useMMKV } from "react-native-mmkv";
import useTextfieldItemAs from "../../hooks/useTextfieldItemAs";
import IconButton from "../icons/IconButton";

// ✅ 

const PlannerEventToolbar = () => {
    const eventStorage = useMMKV({ id: EStorageId.PLANNER_EVENT });

    const {
        textfieldItem: focusedEvent,
    } = useTextfieldItemAs<IPlannerEvent>(eventStorage);

    return (
        <ListToolbar iconSet={[[(
            <IconButton
                name='clock'
                onClick={() => focusedEvent && openEditEventModal(focusedEvent.id, focusedEvent.listId)}
                color="label"
            />
        )]]} />
    )
};

export default PlannerEventToolbar;