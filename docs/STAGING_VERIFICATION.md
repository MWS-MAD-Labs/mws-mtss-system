# Staging Verification

Run this after every staging deploy of MTSS. Tick each line. Anything that fails stops the rollout to `main`.

## 1. The deploy itself
- [ ] The GitHub Actions run is green, including `Send Permission List To Central` and `Wait for the new version`.
- [ ] `STAGING_HEALTH_URL` (for example `https://app-stg.mws.web.id/mtss/api/health`) shows a `buildId` equal to the commit that was deployed. If the old build keeps showing, read the last update of the stack in Komodo.
- [ ] The backend log has a `centralSync: asking Central every N seconds` line and no `[access] Central lookup failed` or `Central said 4xx/5xx` lines.

## 2. Central knows this version
- [ ] In Central, the application `mtss` lists the 14 permissions (`mtss.read` to `hub.support.access`).
- [ ] From `backend`, with the staging Central values in the environment: `npm run permissions:check` prints `permissions match Central`.
- [ ] A role in Central holds `mtss.read`. Without one, nobody gets in.

## 3. Signing in through the Hub
- [ ] Open `https://app-stg.mws.web.id`, sign in, click the MTSS card. You land on `/mtss/home`, not back on the Hub.
- [ ] DevTools > Application > Cookies: the access cookie is named like `HUB_ACCESS_COOKIE_NAME` (for example `hub_at_stg`) with Domain `.mws.web.id`. No cookie named `hub_at` is left from an older sign in.
- [ ] A person whose role has no MTSS permission sees "No Access to MTSS", not an error page.
- [ ] "Back to Hub" in the quick menu goes to the Hub front page. Signing out there ends MTSS too (reload MTSS: you are sent to the Hub).
- [ ] Wait more than 5 minutes on a page, then act: no bounce to the Hub (the token is renewed in the background).

## 4. What each kind of person sees
- [ ] A teacher with only `mtss.read` and `mtss.write` sees only the classes they teach plus the students they support in Central.
- [ ] A person with `mtss.scope.unit` sees only their own unit. A person with `mtss.scope.all` sees every student.
- [ ] A person with `mtss.admin` opens `/mtss/admin`. A person without it is sent to their own dashboard from that address.
- [ ] A student sees only their own record.
- [ ] The Mentor list only offers people who hold `mtss.write`.

## 5. Data matches Central
Pick one person and one student in Central and check each field in MTSS.
- [ ] Change a staff member's unit or job position in Central. Within about 2 minutes it changes under User Management.
- [ ] Remove a role's `mtss.read` in Central. Within about a minute the person is refused (`403`) and the Hub card page shows no access.
- [ ] Move a teacher to another class in Central. Within the class sync interval their student list follows.
- [ ] Withdraw or graduate a student in Central. They leave "All Students" (status filter) at the next roster sync.
- [ ] User Management shows "Synced with Central" and a last check time under a minute old. A red problem line there means Central cannot be reached.
- [ ] No mentor shows as "Unassigned" on a plan whose mentor still works at the school. If one does, that plan still points at an id from before the move: read `docs/PEOPLE_AND_PERMISSIONS.md`, section "Moving from the old collections": `npm run migrate:people` copies the old users with their ids and is the normal move (before the first start of the new version). `npm run migrate:people:refs` is only for a database where the sync already ran first, and cannot be undone.
- [ ] A student who is `REGISTERED` (not yet in a class) or no longer in Central does not appear in MTSS, neither in the student lists nor on a plan. Make one `ACTIVE` in Central: within a minute they appear.
- [ ] A plan whose mentor left or lost access reads "Mentor no longer has access", not "Unassigned". Reassign it from the dashboard.

## 6. Live updates and the audit trail
- [ ] Open MTSS in two browsers as two people. Create an intervention as one: the other's list refreshes without reload.
- [ ] A signed-out tab or a person without access cannot connect to live updates (the browser console shows a refused socket connection).
- [ ] A DOCX download writes an `[AuditLog]` line with the signed-in person as actor.

## 7. Nothing else broke
- [ ] The AI chat opened from Daily Check-in still works: Daily passes the person's Hub cookie to MTSS, so both need the same `HUB_ACCESS_COOKIE_NAME`, and the person needs `ai_chat.use` in MTSS. Without MTSS access Daily shows "AI chat is not available for this account yet".
- [ ] Notifications arrive in the bell and, for those who opted in, in Slack.
- [ ] Exima and Daily staging still open from the Hub card with the new cookie name.

## 8. Before promoting to `main`
- [ ] MTSS is served under the same registrable domain as the Hub. If it is not, the shared session cannot work and `main` must stay on the old version.
- [ ] A backup of the database exists before `migrate:people:apply` (or `migrate:people:refs -- --apply`) runs anywhere.
