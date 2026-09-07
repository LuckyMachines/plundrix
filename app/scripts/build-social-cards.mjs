// Backward-compatible entry point. The recipes, copy, transforms, and budgets now
// live in the shared art pipeline instead of this one-off social-card script.
process.argv.splice(2, 0, 'build', '--family', 'social-source');
await import('./art-pipeline.mjs');
