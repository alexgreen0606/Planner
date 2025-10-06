import Countdowns from '@/components/lists/Countdowns';
import { PageProvider } from '@/providers/PageProvider';

// ✅ 

const PlannersLayout = () => (
    <PageProvider emptyPageLabelProps={{label: 'No countdowns'}}>
        <Countdowns />
    </PageProvider>
);

export default PlannersLayout;