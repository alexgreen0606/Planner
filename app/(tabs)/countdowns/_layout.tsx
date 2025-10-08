import Countdowns from '@/components/lists/Countdowns';
import PlannerEventToolbar from '@/components/toolbars/PlannerEventToolbar';
import { PageProvider } from '@/providers/PageProvider';

// ✅ 

const PlannersLayout = () => (
    <PageProvider
        emptyPageLabelProps={{ label: 'No countdowns' }}
        toolbar={<PlannerEventToolbar />}
    >
        <Countdowns />
    </PageProvider>
);

export default PlannersLayout;