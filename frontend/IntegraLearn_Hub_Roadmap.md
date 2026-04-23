# IntegraLearn Hub: ROADMAP / TIMELINE DEVELOPMENT

## Executive Summary

This report outlines a refined, pilot-ready roadmap for IntegraLearn Hub, a comprehensive Learning Management System (LMS) tailored for Millennia World School (MWS). The plan prioritizes core operational features with a classroom/subject system as the foundation, emphasizes rapid delivery through MVP-focused sprints, and integrates existing MWS tools to minimize development time. The 8-week timeline targets measurable adoption KPIs, with a focus on emotional check-in as the mandatory "aha moment" feature.

## Scope & Target Users

- **Target Education Levels**: TK (Kindergarten), SD (Elementary), SMP (Junior High)
- **Primary Roles**: SUPER_ADMIN, TEACHER, STAFF, STUDENT, PARENT
- **Mandatory Feature**: Emotional Check-in (student + teacher aggregation with classroom context)
- **Core Foundation**: Classroom/Subject System — hierarchical structure (Grade > Class > Subject) for all features

## MVPs — Teacher & Staff (Priority for Early Release)

Six prioritized features for teachers and staff, built on classroom/subject foundation:

1. **Classroom/Subject Management + Automated Schedule Creator** — Rule-based schedule generation per classroom/subject, editable by teachers, iCal export with classroom conflicts resolution.
2. **Reflection Tracker (Teacher Workflow)** — List, approve/edit reflections per subject/classroom, bulk approve with classroom filtering.
3. **Quick Feedback Bank + Report Assistant Integration** — Reusable sentence-starters and template-driven report drafts per subject.
4. **Attendance (QR / One-tap) & Roster Management** — Reliable check-in with <5% error target, classroom-based rosters.
5. **Emotional Check-in Dashboard** — Aggregated daily moods per classroom, flagged students, weekly trend view with subject correlations.
6. **Admin / Staff Utilities (Super Admin Panel)** — User & role management, CSV import with classroom assignments, feature flags per grade/class.

## MVPs — Students

Six prioritized student-facing features:

1. **Live Daily Schedule (Student Passport)** — Today view per classroom/subject + daily 7 AM push reminders for tomorrow's activities.
2. **Portfolio Maker** — Photo/audio/text upload with auto-metadata and PDF export per student/subject.
3. **Reflection Entry & Emotional Check-in** — Quick mood + reflection per subject; offline save & sync.
4. **Learning Journey Map** — Basic visual timeline/kanban per subject within classroom context.
5. **Modes (Self Exploration / Project Work / Group Discussion)** — Session mode metadata stored with artifacts per classroom activity.
6. **Badge Display + Basic SEL Micro-badges** — Teacher-issued badges visible in student passport, tied to classroom achievements.

## Why This Fits & Business Rationale

- **Direct Alignment**: Matches FGD pain points (scheduling, portfolio, visibility) with classroom/subject structure.
- **ROI Focus**: Reduces teacher admin time through automation; classroom system enables scalable rollouts.
- **Integration-First**: Reuse Report Assistant, Slides, and Emotional Check-in tools.
- **Adoption Path**: Immediate wins (7 AM reminders, one-tap check-in) drive usage.
- **Scalability**: Modular services enable grade-by-grade deployment.

## Top Risks & Concrete Mitigations

- **Low Teacher Adoption**: 2-week shadow-mode pilot, 1-hour training, 'reduce one manual task' KPI.
- **Data Privacy**: RBAC, audit logs, guardian consent, presigned URLs, encryption.
- **Scope Creep**: Feature flags gate non-essential features.
- **Offline Complexity**: Lightweight localStorage sync queue.
- **Integration Brittleness**: Node.js adapters with unit tests.

## Critique of Current MVP & Prioritization

Prioritize operational core over advanced AI. Classroom/subject system is P0 foundation.

**Priority Tiers**:

- **P0 (Sprint 1–2)**: Classroom/Subject System, Emotional Check-in Dashboard, Student Live Daily Schedule, Portfolio Maker (basic), Attendance QR/One-tap, Super Admin + RBAC.
- **P1 (Sprint 3)**: Reflection Tracker, Quick Feedback Bank, Parent Weekly Digest.
- **P2 (Post-pilot)**: Report Assistant integration, Slides export, Learning Journey enhancements, Badging, Offline improvements, AI tagging.

## Open Questions / Unresolved Items

- Jemputan System: Limit to pickup notifications only.
- Badging Rubric: Define teacher-issued SEL badges post-pilot.
- AI Features: Template-based for MVP; LLM integration deferred.
- Integration Contracts: Map student_id, classroom_id, subject_id, semester.
- Data Retention: Define 2-year policy pre-launch.

## Integrations — Priority & How-to

Adapters for existing MWS tools:

- **Report Assistant**: POST /integrations/report-assistant/generate (student_id, classroom_id, subject_ids, template_id). Priority: Sprint 4.
- **Slides to PDF**: Server job compile artifacts to PDF per subject. Priority: Sprint 3–4.
- **Slides Generator**: Template per student/subject. Priority: Sprint 4.
- **Report Progress Tracker**: Sync to Teacher Dashboard per classroom. Priority: Sprint 3.
- **Emotional Check-in Dashboard**: Reuse DCD model with classroom aggregation. Priority: Sprint 1–2.
- **MWS Slack Bot**: Notifications for flagged students (post-pilot).

## Roadmap & Timeline — 8 Weeks (2 months) for 2-dev Team

**Capacity**: 2 developers (1 FE, 1 BE) — 640 dev-hours total. Four 2-week sprints (160h each).

- **Sprint 0 (3 days)**: Kickoff, sample data, UX wireframes, infra plan, test accounts.
- **Sprint 1 (Weeks 1–2)**: Auth & RBAC, Classroom/Subject DB schema, storage (presigned S3), notification infra (mock 7 AM reminders), FE app shell, Emotional Check-in end-to-end.
- **Sprint 2 (Weeks 3–4)**: Schedule generator per classroom, Student Live Daily Schedule with 7 AM mock notifications, Portfolio upload API, Portfolio Maker UI.
- **Sprint 3 (Weeks 5–6)**: Reflection tracker endpoints & UI, Attendance QR/one-tap, Parent weekly digest, Super Admin panel basics.
- **Sprint 4 (Weeks 7–8)**: Integration adapters (Report Assistant, Slides), Learning Journey basics, analytics & KPIs, pilot materials & deployment.

## Sample Acceptance Criteria

- **RBAC**: SUPER_ADMIN manages users/roles/classrooms; screens adapt per role.
- **Schedule**: ≥90% conflict-free generation; students receive 7 AM reminders.
- **Portfolio**: >95% upload success; exportable PDF per subject.
- **Emotional Check-in**: Teachers see classroom-aggregated flags with notifications.

## Pilot KPIs (Targets)

- Teacher weekly active ≥ 60% within 2 weeks.
- Parent activation ≥ 40% within 2 weeks.
- Reduce teacher portfolio time ≥ 40%.
- Attendance improvement +10–20%.

## Required Non-Development Resources

- UX/Design (0.1 FTE): Wireframes & demo video.
- Product SME (teacher): 4–6 hrs/week validation.
- SUPER_ADMIN (ops): Roster & pilot management.
- Manual QA: Staff support during pilot.

## Assumptions & Constraints

- Dev team: Proficient in React/Vite, Node/Express.
- School provides: Roster CSV with classroom assignments, pilot cohort (≥5 teachers, 1 grade).
- Push Notifications: Mock system for MVP; FCM for production.
- Dependencies: Adoption success relies on training and network quality.

## Answers to Key Questions

1. **LLM Integration**: d. Tidak perlu integrasi LLM untuk MVP ini — cukup template sederhana.
2. **Report Assistant & AI Tagging**: Template sederhana untuk MVP; AI tagging deferred.
3. **Push Notifications**: c. Mock notification system dulu untuk 7 AM reminders.
4. **Prioritas Pengembangan**: c. Emotional Check-in Dashboard sebagai "aha moment" utama.