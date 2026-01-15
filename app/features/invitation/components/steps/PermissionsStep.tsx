import { useState, useMemo } from "react";
import type {
  WizardState,
  PermissionData,
  CustomPermission,
} from "../../types";

interface PermissionsStepProps {
  state: WizardState;
  permissions: PermissionData[];
  togglePermission: (permissionId: string) => void;
  selectAllPermissionsForResource: (
    permissionIds: string[],
    selected: boolean,
  ) => void;
  addCustomPermission: (permission: CustomPermission) => void;
  removeCustomPermission: (index: number) => void;
  nextStep: () => void;
  previousStep: () => void;
}

export function PermissionsStep({
  state,
  permissions,
  togglePermission,
  selectAllPermissionsForResource,
  addCustomPermission,
  removeCustomPermission,
  nextStep,
  previousStep,
}: PermissionsStepProps) {
  const [customResource, setCustomResource] = useState("");
  const [customAction, setCustomAction] = useState("");

  // Group permissions by resource
  const groupedPermissions = useMemo(() => {
    return permissions.reduce(
      (acc, perm) => {
        if (!acc[perm.resource]) {
          acc[perm.resource] = [];
        }
        acc[perm.resource].push(perm);
        return acc;
      },
      {} as Record<string, PermissionData[]>,
    );
  }, [permissions]);

  const handleAddCustomPermission = () => {
    if (customResource && customAction) {
      addCustomPermission({
        resource: customResource.trim(),
        action: customAction.trim(),
      });
      setCustomResource("");
      setCustomAction("");
    }
  };

  // Check if all permissions in a resource are selected
  const isResourceFullySelected = (resourcePerms: PermissionData[]) => {
    return resourcePerms.every((p) => state.selectedPermissions.includes(p.id));
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Permissions</h2>
        <p className="text-sm text-muted-foreground">
          Configure permissions for this role
        </p>
      </div>

      {/* Browse Permissions */}
      <div className="space-y-4">
        {Object.entries(groupedPermissions).map(([resource, perms]) => {
          const allSelected = isResourceFullySelected(perms);
          return (
            <div key={resource} className="rounded-lg border p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-medium capitalize">{resource}</h3>
                <button
                  type="button"
                  onClick={() =>
                    selectAllPermissionsForResource(
                      perms.map((p) => p.id),
                      !allSelected,
                    )
                  }
                  className="text-sm text-primary hover:underline"
                >
                  {allSelected ? "Deselect All" : "Select All"}
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {perms.map((perm) => (
                  <label
                    key={perm.id}
                    className="flex items-center gap-2 text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={state.selectedPermissions.includes(perm.id)}
                      onChange={() => togglePermission(perm.id)}
                      className="rounded border-gray-300"
                    />
                    <span>{perm.action}</span>
                  </label>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Custom Permission */}
      <div className="border-t pt-6">
        <h3 className="mb-3 font-medium">Add Custom Permission</h3>
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="mb-1 block text-xs text-muted-foreground">
              Resource
            </label>
            <input
              type="text"
              value={customResource}
              onChange={(e) => setCustomResource(e.target.value)}
              placeholder="e.g., report"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <div className="flex-1">
            <label className="mb-1 block text-xs text-muted-foreground">
              Action
            </label>
            <input
              type="text"
              value={customAction}
              onChange={(e) => setCustomAction(e.target.value)}
              placeholder="e.g., export"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <button
            type="button"
            onClick={handleAddCustomPermission}
            disabled={!customResource || !customAction}
            className="self-end rounded-md bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground hover:bg-secondary/80 disabled:opacity-50"
          >
            Add
          </button>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Format: resource:action (e.g., customer:manage, analytics:export)
        </p>

        {/* List Custom Permissions */}
        {state.customPermissions.length > 0 && (
          <div className="mt-4 space-y-2">
            <div className="text-sm font-medium">
              Custom Permissions ({state.customPermissions.length})
            </div>
            {state.customPermissions.map((cp, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded bg-muted p-2"
              >
                <span className="text-sm">
                  {cp.resource}:{cp.action}
                </span>
                <button
                  type="button"
                  onClick={() => removeCustomPermission(i)}
                  className="text-sm text-destructive hover:underline"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Selected Count */}
      <div className="rounded-lg bg-muted p-4 text-sm">
        <strong>{state.selectedPermissions.length}</strong> standard permissions
        and <strong>{state.customPermissions.length}</strong> custom permissions
        selected
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={previousStep}
          className="rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
        >
          Back
        </button>
        <button
          type="button"
          onClick={nextStep}
          className="flex-1 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Review & Send Invitation
        </button>
      </div>
    </div>
  );
}
