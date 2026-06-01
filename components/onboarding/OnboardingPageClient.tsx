"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useOrganizationList } from "@clerk/nextjs";
import { ArrowRight, Building2, CheckCircle2, Loader2, MailPlus, PlusCircle, Warehouse } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { OnboardingDomainMatch } from "@/app/actions/onboarding";

type OnboardingPageClientProps = {
  initialMatch: OnboardingDomainMatch;
  requestJoinCompanyAction: (companyId: string, message?: string) => Promise<{ id: string; companyName: string; status: string }>;
  createCompanyWorkspaceAction: (name: string) => Promise<{ companyId: string; clerkOrganizationId: string; companyName: string; requiresWarehouseSetup: boolean }>;
  createInitialWarehouseAction: (name: string, address?: string) => Promise<{ companyId: string; companyName: string; warehouseId: string; warehouseName: string }>;
};

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong. Please try again.";
}

export function OnboardingPageClient({
  initialMatch,
  requestJoinCompanyAction,
  createCompanyWorkspaceAction,
  createInitialWarehouseAction,
}: OnboardingPageClientProps) {
  const router = useRouter();
  const { isLoaded, setActive } = useOrganizationList();
  const [companyName, setCompanyName] = useState("");
  const [warehouseName, setWarehouseName] = useState("");
  const [warehouseAddress, setWarehouseAddress] = useState("");
  const [warehouseSetupCompany, setWarehouseSetupCompany] = useState(initialMatch.warehouseSetup ?? null);
  const [selectedCompanyId, setSelectedCompanyId] = useState(initialMatch.companies[0]?.id ?? "");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [isRequestingJoin, setIsRequestingJoin] = useState(false);
  const [isCreatingCompany, setIsCreatingCompany] = useState(false);
  const [isCreatingWarehouse, setIsCreatingWarehouse] = useState(false);
  const selectedCompany = useMemo(
    () => initialMatch.companies.find((company) => company.id === selectedCompanyId),
    [initialMatch.companies, selectedCompanyId],
  );
  const hasDomainMatches = initialMatch.companies.length > 0;
  const defaultCompanyName = initialMatch.domain ? initialMatch.domain.split(".")[0] : "";

  async function requestJoin() {
    if (!selectedCompanyId) {
      return;
    }

    setError("");
    setStatusMessage("");
    setIsRequestingJoin(true);

    try {
      const request = await requestJoinCompanyAction(selectedCompanyId, message);
      setStatusMessage(`Your request to join ${request.companyName} was sent.`);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setIsRequestingJoin(false);
    }
  }

  async function createCompany() {
    const name = companyName.trim() || defaultCompanyName;

    if (!name) {
      setError("Company name is required.");
      return;
    }

    setError("");
    setStatusMessage("");
    setIsCreatingCompany(true);

    try {
      const company = await createCompanyWorkspaceAction(name);

      if (isLoaded && setActive) {
        setWarehouseSetupCompany({
          companyId: company.companyId,
          clerkOrganizationId: company.clerkOrganizationId,
          companyName: company.companyName,
        });
        await setActive({ organization: company.clerkOrganizationId, redirectUrl: "/onboarding" });
        return;
      }

      setWarehouseSetupCompany({
        companyId: company.companyId,
        clerkOrganizationId: company.clerkOrganizationId,
        companyName: company.companyName,
      });
    } catch (createError) {
      setError(getErrorMessage(createError));
    } finally {
      setIsCreatingCompany(false);
    }
  }

  async function createInitialWarehouse() {
    const name = warehouseName.trim();

    if (!name) {
      setError("Warehouse name is required.");
      return;
    }

    setError("");
    setStatusMessage("");
    setIsCreatingWarehouse(true);

    try {
      await createInitialWarehouseAction(name, warehouseAddress);
      router.push("/dashboard");
      router.refresh();
    } catch (warehouseError) {
      setError(getErrorMessage(warehouseError));
    } finally {
      setIsCreatingWarehouse(false);
    }
  }

  if (warehouseSetupCompany) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-10">
        <div className="mx-auto max-w-2xl">
          <div className="mb-8">
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-white">
              <Warehouse className="h-5 w-5" />
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950">Create your first warehouse</h1>
            <p className="mt-2 text-sm text-slate-600">
              {warehouseSetupCompany.companyName} needs one warehouse before you can start using operations. Zones can be added later.
            </p>
          </div>

          {error ? <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}

          <Card>
            <CardHeader>
              <CardTitle>Warehouse setup</CardTitle>
              <CardDescription>Add the primary warehouse or stockroom for this company.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-slate-900">Warehouse name</label>
                <Input
                  className="mt-2"
                  value={warehouseName}
                  onChange={(event) => setWarehouseName(event.target.value)}
                  placeholder="Main Warehouse"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-900">Address</label>
                <Input
                  className="mt-2"
                  value={warehouseAddress}
                  onChange={(event) => setWarehouseAddress(event.target.value)}
                  placeholder="Optional"
                />
              </div>
              <Button className="w-full bg-blue-600 hover:bg-blue-700" onClick={createInitialWarehouse} disabled={!warehouseName.trim() || isCreatingWarehouse}>
                {isCreatingWarehouse ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                {isCreatingWarehouse ? "Creating..." : "Finish Setup"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-white">
            <Building2 className="h-5 w-5" />
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950">Set up your workspace</h1>
          <p className="mt-2 text-sm text-slate-600">
            Signed in as {initialMatch.email}. We use your email domain to find existing company workspaces.
          </p>
        </div>

        {error ? <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
        {statusMessage ? (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            <CheckCircle2 className="h-4 w-4" />
            {statusMessage}
          </div>
        ) : null}

        <div className="grid gap-4 lg:grid-cols-2">
          {hasDomainMatches ? (
            <Card>
              <CardHeader>
                <CardTitle>Join an existing company</CardTitle>
                <CardDescription>
                  We found {initialMatch.companies.length} workspace{initialMatch.companies.length === 1 ? "" : "s"} for {initialMatch.domain}.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  {initialMatch.companies.map((company) => (
                    <button
                      key={company.id}
                      type="button"
                      onClick={() => setSelectedCompanyId(company.id)}
                      className={`w-full rounded-xl border px-3 py-3 text-left text-sm transition ${
                        selectedCompanyId === company.id ? "border-blue-300 bg-blue-50 text-blue-900" : "border-slate-200 bg-white hover:bg-slate-50"
                      }`}
                    >
                      <div className="font-semibold">{company.name}</div>
                      <div className="mt-1 text-xs text-slate-500">{company.domain}</div>
                      {company.existingRequest ? <div className="mt-2 text-xs font-medium text-blue-700">Request status: {company.existingRequest.status}</div> : null}
                    </button>
                  ))}
                </div>
                <textarea
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  placeholder="Optional note for the admin"
                  className="min-h-20 w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                />
                <Button className="w-full bg-blue-600 hover:bg-blue-700" onClick={requestJoin} disabled={!selectedCompany || isRequestingJoin}>
                  {isRequestingJoin ? <Loader2 className="h-4 w-4 animate-spin" /> : <MailPlus className="h-4 w-4" />}
                  Request to Join
                </Button>
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle>{hasDomainMatches ? "Create a separate company" : "Create your company"}</CardTitle>
              <CardDescription>
                {initialMatch.isPublicDomain
                  ? "Public email domains cannot be matched to a company. Create a workspace manually."
                  : hasDomainMatches
                    ? "Use this if your business needs a separate workspace."
                    : `No workspace is associated with ${initialMatch.domain || "this email domain"}.`}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-slate-900">Company name</label>
                <Input className="mt-2" value={companyName} onChange={(event) => setCompanyName(event.target.value)} placeholder={defaultCompanyName || "Acme Inc"} />
              </div>
              <Button className="w-full bg-slate-900 hover:bg-slate-800" onClick={createCompany} disabled={isCreatingCompany}>
                {isCreatingCompany ? <Loader2 className="h-4 w-4 animate-spin" /> : hasDomainMatches ? <PlusCircle className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
                {isCreatingCompany ? "Creating..." : "Create Workspace"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
