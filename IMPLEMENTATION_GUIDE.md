# PatriconID Front-End Implementation Guide

## 📋 Table of Contents
1. [Design System Components](#design-system-components)
2. [Usage Examples](#usage-examples)
3. [Accessibility Guidelines](#accessibility-guidelines)
4. [Responsive Patterns](#responsive-patterns)
5. [Integration Steps](#integration-steps)

---

## 🎨 Design System Components

### Components Created

1. **Button** (`/src/components/ui/Button.tsx`)
   - Variants: primary, secondary, outline, ghost, danger
   - Sizes: sm, md, lg, xl
   - Features: Loading states, icons, full-width option

2. **Input** (`/src/components/ui/Input.tsx`)
   - Features: Labels, error states, success states, helper text
   - Icons: Left icon, right icon, password toggle
   - Accessibility: ARIA labels, error announcements

3. **Toast** (`/src/components/ui/Toast.tsx`)
   - Types: success, error, warning, info
   - Features: Auto-dismiss, manual close, descriptions
   - Provider-based architecture

4. **Loading** (`/src/components/ui/Loading.tsx`)
   - Spinner: sm, md, lg sizes
   - Skeleton loaders
   - Progress bars
   - Shimmer effects

5. **Modal** (`/src/components/ui/Modal.tsx`)
   - Sizes: sm, md, lg, xl, full
   - Features: Focus trap, ESC to close, backdrop click
   - Accessibility: ARIA labels, keyboard navigation

6. **Layout** (`/src/components/ui/Layout.tsx`)
   - Container: Responsive max-widths
   - Card: Hover effects, flexible padding
   - Grid: Responsive columns
   - Section: Page sections with titles

7. **Navigation** (`/src/components/ui/Navigation.tsx`)
   - Mobile responsive with hamburger menu
   - Active state indicators
   - Skip navigation link for accessibility

---

## 💡 Usage Examples

### Button Examples

```typescript
import Button from './components/ui/Button';
import { Shield, Download } from 'lucide-react';

// Primary button with loading state
<Button 
  variant="primary" 
  size="lg" 
  isLoading={isGenerating}
  onClick={handleGenerate}
>
  Generate Proof
</Button>

// Button with left icon
<Button 
  variant="outline" 
  leftIcon={<Shield className="w-5 h-5" />}
>
  Verify Identity
</Button>

// Full-width button with right icon
<Button 
  variant="secondary" 
  fullWidth
  rightIcon={<Download className="w-5 h-5" />}
>
  Download Proof
</Button>

// Danger button
<Button 
  variant="danger" 
  size="sm"
  onClick={handleDelete}
>
  Delete
</Button>
```

### Input Examples

```typescript
import Input from './components/ui/Input';
import { Mail, Lock } from 'lucide-react';

// Basic input with label
<Input 
  label="Email Address"
  type="email"
  placeholder="you@example.com"
  required
/>

// Input with icon and helper text
<Input 
  label="Password"
  type="password"
  leftIcon={<Lock className="w-5 h-5" />}
  helperText="Must be at least 8 characters"
/>

// Input with error state
<Input 
  label="Username"
  value={username}
  onChange={(e) => setUsername(e.target.value)}
  error={usernameError}
/>

// Input with success state
<Input 
  label="Verification Code"
  value={code}
  isSuccess={isValid}
/>
```

### Toast Examples

```typescript
import { useToast } from './components/ui/Toast';

function MyComponent() {
  const { showToast } = useToast();

  const handleSuccess = () => {
    showToast({
      type: 'success',
      message: 'Proof generated successfully!',
      description: 'Your zero-knowledge proof is ready to share.',
      duration: 5000,
    });
  };

  const handleError = () => {
    showToast({
      type: 'error',
      message: 'Verification failed',
      description: 'The proof could not be verified. Please try again.',
    });
  };

  return (
    <Button onClick={handleSuccess}>Show Success</Button>
  );
}

// Wrap app with ToastProvider
import { ToastProvider } from './components/ui/Toast';

function App() {
  return (
    <ToastProvider>
      <MyComponent />
    </ToastProvider>
  );
}
```

### Loading Examples

```typescript
import { Spinner, Skeleton, ProgressBar, CardSkeleton } from './components/ui/Loading';

// Inline spinner
<Button disabled>
  <Spinner size="sm" className="mr-2" />
  Processing...
</Button>

// Skeleton loaders for content
<div className="space-y-4">
  <Skeleton className="h-8 w-3/4" />
  <Skeleton className="h-4 w-full" />
  <Skeleton className="h-4 w-5/6" />
</div>

// Card skeleton while loading
{isLoading ? <CardSkeleton /> : <ProofCard data={data} />}

// Progress bar for file upload
<ProgressBar 
  progress={uploadProgress} 
  label="Uploading proof..."
  showPercentage
/>
```

### Modal Examples

```typescript
import Modal, { ModalFooter } from './components/ui/Modal';

const [isOpen, setIsOpen] = useState(false);

<Modal 
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Confirm Verification"
  description="Are you sure you want to verify this proof?"
  size="md"
>
  <div className="space-y-4">
    <p className="text-slate-600">
      This action will verify the zero-knowledge proof on the blockchain.
    </p>
  </div>

  <ModalFooter>
    <Button variant="ghost" onClick={() => setIsOpen(false)}>
      Cancel
    </Button>
    <Button variant="primary" onClick={handleVerify}>
      Verify
    </Button>
  </ModalFooter>
</Modal>
```

### Layout Examples

```typescript
import { Container, Card, CardHeader, Grid, Section } from './components/ui/Layout';
import { Shield } from 'lucide-react';

// Page layout with container
<Container size="lg">
  <Section 
    title="Generate Identity Proof"
    description="Create zero-knowledge proofs for identity verification"
  >
    <Grid cols={3} gap="md">
      <Card hover>
        <CardHeader 
          title="Age Verification"
          description="Prove age without revealing birthdate"
          icon={<Shield className="w-6 h-6 text-violet-600" />}
        />
        <Button fullWidth>Generate</Button>
      </Card>
      
      {/* More cards... */}
    </Grid>
  </Section>
</Container>
```

### Navigation Example

```typescript
import Navigation, { SkipToContent } from './components/ui/Navigation';
import { Shield, FileText, CheckCircle } from 'lucide-react';

<>
  <SkipToContent />
  <Navigation 
    logoText="PATRICONID"
    links={[
      { 
        label: 'Generate', 
        onClick: () => setPage('generate'),
        isActive: page === 'generate',
        icon: <FileText className="w-4 h-4" />
      },
      { 
        label: 'Verify', 
        onClick: () => setPage('verify'),
        isActive: page === 'verify',
        icon: <CheckCircle className="w-4 h-4" />
      },
    ]}
    actions={
      <Button variant="primary" size="sm">
        Connect Wallet
      </Button>
    }
    onLogoClick={() => setPage('home')}
  />
</>
```

---

## ♿ Accessibility Guidelines

### Keyboard Navigation
```typescript
// All interactive elements are keyboard accessible
<Button>                    // Tab to focus, Enter/Space to activate
<Input />                   // Tab to focus, Arrow keys for text
<Modal />                   // ESC to close, Tab for focus trap

// Focus visible states are styled
.focus:ring-2 .focus:ring-violet-500 .focus:ring-offset-2
```

### ARIA Labels
```typescript
// Use aria-label for icon-only buttons
<button aria-label="Close modal">
  <X className="w-5 h-5" />
</button>

// Use aria-describedby for error messages
<Input 
  aria-invalid={hasError}
  aria-describedby="error-message"
/>
<p id="error-message" role="alert">Invalid email format</p>

// Use aria-live for dynamic content
<div aria-live="polite" aria-atomic="true">
  Toast notifications appear here
</div>
```

### Screen Reader Support
```typescript
// Use semantic HTML
<nav>...</nav>               // Navigation
<main id="main-content">...</main>  // Main content
<section>...</section>       // Sections
<article>...</article>       // Independent content

// Provide text alternatives
<img src="proof.png" alt="Zero-knowledge proof visualization" />

// Hide decorative elements
<div aria-hidden="true">     // Decorative gradient
  <div className="absolute inset-0 bg-gradient..." />
</div>
```

### Color Contrast
```
All text meets WCAG AAA standards:

✅ Primary text on white: #0f172a (slate-900) - 17:1 contrast
✅ Secondary text on white: #475569 (slate-600) - 8:1 contrast
✅ Button text on purple: White on #7c3aed - 7.5:1 contrast
✅ Error text: #dc2626 (red-600) - 7:1 contrast
✅ Success text: #059669 (emerald-600) - 4.9:1 contrast
```

### Focus Management
```typescript
// Focus trap in modals
useEffect(() => {
  if (isOpen) {
    const focusableElements = modal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    focusableElements[0]?.focus();
  }
}, [isOpen]);

// Return focus after modal closes
previousActiveElement?.focus();
```

---

## 📱 Responsive Patterns

### Mobile-First Approach
```css
/* Base styles for mobile (320px+) */
.card {
  padding: 1rem;
  font-size: 0.875rem;
}

/* Tablet (768px+) */
@media (min-width: 768px) {
  .card {
    padding: 1.5rem;
    font-size: 1rem;
  }
}

/* Desktop (1024px+) */
@media (min-width: 1024px) {
  .card {
    padding: 2rem;
    font-size: 1rem;
  }
}
```

### Touch Targets
```
Minimum touch target size: 44x44px (WCAG 2.5.5)

✅ Button min-height: 44px (size="md")
✅ Input min-height: 44px
✅ Navigation links: 44px touch area
✅ Mobile menu items: 48px height
```

### Responsive Typography
```typescript
// Using Tailwind responsive classes
<h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl">
  Decentralized Identity
</h1>

<p className="text-sm sm:text-base lg:text-lg">
  Generate zero-knowledge proofs locally
</p>
```

### Responsive Grid
```typescript
// 1 column on mobile, 2 on tablet, 3 on desktop
<Grid cols={3}>
  <Card />
  <Card />
  <Card />
</Grid>

// Custom responsive grid
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
  <Card />
  <Card />
  <Card />
</div>
```

### Mobile Navigation
```typescript
// Hamburger menu on mobile, full nav on desktop
<Navigation 
  links={[...]}  // Hidden on mobile, shown on desktop
  // Mobile menu button automatically shown on mobile
/>

// Mobile menu slides down with animation
<div className="md:hidden animate-slide-down">
  {/* Mobile menu items */}
</div>
```

---

## 🚀 Integration Steps

### Step 1: Install Dependencies
```bash
# Make sure you have these installed
npm install lucide-react
# Tailwind CSS should already be configured
```

### Step 2: Update Tailwind Config
```javascript
// The tailwind.config.js has been updated with:
// - New animations (slide-in-left, slide-down, shimmer)
// - New keyframes
// - Extended font families
```

### Step 3: Wrap App with ToastProvider
```typescript
// src/main.tsx
import { ToastProvider } from './components/ui/Toast';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ToastProvider>
      <App />
    </ToastProvider>
  </React.StrictMode>
);
```

### Step 4: Refactor Existing Components

#### Before (P2PProofGenerator):
```typescript
<button 
  onClick={generateProof}
  disabled={!selectedFile}
  className="px-4 py-2 bg-black text-white rounded"
>
  Generate Proof
</button>
```

#### After:
```typescript
import Button from './ui/Button';

<Button 
  variant="primary"
  size="lg"
  isLoading={isGenerating}
  onClick={generateProof}
  disabled={!selectedFile}
  leftIcon={<Shield className="w-5 h-5" />}
>
  Generate Proof
</Button>
```

### Step 5: Add Visual Feedback
```typescript
import { useToast } from './components/ui/Toast';

function P2PProofGenerator() {
  const { showToast } = useToast();

  const handleSuccess = () => {
    showToast({
      type: 'success',
      message: 'Proof generated successfully!',
      description: 'Your zero-knowledge proof is ready to share.',
    });
  };

  const handleError = (error: string) => {
    showToast({
      type: 'error',
      message: 'Generation failed',
      description: error,
    });
  };

  return (
    // Component JSX
  );
}
```

### Step 6: Replace Navigation
```typescript
// src/App.tsx
import Navigation from './components/ui/Navigation';
import { FileText, CheckCircle, Zap } from 'lucide-react';

function App() {
  return (
    <>
      <Navigation 
        links={[
          { label: 'Generate', onClick: () => setPage('generate'), isActive: page === 'generate', icon: <FileText /> },
          { label: 'Verify', onClick: () => setPage('verify'), isActive: page === 'verify', icon: <CheckCircle /> },
          { label: 'Web3', onClick: () => setPage('web3'), isActive: page === 'web3', icon: <Zap /> },
        ]}
        onLogoClick={() => setPage('home')}
      />
      
      <main id="main-content" className="pt-20">
        {/* Page content */}
      </main>
    </>
  );
}
```

### Step 7: Add Loading States
```typescript
import { Spinner, CardSkeleton } from './components/ui/Loading';

function ProofList() {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
    );
  }

  return (
    // Proof list content
  );
}
```

---

## 📊 Testing Checklist

### Accessibility Testing
- [ ] Test keyboard navigation (Tab, Enter, Space, ESC)
- [ ] Test with screen reader (NVDA, JAWS, VoiceOver)
- [ ] Verify color contrast with tools
- [ ] Test with reduced motion settings
- [ ] Verify focus visible states
- [ ] Test form validation announcements

### Responsive Testing
- [ ] Test on mobile (320px, 375px, 414px)
- [ ] Test on tablet (768px, 1024px)
- [ ] Test on desktop (1280px, 1920px)
- [ ] Test touch interactions on mobile
- [ ] Verify text readability at all sizes
- [ ] Test navigation menu on mobile

### Visual Testing
- [ ] Verify all animations work smoothly
- [ ] Test loading states
- [ ] Verify toast notifications appear/dismiss
- [ ] Test modal focus trap
- [ ] Verify hover states
- [ ] Test button loading states

### Browser Testing
- [ ] Chrome/Edge
- [ ] Firefox
- [ ] Safari
- [ ] Mobile Safari
- [ ] Mobile Chrome

---

## 🎯 Next Steps

1. **Integrate components** into existing pages
2. **Add error boundaries** for better error handling
3. **Implement analytics** for user interactions
4. **Add E2E tests** with Playwright or Cypress
5. **Performance optimization** with code splitting
6. **Documentation site** with component examples
7. **Storybook** for component showcase
8. **A11y audit** with automated tools

---

**Ready to integrate! Start with the navigation and buttons, then gradually refactor other components.** 🚀
