# Agent Guide

## Project

Daylú Dulce is a point-of-sale application for a paletería. Planned areas: sales dashboard (day/week/month), users and permissions, sales, inventory movements, point of sale, and expenses. UI and workflows are not yet approved; do not invent detailed requirements.

## Stack and boundaries

- Astro is the application framework. React powers the interactive dashboard; Tailwind CSS is available for styling, and Supabase is the planned data backend.
- Do not add, install, upgrade, or execute external dependencies/tools without the owner's explicit approval. You may suggest options and explain their purpose first.
- Do not connect to external services or create/modify cloud resources without approval.
- Keep business/private data out of source control. `Daylú Dulce.md` is temporary local reference material and must not be committed or published.
- Preserve existing user changes. Make only changes needed for the requested task.

## Development

- Follow existing project conventions and keep changes focused.
- Before starting the development server or running commands that change the environment, obtain explicit owner approval. If approved, start the server in background mode with `astro dev --background`; manage it with `astro dev status`, `astro dev logs`, and `astro dev stop`.
- Do not assume permission to install packages merely because a package is recommended.

## Design

- `design.md` is the visual-design source of truth and follows the Google Labs `design.md` format: https://github.com/google-labs-code/design.md
- Use the owner-requested pastel Mexican pink palette, warm cream surfaces, Spanish (Mexico) copy, and MXN formatting from `design.md`.
- Keep school-dashboard concepts out of the POS. The supplied template's sidebar-and-section-switching structure is adapted for Daylú Dulce.
- Clearly label sample data and local-only actions as demonstrations; do not imply they persist to Supabase.

## Documentation

- Keep `README.md` in Spanish and this guide in English.
- Consult the relevant Astro documentation before changing Astro routing, components, integrations, content, styling, or i18n: https://docs.astro.build
