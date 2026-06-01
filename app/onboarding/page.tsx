import {
  createCompanyWorkspaceAction,
  createInitialWarehouseAction,
  getOnboardingDomainMatch,
  requestJoinCompanyAction,
} from "@/app/actions/onboarding";
import { OnboardingPageClient } from "@/components/onboarding/OnboardingPageClient";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const initialMatch = await getOnboardingDomainMatch();

  return (
    <OnboardingPageClient
      initialMatch={initialMatch}
      requestJoinCompanyAction={requestJoinCompanyAction}
      createCompanyWorkspaceAction={createCompanyWorkspaceAction}
      createInitialWarehouseAction={createInitialWarehouseAction}
    />
  );
}
