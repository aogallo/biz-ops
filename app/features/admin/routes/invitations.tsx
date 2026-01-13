import { eq } from "drizzle-orm";
import { useSearchParams } from "react-router";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { getUserOrganizations } from "~/server/auth/organization.server";
import { requireAuth } from "~/server/auth/session.server";
import { db } from "~/server/db";
import {
  invitationModel,
  organizationModel,
  userModel,
} from "~/server/db/schemas/auth";
import { isSuperAdmin } from "~/server/permissions";
import type { Route } from "./+types/invitations";

export async function loader({ request }: Route.LoaderArgs) {
  const session = await requireAuth(request);
  const url = new URL(request.url);
  const organizationId = url.searchParams.get("organizationId");

  // Fetch all needed data in parallel
  const [isSuperAdminUser, organizations] = await Promise.all([
    isSuperAdmin(session.user.id),
    getUserOrganizations(session.user.id),
  ]);

  // Default to first org if none selected
  const selectedOrgId = organizationId || organizations[0]?.organization.id;

  // Fetch invitations for selected organization
  let invitations: any[] = [];
  if (selectedOrgId) {
    invitations = await db
      .select({
        id: invitationModel.id,
        email: invitationModel.email,
        role: invitationModel.role,
        status: invitationModel.status,
        expiresAt: invitationModel.expiresAt,
        createdAt: invitationModel.createdAt,
        organizationId: organizationModel.id,
        organizationName: organizationModel.name,
        inviterName: userModel.name,
        inviterEmail: userModel.email,
      })
      .from(invitationModel)
      .innerJoin(
        organizationModel,
        eq(organizationModel.id, invitationModel.organizationId),
      )
      .innerJoin(userModel, eq(userModel.id, invitationModel.inviterId))
      .where(eq(organizationModel.id, selectedOrgId))
      .orderBy(invitationModel.createdAt);
  }

  return {
    isSuperAdmin: isSuperAdminUser,
    organizations,
    invitations,
    selectedOrganizationId: selectedOrgId,
    user: session.user,
  };
}

export default function InvitationsPage({ loaderData }: Route.ComponentProps) {
  const { isSuperAdmin, organizations, invitations, selectedOrganizationId } =
    loaderData;
  const [searchParams, setSearchParams] = useSearchParams();

  // Show message if no organizations
  if (organizations.length === 0) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-4">No Organizations Found</h2>
          <p className="text-muted-foreground">
            You need to be a member of at least one organization to view
            invitations.
          </p>
        </div>
      </div>
    );
  }

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
              <CardDescription>View and track user invitations</CardDescription>
            </div>
            <Select
              value={selectedOrganizationId || ""}
              onValueChange={(id) => setSearchParams({ organizationId: id })}
            >
              <SelectTrigger className="w-75">
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
          {invitations.length === 0 ? (
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
                  const displayStatus =
                    expired && invitation.status === "pending"
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
                            displayStatus,
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
