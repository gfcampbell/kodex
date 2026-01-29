# Common Topics Taxonomy

Kodex uses this taxonomy to automatically generate relevant documentation when it detects matching patterns in your codebase.

## How It Works

1. **Detection:** Scanner looks for code patterns (routes, components, strings)
2. **Matching:** Patterns map to topics in this taxonomy
3. **Generation:** LLM generates user-facing docs for matched topics

---

## Topic Categories

### authentication

Code that involves user identity, login, and access control.

| Topic | Detection Patterns | Generated Doc |
|-------|-------------------|---------------|
| `login-logout` | `/login`, `/logout`, `signIn`, `signOut`, `LoginForm` | How to sign in and out |
| `password-reset` | `/forgot-password`, `/reset-password`, `PasswordReset`, `forgotPassword` | How to reset your password |
| `signup-registration` | `/signup`, `/register`, `SignupForm`, `createAccount` | How to create an account |
| `two-factor-auth` | `/2fa`, `TwoFactor`, `MFASetup`, `authenticator`, `totp` | Setting up two-factor authentication |
| `session-management` | `session`, `logout-all`, `activeDevices` | Managing your active sessions |
| `permissions-roles` | `role`, `permission`, `access`, `admin`, `member` | Understanding permissions and roles |
| `sso-integration` | `/sso`, `saml`, `oauth`, `SingleSignOn` | Single sign-on setup |

---

### navigation

Code that helps users find their way around the product.

| Topic | Detection Patterns | Generated Doc |
|-------|-------------------|---------------|
| `getting-started` | `/onboarding`, `/welcome`, `/getting-started`, `OnboardingFlow` | Getting started guide |
| `finding-features` | `Search`, `CommandPalette`, `QuickActions`, `/search` | How to find features |
| `keyboard-shortcuts` | `useHotkeys`, `shortcuts`, `keyBinding`, `cmd+` | Keyboard shortcuts |
| `mobile-desktop` | `isMobile`, `useMediaQuery`, `responsive` | Mobile vs desktop differences |
| `breadcrumbs` | `Breadcrumb`, `breadcrumbs`, `navigation-path` | Navigating with breadcrumbs |

---

### data

Code that handles user content and information.

| Topic | Detection Patterns | Generated Doc |
|-------|-------------------|---------------|
| `creating-content` | `CreateForm`, `NewItem`, `/new`, `handleCreate` | Creating new content |
| `editing-content` | `EditForm`, `/edit`, `handleUpdate`, `updateItem` | Editing existing content |
| `saving-autosave` | `autosave`, `draft`, `unsavedChanges`, `saveDebounce` | How saving works |
| `import-export` | `/import`, `/export`, `importData`, `exportCSV`, `download` | Importing and exporting data |
| `search` | `SearchInput`, `searchQuery`, `/search`, `useSearch` | Using search |
| `filtering-sorting` | `FilterPanel`, `SortDropdown`, `filterBy`, `orderBy` | Filtering and sorting |
| `bulk-actions` | `bulkSelect`, `selectAll`, `bulkDelete`, `batchUpdate` | Bulk actions |
| `delete-restore` | `handleDelete`, `softDelete`, `trash`, `restore` | Deleting and restoring content |

---

### settings

Code that lets users customize their experience.

| Topic | Detection Patterns | Generated Doc |
|-------|-------------------|---------------|
| `profile-management` | `/profile`, `/account`, `ProfileForm`, `updateProfile` | Managing your profile |
| `notifications` | `/notifications`, `NotificationSettings`, `emailPrefs`, `pushNotif` | Notification settings |
| `privacy` | `/privacy`, `PrivacySettings`, `dataSharing`, `visibility` | Privacy settings |
| `language-locale` | `language`, `locale`, `i18n`, `LanguageSelector` | Language and region |
| `theme-appearance` | `theme`, `darkMode`, `ThemeToggle`, `appearance` | Theme and appearance |
| `connected-accounts` | `connectedAccounts`, `linkAccount`, `socialLogin` | Connected accounts |

---

### errors

Code that handles problems and edge cases.

| Topic | Detection Patterns | Generated Doc |
|-------|-------------------|---------------|
| `common-errors` | `ErrorBoundary`, `error-page`, `handleError`, `catch` | Common error messages |
| `connection-issues` | `offline`, `networkError`, `reconnect`, `connectionLost` | Connection problems |
| `browser-compatibility` | `browserCheck`, `unsupportedBrowser`, `chromeOnly` | Browser compatibility |
| `permission-denied` | `403`, `forbidden`, `accessDenied`, `unauthorized` | Permission errors |
| `not-found` | `404`, `NotFound`, `pageNotFound` | Page not found |
| `rate-limiting` | `429`, `rateLimited`, `tooManyRequests`, `retry` | Rate limit errors |

---

### billing

Code that handles payments and subscriptions.

| Topic | Detection Patterns | Generated Doc |
|-------|-------------------|---------------|
| `subscription` | `/subscription`, `/plans`, `PricingTable`, `subscribeTo` | Managing your subscription |
| `payment-methods` | `/payment-methods`, `addCard`, `PaymentForm`, `stripe` | Payment methods |
| `invoices` | `/invoices`, `/billing-history`, `Invoice`, `receipt` | Viewing invoices |
| `cancellation` | `cancelSubscription`, `/cancel`, `downgrade` | Canceling your subscription |
| `trial` | `freeTrial`, `trialEnds`, `trialDays` | Free trial information |
| `usage-limits` | `usageLimit`, `quota`, `planLimit`, `upgrade` | Usage limits |

---

### integrations

Code that connects to external services.

| Topic | Detection Patterns | Generated Doc |
|-------|-------------------|---------------|
| `third-party` | `integration`, `connect`, `/integrations`, `OAuthCallback` | Connecting integrations |
| `api-access` | `/api-keys`, `ApiKeyForm`, `generateToken`, `apiToken` | API access |
| `webhooks` | `/webhooks`, `WebhookConfig`, `webhookUrl`, `webhookSecret` | Setting up webhooks |
| `sso` | `/sso`, `samlConfig`, `oidcSetup` | SSO configuration |
| `import-from` | `importFrom`, `connectTo`, `syncFrom` | Importing from other services |

---

### collaboration

Code that enables teamwork.

| Topic | Detection Patterns | Generated Doc |
|-------|-------------------|---------------|
| `inviting-members` | `inviteMember`, `/invite`, `InviteForm`, `teamInvite` | Inviting team members |
| `sharing` | `ShareModal`, `shareWith`, `shareLink`, `publicLink` | Sharing content |
| `comments` | `CommentThread`, `addComment`, `mentions`, `@` | Comments and mentions |
| `real-time` | `presence`, `liveEdit`, `collaboration`, `cursor` | Real-time collaboration |
| `permissions` | `memberRole`, `accessLevel`, `canEdit`, `canView` | Team permissions |

---

## Adding Custom Topics

In your `kodex.config.yaml`:

```yaml
docs:
  customTopics:
    - id: "inventory.stock-alerts"
      name: "Stock Alerts"
      patterns:
        - "stockAlert"
        - "lowInventory"
        - "/inventory/alerts"
      prompt: |
        Generate help documentation for stock alerts and inventory notifications.
        Explain how users can set up alerts for low stock levels.
      
    - id: "reporting.custom-reports"
      name: "Custom Reports"
      patterns:
        - "ReportBuilder"
        - "/reports/custom"
        - "createReport"
      prompt: |
        Generate help for the custom report builder.
        Include how to select data, add filters, and export results.
```

---

## Topic Detection Examples

### Example 1: Login Page Detected

**Found in code:**
```typescript
// src/pages/login.tsx
export default function LoginPage() {
  const { signIn } = useAuth();
  return <LoginForm onSubmit={signIn} />;
}
```

**Matched topics:**
- `authentication.login-logout`

**Generated doc:** "How to Sign In"

---

### Example 2: Settings Page Detected

**Found in code:**
```typescript
// src/pages/settings/index.tsx
<Tabs>
  <Tab label="Profile"><ProfileForm /></Tab>
  <Tab label="Notifications"><NotificationSettings /></Tab>
  <Tab label="Security"><PasswordChange /><TwoFactorSetup /></Tab>
</Tabs>
```

**Matched topics:**
- `settings.profile-management`
- `settings.notifications`
- `authentication.password-reset` (from PasswordChange)
- `authentication.two-factor-auth` (from TwoFactorSetup)

**Generated docs:**
- "Managing Your Profile"
- "Notification Settings"
- "Changing Your Password"
- "Setting Up Two-Factor Authentication"

---

## Confidence Scoring

Each detected topic gets a confidence score:

| Score | Meaning |
|-------|---------|
| 0.9+ | Strong match (exact pattern in route/component name) |
| 0.7-0.9 | Good match (pattern in code, clear context) |
| 0.5-0.7 | Possible match (pattern found but context unclear) |
| <0.5 | Weak match (only partial pattern) |

Docs with confidence < 0.7 are generated but flagged for review.
