import { useState } from "react";
import type { WizardState, CustomPermission } from "../types";

const initialState: WizardState = {
  email: "",
  name: "",
  roleId: null,
  createNewRole: false,
  newRoleName: "",
  newRoleDescription: "",
  selectedPermissions: [],
  customPermissions: [],
  currentStep: 1,
  errors: {},
};

export function useInvitationWizard() {
  const [state, setState] = useState<WizardState>(initialState);

  const updateField = <K extends keyof WizardState>(
    field: K,
    value: WizardState[K],
  ) => {
    setState((prev) => ({ ...prev, [field]: value, errors: {} }));
  };

  const goToStep = (step: 1 | 2 | 3 | 4) => {
    setState((prev) => ({ ...prev, currentStep: step }));
  };

  const validateStep = (step: number): boolean => {
    const errors: Record<string, string> = {};

    if (step === 1) {
      if (!state.email) {
        errors.email = "Email is required";
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(state.email)) {
        errors.email = "Invalid email format";
      }
      if (!state.name) {
        errors.name = "Name is required";
      }
    }

    if (step === 2) {
      if (!state.roleId && !state.createNewRole) {
        errors.role = "Select a role or create a new one";
      }
      if (state.createNewRole && !state.newRoleName) {
        errors.newRoleName = "Role name is required";
      }
    }

    if (step === 3) {
      // Permissions are optional, so no validation needed
    }

    setState((prev) => ({ ...prev, errors }));
    return Object.keys(errors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(state.currentStep)) {
      setState((prev) => ({
        ...prev,
        currentStep: (prev.currentStep + 1) as 1 | 2 | 3 | 4,
      }));
    }
  };

  const previousStep = () => {
    setState((prev) => ({
      ...prev,
      currentStep: (prev.currentStep - 1) as 1 | 2 | 3 | 4,
    }));
  };

  const addCustomPermission = (permission: CustomPermission) => {
    setState((prev) => ({
      ...prev,
      customPermissions: [...prev.customPermissions, permission],
    }));
  };

  const removeCustomPermission = (index: number) => {
    setState((prev) => ({
      ...prev,
      customPermissions: prev.customPermissions.filter((_, i) => i !== index),
    }));
  };

  const togglePermission = (permissionId: string) => {
    setState((prev) => {
      const selected = prev.selectedPermissions.includes(permissionId);
      return {
        ...prev,
        selectedPermissions: selected
          ? prev.selectedPermissions.filter((id) => id !== permissionId)
          : [...prev.selectedPermissions, permissionId],
      };
    });
  };

  const selectAllPermissionsForResource = (
    permissionIds: string[],
    selected: boolean,
  ) => {
    setState((prev) => {
      if (selected) {
        // Add all permissions
        const newSelected = new Set([
          ...prev.selectedPermissions,
          ...permissionIds,
        ]);
        return {
          ...prev,
          selectedPermissions: Array.from(newSelected),
        };
      } else {
        // Remove all permissions
        return {
          ...prev,
          selectedPermissions: prev.selectedPermissions.filter(
            (id) => !permissionIds.includes(id),
          ),
        };
      }
    });
  };

  const reset = () => {
    setState(initialState);
  };

  return {
    state,
    updateField,
    nextStep,
    previousStep,
    goToStep,
    validateStep,
    togglePermission,
    selectAllPermissionsForResource,
    addCustomPermission,
    removeCustomPermission,
    reset,
  };
}
