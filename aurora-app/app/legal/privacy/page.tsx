import { LegalViewer } from "@/components/legal/legal-viewer";

export const metadata = {
  title: "Privacy Policy - Aurora",
  description: "Privacy Policy and Data Protection Information for Aurora - Women's Safety Platform",
};

const privacyContent = `# Privacy Policy

*Last updated: December 2024*

## Introduction

Aurora ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application and web platform (the "Service").

## Information We Collect

### Personal Information

We collect information you provide directly to us, such as:

- **Account Information**: Name, email address, profile picture
- **Profile Data**: Location preferences, safety interests, bio information
- **Communication Data**: Messages, posts, comments, and other content you create
- **Verification Data**: Information used to verify your identity and build trust scores

### Location Information

- **Precise Location**: GPS coordinates when you use route tracking or safety features
- **Approximate Location**: City/region for safety recommendations and community features
- **Route Data**: Paths you've traveled and marked as safe or unsafe

### Usage Information

- **App Usage**: Features used, time spent, interaction patterns
- **Device Information**: Device type, operating system, unique identifiers
- **Log Data**: IP address, browser type, access times, pages viewed

### Content and Communications

- **User Content**: Posts, photos, videos, comments, reviews, and safety reports
- **Messages**: Direct messages and communications with other users
- **Voice Data**: Voice recordings for safety features (with explicit consent)

## How We Use Your Information

### Core Service Functionality

- Provide and maintain the Aurora platform
- Create and manage your account
- Enable communication with other users
- Process safety reports and route sharing
- Provide location-based safety recommendations

### Safety and Security

- Verify user identities and prevent fraud
- Monitor for suspicious or harmful activity
- Respond to emergency situations and safety reports
- Improve our safety algorithms and recommendations

### Personalization and Improvement

- Customize your experience and recommendations
- Analyze usage patterns to improve our services
- Develop new features and functionality
- Conduct research and analytics

### Communication

- Send you service-related notifications
- Respond to your inquiries and support requests
- Send marketing communications (with your consent)
- Provide important updates about our services

## Information Sharing and Disclosure

### With Other Users

- **Public Content**: Posts, comments, and safety reports you choose to make public
- **Profile Information**: Basic profile data visible to other verified users
- **Route Data**: Routes you choose to share with the community

### With Service Providers

- **Technology Partners**: Cloud hosting, analytics, and communication services
- **Payment Processors**: For premium features and transactions
- **Security Services**: For fraud prevention and safety monitoring

### For Legal and Safety Reasons

- **Legal Compliance**: When required by law or legal process
- **Safety Protection**: To protect users from harm or illegal activity
- **Emergency Situations**: To respond to immediate safety threats
- **Rights Protection**: To protect our rights, property, and safety

### Business Transfers

In connection with any merger, acquisition, or sale of assets, your information may be transferred as part of that transaction.

## Data Security

### Security Measures

- **Encryption**: Data encrypted in transit and at rest
- **Access Controls**: Strict access controls and authentication
- **Regular Audits**: Security assessments and vulnerability testing
- **Incident Response**: Procedures for handling security incidents

### Your Responsibilities

- Keep your account credentials secure
- Report suspicious activity immediately
- Use strong, unique passwords
- Keep your app updated

## Your Privacy Rights

### Access and Control

- **Access**: Request copies of your personal information
- **Correction**: Update or correct inaccurate information
- **Deletion**: Request deletion of your account and data
- **Portability**: Export your data in a portable format

### Communication Preferences

- **Marketing Opt-out**: Unsubscribe from marketing communications
- **Notification Settings**: Control app notifications and alerts
- **Privacy Settings**: Adjust who can see your information and activity

### Location Privacy

- **Location Sharing**: Control when and how location is shared
- **Route Privacy**: Choose which routes to keep private or share
- **Emergency Override**: Location may be shared in emergency situations

## Cookies and Tracking

### Types of Cookies

- **Essential Cookies**: Required for basic functionality
- **Analytics Cookies**: Help us understand usage patterns
- **Preference Cookies**: Remember your settings and preferences
- **Marketing Cookies**: Deliver relevant advertisements

### Your Choices

- **Browser Settings**: Control cookies through browser settings
- **Opt-out Tools**: Use industry opt-out tools for advertising
- **App Settings**: Manage tracking preferences in the app

## International Data Transfers

Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place for international transfers.

## Children's Privacy

Our service is not intended for children under 13. We do not knowingly collect personal information from children under 13.

## Changes to This Policy

We may update this Privacy Policy from time to time. We will notify you of any material changes by:

- Posting the updated policy on our platform
- Sending you an email notification
- Displaying a prominent notice in the app

## Applicable Laws

Aurora App complies with the following data protection regulations:

- **GDPR** (General Data Protection Regulation) - European Union
- **CCPA** (California Consumer Privacy Act) - California, USA
- **Law 1581 of 2012** (Habeas Data) - Colombia
- **LGPD** (Lei Geral de Proteção de Dados) - Brazil

## Contact Us

If you have questions about this Privacy Policy or our privacy practices, please contact us:

- **Email**: hello@miaurora.app
- **Support**: Available through the app's Help section

## Your Rights

You have the right to:

- Access your personal data
- Correct inaccurate data
- Delete your data ("right to be forgotten")
- Export your data in a portable format
- Withdraw consent at any time
- Lodge a complaint with a supervisory authority

---

*This Privacy Policy is effective as of December 2024 and was last updated on November 2024.*
`;

export default function PrivacyPage() {
  return (
    <LegalViewer
      content={privacyContent}
      title="Privacy Policy"
      lastUpdated="December 2024"
    />
  );
}
