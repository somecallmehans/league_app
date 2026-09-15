# Operator analytics (GA4)

How to read Commander League product analytics in Google Analytics 4. Measurement id default: `G-8R4G06KBTN` (overridable via `VITE_GA_MEASUREMENT_ID` on the site and `GA_MEASUREMENT_ID` on the bot).

## Website events

| Event | When | Useful params |
| --- | --- | --- |
| `page_view` | Every SPA route change | `page_path`, `route_pattern`, `store_slug`, `route_type` |
| `page_time` | Leave / hide a route | `page_path`, `route_pattern`, `duration_ms`, `store_slug` |
| `nav_click` | Selected in-app clicks | `link_text` |

**Cutover:** before this change, time on `/metrics*` used `stats_page_time`. New traffic uses `page_time` on **every** route. Keep old Explorations pointed at `stats_page_time` only for historical ranges.

### Page visits

1. Explore → Free form (or Pages and screens).
2. Dimension: `page_path` or `route_pattern`.
3. Optional filter/breakdown: `store_slug`.
4. Metric: Event count for `page_view` (or Sessions / Users as preferred).

Use `route_pattern` for totals like “all Participant metrics pages” (`/metrics/:id`). Use `page_path` when you care about a specific URL.

### Time on page

1. Event: `page_time`.
2. Dimension: `page_path` or `route_pattern`.
3. Metric: average or sum of `duration_ms` (register as a custom metric if GA has not auto-picked it up).

## Discord bot events

| Event | When | Useful params |
| --- | --- | --- |
| `bot_interaction` | Slash command or UI follow-up (not announcements, PING, or autocomplete) | `interaction_name`, `interaction_kind` (`command` \| `component` \| `modal`), `store_slug` |

Discord user ids are **hashed** into GA `user_id` (never sent raw).

### Invocations

Event count for `bot_interaction`, broken down by `interaction_name` / `interaction_kind` / `store_slug`.

### Unique Discord accounts

Users with `bot_interaction` (GA users keyed by the hashed `user_id`).

## Bot environment

Set on the Discord bot service:

- `GA_MEASUREMENT_ID` — same property as the website
- `GA_API_SECRET` — Measurement Protocol API secret from GA Admin → Data streams → Measurement Protocol API secrets
- `GA_USER_ID_SALT` — required server-side salt for hashing Discord user ids (emission skips if unset)

If any of those are missing, the bot skips emission and logs; Discord commands still work.

## Smoke check

1. Browse a few site routes; confirm `page_view` and `page_time` in GA DebugView / Realtime.
2. Run `/help` or `/signin` in a test guild; confirm `bot_interaction` in Realtime.
