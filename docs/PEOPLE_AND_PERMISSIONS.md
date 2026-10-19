# People and Permissions

MTSS has no sign-in, sign-out or user accounts of its own. It reads the Hub's session (a short access token in a cookie on the parent domain) and asks Central what each person may do here. The people list is a copy of what Central says, kept in the `people` collection by `jobs/centralSync.js`.

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

`mtss.write` and `mtss.admin` need `mtss.read`. Without either scope permission, a person sees the classes they teach plus the students they support, as Central assigns them. A student sees only their own record.

## Moving the old users

Old ids (`users` and `userstudents` collections) are matched to people by email and replaced where other collections keep them (mentor, creator, check-ins, notifications and so on). Back up first, then:

```bash
cd backend
npm run migrate:people              # dry-run, prints what it would change
npm run migrate:people -- --apply   # writes
```

It stops if the people collection is empty, so let the Central sync run first. Old users with no person in Central are listed and left as they were. Running it again changes nothing for ids that are already moved.
