import Countdowns from '@/components/lists/Countdowns';
import { PageProvider } from '@/providers/PageProvider';

// ✅ 

const PlannersLayout = () => (
    <PageProvider>
        <Countdowns />
    </PageProvider>
);

export default PlannersLayout;