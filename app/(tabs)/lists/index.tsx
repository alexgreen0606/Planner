import { EStorageKey } from '@/lib/enums/EStorageKey';
import { Redirect } from 'expo-router';

export default function IndexPage() {

    return <Redirect href={`/lists/folder/NULL/NULL/${EStorageKey.ROOT_CHECKLIST_FOLDER_KEY}`} />;
}
