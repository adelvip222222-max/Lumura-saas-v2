import type { Metadata } from "next";
import Link from "next/link";
import { getCustomersAction } from "@/actions/customers";
import { PageHeader } from "@/components/admin/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Customers" };
export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{ search?: string; page?: string }>;
}

export default async function CustomersPage({ searchParams }: Props) {
  const params = await searchParams;

  const result = await getCustomersAction({
    search: params.search,
    page: params.page ? Number(params.page) : 1,
    limit: 20,
  });

  const customers = result.data?.data ?? [];
  const pagination = result.data?.pagination;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customers"
        description={`${pagination?.total ?? 0} registered customers`}
      />

      {/* Search */}
      <form method="GET" className="flex gap-2">
        <input
          name="search"
          defaultValue={params.search}
          placeholder="Search by name or email..."
          className="flex h-10 w-full max-w-sm rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <Button type="submit" variant="outline">Search</Button>
        {params.search && (
          <Button >
            <Link href="/admin/customers">Clear</Link>
          </Button>
        )}
      </form>

      {/* Table */}
      <div className="rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Customer</th>
                <th className="px-4 py-3 text-left font-medium">Email</th>
                <th className="px-4 py-3 text-left font-medium">Phone</th>
                <th className="px-4 py-3 text-left font-medium">Joined</th>
                <th className="px-4 py-3 text-left font-medium">Last Login</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {customers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                    No customers found
                  </td>
                </tr>
              ) : (
                customers.map((customer) => (
                  <tr key={customer._id} className="hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                          {customer.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium">{customer.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{customer.email}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {customer.phone ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDate(customer.createdAt, { month: "short", day: "numeric", year: "numeric" })}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {customer.lastLogin
                        ? formatDate(customer.lastLogin, { month: "short", day: "numeric" })
                        : "Never"}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={customer.isActive ? "success" : "secondary"}>
                        {customer.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {pagination.page} of {pagination.totalPages} · {pagination.total} customers
          </p>
          <div className="flex gap-2">
            {pagination.hasPrev && (
              <Button >
                <Link href={`/admin/customers?page=${pagination.page - 1}${params.search ? `&search=${params.search}` : ""}`}>
                  Previous
                </Link>
              </Button>
            )}
            {pagination.hasNext && (
              <Button>
                <Link href={`/admin/customers?page=${pagination.page + 1}${params.search ? `&search=${params.search}` : ""}`}>
                  Next
                </Link>
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
