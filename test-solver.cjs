// 求解器单元测试：从 client.js 提取内部函数，验证帮选触发逻辑
const fs = require('node:fs')

let src = fs.readFileSync('client.js', 'utf8')
const m = /return \{\r?\n  inject: \['timer'\],/.exec(src)
if (!m) { console.error('marker not found'); process.exit(1) }
src = src.slice(0, m.index) + 'return { __t: { solveBoard, findGuess, findSafe, sigOf, makeCells, analyzeComponent } }\n'
const T = new Function(src)().__t

function mk(rows, cols) {
  const out = []
  for (let r = 0; r < rows; r++) {
    const row = []
    for (let c = 0; c < cols; c++) row.push({ mine: false, revealed: false, mark: 0, adj: 0, exploded: false })
    out.push(row)
  }
  return out
}

let failures = 0
function check(name, actual, expect) {
  const ok = JSON.stringify(actual) === JSON.stringify(expect)
  if (!ok) failures++
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name} — got ${JSON.stringify(actual)}`)
}

// 场景 1：2 选 1 —— 中心数字 1，恰剩 2 个未知邻居需 1 雷，其余全翻开
{
  const cells = mk(3, 3)
  cells[1][1].revealed = true; cells[1][1].adj = 1
  for (const p of [[0, 1], [0, 2], [1, 0], [1, 2], [2, 0], [2, 1]]) cells[p[0]][p[1]].revealed = true
  const g = T.findGuess({ cells, rows: 3, cols: 3, mines: 1 })
  check('2选1：触发且候选恰 2 格', g === null ? null : g.length, 2)
}

// 场景 2：可推断（唯一雷已被旗标）——不应触发
{
  const cells = mk(3, 3)
  cells[1][1].revealed = true; cells[1][1].adj = 1
  cells[0][0].mark = 1
  const g = T.findGuess({ cells, rows: 3, cols: 3, mines: 1 })
  check('可推断（旗已满足）不触发', g, null)
}

// 场景 3：四选二 —— 数字 2，恰剩 4 个签名相同的未知邻居需 2 雷，其余格全翻开
{
  const cells = mk(5, 5)
  cells[2][2].revealed = true; cells[2][2].adj = 2
  for (let r = 0; r < 5; r++) for (let c = 0; c < 5; c++) {
    const isDiag = (r === 1 || r === 3) && (c === 1 || c === 3)
    if (!isDiag && !(r === 2 && c === 2)) cells[r][c].revealed = true
  }
  const g = T.findGuess({ cells, rows: 5, cols: 5, mines: 2 })
  check('四选二：触发且候选恰 4 格', g === null ? null : g.length, 4)
}

// 场景 4：1-2-1 可由子集规则推断 —— 不应触发
// 顶行 3 个未翻开格，第二行数字 1-2-1（各剩 3 个未知邻居需 1/2/1 雷）
// 左 1 约束 A={a,b,c} k=1；中 2 约束 B={a,b,c} k=2；右 1 约束 C={a,b,c} k=1
// A ⊆ B → diff {} 无；B ⊆ A? 不。A 与 C 相同。需构造含子集关系的场景：
// 用两个重叠约束：A={x,y} k=1（左 1 只剩 2 未知邻居），B={x,y,z} k=2（中 2 剩 3 未知邻居）
// A ⊆ B → diff={z}, kd=1 → z 需 1 雷（非 0），推不出安全，反而推 z 是雷
// 换个能推安全的：A={x,y} k=1，B={x,y,z} k=1 → diff={z}, kd=0 → z 安全
{
  const cells = mk(3, 5)
  // 数字格 (1,1) adj=1，其未翻开邻居 {x=(0,0), y=(0,1)}；数字格 (1,2) adj=1，其未翻开邻居 {x,y,z=(0,2)}
  cells[1][1].revealed = true; cells[1][1].adj = 1
  cells[1][2].revealed = true; cells[1][2].adj = 1
  // 其余格全部翻开（安全）
  for (let r = 0; r < 3; r++) for (let c = 0; c < 5; c++) {
    if (!cells[r][c].revealed && !(r === 0 && c <= 2)) cells[r][c].revealed = true
  }
  const g = T.findGuess({ cells, rows: 3, cols: 5, mines: 1 })
  check('子集规则可推断(z 安全)不触发', g, null)
}

// 场景 5：全图两个独立的 2 选 1（两组各 1 雷，组内无法区分）——必须触发
{
  const cells = mk(3, 6)
  cells[1][0].revealed = true; cells[1][0].adj = 1
  cells[1][4].revealed = true; cells[1][4].adj = 1
  for (let r = 0; r < 3; r++) for (let c = 0; c < 6; c++) {
    const isUnknown = r === 0 && (c === 0 || c === 1 || c === 4 || c === 5)
    if (!isUnknown && !cells[r][c].revealed) cells[r][c].revealed = true
  }
  const g = T.findGuess({ cells, rows: 3, cols: 6, mines: 2 })
  check('全图两个2选1：触发且候选 2 格', g === null ? null : g.length, 2)
}

// 场景 6：传播规则推不出、回溯枚举可推出安全格
// 约束 x+y=1, x+z=1，全局恰 1 雷 → 唯一解 x=1,y=0,z=0 → y、z 必安全
{
  const comp = [
    { cells: new Set(['x', 'y']), k: 1 },
    { cells: new Set(['x', 'z']), k: 1 },
  ]
  const res = T.analyzeComponent(comp, ['x', 'y', 'z'], 1, 0)
  check('回溯枚举推出 y、z 必安全', res.forcedSafe, ['y', 'z'])
}

// 场景 7：findSafe 返回确定安全的格子
{
  const cells = mk(3, 3)
  cells[1][1].revealed = true; cells[1][1].adj = 1
  cells[0][0].mark = 1
  const s = T.findSafe({ cells, rows: 3, cols: 3, mines: 1 })
  check('findSafe 返回确定安全格', s !== null && typeof s.r === 'number' && typeof s.c === 'number', true)
}

console.log(failures === 0 ? 'ALL PASS' : `${failures} FAILURE(S)`)
process.exit(failures === 0 ? 0 : 1)
