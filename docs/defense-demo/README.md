# Vivre Cares Defense Demo Guide

This guide is for preparing a deployed defense demo with realistic patient and invoice data without editing the production database directly.

## Safest Way To Populate Demo Data

Use the built-in admin import tool:

1. Log in as an Admin on the deployed system.
2. Make sure the admin security password is set, because imports require it.
3. Go to `Admin > Import`.
4. Import patients first using `demo-patients.csv`.
5. Import invoices second using `demo-invoices.csv`.
6. Open `Admin > Manage Patients` and `Admin > Billing & Payments` to confirm the records appeared.

Do not use direct SQL on the deployed database unless you have a backup and rollback plan. The app import path is better for defense because it exercises your actual validation, encryption, admin-password protection, and invoice import logic.

## Important Import Notes

- Patient import creates verified patient accounts with random temporary passwords. Use registration/login separately if you need to demo email verification.
- Invoice import requires the patient to already exist. That is why patients must be imported first.
- If you import the same CSV twice, patient import will fail because emails must be unique.
- Before a second import attempt, change `defense2026a` in the demo email addresses to a new tag, for example `defense2026b`.
- Valid invoice branches in the current app are `Pasay Branch` and `Valenzuela Branch`.
- Non-cash paid invoices require a `reference_number`.

## Demo Flow Outline

Recommended flow for a 10-15 minute defense:

1. Landing and authentication
   - Show the landing page.
   - Register a new patient using real email verification.
   - Log in as the patient.

2. Patient portal
   - Show patient dashboard.
   - Request an appointment.
   - Open appointment history and explain pending/upcoming status behavior.
   - Open account settings and show email-change verification modal.

3. Admin portal
   - Log in as Admin.
   - Show dashboard metrics.
   - Open appointment logs and approve/reschedule an appointment.
   - Open Manage Patients and show imported patient records.
   - Open Billing & Payments and show imported invoices, filters, status update, and PDF invoice export.
   - Open Reports to show analytics/export readiness.

4. Doctor portal
   - Log in as Doctor.
   - Open appointments and patient record.
   - Add or review consultation notes.
   - Show clinical reports.

5. Security and data handling
   - Explain role-based access.
   - Explain email verification for registration, password changes, and profile email changes.
   - Explain admin-password protection for bulk imports.
   - Explain encrypted sensitive patient disclosure fields.

## What To Rehearse

Prepare answers for these likely questions:

- Why did you choose separate roles for Patient, Admin, and Doctor?
- What patient data is sensitive, and how is it protected?
- What prevents a user from changing their email to someone else's email?
- What happens if an invoice import contains bad rows?
- How does the system handle appointment rescheduling?
- What are the limitations of the current system?
- What would you improve after deployment?

## AI Prompt For Defense Script

Paste this into an AI assistant:

```text
Help me create a concise defense presentation script for my system, Vivre Cares.

System summary:
- A clinic management web app for patients, admins, and doctors.
- Patients can register with email verification, request appointments, view appointment history, view invoices, update their profile, and change password with verification.
- Admins can manage patients, approve/reschedule/cancel appointments, create/import invoices, update payment status, export PDFs/reports, and manage settings.
- Doctors can view appointments, patient records, consultation notes, and clinical reports.
- Security features include role-based access, email verification, admin-password confirmation for imports, and encrypted sensitive medical disclosure fields.

Please produce:
1. A 10-minute demo flow.
2. A 2-minute technical architecture explanation.
3. A short security explanation.
4. Likely panel questions and strong answers.
5. A closing statement.
Use simple, confident language suitable for a school defense.
```

## AI Prompt For Demo Checklist

```text
Act as my defense demo coach. Create a step-by-step live demo checklist for Vivre Cares using this flow:
Patient registration and appointment request, admin appointment handling, invoice management, doctor patient record review, and security explanation.

For each step, include:
- What screen to open.
- What action to perform.
- What feature to explain.
- What can go wrong and how to recover during a live defense.
```

## Last-Day Practical Checklist

- Use demo accounts and demo emails only.
- Import patients before invoices.
- Confirm email sending works on deployed environment.
- Keep one already verified patient account ready in case live email delivery is slow.
- Keep one admin and one doctor account ready.
- Test PDF export from the deployed site.
- Do not clear production data right before defense.
- Take screenshots of key pages as a fallback.
