import type { WizardState } from "../../types";

interface UserInformationStepProps {
  state: WizardState;
  updateField: <K extends keyof WizardState>(
    field: K,
    value: WizardState[K],
  ) => void;
  nextStep: () => void;
}

export function UserInformationStep({
  state,
  updateField,
  nextStep,
}: UserInformationStepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">User Information</h2>
        <p className="text-sm text-muted-foreground">
          Enter the basic details for the user you want to invite
        </p>
      </div>

      <div>
        <label htmlFor="name" className="mb-2 block text-sm font-medium">
          Full Name
        </label>
        <input
          type="text"
          id="name"
          value={state.name}
          onChange={(e) => updateField("name", e.target.value)}
          placeholder="John Doe"
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        {state.errors.name && (
          <p className="mt-1 text-sm text-destructive">{state.errors.name}</p>
        )}
      </div>

      <div>
        <label htmlFor="email" className="mb-2 block text-sm font-medium">
          Email Address
        </label>
        <input
          type="email"
          id="email"
          value={state.email}
          onChange={(e) => updateField("email", e.target.value)}
          placeholder="john@example.com"
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        {state.errors.email && (
          <p className="mt-1 text-sm text-destructive">{state.errors.email}</p>
        )}
        <p className="mt-1 text-xs text-muted-foreground">
          An invitation will be sent to this email address
        </p>
      </div>

      <button
        type="button"
        onClick={nextStep}
        className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
      >
        Continue to Role Selection
      </button>
    </div>
  );
}
