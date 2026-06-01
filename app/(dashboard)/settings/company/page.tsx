import {
  approveJoinRequestAction,
  getOrganizationManagerDataAction,
  inviteCompanyMemberAction,
  rejectJoinRequestAction,
  removeCompanyMemberAction,
  updateCompanyMemberRoleAction,
  type OrganizationManagerData,
} from "@/app/actions/organization";
import { PageHeader } from "@/components/layout/page-header";
import { OrganizationManager } from "@/components/settings/OrganizationManager";

export const dynamic = "force-dynamic";

export default async function CompanySettingsPage() {
  let organizationManagerData: OrganizationManagerData | null = null;
  let organizationManagerError = "";

  try {
    organizationManagerData = await getOrganizationManagerDataAction();
  } catch (error) {
    console.error("Unable to load company settings", error);
    organizationManagerError = error instanceof Error ? error.message : "Unable to load company settings.";
  }

  return (
    <>
      <PageHeader title="Company Settings" description="Manage company users, roles, invitations, and access requests." />
      <div className="grid gap-4 lg:grid-cols-2">
        <OrganizationManager
          initialData={organizationManagerData}
          loadError={organizationManagerError}
          inviteCompanyMemberAction={inviteCompanyMemberAction}
          updateCompanyMemberRoleAction={updateCompanyMemberRoleAction}
          removeCompanyMemberAction={removeCompanyMemberAction}
          approveJoinRequestAction={approveJoinRequestAction}
          rejectJoinRequestAction={rejectJoinRequestAction}
        />
      </div>
    </>
  );
}
