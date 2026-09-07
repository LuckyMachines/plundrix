# Art source masters

This directory contains archival, editable-quality raster masters. These files are inputs to `npm run art:build`; product code must use optimized derivatives under `public/images/`.

- `scenes/` contains accepted or currently shipping scene masters.
- `parts/` contains accepted transparent reusable-part masters.
- `raw/` preserves unkeyed model responses and generated scene bases.
- `retired/` preserves superseded masters so replacements remain reversible.
- `candidates/` is temporary review space; rejected rasters may be removed after their decision and hashes are recorded.

Do not overwrite an accepted master while exploring. Save a versioned candidate, compare it in the real product crop, then update the manifest deliberately.

## Batch generation

Generate several manifest-backed candidates in sequence with:

```powershell
npm run art:generate-batch -- --assets part-precision-kit,part-signal-scanner,part-firewall
```

The local FLUX.2-pro wrapper owns the four-requests-per-minute throttle. The pipeline never promotes candidates automatically: inspect each processed image, record the decision in `reports/art-pipeline/generation-decisions.md`, and promote only an accepted version with `npm run art:promote -- --asset <id> --candidate <file>`.
