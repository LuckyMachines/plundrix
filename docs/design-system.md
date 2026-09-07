# Plundrix Design System

The living design system is available at `/design-system` in development. Production builds expose it only when `VITE_ENABLE_INTERNAL_TOOLS=true` is set deliberately.

## What it contains

- principles for hierarchy, pressure, consequences, player identity, proof, and progressive disclosure
- semantic color tokens with roles and usage guidance
- typography, spacing, shape, elevation, and motion scales
- shared buttons, form controls, status, identity, feedback, and transaction states
- the production gameplay shell and real action components
- ready, stunned, disabled, loading, empty, error, resolution, victory, and replay specimens
- inventory, crafting recipe, material wallet, owned, craftable, and equipped specimens
- mobile, tablet, and desktop composition previews
- motion, sound, accessibility, content-voice, terminology, and asset guidance
- a complete coverage map for public, gameplay, support, and internal surfaces

## Review workflow

1. Run `cd app && npm run dev`.
2. Open `http://localhost:5173/design-system`.
3. Add the reviewer name and system version in the review rail.
4. Mark each section `Approve` or `Needs work`, then assign P0/P1/P2 priority and a concrete section note.
5. Add cross-system notes in the review rail and filter to `Needs work` for the next iteration.
6. Export the JSON review and attach it to the implementation or design decision. Use Import to continue review on another device, or Reset to begin a new review cycle.

Review state is stored locally under `plundrix-design-system-review-v1`; it is never sent to analytics or a server.

## Change rules

- Update shared tokens or primitives before applying one-off screen patches.
- Review ready, hover, focus, pressed, disabled, loading, success, and error states.
- Verify desktop, mobile, readable, and reduced-motion modes.
- Keep one semantic job per accent: tungsten for primary progress, oxide for success/search, red for danger/sabotage, and blueprint for information/commitment.
- Keep advanced analysis behind details or dedicated internal routes.
- Use generated artwork for atmosphere and real UI captures or replays for product proof.
- Treat `app/art/` as the art source of truth. Every image needs a family, reusable parts, joy target, gameplay-truth constraints, delivery budget, alt treatment, and review state.

The complete asset-generation and delivery workflow lives in [art-pipeline.md](art-pipeline.md). The asset section of the living Design System reads that same manifest and exposes accepted, revision-needed, and reusable-part counts. The ten-signature, 1,200-configuration workshop model is documented in [gadget-inventory.md](gadget-inventory.md).

## Release gate

The design-system browser test verifies all 15 review sections, review persistence and filtering, the responsive preview, serious/critical accessibility findings, and mobile horizontal overflow. Responsive specimens use their own container width, so the mobile preview remains truthful even on a desktop review screen.
