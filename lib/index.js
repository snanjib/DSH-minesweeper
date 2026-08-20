// Node half of the minesweeper plugin: pure UI plugin, no host-side behavior.
// The empty apply exists so the plugin appears in the host cordis.yml / Loader;
// the browser half ships via exports["./client"], discovered through the
// package.json dsh.client declaration.
export function apply() {}
