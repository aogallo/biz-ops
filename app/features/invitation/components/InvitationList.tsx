import { useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import type { InvitationRow } from "../types";
import { DataTable } from "~/components/dataTable/DataTable";

interface InvitationListProps {
  invitations: InvitationRow[];
}

export function InvitationList({ invitations }: InvitationListProps) {
  const columns = useMemo<ColumnDef<InvitationRow>[]>(
    () => [
      {
        accessorKey: "email",
        header: "Email",
        cell: ({ row }) => (
          <div className="font-medium">{row.getValue("email")}</div>
        ),
      },
      {
        accessorKey: "roleName",
        header: "Role",
        cell: ({ row }) => (
          <div>{row.getValue("roleName") || "No role assigned"}</div>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const status = row.getValue("status") as string;
          return (
            <span
              className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                status === "accepted"
                  ? "bg-green-100 text-green-800"
                  : status === "expired"
                    ? "bg-red-100 text-red-800"
                    : "bg-yellow-100 text-yellow-800"
              }`}
            >
              {status}
            </span>
          );
        },
      },
      {
        accessorKey: "inviterName",
        header: "Invited By",
        cell: ({ row }) => <div>{row.getValue("inviterName")}</div>,
      },
      {
        accessorKey: "createdAt",
        header: "Created",
        cell: ({ row }) => {
          const date = row.getValue("createdAt") as Date;
          return <div>{new Date(date).toLocaleDateString()}</div>;
        },
      },
      {
        accessorKey: "expiresAt",
        header: "Expires",
        cell: ({ row }) => {
          const date = row.getValue("expiresAt") as Date;
          const isExpired = new Date(date) < new Date();
          return (
            <div className={isExpired ? "text-destructive" : ""}>
              {new Date(date).toLocaleDateString()}
            </div>
          );
        },
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
          const status = row.getValue("status") as string;
          return (
            <div className="flex gap-2">
              {status === "pending" && (
                <>
                  <button className="text-sm text-primary hover:underline">
                    Resend
                  </button>
                  <button className="text-sm text-destructive hover:underline">
                    Cancel
                  </button>
                </>
              )}
            </div>
          );
        },
      },
    ],
    [],
  );

  if (invitations.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-12 text-center">
        <div className="mx-auto max-w-sm">
          <h3 className="text-lg font-semibold">No invitations yet</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Get started by inviting your first team member.
          </p>
        </div>
      </div>
    );
  }

  return <DataTable columns={columns} data={invitations} />;
}
