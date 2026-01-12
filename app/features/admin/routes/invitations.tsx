import { useState, useEffect } from "react";
import type { Route } from "./+types/invitations";
import { requireAuth } from "~/server/auth/session.server";
import { getUserOrganizations } from "~/server/auth/organization.server";
import { isSuperAdmin } from "~/server/permissions";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";

export async function loader({ request }: Route.LoaderArgs) {
  const session = await requireAuth(request);

  // Check if user is super admin
  const { db: dbInstance } = await import("~/server/db");
  const isSuperAdminUser = await isSuperAdmin(dbInstance, session.user.id);

  // Get user's organizations
  const organizations = await getUserOrganizations(session.user.id);

  return {
    isSuperAdmin: isSuperAdminUser,
    organizations,
    user: session.user,
  };
}

export default function InvitationsPage({ loaderData }: Route.ComponentProps) {
  const { isSuperAdmin, organizations } = loaderData;
  const [selectedOrgId, setSelectedOrgId] = useState<string>(
    organizations.length > 0 ? organizations[0].organization.id : ""
  );
  const [invitations, setInvitations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Show message if no organizations
  if (organizations.length === 0) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-4">No Organizations Found</h2>
          <p className="text-muted-foreground">
            You need to be a member of at least one organization to view invitations.
          </p>
        </div>
      </div>
    );
  }

  // Fetch invitations when organization changes
  useEffect(() => {
    if (!selectedOrgId) return;

    const fetchInvitations = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ organizationId: selectedOrgId });
        const response = await fetch(`/api/invitations/list?${params}`);
        const data = await response.json() as { success?: boolean; invitations?: any[]; error?: string };

        if (data.success && data.invitations) {
          setInvitations(data.invitations);
        } else {
          console.error("Failed to fetch invitations:", data.error);
        }
      } catch (error) {
        console.error("Error fetching invitations:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchInvitations();
  }, [selectedOrgId]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-amber-100 text-amber-800";
      case "accepted":
        return "bg-green-100 text-green-800";
      case "expired":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const isExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date();
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Invitation Management</h1>
          <p className="text-muted-foreground">
            {isSuperAdmin
              ? "Manage invitations across all organizations"
              : "Manage invitations in your organization"}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Invitations</CardTitle>
              <CardDescription>
                View and track user invitations
              </CardDescription>
            </div>
            <Select value={selectedOrgId} onValueChange={setSelectedOrgId}>
              <SelectTrigger className="w-[300px]">
                <SelectValue placeholder="Select organization" />
              </SelectTrigger>
              <SelectContent>
                {organizations.map((org) => (
                  <SelectItem
                    key={org.organization.id}
                    value={org.organization.id}
                  >
                    {org.organization.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading invitations...
            </div>
          ) : invitations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No invitations found in this organization
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Organization</TableHead>
                  <TableHead>Invited By</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invitations.map((invitation) => {
                  const expired = isExpired(invitation.expiresAt);
                  const displayStatus = expired && invitation.status === "pending"
                    ? "expired"
                    : invitation.status;

                  return (
                    <TableRow key={invitation.id}>
                      <TableCell className="font-medium">
                        {invitation.email}
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                          {invitation.role}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${getStatusColor(
                            displayStatus
                          )}`}
                        >
                          {displayStatus}
                        </span>
                      </TableCell>
                      <TableCell>{invitation.organizationName}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {invitation.inviterName}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {invitation.inviterEmail}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span
                          className={expired ? "text-red-600 font-medium" : ""}
                        >
                          {new Date(invitation.expiresAt).toLocaleDateString()}
                        </span>
                      </TableCell>
                      <TableCell>
                        {new Date(invitation.createdAt).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
