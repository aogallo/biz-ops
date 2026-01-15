import { createContext, useContext } from "react";
import type {
  Organization,
  OrganizationMember,
} from "~/server/auth/organization.server";
import type { SessionData } from "~/server/auth/session.server";

interface AuthContextType {
  session: SessionData;
  organization?: {
    data: Organization;
    membership: OrganizationMember;
  };
  permissions: {
    list: string[];
    isSuperAdmin: boolean;
  };
  availableOrganizations?: Array<{
    id: string;
    name: string;
    slug: string;
    isAdmin?: boolean;
  }>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({
  children,
  value,
}: {
  children: React.ReactNode;
  value: AuthContextType;
}) {
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}

export function useOptionalAuth() {
  return useContext(AuthContext);
}

export function useUser() {
  const { session } = useAuth();
  return session.user;
}

export function useOrganization() {
  const { organization } = useAuth();
  if (!organization) {
    throw new Error("useOrganization called outside organization context");
  }
  return organization;
}

export function useOptionalOrganization() {
  const { organization } = useAuth();
  return organization;
}
