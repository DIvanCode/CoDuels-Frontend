# Timestamp display

## Current behavior after issue 65

Duely date-time fields are absolute instants. The shared
`src/shared/lib/isoTimestamp.ts` helper parses ISO 8601 values with `Z` or an
explicit offset and formats dates and times through `Intl` using the selected
`ru-RU` locale and the browser's timezone. Changing the browser timezone changes
the displayed wall clock, while the parsed instant stays the same. Duel timers,
history, submission lists/details, registration dates, group duels and
tournaments, group-stage brackets, and administrative views use this helper.

The helper temporarily treats the exact old Duely ISO shape without an offset
as UTC, because those old `timestamp` values were written as UTC wall clocks.
Other malformed or impossible values return a safe fallback such as `—`, `-`,
or `Неизвестно`; timers show `00:00` for missing or invalid deadlines. API and
domain models keep the raw instant string and never contain formatted dates.

Date-only calendar fields and future local schedules need separate types and
rules. No current Duely date-time response is such a field. New instant fields
must include `Z` or an offset; the legacy fallback can be removed after old
responses and caches are no longer possible.
