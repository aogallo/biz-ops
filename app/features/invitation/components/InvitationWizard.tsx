import { useState } from "react";
import { useInvitationWizard } from "../hooks/useInvitationWizard";
import { UserInformationStep } from "./steps/UserInformationStep";
import { RoleAssignmentStep } from "./steps/RoleAssignmentStep";
import { PermissionsStep } from "./steps/PermissionsStep";
import { ReviewStep } from "./steps/ReviewStep";
import type { RoleData, PermissionData } from "../types";

interface InvitationWizardProps {
  roles: RoleData[];
  permissions: PermissionData[];
  onSubmit: (data: {
    email: string;
    name: string;
    roleId: string | null;
    createNewRole: boolean;
    newRoleName: string;
    newRoleDescription: string;
    selectedPermissions: string[];
    customPermissions: Array<{ resource: string; action: string }>;
  }) => Promise<void>;
}

export function InvitationWizard({
  roles,
  permissions,
  onSubmit,
}: InvitationWizardProps) {
  const {
    state,
    updateField,
    nextStep,
    previousStep,
    goToStep,
    togglePermission,
    selectAllPermissionsForResource,
    addCustomPermission,
    removeCustomPermission,
  } = useInvitationWizard();

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onSubmit({
        email: state.email,
        name: state.name,
        roleId: state.roleId,
        createNewRole: state.createNewRole,
        newRoleName: state.newRoleName,
        newRoleDescription: state.newRoleDescription,
        selectedPermissions: state.selectedPermissions,
        customPermissions: state.customPermissions,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      {/* Progress Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {[1, 2, 3, 4].map((step) => (
            <div key={step} className="flex flex-1 items-center">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full border-2 ${
                  state.currentStep === step
                    ? "border-primary bg-primary text-primary-foreground"
                    : state.currentStep > step
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-muted-foreground/30 text-muted-foreground"
                }`}
              >
                {state.currentStep > step ? (
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : (
                  <span className="text-sm font-medium">{step}</span>
                )}
              </div>
              {step < 4 && (
                <div
                  className={`mx-2 h-0.5 flex-1 ${
                    state.currentStep > step
                      ? "bg-primary"
                      : "bg-muted-foreground/30"
                  }`}
                />
              )}
            </div>
          ))}
        </div>
        <div className="mt-2 flex justify-between text-xs text-muted-foreground">
          <span>User Info</span>
          <span>Role</span>
          <span>Permissions</span>
          <span>Review</span>
        </div>
      </div>

      {/* Step Content */}
      <div className="rounded-lg border bg-card p-6">
        {state.currentStep === 1 && (
          <UserInformationStep
            state={state}
            updateField={updateField}
            nextStep={nextStep}
          />
        )}

        {state.currentStep === 2 && (
          <RoleAssignmentStep
            state={state}
            roles={roles}
            updateField={updateField}
            nextStep={nextStep}
            previousStep={previousStep}
          />
        )}

        {state.currentStep === 3 && (
          <PermissionsStep
            state={state}
            permissions={permissions}
            togglePermission={togglePermission}
            selectAllPermissionsForResource={selectAllPermissionsForResource}
            addCustomPermission={addCustomPermission}
            removeCustomPermission={removeCustomPermission}
            nextStep={nextStep}
            previousStep={previousStep}
          />
        )}

        {state.currentStep === 4 && (
          <ReviewStep
            state={state}
            roles={roles}
            permissions={permissions}
            previousStep={previousStep}
            goToStep={goToStep}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
          />
        )}
      </div>
    </div>
  );
}
