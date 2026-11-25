# Changelog

## Current state

Home, Work and About use the marked-up proof design. The homepage leads straight from the first-person hero to Work. Five concept samples include case notes and playable edits. The section menu and project-type email controls work with keyboard and touch. Privacy and Terms are static. The owner studio uses the Node server for publishing.

## 2026-11-25 - Portfolio upload package

- Replaced draft timings and pricing placeholders with project-specific terms agreed in the quote.
- Packaged the complete site with the live Worker URL and WhatsApp handoff.

## 2026-11-25 - Margin Workers AI connection

- Replaced browser-side canned replies with a Cloudflare Worker connection, capped conversation history, and a ten-second fallback.
- Kept the chat widget's layout, controls, and reply bubbles.

## 2026-11-25 - Margin lead qualification

- Grounded Margin's answers in portfolio services, samples, pricing, and process.
- Required a listed service before accepting a project brief, checked each answer against the current step, and kept unrelated requests from advancing it.
- Added GitHub and Instagram profile links to the top bar on Home, Work, and About.

## 2026-11-25 - Margin chat interface

- Redesigned Margin as a corner chat window on desktop and a scroll-locked full-screen sheet on phones.
- Added chat bubbles, a typing indicator, unread replies, a multiline composer, and keyboard focus restoration. Kept the existing replies and project brief flow.

## 2026-11-25 - Margin portfolio chat

- Embedded Margin on Home, Work, and About. The widget answers common portfolio questions and prepares a brief for the visitor to send.
- Kept chat messages in the current page and preserved the existing contact form and email handoff.

## 2026-11-25 - Portfolio audit fixes

- Removed the full-screen intro so the portfolio is readable on first paint. Kept the on-page pen effects for visitors who allow motion.
- Tightened the mobile hero, gave both actions clear focus states, and enlarged interactive targets.
- Darkened muted copy and red text used on cream surfaces.
- Added section links, a footer update date, availability copy, a WebSite and Person graph, and a root llms.txt.
- Made the existing contact forms submit without JavaScript.

## 2026-11-25 - Viewport-aware sample comparisons

- Start home comparisons on Practice draft and play through the edit only while the panel is in view. Picking a stage or using the slider pauses autoplay for that sample.

## 2026-11-25 - Hero headline loop

- Replaced the headline switch button with four automatically rotating lines. The loop pauses offscreen and leaves a static headline in reduced-motion mode.

## 2026-11-25 - Collaboration and Morning Ritual edit

- Replaced the collaboration overview with four steps, a first-email checklist, and a fixed-project pricing explanation with editable terms.
- Added a three-sentence Morning Ritual practice draft and a marked-up comparison with three numbered edit notes on Home and Work.
- Softened the splash exit and section reveals, tuned the page crossfade, and made the cursor trail smoother across refresh rates.
- Removed the empty headshot placeholder from About and kept the existing portrait.

## 2026-11-25 - Contact cursor

- Use the native cursor on contact form fields and hide the custom cursor there, including when scrolling under a stationary pointer.

## 2026-11-25 - Services note

- Made the yellow Services note explain the purpose of each service as visitors move between options.

## 2026-11-25 - Formspree connection

- Connected the Home, Work, and About contact forms to the supplied Formspree endpoint.

## 2026-11-25 - Availability and inquiry fallback

- Marked availability as open year-round.
- Enabled contact fields with an email-draft fallback while no Formspree endpoint is configured.

## 2026-11-25 - Contact, case study, and search metadata

- Added a contact form, free headline teardown, and editable FAQ.
- Expanded the Local Gym sample into a concept case study with illustrative drafts.
- Added a custom 404, refined page metadata and keyboard focus, and adjusted image loading.

## 2026-11-25 - Editorial proof and share previews

- Added a side-by-side hero edit, annotations in Pen marks, and inbox/browser contexts for samples.
- Triggered heading highlights on entry into view and added a shared social image and page metadata.
- Added editable contact availability and a LinkedIn people search link.

## 2026-11-25 - Readability and navigation refinement

- Kept the Google Forms button and hid the feedback heading and feed area until configured.
- Removed standalone symbols, the floating Next control and the decorative footer pen.
- Increased the base type size and contrast, tightened About spacing and added an optional headshot slot.
- Clarified sample links, listed service deliverables and added brief onboarding details near Contact.
- Left proposed copy edits in HTML comments.

## 2026-11-25 - Cursor and hero cleanup

- Kept the custom pointer active during mouse scrolling and refreshed the element under it.
- Removed the Replay intro button. The arrival animation still plays.

## 2026-11-24 - Margin marks across the portfolio

- Spread 19 background marks across Home, Work, and About, up from 12. Added bracket, diamond, and dot motifs.

## 2026-11-24 - Google Form feedback and margin symbols

- Restored the Google Form link and replaced the native publishing form with a public feedback display.
- Added a Google Apps Script feed for consented responses.
- Added clearer groups of four hand-drawn symbols to the hero and Work backgrounds.

## 2026-11-24 - Sample interactions and native feedback

- Looped visible edit cards automatically, with manual stages and reduced-motion support.
- Added a writing reveal to opened samples, removed the misleading cursor label, and refined the Work layout.
- Added subtle background shapes and increased portrait size on Home and About.
- Replaced the external feedback form with a native, database-backed form and public list.

## 2026-11-24 - Distinct homepage examples

- Gave the hero paper its own headline and practice draft.
- Kept original featured samples and added distinct practice rewrites for their homepage comparisons.
- Used each service’s existing example in the preview note and separated the alternate hero headlines from sample titles.

## 2026-11-24 - Reading path and responsive hero

- Preserved the supplied once-per-session splash and linked its completion to the hero entrance.
- Fixed hero text clearance and the quote card overhang. Kept one headline control label.
- Added highlighted headings, directional marks, prominent actions, and on-page next steps to Home, Work, and About.
- Added a service preview using existing sample lines, an animated three-step editing sequence, and a labeled Next pill.
- Added reduced-motion handling for the scroll and opening effects. Refreshed shared asset versions.

## 2026-11-24 — pen5

- Updated stylesheet references on Home, Work, About, Privacy, Terms and Studio. Updated the shared script reference on Home, Work and About. All asset paths remain relative to the project.
- Added an instruction to the revision slider and an editorial explanation for each of the five original samples. Practice drafts are illustrative.
- Moved the red-pen flourish into the viewport and made it clear automatically.
- Isolated optional interaction initializers, guarded missing controls, restored the native pointer over the modal, and reduced redundant cursor label updates.
- Added this delivery record. No repository files were renamed or moved.
- Corrected the homepage navigation underline when JavaScript is disabled and cleared stale clipboard success text on failure.
