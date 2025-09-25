import { currentPlannerDatestamp } from '@/atoms/currentPlannerDatestamp';
import PlannerBanner from '@/components/banner/PlannerBanner';
import GlassIconButton from '@/components/icon/GlassButtonIcon';
import usePlanner from '@/hooks/planners/usePlanner';
import { EStorageId } from '@/lib/enums/EStorageId';
import { PageProvider } from '@/providers/PageProvider';
import { useAtomValue } from 'jotai';
import React, { ReactNode } from 'react';
import { View } from 'react-native';
import { useMMKV } from 'react-native-mmkv';
import RecurringPlannerBanner from './banner/RecurringPlannerBanner';

// ✅ 

type TRecurringPlannerPageProps = {
    children: ReactNode;
};

const RecurringPlannerPage = ({ children }: TRecurringPlannerPageProps) => {
    const datestamp = useAtomValue(currentPlannerDatestamp);
    const eventStorage = useMMKV({ id: EStorageId.PLANNER_EVENT });

    const { OverflowActionsIcon } = usePlanner(datestamp, eventStorage);

    return (
        <PageProvider
            floatingHeader={
                <RecurringPlannerBanner />
            }
            // floatingFooter={
            //     // <View className='px-2 justify-between flex-row'>
            //     //     <GlassIconButton systemImage='repeat' />
            //     //     <View className='flex-row gap-2'>
            //     //         <GlassIconButton systemImage='square.stack' />
            //     //         <OverflowActionsIcon />
            //     //     </View>
            //     // </View>
            // }
        >
            {children}
        </PageProvider>
    )
};

export default RecurringPlannerPage;