import { useAtom } from 'jotai';

import { permissionsAtom } from '@/atoms/userAccessAtoms';
import { EAccess } from '@/lib/enums/EAccess';

const usePermissions = (access: EAccess) => {
  const [permissions, setPermissions] = useAtom(permissionsAtom);

  const permission = permissions[access] ?? false;
  const isLoaded = permissions[access] !== undefined;

  function handleSetPermission(newValue: boolean) {
    setPermissions((prev) => ({ ...prev, [access]: newValue }));
  }

  return { permission, isLoaded, onSetPermission: handleSetPermission };
};

export default usePermissions;
