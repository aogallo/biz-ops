import { Link, useSearchParams } from "react-router";
import { Button } from "~/components/ui/button";
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
import { requireAuth } from "~/server/auth/session.server";
import type { Route } from "./+types/index";
import { businessPartnersRepository } from "../server/repository";
import type { PartnerType } from "../schemas";

export async function loader({ request }: Route.LoaderArgs) {
  const session = await requireAuth(request);
  const url = new URL(request.url);
  const typeFilter = url.searchParams.get("type") as PartnerType | null;

  const organizationId = session.session.activeOrganizationId;
  if (!organizationId) {
    return {
      partners: [],
      noOrganization: true,
      selectedType: typeFilter,
    };
  }

  const partners = await businessPartnersRepository.getAllByOrganization(
    organizationId,
    typeFilter || undefined
  );

  return {
    partners,
    noOrganization: false,
    selectedType: typeFilter,
  };
}

export default function BusinessPartnersIndex({
  loaderData,
}: Route.ComponentProps) {
  const { partners, noOrganization, selectedType } = loaderData;
  const [searchParams, setSearchParams] = useSearchParams();

  if (noOrganization) {
    return (
      <div className="p-6">
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="mb-4 text-muted-foreground">
            Please select an organization to view business partners.
          </p>
          <Link to="/organization">
            <Button>Select Organization</Button>
          </Link>
        </div>
      </div>
    );
  }

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case "client":
        return "bg-blue-100 text-blue-700";
      case "vendor":
        return "bg-green-100 text-green-700";
      case "both":
        return "bg-purple-100 text-purple-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Business Partners</h1>
          <p className="text-muted-foreground">
            Manage your clients and vendors
          </p>
        </div>
        <Link to="/business-partners/new">
          <Button>Add Partner</Button>
        </Link>
      </div>

      <div className="mb-4 flex items-center gap-4">
        <Select
          value={selectedType || "all"}
          onValueChange={(value) => {
            if (value === "all") {
              searchParams.delete("type");
              setSearchParams(searchParams);
            } else {
              setSearchParams({ type: value });
            }
          }}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Partners</SelectItem>
            <SelectItem value="client">Clients Only</SelectItem>
            <SelectItem value="vendor">Vendors Only</SelectItem>
            <SelectItem value="both">Both</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-sm text-muted-foreground">
          Showing {partners.length} partner{partners.length !== 1 ? "s" : ""}
        </p>
      </div>

      {partners.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="mb-4 text-muted-foreground">
            {selectedType
              ? `No ${selectedType} partners found.`
              : "No business partners found. Add your first partner to get started."}
          </p>
          <Link to="/business-partners/new">
            <Button>Add Partner</Button>
          </Link>
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Created</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {partners.map((partner) => (
                <TableRow key={partner.id}>
                  <TableCell className="font-medium">{partner.name}</TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getTypeBadgeColor(
                        partner.type
                      )}`}
                    >
                      {partner.type === "both"
                        ? "Client & Vendor"
                        : partner.type.charAt(0).toUpperCase() +
                          partner.type.slice(1)}
                    </span>
                  </TableCell>
                  <TableCell>
                    {partner.email ? (
                      <a
                        href={`mailto:${partner.email}`}
                        className="text-primary hover:underline"
                      >
                        {partner.email}
                      </a>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {new Date(partner.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Link
                      to={`/business-partners/${partner.id}`}
                      className="text-sm font-medium text-primary hover:underline"
                    >
                      View →
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
