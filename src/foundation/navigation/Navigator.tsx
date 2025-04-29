// import React from 'react';
// import { StyleSheet, View } from 'react-native';
// import { BOTTOM_NAVIGATION_HEIGHT, Screens } from './constants';
// import GenericIcon from '../components/GenericIcon';
// import useDimensions from '../hooks/useDimensions';
// import { useNavigation } from './services/NavigationProvider';
// import Today from '../../screens/today';
// import Planners from '../../screens/planners';
// import Lists from '../../screens/checklists';

// const Navigator = () => {

//     const {
//         currentScreen,
//         setCurrentScreen,
//     } = useNavigation();

//     const {
//         SCREEN_WIDTH,
//         SCREEN_HEIGHT,
//         BOTTOM_SPACER,
//     } = useDimensions();

//     const screenStyles = [
//         styles.screen,
//         { height: SCREEN_HEIGHT, width: SCREEN_WIDTH }
//     ];

//     return (
//         <View style={{ flex: 1 }}>

//             {/* Screens */}
//             <View style={[
//                 ...screenStyles,
//                 {
//                     opacity: currentScreen === Screens.DASHBOARD ? 1 : 0,
//                     pointerEvents: currentScreen === Screens.DASHBOARD ? 'auto' : 'none'
//                 }
//             ]}>
//                 <Today />
//             </View>
//             <View style={[
//                 ...screenStyles,
//                 {
//                     opacity: currentScreen === Screens.LISTS ? 1 : 0,
//                     pointerEvents: currentScreen === Screens.LISTS ? 'auto' : 'none',
//                 }
//             ]}>
//                 <Lists />
//             </View>
//             <View style={[
//                 ...screenStyles,
//                 {
//                     opacity: ![Screens.LISTS, Screens.DASHBOARD].includes(currentScreen) ? 1 : 0,
//                     pointerEvents: ![Screens.LISTS, Screens.DASHBOARD].includes(currentScreen) ? 'auto' : 'none',
//                 }
//             ]}>
//                 <Planners />
//             </View>

//             {/* Bottom Navbar */}
//             <View style={[
//                 styles.navBar,
//                 { paddingBottom: BOTTOM_SPACER - 8 }
//             ]}>
//                 <GenericIcon
//                     type='lists'
//                     size='xl'
//                     hideRipple
//                     platformColor={currentScreen === Screens.LISTS ? 'systemBlue' : 'secondaryLabel'}
//                     onClick={() => setCurrentScreen(Screens.LISTS)}
//                 />
//                 <GenericIcon
//                     type='coffee'
//                     size='xl'
//                     hideRipple
//                     platformColor={currentScreen === Screens.DASHBOARD ? 'systemBlue' : 'secondaryLabel'}
//                     onClick={() => setCurrentScreen(Screens.DASHBOARD)}
//                 />
//                 <GenericIcon
//                     type='planners'
//                     size='xl'
//                     hideRipple
//                     platformColor={currentScreen === Screens.PLANNERS ? 'systemBlue' : 'secondaryLabel'}
//                     onClick={() => setCurrentScreen(Screens.PLANNERS)}
//                 />
//             </View>
//         </View>
//     );
// };

// const styles = StyleSheet.create({
//     screen: {
//         position: 'absolute',
//         top: 0,
//         left: 0
//     },
//     navBar: {
//         position: 'absolute',
//         bottom: 0,
//         left: 0,
//         height: BOTTOM_NAVIGATION_HEIGHT,
//         width: '100%',
//         flexDirection: 'row',
//         justifyContent: 'space-evenly',
//         alignItems: 'flex-end',
//         backgroundColor: 'transparent',
//         zIndex: 1000
//     }
// });

// export default Navigator;
