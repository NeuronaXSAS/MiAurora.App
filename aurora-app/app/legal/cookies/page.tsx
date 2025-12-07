import { LegalViewer } from "@/components/legal/legal-viewer";

export const metadata = {
  title: "Cookie Policy - Aurora App",
  description: "Cookie Policy for Aurora App - Learn how we use cookies and similar technologies",
};

const cookiesContent = `# Cookie Policy

*Last updated: December 2024*

## Introduction

Aurora App ("we," "our," or "us") uses cookies and similar tracking technologies to provide, improve, and protect our services. This Cookie Policy explains what cookies are, how we use them, and your choices regarding their use.

## What Are Cookies?

Cookies are small text files that are stored on your device (computer, tablet, or mobile) when you visit a website or use an application. They help websites remember your preferences and understand how you interact with the service.

## Types of Cookies We Use

### Essential Cookies

These cookies are necessary for Aurora App to function properly. They enable core functionality such as:

- **Authentication**: Keeping you signed in securely
- **Security**: Protecting against fraud and unauthorized access
- **Session Management**: Remembering your preferences during a session
- **Load Balancing**: Ensuring the platform runs smoothly

*You cannot opt out of essential cookies as they are required for the service to work.*

### Functional Cookies

These cookies enhance your experience by remembering your choices:

- **Language Preferences**: Remembering your selected language
- **Theme Settings**: Storing your light/dark mode preference
- **Location Preferences**: Remembering your city or region settings
- **Accessibility Settings**: Storing your accessibility preferences

### Analytics Cookies

We use analytics cookies to understand how users interact with Aurora App:

- **Usage Patterns**: Which features are most popular
- **Performance Metrics**: Page load times and app responsiveness
- **Error Tracking**: Identifying and fixing technical issues
- **User Journey**: Understanding how users navigate the platform

We use privacy-focused analytics that do not track individual users across websites.

### Safety & Security Cookies

Given our focus on women's safety, we use specific cookies to:

- **Fraud Prevention**: Detecting suspicious activity
- **Trust Verification**: Supporting our user verification system
- **Emergency Features**: Ensuring panic button and safety features work reliably
- **Location Services**: Enabling safe route tracking (only when you opt in)

## Third-Party Cookies

We minimize the use of third-party cookies. When we do use them, it's for:

- **Authentication Providers**: Google and Microsoft sign-in (WorkOS)
- **Payment Processing**: Secure payment handling for premium features
- **Content Delivery**: Ensuring fast loading of images and media

We do not sell your data to advertisers or use tracking cookies for targeted advertising.

## Cookie Duration

- **Session Cookies**: Deleted when you close your browser
- **Persistent Cookies**: Remain for a set period (typically 30 days to 1 year)
- **Authentication Cookies**: Valid for your login session (up to 30 days)

## Your Cookie Choices

### Browser Settings

You can control cookies through your browser settings:

- **Chrome**: Settings → Privacy and Security → Cookies
- **Firefox**: Settings → Privacy & Security → Cookies
- **Safari**: Preferences → Privacy → Cookies
- **Edge**: Settings → Privacy → Cookies

### Our Cookie Consent

When you first visit Aurora App, you'll see a cookie consent banner where you can:

- Accept all cookies
- Accept only essential cookies
- Customize your preferences

You can change your preferences at any time in your account settings.

### Impact of Disabling Cookies

If you disable certain cookies:

- **Essential Cookies Disabled**: The app may not function properly
- **Functional Cookies Disabled**: Your preferences won't be saved
- **Analytics Cookies Disabled**: No impact on your experience

## Local Storage and Similar Technologies

In addition to cookies, we use:

- **Local Storage**: For offline functionality and caching
- **IndexedDB**: For storing data needed for offline safety features
- **Service Workers**: For push notifications and offline access

These technologies are essential for our safety-first features, including the offline panic button.

## Children's Privacy

Aurora App is designed for users 18 and older. We do not knowingly collect data from children under 18.

## Updates to This Policy

We may update this Cookie Policy periodically. We will notify you of significant changes through:

- In-app notifications
- Email (for registered users)
- A banner on our website

## Contact Us

If you have questions about our use of cookies, please contact us:

- **Email**: privacy@auroraapp.com
- **In-App**: Settings → Help → Contact Support

## Your Rights

Under GDPR and similar regulations, you have the right to:

- Access information about cookies we use
- Request deletion of your data
- Opt out of non-essential cookies
- Lodge a complaint with a supervisory authority

---

*Aurora App is committed to transparency and respecting your privacy choices. We use cookies responsibly to provide a safe, personalized experience for women worldwide.*
`;

export default function CookiesPage() {
  return <LegalViewer content={cookiesContent} title="Cookie Policy" lastUpdated="December 2024" />;
}
