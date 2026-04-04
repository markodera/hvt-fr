import { Link } from 'react-router-dom';

import { LegalDocumentLayout, LegalList, LegalSection } from '@/components/legal/LegalDocumentLayout';

const LAST_UPDATED = 'April 4, 2026';

export default function PrivacyPolicyPage() {
    return (
        <LegalDocumentLayout
            title="Privacy Policy"
            updatedOn={LAST_UPDATED}
            summary="This Privacy Policy explains how HVT collects, uses, stores, and discloses information when you use the managed service at hvts.app. If you use a self-hosted deployment, the operator of that deployment is responsible for its privacy practices."
        >
            <LegalSection title="Information We Collect">
                <p>
                    We collect information you provide directly when you create an account, join an organization,
                    configure a project, or contact the service operator. This may include your name, email address,
                    organization details, and credentials or authentication-related inputs.
                </p>
                <p>
                    We also collect service-generated information needed to operate HVT, including login activity,
                    audit logs, API key metadata, project configuration, webhook delivery data, browser and device
                    metadata, IP address, and security telemetry.
                </p>
            </LegalSection>

            <LegalSection title="How We Use Information">
                <LegalList
                    items={[
                        'Provide account access, authentication, organization management, and project-scoped runtime features.',
                        'Secure the service, detect abuse, investigate incidents, and enforce access controls.',
                        'Operate audit logging, webhook delivery, password reset, email verification, and social sign-in flows.',
                        'Maintain, improve, debug, and monitor the reliability and performance of the service.',
                        'Comply with legal obligations and protect the rights, safety, and security of users and the service operator.',
                    ]}
                />
            </LegalSection>

            <LegalSection title="Cookies And Similar Technologies">
                <p>
                    HVT uses cookies and similar browser storage mechanisms to maintain authenticated sessions, protect
                    against CSRF, remember in-progress auth state, and support normal application security and
                    usability.
                </p>
            </LegalSection>

            <LegalSection title="How Information May Be Shared">
                <p>
                    Information may be shared with infrastructure, email, analytics, monitoring, and other service
                    providers only to the extent reasonably necessary to operate HVT. Information may also be disclosed
                    when required by law, to enforce service rules, or to prevent fraud, abuse, or security threats.
                </p>
            </LegalSection>

            <LegalSection title="Data Retention">
                <p>
                    We retain information for as long as needed to provide the service, maintain security records,
                    resolve disputes, comply with legal obligations, and support legitimate operational needs. Retention
                    periods may vary based on the type of data and the sensitivity of the relevant event history.
                </p>
            </LegalSection>

            <LegalSection title="Security">
                <p>
                    HVT applies reasonable administrative, technical, and organizational safeguards designed to protect
                    personal information. No method of transmission or storage is completely secure, and the service
                    cannot guarantee absolute security.
                </p>
            </LegalSection>

            <LegalSection title="Your Choices">
                <p>
                    You may be able to access, update, or delete certain account information from within the product or
                    by working with your organization administrator. If you use a self-hosted deployment, requests about
                    your information should be directed to the operator of that deployment.
                </p>
            </LegalSection>

            <LegalSection title="Changes To This Policy">
                <p>
                    This Privacy Policy may be updated from time to time. Material changes will apply when posted on
                    this page unless a different effective date is stated.
                </p>
            </LegalSection>

            <LegalSection title="Related Terms">
                <p>
                    Use of the service is also governed by the{' '}
                    <Link to="/terms-of-service" className="text-white transition-colors hover:text-[#a78bfa]">
                        Terms of Service
                    </Link>
                    .
                </p>
            </LegalSection>
        </LegalDocumentLayout>
    );
}
