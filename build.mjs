// 跨平台构建脚本：把 client.template.js 的 @@WHALE_*@@ 占位符替换为
// base64 data URI，生成自包含的 client.js，再包装成浏览器 bundle lib/client.js。
// 用法：node build.mjs（或 npm run build）
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))

// 1) base64 内嵌
let tpl = readFileSync(join(here, 'client.template.js'), 'utf8')
const MAP = { THINK: 'think', HAPPY: 'happy', SORRY: 'sorry', SMUG: 'smug' }
for (const [k, name] of Object.entries(MAP)) {
  const b64 = readFileSync(join(here, 'assets', 'web', `whale-${name}.webp`)).toString('base64')
  const chunks = []
  for (let i = 0; i < b64.length; i += 900) chunks.push(`'${b64.slice(i, i + 900)}'`)
  const expr = `'data:image/webp;base64,' +\n  ` + chunks.join(' +\n  ')
  tpl = tpl.replace(`'@@WHALE_${k}@@'`, expr)
  console.log(`${k}: ${b64.length} chars -> ${chunks.length} chunks`)
}
writeFileSync(join(here, 'client.js'), tpl)
console.log(`client.js written: ${tpl.length} bytes`)

// 2) 生成浏览器 bundle lib/client.js（__ModuleLoader__ 闭包工厂格式）
const pkg = JSON.parse(readFileSync(join(here, 'package.json'), 'utf8'))
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
const out = prelude + tpl + postlude
writeFileSync(join(here, 'lib', 'client.js'), out)
console.log(`lib/client.js written: ${out.length} bytes`)
