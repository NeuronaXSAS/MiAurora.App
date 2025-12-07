import { LegalViewer } from "@/components/legal/legal-viewer";

export const metadata = {
  title: "Community Guidelines - Aurora App",
  description: "Community Guidelines for Aurora App - Creating a safe, supportive space for women",
};

const communityContent = `# Community Guidelines

*Last updated: December 2024*

## Our Mission

Aurora App is a safe, supportive community built by women, for women. These guidelines help us maintain a space where every woman can feel protected, empowered, and connected.

## Core Values

### 1. Safety First 🛡️

Safety is our top priority. We take all safety concerns seriously.

- **Report suspicious behavior** immediately
- **Never share personal information** publicly (address, workplace, daily routines)
- **Trust your instincts** — if something feels wrong, report it
- **Use safety features** like check-ins and trusted contacts

### 2. Respect & Kindness 💜

Treat every member with dignity and respect.

- **Be supportive** — we're all navigating life's challenges together
- **Listen actively** — everyone's experience is valid
- **Disagree respectfully** — healthy debate is welcome, personal attacks are not
- **Celebrate diversity** — women of all backgrounds belong here

### 3. Authenticity & Trust ✨

Build genuine connections based on honesty.

- **Be yourself** — authentic connections are the strongest
- **Share truthfully** — misinformation harms our community
- **Verify information** before sharing safety alerts
- **Protect privacy** — yours and others'

## What's Not Allowed

### Zero Tolerance

The following will result in immediate account suspension:

- **Harassment or bullying** of any kind
- **Hate speech** based on race, religion, sexuality, disability, or any identity
- **Threats of violence** or encouraging self-harm
- **Sharing others' private information** (doxxing)
- **Impersonation** of other users or organizations
- **Sexual content or solicitation**
- **Spam or commercial exploitation**
- **Fake safety reports** that waste community resources

### Content Restrictions

- **No graphic violence** or disturbing imagery
- **No promotion of illegal activities**
- **No multi-level marketing** or pyramid schemes
- **No unsolicited promotions** or advertising
- **No misinformation** about health, safety, or emergencies

## Safety Features Guidelines

### Panic Button 🚨

- Use only in genuine emergencies
- False alarms waste resources and erode trust
- Test mode is available for practice

### Safety Reports

- Be accurate and specific
- Include relevant details (time, location, description)
- Don't exaggerate or fabricate incidents
- Update reports if situations change

### Safe Routes

- Share routes you've personally verified
- Update ratings if conditions change
- Report dangerous areas promptly
- Respect others' route privacy

### Support Circles

- Keep circle discussions confidential
- Support members without judgment
- Report concerning behavior to moderators
- Respect circle rules set by admins

## Workplace Reports

When reporting workplace issues:

- **Be factual** — stick to what happened
- **Protect identities** — use anonymous mode when needed
- **Provide context** — help others understand the situation
- **Update if resolved** — let the community know positive outcomes

## Earning & Using Credits

Our credit system rewards positive contributions:

### Earn Credits By
- Completing daily check-ins
- Sharing verified safety information
- Helping other community members
- Contributing to discussions
- Reporting accurate safety concerns

### Don't
- Game the system with fake activity
- Buy or sell credits outside the platform
- Create multiple accounts for credits
- Spam content for credit rewards

## Moderation

### How We Moderate

- **AI-assisted detection** of harmful content
- **Community reporting** — you help us stay safe
- **Human review** of flagged content
- **Transparent appeals** process

### Reporting Content

If you see something concerning:

1. Tap the report button (⚠️)
2. Select the reason
3. Add details if helpful
4. Submit — we'll review within 24 hours

### Appeals

If your content is removed or account restricted:

1. Review the notification explaining why
2. Submit an appeal through Settings → Help
3. Provide context or clarification
4. Wait for human review (usually 48-72 hours)

## Privacy in Community

### What to Share

- General experiences and advice
- Safety tips and recommendations
- Support and encouragement
- Professional insights (anonymously if preferred)

### What Not to Share

- Exact home or work addresses
- Daily schedules or routines
- Financial information
- Photos that reveal sensitive locations
- Other people's private information

## Mental Health Support

Aurora App cares about your wellbeing:

- **We're not a crisis service** — if you're in immediate danger, contact emergency services
- **Support resources** are available in the app
- **Community support** is for peer connection, not professional therapy
- **Take breaks** when needed — your mental health matters

## Changes to Guidelines

We may update these guidelines as our community grows. We'll notify you of significant changes through:

- In-app announcements
- Email notifications
- Community posts

## Contact Us

Questions about these guidelines?

- **In-App**: Settings → Help → Contact Support
- **Email**: community@auroraapp.com

---

*Together, we're building a safer world for women. Thank you for being part of Aurora App. 💜*
`;

export default function CommunityGuidelinesPage() {
  return <LegalViewer content={communityContent} title="Community Guidelines" lastUpdated="December 2024" />;
}
