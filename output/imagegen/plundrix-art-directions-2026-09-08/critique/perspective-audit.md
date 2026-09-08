# Perspective audit

Artifact: `../05-recommended-synthesis.png`

## Camera hypothesis

The synthesis is a straight-on, near-orthographic interface mockup rather than a photographed physical scene. Outer frame edges, panel rails, cards, and action plates remain parallel to the image axes. The mild object shading creates thickness, but there are no credible sets of converging physical lines from which to estimate a finite vanishing point.

- Vanishing point: not estimated
- Normalized coordinates: not applicable
- Horizon assumption: effectively at infinity for the front-facing interface plane
- Fit residual: not applicable
- Perspective overlay: intentionally not generated

Forcing a finite calibration onto these parallel UI edges would create false geometric evidence. Production implementation should preserve the frontal camera and use local shadow, overlap, scale, and parallax for depth rather than introducing inconsistent perspective.
