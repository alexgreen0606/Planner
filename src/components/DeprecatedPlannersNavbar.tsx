// import { PageProvider } from '@/providers/PageProvider';
// import { Host, HStack, Picker } from '@expo/ui/swift-ui';
// import { frame, glassEffect } from '@expo/ui/swift-ui/modifiers';
// import { useRouter } from 'expo-router';
// import React, { useState } from 'react';
// import { useWindowDimensions } from 'react-native';

// // ✅ 

// type TTopNavbarProps = {
//     children: React.ReactNode;
// };

// const BAR_HEIGHT = 36;
// const BAR_WIDTH = 320;

// const routes = [
//     '/planners/countdowns',
//     '/planners',
//     '/planners/recurring'
// ];

// const PlannersNavbar = ({ children }: TTopNavbarProps) => {
//     const { width: SCREEN_WIDTH } = useWindowDimensions();
//     const router = useRouter();

//     const [currentTabIndex, setCurrentTabIndex] = useState(1);

//     return (
//         <PageProvider
//             fixFloatingBannerToTop
//             floatingHeader={
//                 <Host matchContents>
//                     <HStack modifiers={[frame({ width: SCREEN_WIDTH })]} alignment="center">
//                         <Picker
//                             options={['Countdowns', 'Planner', 'Recurring']}
//                             selectedIndex={currentTabIndex}
//                             onOptionSelected={({ nativeEvent: { index } }) => {
//                                 router.push(routes[index]);
//                                 setCurrentTabIndex(index);
//                             }}
//                             variant="segmented"
//                             modifiers={[frame({ width: BAR_WIDTH, height: BAR_HEIGHT }), glassEffect({ glass: { variant: 'regular' } })]}
//                         />
//                     </HStack>
//                 </Host>
//             }
//         >
//             {children}
//         </PageProvider>
//     )
// };

// export default PlannersNavbar;