// 从伺服的 bundle 中提取鲸鱼娘 data URI 并验证完整性
const BUNDLE = process.argv[2]
const text = require('node:fs').readFileSync(BUNDLE, 'utf8')

// client.js 里 data URI 被写成多段字符串拼接：
//   'data:image/webp;base64,' +\n  'CHUNK' +\n  'CHUNK' ...
// 运行时它们拼成一个字符串；静态提取时需要重建这个拼接。
// 找出每个 const IMG_X = '...' 常量声明的完整区域，去掉引号和 + 拼接符。
const names = ['IMG_THINK', 'IMG_HAPPY', 'IMG_SORRY', 'IMG_SMUG']
let allOk = true
for (const name of names) {
  const start = text.indexOf(`const ${name} = `)
  if (start < 0) { console.log(`${name}: NOT FOUND`); allOk = false; continue }
  // 从声明开始截到行尾为纯标识符结尾（下一个顶层 const/let/function 或文件结构）
  const rest = text.slice(start)
  const m = rest.match(/'data:image\/webp;base64,'[\s\S]*?'(?=\s*(\nconst |\nlet |\nfunction |\n\/\/))|(?:'[^']+'\s*\+\s*\n\s*)+'[^']+'/)
  // 更简单可靠：逐字符扫描，收集所有被 + 连接的单引号字符串
  let i = rest.indexOf("'")
  let parts = []
  let idx = i
  while (idx < rest.length) {
    if (rest[idx] !== "'") { idx++; continue }
    const end = rest.indexOf("'", idx + 1)
    if (end < 0) break
    parts.push(rest.slice(idx + 1, end))
    // 看下一个非空白字符是否是 + 后跟另一个字符串
    let j = end + 1
    while (j < rest.length && /\s/.test(rest[j])) j++
    if (rest[j] === '+' ) {
      j++
      while (j < rest.length && /\s/.test(rest[j])) j++
      if (rest[j] === "'") { idx = j; continue }
    }
    break
  }
  const joined = parts.join('')
  const b64 = joined.replace(/^data:image\/webp;base64,/, '')
  const isB64 = /^[A-Za-z0-9+/=]+$/.test(b64)
  let magic = 'N/A'
  let ok = false
  if (isB64) {
    const buf = Buffer.from(b64, 'base64')
    magic = buf.slice(0, 4).toString('ascii') + '|' + buf.slice(8, 12).toString('ascii')
    ok = buf.slice(0, 4).toString('ascii') === 'RIFF' && buf.slice(8, 12).toString('ascii') === 'WEBP'
    console.log(`${name}: ${b64.length} chars, decode ${buf.length} bytes, magic=${magic}, VALID_WEBP=${ok}`)
  } else {
    console.log(`${name}: NOT pure base64 (len ${b64.length}) first50=${JSON.stringify(b64.slice(0, 50))}`)
  }
  if (!ok) allOk = false
}
console.log(allOk ? 'ALL IMAGES VALID' : 'SOME IMAGES BROKEN')
