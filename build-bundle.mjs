// Wraps client.js (the plain function body that returns a Cordis plugin) into
// the closure-factory artifact the DSH client module loader expects:
//   window.__ModuleLoader__.load({ id, factory: (require) => { ... } })
// The wrapper provides the same ambient globals the dynamic-plugin sandbox
// exposed (React via the module table, a styles.insert shim owning a
// data-plugin style tag so the loader removes it on unload).
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const pkg = JSON.parse(readFileSync(join(here, 'package.json'), 'utf8'))
const body = readFileSync(join(here, 'client.js'), 'utf8')

const id = JSON.stringify(pkg.name)
const prelude = `window.__ModuleLoader__.load({ id: ${id}, factory: (require) => {
var module = { exports: {} }; var exports = module.exports;
var React = require('react');
var styles = {
  insert: function (css) {
    var sel = 'style[data-plugin=' + JSON.stringify(${id}) + ']'
    var tag = (typeof document !== 'undefined') ? document.querySelector(sel) : null
    if (!tag && typeof document !== 'undefined') {
      tag = document.createElement('style')
      tag.dataset.plugin = ${id}
      tag.textContent = css
      document.head.appendChild(tag)
    }
    return function () { if (tag) tag.remove() }
  },
};
module.exports = (function () {
`

const postlude = `
})();
return module.exports; } });
`

mkdirSync(join(here, 'lib'), { recursive: true })
const out = prelude + body + postlude
writeFileSync(join(here, 'lib', 'client.js'), out)
console.log(`lib/client.js written: ${out.length} bytes`)
