# Product

## Register

product

## Users

One person: Shyam, who owns the portfolio this admin sits behind. There is no multi-user story and no permission model, by design; the backend authenticates a single admin from environment variables. Two working contexts, and they are not alike:

- **The check-in.** A short visit, often in the evening, on a Windows desktop, to answer one question: did anyone actually read this, and what did they do? Sub-minute. Wants an answer, not a report to interpret.
- **The writing session.** Long, focused, sometimes an hour, drafting and publishing a blog post with code samples and images. Wants to not think about the tool at all, and above everything else wants to never lose work.

The bookshelf sits in between: occasional, low-stakes list maintenance.

## Product Purpose

The back office for a personal portfolio site. It manages the only two content types that are database-backed (blog posts, books) and surfaces the analytics that indicate whether the site is doing its job.

Success looks like: traffic numbers that can be trusted at a glance without mentally subtracting the owner's own visits, and a writing surface where publishing a post never costs a draft.

Failure looks like: another dashboard whose numbers are ignored because nobody is sure what they count.

## Brand Personality

Precise, quiet, fast. An instrument, not a showroom.

The public portfolio performs: warm palette, large type, motion, personality. The admin performs nothing. Its entire job is to hand over information and get out of the way. Where the public site persuades, the admin reports. That contrast is deliberate, not an inconsistency.

Voice in the interface: plain and specific. "No sessions in the last 3 days" over "Nothing to see here!". Never chatty, never congratulatory, no exclamation marks.

## Anti-references

- **The admin this replaces.** White cards on grey, blue primary buttons, Font Awesome icons, uniform card grids, hand-rolled bars standing in for charts.
- **Gradient SaaS dashboards.** Purple-to-blue KPI tiles, glassmorphism, glowing borders, big hero numbers that carry no comparison and mean nothing.
- **Enterprise admin consoles.** Salesforce/Jira density without craft: grey chrome, cramped tables, nested dropdowns, toolbars of disabled buttons.

Explicitly not a toy either: no pastel blobs, no mascots, no bouncy motion.

## Design Principles

1. **Instrument, not showroom.** Every pixel either carries information or gets out of the way. Decoration that survives the question "what does this tell me?" is rare.
2. **A number is worthless until you know what it excludes.** Admin visits, bot traffic, and internal IPs are filtered; the interface says so, visibly, next to the figure. Trust is built by showing the subtraction, not by hiding it.
3. **Never lose the writer's work.** Drafts survive reload, navigation, crash, and accidental close. This outranks every visual consideration in the editor.
4. **Speed is the feature.** Anything done more than twice gets a keyboard path. No confirmation dialog that a well-placed undo could replace.
5. **State the freshness, always.** Clarity's export API allows roughly ten calls a day over a three-day window, so this data is periodically snapshotted, never live. The interface must never imply real-time. Every panel carries its as-of time.

## Accessibility & Inclusion

- WCAG 2.1 AA contrast in both light and dark themes, including chart marks and their labels, not just body text.
- Full keyboard operation: every action reachable without a pointer, visible focus rings that survive both themes, logical tab order in the editor toolbar.
- Honour `prefers-reduced-motion`; the public site already does this globally and the admin must match.
- Never encode meaning in colour alone. Series in charts carry direct labels; status is carried by text, not a coloured dot on its own.
- Charts must stay readable under the common colour-vision deficiencies; verify categorical palettes rather than assuming.
