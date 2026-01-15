import type { WizardState, RoleData } from "../../types";

interface RoleAssignmentStepProps {
  state: WizardState;
  roles: RoleData[];
  updateField: <K extends keyof WizardState>(
    field: K,
    value: WizardState[K],
  ) => void;
  nextStep: () => void;
  previousStep: () => void;
}

export function RoleAssignmentStep({
  state,
  roles,
  updateField,
  nextStep,
  previousStep,
}: RoleAssignmentStepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Role Assignment</h2>
        <p className="text-sm text-muted-foreground">
          Assign or create role for this user
        </p>
      </div>

      {/* Existing Roles */}
      <div>
        <label className="mb-3 block text-sm font-medium">
          Select Existing Role
        </label>
        <div className="space-y-3">
          {roles.map((role) => (
            <label
              key={role.id}
              className="flex cursor-pointer items-start gap-3 rounded-lg border p-4 hover:bg-muted/50"
            >
              <input
                type="radio"
                name="roleSelection"
                checked={state.roleId === role.id && !state.createNewRole}
                onChange={() => {
                  updateField("roleId", role.id);
                  updateField("createNewRole", false);
                }}
                className="mt-1"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <div className="font-medium">{role.name}</div>
                  {role.isSystem && (
                    <span className="rounded bg-blue-100 px-2 py-0.5 text-xs text-blue-800">
                      System
                    </span>
                  )}
                </div>
                {role.description && (
                  <div className="text-sm text-muted-foreground">
                    {role.description}
                  </div>
                )}
              </div>
            </label>
          ))}
        </div>
        {state.errors.role && (
          <p className="mt-2 text-sm text-destructive">{state.errors.role}</p>
        )}
      </div>

      {/* Create Custom Role */}
      <div className="border-t pt-6">
        <label className="flex cursor-pointer items-center gap-3">
          <input
            type="radio"
            name="roleSelection"
            checked={state.createNewRole}
            onChange={() => {
              updateField("createNewRole", true);
              updateField("roleId", null);
            }}
          />
          <span className="font-medium">Create Custom Role</span>
        </label>

        {state.createNewRole && (
          <div className="ml-7 mt-4 space-y-4">
            <div>
              <label
                htmlFor="roleName"
                className="mb-2 block text-sm font-medium"
              >
                Role Name
              </label>
              <input
                type="text"
                id="roleName"
                value={state.newRoleName}
                onChange={(e) => updateField("newRoleName", e.target.value)}
                placeholder="e.g., Sales Manager"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              {state.errors.newRoleName && (
                <p className="mt-1 text-sm text-destructive">
                  {state.errors.newRoleName}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="roleDescription"
                className="mb-2 block text-sm font-medium"
              >
                Description (Optional)
              </label>
              <textarea
                id="roleDescription"
                value={state.newRoleDescription}
                onChange={(e) =>
                  updateField("newRoleDescription", e.target.value)
                }
                placeholder="What does this role do?"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                rows={3}
              />
            </div>
          </div>
        )}
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
          Continue to Permissions
        </button>
      </div>
    </div>
  );
}
