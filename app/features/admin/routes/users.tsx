import { eq } from "drizzle-orm";
import { Link, useSearchParams } from "react-router";
import { Button } from "~/components/ui/button";
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
  memberModel,
  organizationModel,
  roleModel,
  userModel,
} from "~/server/db/schemas/auth";
import { isSuperAdmin } from "~/server/permissions";
import type { Route } from "./+types/users";

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

  // Fetch users for selected organization
  let users: any[] = [];
  if (selectedOrgId) {
    users = await db
      .select({
        id: userModel.id,
        name: userModel.name,
        email: userModel.email,
        emailVerified: userModel.emailVerified,
        createdAt: userModel.createdAt,
        organizationName: organizationModel.name,
        memberRole: memberModel.role,
        roleName: roleModel.name,
      })
      .from(userModel)
      .innerJoin(memberModel, eq(memberModel.userId, userModel.id))
      .innerJoin(
        organizationModel,
        eq(organizationModel.id, memberModel.organizationId),
      )
      .leftJoin(roleModel, eq(roleModel.id, memberModel.roleId))
      .where(eq(organizationModel.id, selectedOrgId))
      .orderBy(userModel.createdAt);
  }

  return {
    isSuperAdmin: isSuperAdminUser,
    organizations,
    users,
    selectedOrganizationId: selectedOrgId,
    user: session.user,
  };
}

export default function UsersPage({ loaderData }: Route.ComponentProps) {
  const { isSuperAdmin, organizations, users, selectedOrganizationId } =
    loaderData;
  const [searchParams, setSearchParams] = useSearchParams();

  // Show message if no organizations
  if (organizations.length === 0) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-4">No Organizations Found</h2>
          <p className="text-muted-foreground mb-6">
            You need to be a member of at least one organization to view users.
          </p>
          {isSuperAdmin && (
            <Link to="/admin/organizations/create">
              <Button>Create Organization</Button>
            </Link>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground">
            {isSuperAdmin
              ? "Manage users across all organizations"
              : "Manage users in your organization"}
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/admin/users/create">
            <Button>Create User</Button>
          </Link>
          <Link to="/admin/users/bulk-create">
            <Button variant="outline">Bulk Create</Button>
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Users</CardTitle>
              <CardDescription>View and manage user accounts</CardDescription>
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
          {users.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No users found in this organization
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Verified</TableHead>
                  <TableHead>Organization</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                        {user.roleName || user.memberRole}
                      </span>
                    </TableCell>
                    <TableCell>
                      {user.emailVerified ? (
                        <span className="text-green-600">✓ Verified</span>
                      ) : (
                        <span className="text-amber-600">Pending</span>
                      )}
                    </TableCell>
                    <TableCell>{user.organizationName}</TableCell>
                    <TableCell>
                      {new Date(user.createdAt).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
