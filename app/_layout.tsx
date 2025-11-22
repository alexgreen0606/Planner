import '../global.css';

import { Stack } from 'expo-router';
import { createStore, Provider as JotaiProvider } from 'jotai';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import useAppTheme from '@/hooks/useAppTheme';
import { EModalBasePath } from '@/lib/enums/EModalBasePath';
import { DeleteSchedulerProvider } from '@/providers/DeleteScheduler';
import { ExternalDataProvider } from '@/providers/ExternalDataProvider';
import { ScrollDirectionRegistryProvider } from '@/providers/ScrollDirectionRegistry';
import { ScrollOffsetRegistryProvider } from '@/providers/ScrollOffsetRegistry';

export const jotaiStore = createStore();

const TabLayout = () => {
  const {
    CssColor: { background }
  } = useAppTheme();
  return (
    <JotaiProvider store={jotaiStore}>
      <DeleteSchedulerProvider>
        <GestureHandlerRootView>
          <ScrollOffsetRegistryProvider>
            <ScrollDirectionRegistryProvider>
              <ExternalDataProvider>
                <Stack>
                  <Stack.Screen
                    name="(tabs)"
                    options={{
                      headerShown: false,
                      contentStyle: {
                        backgroundColor: background
                      }
                    }}
                  />
                  <Stack.Screen
                    name={`${EModalBasePath.EDIT_EVENT_MODAL_PATHNAME}/[eventId]/[triggerDatestamp]`}
                    options={{
                      presentation: 'formSheet',
                      sheetAllowedDetents: 'fitToContents',
                      contentStyle: {
                        backgroundColor: 'transparent'
                      },
                      headerShown: false
                    }}
                  />
                  <Stack.Screen
                    name={`${EModalBasePath.VIEW_EVENT_MODAL_PATHNAME}/[eventId]/[triggerDatestamp]`}
                    options={{
                      presentation: 'formSheet',
                      sheetAllowedDetents: 'fitToContents',
                      contentStyle: {
                        backgroundColor: 'transparent'
                      },
                      headerShown: false
                    }}
                  />
                  <Stack.Screen
                    name={`${EModalBasePath.FOLDER_ITEM_MODAL_PATHNAME}/[parentFolderId]/[folderItemId]`}
                    options={{
                      presentation: 'formSheet',
                      sheetAllowedDetents: 'fitToContents',
                      contentStyle: {
                        backgroundColor: 'transparent'
                      },
                      headerShown: false
                    }}
                  />
                </Stack>
              </ExternalDataProvider>
            </ScrollDirectionRegistryProvider>
          </ScrollOffsetRegistryProvider>
        </GestureHandlerRootView>
      </DeleteSchedulerProvider>
    </JotaiProvider>
  );
};

export default TabLayout;
