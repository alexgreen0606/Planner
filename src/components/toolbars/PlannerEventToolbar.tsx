import GenericIcon from "@/components/icon";
import { openPlannerTimeModal } from "@/utils/plannerUtils";
import useTextfieldItemAs from "../../hooks/useTextfieldItemAs";
import { IPlannerEvent } from "@/lib/types/listItems/IPlannerEvent";
import { useMMKV } from "react-native-mmkv";
import { EStorageId } from "@/lib/enums/EStorageId";
import ListToolbar from "@/components/lists/components/ListToolbar";

// ✅ 

const PlannerEventToolbar = () => {
    const eventStorage = useMMKV({ id: EStorageId.PLANNER_EVENT });

    const {
        textfieldItem: focusedEvent,
    } = useTextfieldItemAs<IPlannerEvent>(eventStorage);

    const iconSet = [[(
        <GenericIcon
            type='clock'
            onClick={() => focusedEvent && openPlannerTimeModal(focusedEvent.id, focusedEvent.listId)}
            platformColor="label"
        />
    )]];

    return (
        <ListToolbar
            hide={focusedEvent?.storageId !== EStorageId.PLANNER_EVENT}
            iconSet={iconSet}
        />
    )
};

export default PlannerEventToolbar;