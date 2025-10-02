import Countdowns from '@/components/lists/Countdowns';
import { PageProvider } from '@/_deprecated/DeprecatedPageProvider';

// ✅ 

const PlannersLayout = () => (
    <PageProvider>
        <Countdowns />
    </PageProvider>
);

export default PlannersLayout;