import type { WizardState, RoleData, PermissionData } from "../../types";

interface ReviewStepProps {
  state: WizardState;
  roles: RoleData[];
  permissions: PermissionData[];
  previousStep: () => void;
  goToStep: (step: 1 | 2 | 3 | 4) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}

export function ReviewStep({
  state,
  roles,
  permissions,
  previousStep,
  goToStep,
  onSubmit,
  isSubmitting,
}: ReviewStepProps) {
  const selectedRole = roles.find((r) => r.id === state.roleId);
  const selectedPerms = permissions.filter((p) =>
    state.selectedPermissions.includes(p.id)
  );

  // Group selected permissions by resource
  const groupedPerms = selectedPerms.reduce((acc, perm) => {
    if (!acc[perm.resource]) {
      acc[perm.resource] = [];
    }
    acc[perm.resource].push(perm.action);
    return acc;
  }, {} as Record<string, string[]>);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Review Invitation</h2>
        <p className="text-sm text-muted-foreground">
          Review the details before sending the invitation
        </p>
      </div>

      <div className="divide-y rounded-lg border">
        {/* User Info */}
        <div className="p-4">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="font-medium">User Information</h3>
            <button
              type="button"
              onClick={() => goToStep(1)}
              className="text-sm text-primary hover:underline"
            >
              Edit
            </button>
          </div>
          <div className="space-y-1 text-sm">
            <div>
              <span className="text-muted-foreground">Name:</span>{" "}
              <span className="font-medium">{state.name}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Email:</span>{" "}
              <span className="font-medium">{state.email}</span>
            </div>
          </div>
        </div>

        {/* Role */}
        <div className="p-4">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="font-medium">Role Assignment</h3>
            <button
              type="button"
              onClick={() => goToStep(2)}
              className="text-sm text-primary hover:underline"
            >
              Edit
            </button>
          </div>
          <div className="text-sm">
            {state.createNewRole ? (
              <div>
                <div className="font-medium">{state.newRoleName}</div>
                {state.newRoleDescription && (
                  <div className="text-muted-foreground">
                    {state.newRoleDescription}
                  </div>
                )}
                <div className="mt-1 inline-flex items-center rounded-full bg-purple-100 px-2 py-0.5 text-xs text-purple-800">
                  Custom Role
                </div>
              </div>
            ) : (
              <div>
                <div className="font-medium">{selectedRole?.name}</div>
                {selectedRole?.description && (
                  <div className="text-muted-foreground">
                    {selectedRole.description}
                  </div>
                )}
                {selectedRole?.isSystem && (
                  <div className="mt-1 inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-800">
                    System Role
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Permissions */}
        <div className="p-4">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="font-medium">Permissions</h3>
            <button
              type="button"
              onClick={() => goToStep(3)}
              className="text-sm text-primary hover:underline"
            >
              Edit
            </button>
          </div>
          <div className="space-y-3 text-sm">
            {Object.keys(groupedPerms).length > 0 && (
              <div>
                <div className="mb-1 text-muted-foreground">
                  Standard ({selectedPerms.length}):
                </div>
                <div className="space-y-2">
                  {Object.entries(groupedPerms).map(([resource, actions]) => (
                    <div key={resource}>
                      <div className="font-medium capitalize">{resource}:</div>
                      <div className="flex flex-wrap gap-1">
                        {actions.map((action) => (
                          <span
                            key={action}
                            className="inline-flex items-center rounded bg-muted px-2 py-0.5 text-xs"
                          >
                            {action}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {state.customPermissions.length > 0 && (
              <div>
                <div className="mb-1 text-muted-foreground">
                  Custom ({state.customPermissions.length}):
                </div>
                <div className="flex flex-wrap gap-1">
                  {state.customPermissions.map((cp, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center rounded bg-primary/10 px-2 py-0.5 text-xs"
                    >
                      {cp.resource}:{cp.action}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {selectedPerms.length === 0 &&
              state.customPermissions.length === 0 && (
                <div className="text-muted-foreground">
                  No permissions selected
                </div>
              )}
          </div>
        </div>
      </div>

      {/* Note */}
      <div className="rounded-lg bg-blue-50 p-4 text-sm">
        <p>
          An invitation email will be sent to{" "}
          <strong>{state.email}</strong> after you click "Send Invitation".
        </p>
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={previousStep}
          disabled={isSubmitting}
          className="rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
        >
          Back
        </button>
        <button
          type="button"
          onClick={onSubmit}
          disabled={isSubmitting}
          className="flex-1 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {isSubmitting ? "Sending..." : "Send Invitation"}
        </button>
      </div>
    </div>
  );
}
