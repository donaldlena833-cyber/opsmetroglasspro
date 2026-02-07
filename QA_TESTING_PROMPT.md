# MetroGlassOps - Comprehensive QA Testing & Enhancement Prompt

## Context

You are evaluating **MetroGlassOps**, a mobile-first Progressive Web App (PWA) built for MetroGlass Pro Inc, a custom shower glass installation business serving NYC, NJ, and CT. This is an internal operations system designed for exactly 2 users (Donald and Ledion) to manage their entire workflow from job estimates through completion, including expense tracking, payment recording, invoice generation, and client management.

## Tech Stack
- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, Radix UI
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **PDF Generation**: jsPDF
- **AI**: Google Gemini Flash API (for receipt extraction - currently not fully integrated)
- **Deployment Target**: Vercel with custom domain ops.metroglasspro.com

## Brand Guidelines
- **Primary Color**: Navy `#1B2B5A`
- **Accent Color**: Orange `#F5A623`
- **Background**: Cream `#F7F1E6`
- **Design Philosophy**: Modern, premium, clean - NOT generic SaaS feel

---

## PART 1: FEATURE TESTING CHECKLIST

Test each feature thoroughly and score on a scale of 1-10 (10 = perfect, production-ready).

### 1. Authentication (Score: __/10)
- [ ] Login page loads with MetroGlass Pro branding
- [ ] Email/password login works correctly
- [ ] Show/hide password toggle functions
- [ ] Invalid credentials show error toast
- [ ] Successful login redirects to /today dashboard
- [ ] Session persists on page refresh
- [ ] Logout from Settings works
- [ ] Unauthorized access redirects to login
- [ ] Protected routes are properly guarded

**Notes:**
```
[Your observations here]
```

### 2. Today Dashboard (Score: __/10)
- [ ] Personalized greeting with time-of-day logic (Good morning/afternoon/evening)
- [ ] Current date displayed correctly
- [ ] Monthly revenue, expenses, net profit cards show accurate data
- [ ] Net profit shows green (positive) or red (negative) appropriately
- [ ] Reminders section displays with priority colors (red=high, orange=moderate, green=low)
- [ ] Mark reminder as done works (checkmark button)
- [ ] Overdue reminders show "Overdue" label in red
- [ ] Jobs needing attention section displays correctly
- [ ] Attention messages are accurate (waiting for deposit, need to order glass, collect final payment)
- [ ] Clicking job card navigates to job detail
- [ ] Upcoming installs section shows next 7 days
- [ ] Spending breakdown shows category icons and progress bars
- [ ] All animations are smooth

**Notes:**
```
[Your observations here]
```

### 3. Jobs - List View (Score: __/10)
- [ ] Jobs list loads with all jobs
- [ ] Search by job name works
- [ ] Search by client name works
- [ ] Search by address works
- [ ] Filter tabs work: All, Active, Closed, Archived
- [ ] Job cards show: name, status badge, address, client, install date
- [ ] Status badges have appropriate colors
- [ ] Clicking job navigates to detail page
- [ ] Long-press/right-click reveals delete option
- [ ] Delete confirmation dialog appears
- [ ] Delete actually removes job
- [ ] Floating "+" button navigates to new job
- [ ] Empty state shows when no jobs match filter/search

**Notes:**
```
[Your observations here]
```

### 4. Jobs - Create New (Score: __/10)
- [ ] Form loads correctly
- [ ] Job Name field (required) validates
- [ ] Address field (required) validates
- [ ] Area field (optional, free text)
- [ ] Status dropdown shows all options
- [ ] Install date picker works
- [ ] Install end date picker works
- [ ] Notes textarea works
- [ ] Client search shows autocomplete dropdown
- [ ] Selecting existing client fills info
- [ ] "Create new client" option appears when typing non-existing name
- [ ] New client form expands with name/email/phone/address fields
- [ ] Submit creates job and redirects to job detail
- [ ] Back button works

**Notes:**
```
[Your observations here]
```

### 5. Jobs - Detail View (Score: __/10)
- [ ] Header shows job name and status badge
- [ ] Address displayed with map pin icon
- [ ] Client name is clickable (navigates to client detail)
- [ ] Install date(s) displayed
- [ ] Net profit card shows Revenue, Costs, Net
- [ ] Tabs work: Overview, Costs, Payments, Invoices

**Overview Tab:**
- [ ] Status dropdown changes status immediately
- [ ] Install date fields are editable
- [ ] Notes field is editable
- [ ] "Save Changes" persists updates

**Costs Tab:**
- [ ] Shows total expenses
- [ ] "Add Cost" button works
- [ ] Expense cards show: receipt image (or category icon), vendor, category, date, amount
- [ ] **MISSING: Delete expense functionality** ⚠️

**Payments Tab:**
- [ ] Shows total revenue
- [ ] "Add Payment" button works
- [ ] Payment cards show: type, method, invoice link (if any), date, amount
- [ ] **MISSING: Delete payment functionality** ⚠️

**Invoices Tab:**
- [ ] Shows invoice count
- [ ] "Create Invoice" button works
- [ ] Invoice cards show: number, status badge, date, total
- [ ] Clicking invoice navigates to invoice detail

- [ ] Delete job button works with confirmation

**Notes:**
```
[Your observations here]
```

### 6. Add Expense - Standard Form (Score: __/10)
- [ ] Receipt image upload works
- [ ] Image preview shows with remove button
- [ ] Job search/selection works
- [ ] "General expense (no job)" option works
- [ ] Amount field (required) validates
- [ ] Vendor field (required) validates
- [ ] Category dropdown shows all options with icons
- [ ] Payment method dropdown shows all options
- [ ] Date picker defaults to today
- [ ] Notes field is optional
- [ ] Submit saves expense
- [ ] Redirects appropriately (to job or to today)

**Notes:**
```
[Your observations here]
```

### 7. Quick Expense - Camera First (Score: __/10)
- [ ] Camera opens automatically on page load
- [ ] Capture button works
- [ ] Image uploads successfully
- [ ] **AI EXTRACTION**: Does Gemini Flash extract receipt data? (amount, vendor, date, category)
  - [ ] If YES: Fields pre-populate correctly
  - [ ] If NO: Manual entry still works ⚠️ (Known V1 limitation)
- [ ] Job selection works
- [ ] Form submission works
- [ ] "Add another?" prompt appears after save
- [ ] Confirming resets form and opens camera again

**Notes:**
```
[Your observations here]
```

### 8. Add Payment (Score: __/10)
- [ ] Job selection is required
- [ ] Invoice linking dropdown appears when job has invoices
- [ ] Quick fill buttons (50%, Full) calculate correctly from invoice total
- [ ] Amount field works
- [ ] Payment type dropdown (Deposit, Final, Other)
- [ ] Payment method dropdown (Stripe, Check, Zelle, Venmo, CashApp, Cash, Other)
- [ ] Stripe shows helpful note about recording after fees
- [ ] Date picker works
- [ ] Notes field works
- [ ] Confirmation screenshot upload works
- [ ] Submit saves payment and redirects to job

**Notes:**
```
[Your observations here]
```

### 9. Add Reminder (Score: __/10)
- [ ] Title field (required)
- [ ] Due date picker (required)
- [ ] Priority selection UI (visual cards, not dropdown)
- [ ] High priority = "Payment Collection" (red)
- [ ] Moderate priority = "Order / Schedule" (orange)
- [ ] Low priority = "Follow-up" (green)
- [ ] Job linking is optional
- [ ] Submit creates reminder
- [ ] Reminder appears on Today dashboard

**Notes:**
```
[Your observations here]
```

### 10. Invoices - List View (Score: __/10)
- [ ] Invoices list loads
- [ ] Search by invoice number works
- [ ] Search by client name works
- [ ] Search by job name works
- [ ] Invoice cards show: number, status badge, client, job, date, total
- [ ] Clicking invoice navigates to detail
- [ ] Floating "+" button works
- [ ] Empty state displays correctly

**Notes:**
```
[Your observations here]
```

### 11. Invoices - Create New (Score: __/10)
- [ ] Job selection (required) with search
- [ ] Selecting job auto-fills customer name/address from client
- [ ] Invoice date defaults to today
- [ ] Due date defaults to +30 days
- [ ] Customer name editable
- [ ] Customer address editable
- [ ] Line items:
  - [ ] Description field
  - [ ] Quantity field
  - [ ] Unit price field
  - [ ] Line total calculates automatically
  - [ ] Add line item button works
  - [ ] Remove line item button works (when >1)
- [ ] Discount toggle enables percentage input (default 10%)
- [ ] Tax toggle enables rate selection
- [ ] Tax presets: NYC 8.875%, NJ 6.625%, CT 6.35%
- [ ] Totals section updates in real-time:
  - [ ] Subtotal
  - [ ] Discount amount (when enabled)
  - [ ] Tax amount (when enabled)
  - [ ] Final total
- [ ] Notes field with default payment terms
- [ ] "Generate Invoice" submits and creates PDF
- [ ] Redirects to invoice detail

**Notes:**
```
[Your observations here]
```

### 12. Invoices - Detail View (Score: __/10)
- [ ] Header shows invoice number and status badge
- [ ] Customer name and job name displayed
- [ ] Share button works (native share or copy link)
- [ ] Download button downloads PDF
- [ ] Status dropdown changes invoice status (Sent, Deposit Paid, Paid)
- [ ] Invoice preview shows all details:
  - [ ] Dates
  - [ ] Bill to info
  - [ ] Line items with calculations
  - [ ] Subtotal, discount, tax, total
  - [ ] Notes
- [ ] PDF link/download button
- [ ] Edit Invoice button exists

**Notes:**
```
[Your observations here]
```

### 13. Invoice PDF Quality (Score: __/10)
- [ ] PDF generates successfully
- [ ] MetroGlass Pro branding (logo colors: navy "MetroGlass" + orange "Pro")
- [ ] Company contact info present
- [ ] Invoice number prominent
- [ ] Professional layout
- [ ] Line items table formatted correctly
- [ ] Totals section clear
- [ ] Notes section included
- [ ] Footer with thank you message
- [ ] Filename format: MetroGlass_INV{number}_{JobName}_{Address}.pdf

**Notes:**
```
[Your observations here]
```

### 14. Client Detail (Score: __/10)
- [ ] Accessible from job detail by clicking client name
- [ ] Shows client name
- [ ] Contact info: email (clickable mailto), phone (clickable tel), address
- [ ] Notes section
- [ ] Edit mode toggles correctly
- [ ] Edit form saves changes
- [ ] Total Business stats: jobs count, total invoiced, total paid
- [ ] Jobs list shows all jobs for this client
- [ ] Clicking job navigates to job detail

**Notes:**
```
[Your observations here]
```

### 15. Settings Page (Score: __/10)
- [ ] Company info displayed (logo, name, email, phones, service area)
- [ ] Account section shows logged in state
- [ ] Sign Out button works
- [ ] Install App section with instructions
- [ ] About section with version info

**Notes:**
```
[Your observations here]
```

### 16. Navigation & UX (Score: __/10)
- [ ] Bottom tab bar is always visible on protected pages
- [ ] Active tab is highlighted (icon in orange, label in navy)
- [ ] Center "+" button is raised and prominent (orange)
- [ ] Quick actions sheet opens smoothly from bottom
- [ ] Quick actions: Quick Expense, New Job, Add Expense, Add Payment, Add Reminder
- [ ] Each quick action navigates correctly
- [ ] Back buttons work throughout app
- [ ] Page transitions are smooth
- [ ] Loading states are visible
- [ ] Toast notifications appear for success/error/warning
- [ ] Forms show validation errors appropriately

**Notes:**
```
[Your observations here]
```

### 17. PWA Functionality (Score: __/10)
- [ ] Manifest file is valid
- [ ] App is installable (Add to Home Screen)
- [ ] App icon displays correctly
- [ ] Splash screen/theme color correct (cream background, navy theme)
- [ ] Standalone mode works (no browser chrome)
- [ ] App shortcuts work (New Job, Add Expense)

**Notes:**
```
[Your observations here]
```

### 18. Mobile Responsiveness (Score: __/10)
- [ ] All pages work on iPhone SE (smallest common screen)
- [ ] All pages work on iPhone 14 Pro Max
- [ ] All pages work on Android devices
- [ ] Touch targets are minimum 44x44px
- [ ] No horizontal scrolling issues
- [ ] Forms are usable on mobile keyboards
- [ ] Camera/file upload works on mobile

**Notes:**
```
[Your observations here]
```

### 19. Data Integrity (Score: __/10)
- [ ] Creating a job with a new client creates both records
- [ ] Deleting a job cascades to expenses/payments/invoices (or shows warning)
- [ ] Invoice numbers auto-increment correctly
- [ ] Payment amounts are stored accurately (decimal precision)
- [ ] Dates are stored and displayed in correct timezone
- [ ] All CRUD operations persist after page refresh

**Notes:**
```
[Your observations here]
```

### 20. Error Handling (Score: __/10)
- [ ] Network errors show appropriate messages
- [ ] Invalid form submissions show field-level errors
- [ ] 404 pages work for invalid routes
- [ ] API errors are caught and displayed
- [ ] App doesn't crash on unexpected data

**Notes:**
```
[Your observations here]
```

---

## PART 2: KNOWN ISSUES & LIMITATIONS

### Confirmed Issues to Address:
1. **Delete Expense**: No way to delete an expense after creation ⚠️ CRITICAL
2. **Delete Payment**: No way to delete a payment after creation ⚠️ CRITICAL
3. **AI Receipt Extraction**: Gemini Flash integration exists but may not be fully functional ⚠️ MEDIUM
4. **Edit Expense**: No edit functionality for expenses
5. **Edit Payment**: No edit functionality for payments

### V2 Planned Features (Not in V1):
- Light/Dark mode toggle
- Push notifications
- Job items/specs (glass dimensions, hardware details)
- Offline support
- Measurement photos gallery

---

## PART 3: MISSING FEATURES ANALYSIS

Based on the app's purpose (shower glass installation business operations), evaluate what features might be missing:

### A. Essential Missing Features (Should be in V1)
Rate each as: CRITICAL / HIGH / MEDIUM / LOW

1. **Expense Deletion**: ___________
2. **Payment Deletion**: ___________
3. **Expense Editing**: ___________
4. **Payment Editing**: ___________
5. **[Your suggestion]**: ___________
6. **[Your suggestion]**: ___________

### B. Nice-to-Have Features (Could be V1.5)
1. **Expense Dashboard on Bottom Nav**: A dedicated expenses view to see all expenses across all jobs, with filters by date range, category, payment method
2. **Duplicate Job**: Clone an existing job for similar work
3. **Job Templates**: Pre-set job types with default values
4. **Bulk Status Update**: Update multiple jobs at once
5. **Search Everywhere**: Global search across jobs, clients, invoices
6. **[Your suggestion]**: ___________

### C. Advanced Features (V2+)
1. **Light/Dark Mode**: Already planned
2. **Push Notifications**: Already planned
3. **Reporting/Analytics Dashboard**: Monthly/yearly reports, charts, comparisons
4. **Export to CSV/Excel**: Export data for accounting
5. **Client Portal**: Let clients view their invoices online
6. **Integration with QuickBooks/Accounting Software**
7. **GPS Tracking for Install Locations**: Map view of all job sites
8. **Team Assignment**: If business grows, assign jobs to specific installers
9. **Inventory Management**: Track glass, hardware stock
10. **[Your suggestion]**: ___________

---

## PART 4: UI/UX ENHANCEMENT SUGGESTIONS

### Current Design Strengths:
- Brand colors are well-applied
- Card-based design is clean
- Bottom navigation is intuitive
- Quick actions sheet is convenient
- Status badges are clear

### Suggested Improvements:

#### Visual Enhancements:
1. **Micro-interactions**: Add subtle animations on button presses, card taps
2. **Skeleton loading states**: Show content placeholders while loading
3. **Pull-to-refresh**: Native mobile feel for lists
4. **Swipe gestures**: Swipe to delete/edit on list items
5. **Haptic feedback**: Vibration on important actions (mobile)

#### Information Architecture:
1. **Dashboard widgets reordering**: Let user customize Today dashboard
2. **Collapsible sections**: Expand/collapse sections on job detail
3. **Quick stats on job cards**: Show total value on job list cards

#### Accessibility:
1. **Font sizing options**: Accessibility settings
2. **High contrast mode**: For outdoor use
3. **Voice input**: For hands-free entry on job sites

---

## PART 5: FINAL SCORING

### Category Scores Summary:
| Category | Score (/10) |
|----------|-------------|
| Authentication | |
| Today Dashboard | |
| Jobs - List | |
| Jobs - Create | |
| Jobs - Detail | |
| Add Expense | |
| Quick Expense | |
| Add Payment | |
| Add Reminder | |
| Invoices - List | |
| Invoices - Create | |
| Invoices - Detail | |
| Invoice PDF | |
| Client Detail | |
| Settings | |
| Navigation & UX | |
| PWA | |
| Mobile Responsiveness | |
| Data Integrity | |
| Error Handling | |

### Overall App Score: ___/100

### Grade:
- 90-100: A (Production-ready, exceptional)
- 80-89: B (Production-ready with minor issues)
- 70-79: C (Functional but needs polish)
- 60-69: D (Major issues need addressing)
- Below 60: F (Not ready for production)

### Final Verdict:
```
[Your comprehensive evaluation summary]
```

---

## PART 6: PRIORITY FIX LIST

Based on your testing, list the top 10 items that should be fixed/added before production launch:

1. _____________ (Priority: CRITICAL/HIGH/MEDIUM)
2. _____________ (Priority: CRITICAL/HIGH/MEDIUM)
3. _____________ (Priority: CRITICAL/HIGH/MEDIUM)
4. _____________ (Priority: CRITICAL/HIGH/MEDIUM)
5. _____________ (Priority: CRITICAL/HIGH/MEDIUM)
6. _____________ (Priority: CRITICAL/HIGH/MEDIUM)
7. _____________ (Priority: CRITICAL/HIGH/MEDIUM)
8. _____________ (Priority: CRITICAL/HIGH/MEDIUM)
9. _____________ (Priority: CRITICAL/HIGH/MEDIUM)
10. _____________ (Priority: CRITICAL/HIGH/MEDIUM)

---

## Testing Environment Notes

**Tested On:**
- Device: _______________
- OS Version: _______________
- Browser: _______________
- Screen Size: _______________
- Date Tested: _______________

**Test Account Used:**
- Email: _______________

**Test Data:**
- Number of jobs created: ___
- Number of expenses created: ___
- Number of payments created: ___
- Number of invoices created: ___

---

*End of QA Testing Prompt*
