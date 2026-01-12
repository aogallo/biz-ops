import { useState, useEffect } from "react";
import { Link } from "react-router";
import type { Route } from "./+types/users";
import { requireAuth } from "~/server/auth/session.server";
import { getUserOrganizations } from "~/server/auth/organization.server";
import { isSuperAdmin } from "~/server/permissions";
import { db } from "~/server/db";
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
  const isSuperAdminUser = await isSuperAdmin(db, session.user.id);

  // Get user's organizations
  const organizations = await getUserOrganizations(session.user.id);

  console.log("Loader: getUserOrganizations returned", organizations.length, "organizations");
  console.log("Organizations:", organizations.map(o => o.organization.name));

  return {
    isSuperAdmin: isSuperAdminUser,
    organizations,
    user: session.user,
  };
}

export default function UsersPage({ loaderData }: Route.ComponentProps) {
  const { isSuperAdmin, organizations } = loaderData;

  console.log("Component: Received organizations:", organizations);
  console.log("Component: Organizations length:", organizations?.length);
  console.log("Component: Organizations type:", typeof organizations);
  console.log("Component: Is array?", Array.isArray(organizations));

  const [selectedOrgId, setSelectedOrgId] = useState<string>(
    organizations.length > 0 ? organizations[0].organization.id : ""
  );
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

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

  // Fetch users when organization changes
  useEffect(() => {
    if (!selectedOrgId) return;

    const fetchUsers = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ organizationId: selectedOrgId });
        const response = await fetch(`/api/users/list?${params}`);
        const data = await response.json() as { success?: boolean; users?: any[]; error?: string };

        if (data.success && data.users) {
          setUsers(data.users);
        } else {
          console.error("Failed to fetch users:", data.error);
        }
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [selectedOrgId]);

  return (
    <div className="container mx-auto py-6 space-y-6">
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
              <CardDescription>
                View and manage user accounts
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
              Loading users...
            </div>
          ) : users.length === 0 ? (
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
