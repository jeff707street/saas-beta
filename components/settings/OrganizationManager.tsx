"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, MailPlus, Shield, Trash2, UserCheck, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { CompanyRole } from "@/lib/tenant";
import type { OrganizationManagerData } from "@/app/actions/organization";

const assignableRoles: CompanyRole[] = ["admin", "manager", "operator", "viewer"];
const roleDescriptions: Record<CompanyRole, string> = {
  owner: "Full workspace ownership.",
  admin: "Manage users, settings, and operations.",
  manager: "Manage warehouse setup and operations.",
  operator: "Work with operational flows.",
  viewer: "Read-only access.",
};

type OrganizationManagerProps = {
  initialData: OrganizationManagerData | null;
  loadError?: string;
  inviteCompanyMemberAction: (email: string, role: CompanyRole) => Promise<OrganizationManagerData>;
  updateCompanyMemberRoleAction: (userId: string, role: CompanyRole) => Promise<OrganizationManagerData>;
  removeCompanyMemberAction: (userId: string) => Promise<OrganizationManagerData>;
  approveJoinRequestAction: (requestId: string, role: CompanyRole) => Promise<OrganizationManagerData>;
  rejectJoinRequestAction: (requestId: string) => Promise<OrganizationManagerData>;
};

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unable to complete this action. Please try again.";
}

export function OrganizationManager({
  initialData,
  loadError,
  inviteCompanyMemberAction,
  updateCompanyMemberRoleAction,
  removeCompanyMemberAction,
  approveJoinRequestAction,
  rejectJoinRequestAction,
}: OrganizationManagerProps) {
  const [data, setData] = useState(initialData);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<CompanyRole>("operator");
  const [requestRoles, setRequestRoles] = useState<Record<string, CompanyRole>>({});
  const [busyKey, setBusyKey] = useState("");
  const [error, setError] = useState(loadError ?? "");
  const [notice, setNotice] = useState("");

  async function runAction(key: string, action: () => Promise<OrganizationManagerData>, success: string) {
    setBusyKey(key);
    setError("");
    setNotice("");

    try {
      const nextData = await action();
      setData(nextData);
      setNotice(success);
      return true;
    } catch (actionError) {
      setError(getErrorMessage(actionError));
      return false;
    } finally {
      setBusyKey("");
    }
  }

  function inviteMember() {
    const email = inviteEmail.trim();

    if (!email) {
      setError("Enter an email address to invite.");
      return;
    }

    void runAction(
      "invite",
      () => inviteCompanyMemberAction(email, inviteRole),
      `Invitation sent to ${email}.`,
    ).then((ok) => {
      if (ok) {
        setInviteEmail("");
      }
    });
  }

  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Company Settings</CardTitle>
          <CardDescription>Manage company users, invitations, and join requests.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error || "Unable to load organization manager."}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="lg:col-span-2">
      <CardHeader className="flex-row items-start justify-between gap-4">
        <div>
          <CardTitle>Company Settings</CardTitle>
          <CardDescription>
            Manage users and access for {data.companyName}. Your role: {data.currentRole}.
          </CardDescription>
        </div>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100">
          <Shield className="h-5 w-5 text-slate-700" />
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {!data.canManage ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            You can view members, but only owners and admins can invite users or change roles.
          </div>
        ) : null}
        {!data.clerkOrganizationId ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            This workspace is not connected to a Clerk Organization yet. Create a company through onboarding to enable invites.
          </div>
        ) : null}
        {error ? <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}
        {notice ? (
          <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-700">
            <CheckCircle2 className="h-4 w-4" />
            {notice}
          </div>
        ) : null}

        <section className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-950">Invite User</h3>
              <p className="text-xs text-slate-500">Invitations are sent through Clerk.</p>
            </div>
          </div>
          <div className="grid gap-2 md:grid-cols-[1fr_150px_auto]">
            <Input value={inviteEmail} onChange={(event) => setInviteEmail(event.target.value)} placeholder="teammate@company.com" disabled={!data.canManage || !data.clerkOrganizationId} />
            <Select value={inviteRole} onValueChange={(value) => setInviteRole(value as CompanyRole)} disabled={!data.canManage || !data.clerkOrganizationId}>
              <SelectTrigger className="bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {assignableRoles.map((role) => (
                  <SelectItem key={role} value={role}>{role}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={inviteMember} disabled={!data.canManage || !data.clerkOrganizationId || busyKey === "invite"} className="bg-blue-600 hover:bg-blue-700">
              {busyKey === "invite" ? <Loader2 className="h-4 w-4 animate-spin" /> : <MailPlus className="h-4 w-4" />}
              Invite
            </Button>
          </div>
        </section>

        <section>
          <h3 className="mb-2 text-sm font-semibold text-slate-950">Members</h3>
          <div className="overflow-hidden rounded-xl border border-slate-200">
            {data.members.map((member) => (
              <div key={member.id} className="grid gap-3 border-b border-slate-100 bg-white p-3 last:border-b-0 md:grid-cols-[1fr_150px_auto] md:items-center">
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-slate-900">{member.name || member.email}</div>
                  <div className="truncate text-xs text-slate-500">{member.email}</div>
                </div>
                <div>
                  <Select
                    value={member.role}
                    onValueChange={(value) =>
                      runAction(
                        `role-${member.userId}`,
                        () => updateCompanyMemberRoleAction(member.userId, value as CompanyRole),
                        "Member role updated.",
                      )
                    }
                    disabled={!data.canManage || member.role === "owner" || busyKey === `role-${member.userId}`}
                  >
                    <SelectTrigger className="h-9 bg-slate-50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(member.role === "owner" ? (["owner", ...assignableRoles] as CompanyRole[]) : assignableRoles).map((role) => (
                        <SelectItem key={role} value={role}>{role}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="mt-1 text-[11px] text-slate-500">{roleDescriptions[member.role]}</div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    runAction(
                      `remove-${member.userId}`,
                      () => removeCompanyMemberAction(member.userId),
                      "Member removed.",
                    )
                  }
                  disabled={!data.canManage || member.role === "owner" || busyKey === `remove-${member.userId}`}
                >
                  {busyKey === `remove-${member.userId}` ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  Remove
                </Button>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <div>
            <h3 className="mb-2 text-sm font-semibold text-slate-950">Join Requests</h3>
            <div className="space-y-2">
              {data.joinRequests.length === 0 ? <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-500">No pending join requests.</div> : null}
              {data.joinRequests.map((request) => {
                const role = requestRoles[request.id] ?? "operator";
                return (
                  <div key={request.id} className="rounded-xl border border-slate-200 bg-white p-3">
                    <div className="text-sm font-semibold text-slate-900">{request.userName || request.email}</div>
                    <div className="text-xs text-slate-500">{request.email} · {request.domain}</div>
                    {request.message ? <div className="mt-2 rounded-lg bg-slate-50 p-2 text-xs text-slate-600">{request.message}</div> : null}
                    <div className="mt-3 grid gap-2 md:grid-cols-[1fr_auto_auto]">
                      <Select value={role} onValueChange={(value) => setRequestRoles((current) => ({ ...current, [request.id]: value as CompanyRole }))} disabled={!data.canManage}>
                        <SelectTrigger className="h-9 bg-slate-50">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {assignableRoles.map((item) => (
                            <SelectItem key={item} value={item}>{item}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700"
                        onClick={() =>
                          runAction(
                            `approve-${request.id}`,
                            () => approveJoinRequestAction(request.id, role),
                            "Join request approved.",
                          )
                        }
                        disabled={!data.canManage || busyKey === `approve-${request.id}`}
                      >
                        {busyKey === `approve-${request.id}` ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserCheck className="h-4 w-4" />}
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          runAction(
                            `reject-${request.id}`,
                            () => rejectJoinRequestAction(request.id),
                            "Join request rejected.",
                          )
                        }
                        disabled={!data.canManage || busyKey === `reject-${request.id}`}
                      >
                        <XCircle className="h-4 w-4" />
                        Reject
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <h3 className="mb-2 text-sm font-semibold text-slate-950">Pending Invitations</h3>
            <div className="space-y-2">
              {data.invitations.length === 0 ? <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-500">No pending invitations.</div> : null}
              {data.invitations.map((invitation) => (
                <div key={invitation.id} className="rounded-xl border border-slate-200 bg-white p-3">
                  <div className="text-sm font-semibold text-slate-900">{invitation.email}</div>
                  <div className="text-xs text-slate-500">{invitation.role} · {invitation.status}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </CardContent>
    </Card>
  );
}
