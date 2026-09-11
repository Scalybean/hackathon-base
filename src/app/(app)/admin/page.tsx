/**
 * Admin-only page. Two independent locks: requireAdmin() renders a 404 for a
 * non-admin, and the profiles_select_admin RLS policy is what actually allows
 * the cross-user read. Remove either and the other still holds.
 */
import { Users } from 'lucide-react';

import { PageHeader } from '@/components/app/page-header';
import { Badge } from '@/components/ui/badge';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { TBody, TD, TH, THead, TR, Table } from '@/components/ui/table';
import { requireAdmin } from '@/lib/auth/require-user';

export const metadata = { title: 'Admin' };

export default async function AdminPage() {
  const { supabase } = await requireAdmin();

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, display_name, role, created_at')
    .order('created_at', { ascending: true })
    .limit(200);

  const rows = profiles ?? [];

  return (
    <>
      <PageHeader
        title="Admin"
        description="Everyone with an account."
      />

      <Card>
        <CardHeader className="flex items-center justify-between">
          <CardTitle>Accounts</CardTitle>
          <Badge tone="accent">{rows.length} total</Badge>
        </CardHeader>
        <CardBody className="p-0">
          {rows.length === 0 ? (
            <div className="p-5">
              <EmptyState icon={Users} title="No accounts yet" />
            </div>
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH>Display name</TH>
                  <TH>Role</TH>
                  <TH>Joined</TH>
                </TR>
              </THead>
              <TBody>
                {rows.map((row) => (
                  <TR key={row.id}>
                    <TD className="font-medium">{row.display_name}</TD>
                    <TD>
                      <Badge tone={row.role === 'admin' ? 'accent' : 'neutral'}>{row.role}</Badge>
                    </TD>
                    <TD className="text-fg-muted">
                      {new Date(row.created_at).toLocaleDateString(undefined, {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          )}
        </CardBody>
      </Card>
    </>
  );
}
