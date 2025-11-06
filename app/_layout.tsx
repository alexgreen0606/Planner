import { Stack } from 'expo-router'
import { createStore, Provider as JotaiProvider } from 'jotai'
import { GestureHandlerRootView } from 'react-native-gesture-handler'

import useAppTheme from '@/hooks/useAppTheme'
import {
  EDIT_EVENT_MODAL_PATHNAME,
  FOLDER_ITEM_MODAL_PATHNAME,
  VIEW_EVENT_MODAL_PATHNAME,
} from '@/lib/constants/pathnames'
import { DeleteSchedulerProvider } from '@/providers/DeleteScheduler'
import { ExternalDataProvider } from '@/providers/ExternalDataProvider'
import { ScrollRegistryProvider } from '@/providers/ScrollRegistry'
import '../global.css'

// ✅

export const jotaiStore = createStore()

const TabLayout = () => {
  const {
    CssColor: { background },
  } = useAppTheme()
  return (
    <JotaiProvider store={jotaiStore}>
      <DeleteSchedulerProvider>
        <GestureHandlerRootView>
          <ScrollRegistryProvider>
            <ExternalDataProvider>
              <Stack>
                <Stack.Screen
                  name="(tabs)"
                  options={{ headerShown: false, contentStyle: { backgroundColor: background } }}
                />
                <Stack.Screen
                  name={`${EDIT_EVENT_MODAL_PATHNAME}/[eventId]/[triggerDatestamp]`}
                  options={{
                    presentation: 'formSheet',
                    sheetAllowedDetents: 'fitToContents',
                    contentStyle: { backgroundColor: 'transparent' },
                    headerShown: false,
                  }}
                />
                <Stack.Screen
                  name={`${VIEW_EVENT_MODAL_PATHNAME}/[eventId]/[triggerDatestamp]`}
                  options={{
                    presentation: 'formSheet',
                    sheetAllowedDetents: 'fitToContents',
                    contentStyle: { backgroundColor: 'transparent' },
                    headerShown: false,
                  }}
                />
                <Stack.Screen
                  name={`${FOLDER_ITEM_MODAL_PATHNAME}/[folderItemId]`}
                  options={{
                    presentation: 'formSheet',
                    sheetAllowedDetents: 'fitToContents',
                    contentStyle: { backgroundColor: 'transparent' },
                    headerShown: false,
                  }}
                />
              </Stack>
            </ExternalDataProvider>
          </ScrollRegistryProvider>
        </GestureHandlerRootView>
      </DeleteSchedulerProvider>
    </JotaiProvider>
  )
}

export default TabLayout
