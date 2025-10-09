import Countdowns from '@/components/lists/Countdowns';
import PlannerEventToolbar from '@/components/toolbars/PlannerEventToolbar';
import { ListPage } from '@/components/ListPage';

// ✅ 

const PlannersLayout = () => (
    <ListPage
        emptyPageLabelProps={{ label: 'No countdowns' }}
        toolbar={<PlannerEventToolbar />}
    >
        <Countdowns />
    </ListPage>
);

export default PlannersLayout;