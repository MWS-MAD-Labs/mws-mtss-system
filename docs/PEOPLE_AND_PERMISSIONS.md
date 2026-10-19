# People and Permissions

MTSS has no sign-in, sign-out or user accounts of its own. It reads the Hub's session (a short access token in a cookie on the parent domain) and asks Central what each person may do here. The people list is a copy of what Central says, kept in the `people` collection by `jobs/centralSync.js`.

## Who is in the app

One collection, `people`, one document per person, the way Central keeps them. A person is an employee or a student (`personType`, copied from Central). Documents are made and updated by `jobs/centralSync.js`, so everybody Central lists for `mtss` is in the list before their first sign-in.

The sync asks Central one small question every minute (the key of `/application-entitlements/version`). It reads the full list only when the key moved. Unit, job, grade, class, who teaches which class and which students a special education teacher supports are not part of that key, so they are read in bulk every minute too, in the same pass and under the same lease, so only one server instance syncs at a time. The student roster (`MTSSStudent`) is a separate job on the same pace with its own lease. Set `MTSS_AUTO_SYNC_SECONDS` to change the minute (minimum 15, `0` turns the access sync off).

There is no button to run it. User Management shows when MTSS last checked Central, when something last changed, how old the student roster is, and any problem in plain words (for people with `sync.read`). The same is at `GET /api/v1/sync/status` and in the `centralsyncstates` collection. A list Central could not be read in full is skipped and never used to deactivate anyone or to clear classes.

Only students Central has put in a class (status `ACTIVE`) and still lists are seen in MTSS. Students who are not yet in a class (`REGISTERED`), who left, or whom Central no longer lists are hidden from the student lists and from intervention plans, and a plan with no visible student is not shown. Nothing is deleted: the record waits and the student shows again when Central makes them `ACTIVE`. The rule is in `backend/src/utils/studentVisibility.js`.

### What MTSS's API token needs in Central

`application_entitlements:read` and `employees:read` for the access list and employees. `students:read`, `class_teacher_assignments:read` and `student_support_assignments:read` for students, the classes teachers are assigned to and the students a special education teacher supports. Without one of them, the rest still syncs and the status line names the missing scope.

## Who gets in

A person gets in when Central gives their role in MTSS at least `mtss.read`. Someone the Hub knows but Central gives no access to MTSS sees the "No Access to MTSS" page. The sync deactivates people Central stops listing and keeps their history.

## Permissions

The list lives in `backend/src/constants/permissions.js`. `npm run permissions:sync` sends it to Central, and the deploy workflow does the same before every deploy. Roles in Central can only hold what is on that list.

| Permission | What it opens |
|---|---|
| `mtss.read` | MTSS itself: tiers, strategies, students in scope, intervention plans that are visible |
| `mtss.write` | Writing interventions and mentor assignments, uploading evidence. Holders can also be chosen as mentors |
| `mtss.admin` | Tiers and strategies, creating and changing students, the mentor list, pilot feedback, reassigning a plan |
| `mtss.scope.unit` | Students in the person's own unit |
| `mtss.scope.all` | Every student |
| `emotional_dashboard.read` | The emotional dashboard |
| `ai_chat.use` | The AI assistant |
| `ai_insights.read`, `ai_insights.write` | AI insights and alerts |
| `notifications.broadcast` | Sending system notifications |
| `users.read` | The people list under User Management |
| `sync.read` | The sync status line |
| `dev_topology.read` | The developer topology page |
| `hub.support.access` | The Support Hub shortcut in the quick menu |

`mtss.write` and `mtss.admin` need `mtss.read`. Without either scope permission, a person sees the classes they teach plus the students they support, as Central assigns them. A student sees only their own record.

## Moving from the old collections

The old `users` and `userstudents` collections are not touched. Back up the database first, and do this BEFORE the new version starts for the first time:

```bash
cd backend
npm run migrate:people          # dry-run, prints what it would do
npm run migrate:people:apply    # writes
```

Each person keeps the `_id` they had, so plans, check-ins and notifications keep pointing at the right person. The old MTSS accounts never kept Central's person id, so it is asked of Central by email (read only). Accounts Central does not know are listed as "needs review" and not moved. Running it again changes nothing for people who are already there. To go back, deploy the previous version.

If the new version already ran against the database, the Central sync has made the people with new ids and the script lists them as duplicates. For that case only there is an emergency tool that rewrites the old ids kept in other collections to the new ones, by email:

```bash
npm run migrate:people:refs              # dry-run
npm run migrate:people:refs -- --apply   # writes, and cannot be undone by deploying the old code: back up first
```
