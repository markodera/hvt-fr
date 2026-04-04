import { Link } from 'react-router-dom';

import { LegalDocumentLayout, LegalList, LegalSection } from '@/components/legal/LegalDocumentLayout';

const LAST_UPDATED = 'April 4, 2026';

export default function TermsOfServicePage() {
    return (
        <LegalDocumentLayout
            title="Terms of Service"
            updatedOn={LAST_UPDATED}
            summary="These Terms of Service govern access to and use of the managed HVT service at hvts.app. If you use HVT through a self-hosted deployment, additional terms from that deployment operator may apply."
        >
            <LegalSection title="Acceptance Of Terms">
                <p>
                    By accessing or using HVT, you agree to these Terms of Service. If you use HVT on behalf of a
                    company or organization, you represent that you have authority to bind that entity to these terms.
                </p>
            </LegalSection>

            <LegalSection title="Accounts And Eligibility">
                <p>
                    You are responsible for maintaining the confidentiality of your credentials and for activity that
                    occurs under your account. You must provide accurate information and keep it reasonably up to date.
                </p>
            </LegalSection>

            <LegalSection title="Permitted Use">
                <LegalList
                    items={[
                        'Use the service only in compliance with applicable law and these terms.',
                        'Do not attempt to gain unauthorized access to accounts, systems, tokens, keys, or data.',
                        'Do not interfere with or disrupt the integrity, security, or performance of the service.',
                        'Do not use the service to transmit malicious code, run abusive automation, or facilitate unlawful activity.',
                    ]}
                />
            </LegalSection>

            <LegalSection title="Open-Source License And Hosted Service">
                <p>
                    Portions of HVT may be available as open-source software under AGPL v3 or another applicable
                    license. Those licenses govern your use of the source code. These Terms of Service govern your use
                    of the hosted service and related operational infrastructure.
                </p>
            </LegalSection>

            <LegalSection title="Service Availability And Changes">
                <p>
                    HVT may change, suspend, or discontinue features at any time, including for maintenance, security,
                    legal compliance, or product updates. The service operator may impose reasonable usage limits or
                    technical restrictions to protect reliability and security.
                </p>
            </LegalSection>

            <LegalSection title="Suspension And Termination">
                <p>
                    Access may be suspended or terminated if these terms are violated, if the service is used in a way
                    that creates security or operational risk, or if continued access is no longer commercially or
                    legally feasible.
                </p>
            </LegalSection>

            <LegalSection title="Disclaimers">
                <p>
                    Except to the extent prohibited by law, the service is provided on an &quot;as is&quot; and
                    &quot;as available&quot; basis without warranties of any kind, whether express or implied,
                    including implied warranties of merchantability, fitness for a particular purpose, and
                    non-infringement.
                </p>
            </LegalSection>

            <LegalSection title="Limitation Of Liability">
                <p>
                    To the maximum extent permitted by law, the service operator will not be liable for indirect,
                    incidental, special, consequential, exemplary, or punitive damages, or for loss of profits,
                    revenues, data, goodwill, or business opportunities arising from or related to use of the service.
                </p>
            </LegalSection>

            <LegalSection title="Changes To These Terms">
                <p>
                    These terms may be updated from time to time. Continued use of the service after updated terms take
                    effect constitutes acceptance of the revised terms.
                </p>
            </LegalSection>

            <LegalSection title="Related Privacy Terms">
                <p>
                    Please also review the{' '}
                    <Link to="/privacy-policy" className="text-white transition-colors hover:text-[#a78bfa]">
                        Privacy Policy
                    </Link>
                    .
                </p>
            </LegalSection>
        </LegalDocumentLayout>
    );
}
