// ===== DSH-Minesweeper — 纯客户端动态 Cordis 插件 =====
// 视觉：深海街机面板（自有深蓝色板，不随 GUI 主题变化）。
// 本文件为可读源码模板；build.ps1 会把 @@WHALE_*@@ 占位符替换为
// base64 data URI 并生成 lib/client.js。

const DIFFICULTIES = [
  { id: 'beginner', label: '初级 9×9', rows: 9, cols: 9, mines: 10 },
  { id: 'intermediate', label: '中级 16×16', rows: 16, cols: 16, mines: 40 },
  { id: 'expert', label: '高级 16×30', rows: 16, cols: 30, mines: 99 },
]

const IMG_THINK = '@@WHALE_THINK@@'
const IMG_HAPPY = '@@WHALE_HAPPY@@'
const IMG_SORRY = '@@WHALE_SORRY@@'
const IMG_SMUG = '@@WHALE_SMUG@@'

let activeDrag = null
let whaleTimer = null

// cell.mark: 0 = 无标记, 1 = 旗, 2 = 问号
function makeCells(rows, cols) {
  const cells = []
  for (let r = 0; r < rows; r++) {
    const row = []
    for (let c = 0; c < cols; c++) {
      row.push({ mine: false, revealed: false, mark: 0, adj: 0, exploded: false })
    }
    cells.push(row)
  }
  return cells
}

function neighbors(rows, cols, r, c) {
  const out = []
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue
      const nr = r + dr
      const nc = c + dc
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) out.push([nr, nc])
    }
  }
  return out
}

function cloneCells(cells) {
  return cells.map(function (row) {
    return row.map(function (c) {
      return { mine: c.mine, revealed: c.revealed, mark: c.mark, adj: c.adj, exploded: c.exploded }
    })
  })
}

function plantMines(cells, rows, cols, mines, safeR, safeC) {
  const forbidden = {}
  forbidden[safeR + ',' + safeC] = true
  const safe = neighbors(rows, cols, safeR, safeC)
  for (let i = 0; i < safe.length; i++) forbidden[safe[i][0] + ',' + safe[i][1]] = true
  const candidates = []
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (!forbidden[r + ',' + c]) candidates.push([r, c])
    }
  }
  for (let i = candidates.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const tmp = candidates[i]
    candidates[i] = candidates[j]
    candidates[j] = tmp
  }
  const chosen = candidates.slice(0, mines)
  for (let i = 0; i < chosen.length; i++) {
    cells[chosen[i][0]][chosen[i][1]].mine = true
  }
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      let n = 0
      const ns = neighbors(rows, cols, r, c)
      for (let i = 0; i < ns.length; i++) if (cells[ns[i][0]][ns[i][1]].mine) n++
      cells[r][c].adj = n
    }
  }
}

function reveal(cells, rows, cols, r, c) {
  const stack = [[r, c]]
  while (stack.length) {
    const cur = stack.pop()
    const cr = cur[0]
    const cc = cur[1]
    const cell = cells[cr][cc]
    if (cell.revealed || cell.mark !== 0) continue
    cell.revealed = true
    if (cell.mine) continue
    if (cell.adj === 0) {
      const ns = neighbors(rows, cols, cr, cc)
      for (let i = 0; i < ns.length; i++) {
        const nr = ns[i][0]
        const nc = ns[i][1]
        if (!cells[nr][nc].revealed && cells[nr][nc].mark === 0) stack.push([nr, nc])
      }
    }
  }
}

function countRevealedSafe(cells, rows, cols) {
  let n = 0
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) if (cells[r][c].revealed && !cells[r][c].mine) n++
  return n
}

function flagAllMines(cells, rows, cols) {
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) if (cells[r][c].mine) cells[r][c].mark = 1
}

function revealAllMines(cells, rows, cols) {
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) if (cells[r][c].mine) cells[r][c].revealed = true
}

function initialState(rows, cols, mines) {
  return { rows: rows, cols: cols, mines: mines, status: 'ready', cells: makeCells(rows, cols), elapsed: 0 }
}

function stepGame(state, action) {
  if (action.type === 'NEW') return initialState(action.rows, action.cols, action.mines)

  if (action.type === 'TICK') {
    if (state.status !== 'playing') return state
    return { rows: state.rows, cols: state.cols, mines: state.mines, status: state.status, cells: state.cells, elapsed: state.elapsed + 1 }
  }

  if (action.type === 'FLAG') {
    if (state.status === 'won' || state.status === 'lost') return state
    const cell = state.cells[action.r][action.c]
    if (cell.revealed) return state
    const cells = cloneCells(state.cells)
    cells[action.r][action.c].mark = (cells[action.r][action.c].mark + 1) % 3
    return { rows: state.rows, cols: state.cols, mines: state.mines, status: state.status, cells: cells, elapsed: state.elapsed }
  }

  if (action.type === 'REVEAL') {
    const r = action.r
    const c = action.c
    if (state.status === 'won' || state.status === 'lost') return state
    const orig = state.cells[r][c]
    if (orig.mark !== 0 || orig.revealed) return state
    let cells
    let status = state.status
    if (state.status === 'ready') {
      cells = cloneCells(state.cells)
      plantMines(cells, state.rows, state.cols, state.mines, r, c)
      status = 'playing'
    } else {
      cells = cloneCells(state.cells)
    }
    const cell = cells[r][c]
    if (cell.mine) {
      cell.exploded = true
      revealAllMines(cells, state.rows, state.cols)
      return { rows: state.rows, cols: state.cols, mines: state.mines, status: 'lost', cells: cells, elapsed: state.elapsed }
    }
    reveal(cells, state.rows, state.cols, r, c)
    if (countRevealedSafe(cells, state.rows, state.cols) === state.rows * state.cols - state.mines) {
      flagAllMines(cells, state.rows, state.cols)
      return { rows: state.rows, cols: state.cols, mines: state.mines, status: 'won', cells: cells, elapsed: state.elapsed }
    }
    return { rows: state.rows, cols: state.cols, mines: state.mines, status: status, cells: cells, elapsed: state.elapsed }
  }

  if (action.type === 'CHORD') {
    const r = action.r
    const c = action.c
    if (state.status !== 'playing') return state
    const cell = state.cells[r][c]
    if (!cell.revealed || cell.adj === 0) return state
    const ns = neighbors(state.rows, state.cols, r, c)
    let flags = 0
    for (let i = 0; i < ns.length; i++) if (state.cells[ns[i][0]][ns[i][1]].mark === 1) flags++
    if (flags !== cell.adj) return state
    const cells = cloneCells(state.cells)
    let hit = false
    for (let i = 0; i < ns.length; i++) {
      const nr = ns[i][0]
      const nc = ns[i][1]
      const n = cells[nr][nc]
      if (n.mark !== 0 || n.revealed) continue
      if (n.mine) { hit = true; continue }
      reveal(cells, state.rows, state.cols, nr, nc)
    }
    if (hit) {
      for (let i = 0; i < ns.length; i++) {
        const nr = ns[i][0]
        const nc = ns[i][1]
        if (cells[nr][nc].mine && cells[nr][nc].mark === 0) cells[nr][nc].exploded = true
      }
      revealAllMines(cells, state.rows, state.cols)
      return { rows: state.rows, cols: state.cols, mines: state.mines, status: 'lost', cells: cells, elapsed: state.elapsed }
    }
    if (countRevealedSafe(cells, state.rows, state.cols) === state.rows * state.cols - state.mines) {
      flagAllMines(cells, state.rows, state.cols)
      return { rows: state.rows, cols: state.cols, mines: state.mines, status: 'won', cells: cells, elapsed: state.elapsed }
    }
    return { rows: state.rows, cols: state.cols, mines: state.mines, status: state.status, cells: cells, elapsed: state.elapsed }
  }

  return state
}

function sigOf(cells, rows, cols, r, c) {
  const sig = []
  const ns = neighbors(rows, cols, r, c)
  for (let i = 0; i < ns.length; i++) {
    const nc = cells[ns[i][0]][ns[i][1]]
    if (nc.revealed && nc.adj > 0) sig.push(ns[i][0] + ',' + ns[i][1])
  }
  sig.sort()
  return sig.join('|')
}

// ── 帮选触发：完整约束求解器 ──────────────────────────────────
// 先做约束传播（数字约束 + 全局雷数 + 子集规则）；
// 仅当推不出任何安全格（不得不猜）时才触发帮选，
// 候选取最小「对等组」（约束签名相同的格子群）：2 选 1、四选二等。

function keyOf(r, c) { return r + ',' + c }

function parseKey(k) {
  const i = k.indexOf(',')
  return [parseInt(k.slice(0, i), 10), parseInt(k.slice(i + 1), 10)]
}

function isSubset(a, b) {
  if (a.size > b.size) return false
  for (const x of a) if (!b.has(x)) return false
  return true
}

// 连通分量分组（约束共享格子即连通）
function componentsOf(constraints) {
  const parent = []
  for (let i = 0; i < constraints.length; i++) parent.push(i)
  function find(x) { while (parent[x] !== x) { parent[x] = parent[parent[x]]; x = parent[x] } return x }
  function union(a, b) { const ra = find(a); const rb = find(b); if (ra !== rb) parent[ra] = rb }
  const keyToCons = {}
  for (let i = 0; i < constraints.length; i++) {
    for (const k of constraints[i].cells) {
      if (keyToCons[k] !== undefined) union(i, keyToCons[k])
      else keyToCons[k] = i
    }
  }
  const groups = {}
  for (let i = 0; i < constraints.length; i++) {
    const r = find(i)
    if (!groups[r]) groups[r] = []
    groups[r].push(i)
  }
  const out = []
  for (const r in groups) out.push(groups[r].map(function (i) { return constraints[i] }))
  return out
}

// 回溯枚举一个分量的所有合法雷分配（全局雷数作上限剪枝），
// 返回在所有解中都安全的格子（forcedSafe）
function analyzeComponent(comp, keys, maxMines, otherUnknown) {
  const cellCons = {}
  for (let i = 0; i < comp.length; i++) {
    for (const x of comp[i].cells) {
      if (!cellCons[x]) cellCons[x] = []
      cellCons[x].push(i)
    }
  }
  const cnt = new Array(comp.length).fill(0)
  const open = new Array(comp.length).fill(0)
  for (let i = 0; i < comp.length; i++) open[i] = comp[i].cells.size
  const assigned = {}
  const canMine = {}
  const canSafe = {}
  let anySolution = false

  function assign(key, isMine) {
    assigned[key] = isMine
    const list = cellCons[key] || []
    for (let i = 0; i < list.length; i++) {
      if (isMine) cnt[list[i]]++
      open[list[i]]--
    }
  }
  function unassign(key, isMine) {
    delete assigned[key]
    const list = cellCons[key] || []
    for (let i = 0; i < list.length; i++) {
      if (isMine) cnt[list[i]]--
      open[list[i]]++
    }
  }
  function partialOk(key) {
    const list = cellCons[key] || []
    for (let i = 0; i < list.length; i++) {
      const c = comp[list[i]]
      if (cnt[list[i]] > c.k || cnt[list[i]] + open[list[i]] < c.k) return false
    }
    return true
  }
  function rec(idx, minesUsed) {
    if (minesUsed > maxMines) return
    const left = keys.length - idx
    if (minesUsed + left + otherUnknown < maxMines) return
    if (idx === keys.length) {
      anySolution = true
      for (let i = 0; i < keys.length; i++) {
        if (assigned[keys[i]]) canMine[keys[i]] = true
        else canSafe[keys[i]] = true
      }
      return
    }
    const key = keys[idx]
    assign(key, 0)
    if (partialOk(key)) rec(idx + 1, minesUsed)
    unassign(key, 0)
    assign(key, 1)
    if (partialOk(key)) rec(idx + 1, minesUsed + 1)
    unassign(key, 1)
  }
  rec(0, 0)

  if (!anySolution) return { contradictory: true, forcedSafe: [] }
  const forcedSafe = []
  for (let i = 0; i < keys.length; i++) {
    const k = keys[i]
    if (canMine[k] !== true && canSafe[k] === true) forcedSafe.push(k)
  }
  return { contradictory: false, forcedSafe: forcedSafe }
}

function solveBoard(cells, rows, cols, mines) {
  const safeSet = new Set()
  const mineSet = new Set()

  const unknownAll = new Set()
  let flagged = 0
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = cells[r][c]
      if (cell.mark === 1) flagged++
      else if (!cell.revealed) unknownAll.add(keyOf(r, c))
    }
  }
  const R = mines - flagged
  if (R < 0 || R > unknownAll.size) {
    // 旗数与雷数矛盾（旗插错）：不触发帮选
    return { contradictory: true, safe: [], unknown: [], constraints: [] }
  }

  const constraints = [{ cells: new Set(unknownAll), k: R }]
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = cells[r][c]
      if (!cell.revealed || cell.adj === 0) continue
      const ns = neighbors(rows, cols, r, c)
      const S = new Set()
      let f = 0
      for (let i = 0; i < ns.length; i++) {
        const n = cells[ns[i][0]][ns[i][1]]
        if (n.mark === 1) f++
        else if (!n.revealed) S.add(keyOf(ns[i][0], ns[i][1]))
      }
      const k = cell.adj - f
      if (S.size > 0 && k >= 0 && k <= S.size) constraints.push({ cells: S, k })
    }
  }

  let changed = true
  let guard = 0
  while (changed && guard < 200) {
    changed = false
    guard++
    for (let i = 0; i < constraints.length; i++) {
      const cons = constraints[i]
      for (const m of mineSet) if (cons.cells.delete(m)) cons.k--
      for (const s of safeSet) cons.cells.delete(s)
      if (cons.cells.size === 0) continue
      if (cons.k === 0) {
        for (const s of cons.cells) if (!safeSet.has(s)) { safeSet.add(s); changed = true }
        cons.cells.clear()
        continue
      }
      if (cons.k === cons.cells.size) {
        for (const m of cons.cells) if (!mineSet.has(m)) { mineSet.add(m); changed = true }
        cons.cells.clear()
        continue
      }
      for (let j = 0; j < constraints.length; j++) {
        if (i === j) continue
        const other = constraints[j]
        if (other.cells.size === 0) continue
        if (isSubset(cons.cells, other.cells)) {
          const diff = []
          for (const x of other.cells) if (!cons.cells.has(x)) diff.push(x)
          if (diff.length === 0) continue
          const kd = other.k - cons.k
          if (kd === 0) {
            for (const s of diff) if (!safeSet.has(s)) { safeSet.add(s); changed = true }
          } else if (kd === diff.length) {
            for (const m of diff) if (!mineSet.has(m)) { mineSet.add(m); changed = true }
          }
        }
      }
    }
  }

  // 完备性补充：传播无安全格时，对连通约束分量回溯枚举，
  // 找出所有合法雷分配中都安全的格子（传播规则推不出的那部分）
  if (safeSet.size === 0 && unknownAll.size > 0) {
    const locals = constraints.slice(1).filter(function (c) { return c.cells.size > 0 })
    const comps = componentsOf(locals)
    for (let i = 0; i < comps.length; i++) {
      const keys = new Set()
      for (let j = 0; j < comps[i].length; j++) {
        for (const k of comps[i][j].cells) keys.add(k)
      }
      const keyList = Array.from(keys)
      if (keyList.length > 24) continue
      const otherUnknown = unknownAll.size - safeSet.size - mineSet.size - keyList.length
      const res = analyzeComponent(comps[i], keyList, R, otherUnknown)
      if (res.contradictory) continue
      for (let j = 0; j < res.forcedSafe.length; j++) {
        const s = res.forcedSafe[j]
        if (!mineSet.has(s)) safeSet.add(s)
      }
    }
  }

  const safe = []
  for (const s of safeSet) if (!mineSet.has(s)) safe.push(s)
  const unknown = []
  for (const k of unknownAll) if (!safeSet.has(k) && !mineSet.has(k)) unknown.push(k)
  return { contradictory: false, safe: safe, unknown: unknown, constraints: constraints }
}

let guessCacheGame = null
let guessCacheResult = null

function findGuess(game) {
  if (game === guessCacheGame) return guessCacheResult
  guessCacheGame = game

  const solver = solveBoard(game.cells, game.rows, game.cols, game.mines)
  if (solver.contradictory || solver.safe.length > 0 || solver.unknown.length === 0) {
    guessCacheResult = null
    return null
  }

  // 必须猜：局部约束中的未知格按约束签名分组，取最小对等组
  const inConstraint = new Set()
  for (let i = 1; i < solver.constraints.length; i++) {
    for (const k of solver.constraints[i].cells) inConstraint.add(k)
  }
  const groups = {}
  for (const k of inConstraint) {
    const p = parseKey(k)
    const sig = sigOf(game.cells, game.rows, game.cols, p[0], p[1])
    if (!groups[sig]) groups[sig] = []
    groups[sig].push(k)
  }
  let best = null
  for (const sig in groups) {
    const g = groups[sig]
    if (g.length >= 2 && (best === null || g.length < best.length)) best = g
  }
  let pick
  if (best !== null) pick = best
  else if (inConstraint.size > 0) pick = Array.from(inConstraint)
  else pick = solver.unknown
  guessCacheResult = pick.map(function (k) {
    const p = parseKey(k)
    return { r: p[0], c: p[1] }
  })
  return guessCacheResult
}

// 所有未翻开、未插旗的格子（无卡死候选时随机选用的兜底池）
function allUnrevealed(game) {
  const out = []
  for (let r = 0; r < game.rows; r++) {
    for (let c = 0; c < game.cols; c++) {
      const cell = game.cells[r][c]
      if (!cell.revealed && cell.mark !== 1) out.push({ r: r, c: c })
    }
  }
  return out
}

function led(n, width) {
  const s = String(n)
  return n < 0 ? s : s.padStart(width, '0')
}

// 键位编码：'m0'/'m1'/'m2' = 鼠标左/中/右；'dbl' = 双击；'k-x' = 键盘键；'none' = 未绑定
function bindLabel(b) {
  if (b === 'm0') return '左键'
  if (b === 'm1') return '中键'
  if (b === 'm2') return '右键'
  if (b === 'dbl') return '双击'
  if (b === 'none') return '未绑定'
  if (b && b.slice(0, 2) === 'k-') return b.slice(2).toUpperCase() + ' 键'
  return String(b)
}

const SETTINGS_KEY = 'dsh-minesweeper:settings'

function loadSettings() {
  const def = {
    reveal: 'm0',
    flag: 'm2',
    chord: 'dbl',
    customRows: 9,
    customCols: 9,
    customMines: 10,
  }
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(SETTINGS_KEY)
      if (raw) {
        const s = JSON.parse(raw)
        if (s && typeof s.reveal === 'string') def.reveal = s.reveal
        if (s && typeof s.flag === 'string') def.flag = s.flag
        if (s && typeof s.chord === 'string') def.chord = s.chord
        if (s && typeof s.customRows === 'number') def.customRows = s.customRows
        if (s && typeof s.customCols === 'number') def.customCols = s.customCols
        if (s && typeof s.customMines === 'number') def.customMines = s.customMines
      }
    }
  } catch (err) {}
  return def
}

function saveSettings(s) {
  try {
    if (typeof localStorage !== 'undefined') localStorage.setItem(SETTINGS_KEY, JSON.stringify(s))
  } catch (err) {}
}

// 求解器推出一个确定安全的格子（传播 + 回溯），或 null
function findSafe(game) {
  const solver = solveBoard(game.cells, game.rows, game.cols, game.mines)
  if (solver.contradictory || solver.safe.length === 0) return null
  const p = parseKey(solver.safe[0])
  return { r: p[0], c: p[1] }
}

// ── 深海街机色板（自有，跨浅/深主题恒定）──────────────────────────
const CSS = `
.ms-btn {
  position: fixed;
  right: 24px;
  bottom: 24px;
  z-index: 1000;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  border-radius: 999px;
  border: 1px solid #2c3f6e;
  background: linear-gradient(180deg, #1d2c55 0%, #131f40 100%);
  color: #edf2ff;
  font-family: system-ui, -apple-system, 'Segoe UI', 'Microsoft YaHei', sans-serif;
  font-size: 13.5px;
  font-weight: 600;
  letter-spacing: 0.02em;
  cursor: pointer;
  user-select: none;
  pointer-events: auto;
  box-shadow: 0 8px 28px rgba(10, 18, 40, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.08);
  transition: transform 0.15s ease, filter 0.15s ease;
}
.ms-btn:hover { filter: brightness(1.14); transform: translateY(-1px); }
.ms-btn:active { transform: translateY(0); }
.ms-btn:focus-visible { outline: 2px solid #6fa8ff; outline-offset: 2px; }
.ms-btn .ms-btn-ico { font-size: 16px; line-height: 1; }

.ms-win {
  position: fixed;
  border-radius: 16px;
  border: 1px solid #2c3f6e;
  background: #0f1a36;
  color: #e8eeff;
  font-family: system-ui, -apple-system, 'Segoe UI', 'Microsoft YaHei', sans-serif;
  box-shadow: 0 24px 64px rgba(8, 14, 32, 0.55), 0 2px 8px rgba(8, 14, 32, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.06);
  z-index: 1000;
  user-select: none;
  touch-action: none;
  animation: ms-in 0.28s cubic-bezier(0.22, 1, 0.36, 1);
}

.ms-win-inner {
  overflow: hidden;
  border-radius: 15px;
}

.ms-header {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 8px 12px;
  background: linear-gradient(180deg, #1b2b57 0%, #14203f 100%);
  border-bottom: 1px solid #2c3f6e;
  cursor: grab;
}
.ms-header:active { cursor: grabbing; }
.ms-header-row {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  min-width: 0;
}
.ms-title {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: baseline;
  gap: 8px;
  font-size: 14px;
  font-weight: 700;
  color: #f2f6ff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.ms-title-sub {
  font-size: 9.5px;
  font-weight: 600;
  letter-spacing: 0.18em;
  color: #7e93c4;
  flex: none;
}
.ms-header-actions {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: none;
}

.ms-select {
  background: #0c1631;
  color: #d7e2fa;
  border: 1px solid #2c3f6e;
  border-radius: 8px;
  padding: 4px 6px;
  font-size: 12px;
  font-family: inherit;
  cursor: pointer;
  max-width: 100%;
}
.ms-select:hover { border-color: #3d5490; }
.ms-select:focus-visible { outline: 2px solid #6fa8ff; outline-offset: 1px; }

.ms-iconbtn {
  width: 32px;
  height: 32px;
  flex: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #1a2a55;
  border: 1px solid #2c3f6e;
  border-radius: 9px;
  color: #e8eeff;
  font-size: 15px;
  line-height: 1;
  cursor: pointer;
  transition: filter 0.12s ease, transform 0.12s ease, box-shadow 0.12s ease;
}
.ms-iconbtn:hover { filter: brightness(1.16); }
.ms-iconbtn:active { transform: scale(0.93); }
.ms-iconbtn:focus-visible { outline: 2px solid #6fa8ff; outline-offset: 2px; }
.ms-iconbtn.ms-face--won { box-shadow: 0 0 0 2px rgba(52, 211, 153, 0.55); border-color: #1f7a5c; }
.ms-iconbtn.ms-face--lost { box-shadow: 0 0 0 2px rgba(244, 63, 94, 0.55); border-color: #a02840; }
.ms-iconbtn--active { border-color: #3a66ff; box-shadow: 0 0 0 2px rgba(58, 102, 255, 0.4); }

.ms-statusbar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #0f1a36;
  border-bottom: 1px solid #1e2c4f;
}
.ms-spacer { flex: 1; }

.ms-actions {
  display: flex;
  gap: 8px;
  padding: 6px 12px;
  background: #0f1a36;
  border-bottom: 1px solid #1e2c4f;
}
.ms-actions .ms-ai-btn { flex: 1; justify-content: center; }

.ms-led {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  background: #0a1226;
  border: 1px solid #223257;
  border-radius: 8px;
  font-family: ui-monospace, 'Cascadia Mono', Consolas, monospace;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.06em;
  font-variant-numeric: tabular-nums;
  box-shadow: inset 0 2px 6px rgba(0, 0, 0, 0.5);
}
.ms-led--mines { color: #ff6b81; }
.ms-led--timer { color: #ffc24d; }

.ms-ai-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border: none;
  border-radius: 999px;
  background: linear-gradient(180deg, #3a66ff 0%, #2144de 100%);
  color: #ffffff;
  font-size: 12.5px;
  font-weight: 700;
  letter-spacing: 0.02em;
  font-family: inherit;
  cursor: pointer;
  box-shadow: 0 2px 10px rgba(37, 80, 255, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.22);
  transition: filter 0.12s ease, transform 0.12s ease;
  animation: ms-in 0.22s cubic-bezier(0.22, 1, 0.36, 1), ms-ai-attention 1.7s ease 0.35s 2;
}
.ms-ai-btn:hover { filter: brightness(1.1); transform: translateY(-1px); }
.ms-ai-btn:active { transform: translateY(0); }
.ms-ai-btn:focus-visible { outline: 2px solid #9dbcff; outline-offset: 2px; }
.ms-ai-btn:disabled { opacity: 0.45; cursor: not-allowed; filter: none; transform: none; animation: none; }
.ms-ai-btn-img {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  object-fit: cover;
  border: 1px solid rgba(255, 255, 255, 0.55);
  flex: none;
}

.ms-stage { position: relative; }
.ms-board {
  display: grid;
  gap: 2px;
  padding: 12px;
  background: #0b1428;
  box-shadow: inset 0 2px 10px rgba(0, 0, 0, 0.45);
}

.ms-cell {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 700;
  line-height: 1;
  border: none;
  padding: 0;
  border-radius: 5px;
  cursor: pointer;
  color: #e8eeff;
  background: linear-gradient(180deg, #34497d 0%, #2a3b69 100%);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.14), 0 1px 2px rgba(5, 10, 24, 0.5);
  transition: filter 0.1s ease, transform 0.1s ease;
}
.ms-cell:hover { filter: brightness(1.2); }
.ms-cell:active { transform: scale(0.9); filter: brightness(0.95); }
.ms-cell:focus-visible { outline: 2px solid #6fa8ff; outline-offset: -2px; }
.ms-cell.revealed {
  background: #17233f;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.4);
  cursor: default;
}
.ms-cell.mine-shown { color: #93a7d4; }
.ms-cell.exploded {
  background: #f43f5e;
  color: #ffffff;
  box-shadow: 0 0 12px rgba(244, 63, 94, 0.6);
}
.ms-cell.num1 { color: #6fa8ff; }
.ms-cell.num2 { color: #52c789; }
.ms-cell.num3 { color: #ff7a93; }
.ms-cell.num4 { color: #b79cff; }
.ms-cell.num5 { color: #ff9a62; }
.ms-cell.num6 { color: #4fd8ce; }
.ms-cell.num7 { color: #c9d6f2; }
.ms-cell.num8 { color: #8fa3cc; }

.ms-ring {
  position: absolute;
  inset: 1px;
  border: 2.5px solid #ff3b5c;
  border-radius: 50%;
  pointer-events: none;
  box-shadow: 0 0 0 2px rgba(255, 59, 92, 0.25), 0 0 14px rgba(255, 59, 92, 0.55);
  animation: ms-ring 1.15s ease-in-out infinite;
}

.ms-whale {
  position: absolute;
  top: 20px;
  z-index: 40;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
  pointer-events: none;
  animation: ms-in 0.3s cubic-bezier(0.22, 1, 0.36, 1);
}
.ms-whale--right { left: calc(100% + 12px); }
.ms-whale--left { right: calc(100% + 12px); }
.ms-whale-body {
  position: relative;
  pointer-events: auto;
  animation: ms-bob 3.2s ease-in-out infinite;
}
.ms-whale-img {
  display: block;
  width: 88px;
  height: 88px;
  object-fit: cover;
  border-radius: 20px;
  border: 2px solid #3d5490;
  box-shadow: 0 10px 30px rgba(5, 10, 24, 0.55), 0 0 0 4px rgba(255, 255, 255, 0.04);
}
.ms-whale-close {
  position: absolute;
  top: -8px;
  right: -8px;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #16224a;
  color: #c9d6f2;
  border: 1px solid #2c3f6e;
  font-size: 11px;
  line-height: 1;
  cursor: pointer;
  pointer-events: auto;
}
.ms-whale-close:hover { background: #f43f5e; color: #ffffff; border-color: #f43f5e; }
.ms-whale-close:focus-visible { outline: 2px solid #6fa8ff; outline-offset: 1px; }

.ms-bubble {
  position: relative;
  max-width: 210px;
  padding: 9px 13px;
  border-radius: 14px;
  border-top-left-radius: 4px;
  background: #ffffff;
  color: #1a2a55;
  font-size: 12.5px;
  font-weight: 700;
  line-height: 1.45;
  box-shadow: 0 8px 24px rgba(5, 10, 24, 0.4);
  pointer-events: auto;
}

.ms-hint {
  padding: 7px 12px;
  font-size: 11px;
  color: #7e93c4;
  background: #0f1a36;
  border-top: 1px solid #1e2c4f;
}

.ms-settings {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  background: #0b1428;
}
.ms-settings-title {
  font-size: 14px;
  font-weight: 700;
  color: #f2f6ff;
}
.ms-settings-section {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: #7e93c4;
  margin-bottom: -4px;
}
.ms-settings-field {
  display: flex;
  align-items: center;
  gap: 8px;
}
.ms-settings-label {
  flex: 1;
  min-width: 0;
  font-size: 12.5px;
  color: #c9d6f2;
}
.ms-settings-bind {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  min-width: 52px;
  justify-content: center;
  background: #0c1631;
  color: #d7e2fa;
  border: 1px solid #2c3f6e;
  border-radius: 8px;
  font-size: 12px;
  font-family: inherit;
  cursor: pointer;
}
.ms-settings-bind:hover { border-color: #3d5490; }
.ms-settings-bind--listening {
  border-color: #ff9a62;
  color: #ffc24d;
  box-shadow: 0 0 0 2px rgba(255, 154, 98, 0.3);
}
.ms-settings-keybtn {
  padding: 4px 8px;
  background: #1a2a55;
  color: #c9d6f2;
  border: 1px solid #2c3f6e;
  border-radius: 8px;
  font-size: 11px;
  font-family: inherit;
  cursor: pointer;
}
.ms-settings-keybtn:hover { filter: brightness(1.15); }
.ms-settings-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}
.ms-settings-num {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.ms-settings-num span {
  font-size: 11px;
  color: #7e93c4;
}
.ms-settings-num input {
  width: 100%;
  padding: 4px 6px;
  background: #0c1631;
  color: #e8eeff;
  border: 1px solid #2c3f6e;
  border-radius: 8px;
  font-size: 13px;
  font-family: ui-monospace, Consolas, monospace;
}
.ms-settings-num input:focus-visible { outline: 2px solid #6fa8ff; outline-offset: 1px; }
.ms-settings-note {
  font-size: 11px;
  color: #7e93c4;
}
.ms-settings-done {
  margin-top: 4px;
  align-self: flex-start;
  padding: 8px 16px;
  border: none;
  border-radius: 8px;
  background: linear-gradient(180deg, #3a66ff 0%, #2144de 100%);
  color: #ffffff;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
}
.ms-settings-done:hover { filter: brightness(1.1); }
.ms-settings-done:focus-visible { outline: 2px solid #9dbcff; outline-offset: 2px; }

@keyframes ms-in {
  from { opacity: 0; transform: scale(0.94) translateY(6px); }
  to { opacity: 1; transform: none; }
}
@keyframes ms-bob {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-4px); }
}
@keyframes ms-ring {
  0%, 100% { transform: scale(0.86); opacity: 0.85; }
  50% { transform: scale(1.04); opacity: 1; }
}
@keyframes ms-ai-attention {
  0%, 100% { box-shadow: 0 2px 10px rgba(37, 80, 255, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.22); }
  50% { box-shadow: 0 2px 20px rgba(37, 80, 255, 0.9), inset 0 1px 0 rgba(255, 255, 255, 0.22); }
}
@media (prefers-reduced-motion: reduce) {
  .ms-win, .ms-whale, .ms-whale-body, .ms-ai-btn, .ms-ring { animation: none; }
  .ms-cell, .ms-ai-btn, .ms-iconbtn, .ms-btn { transition: none; }
}
`

return {
  inject: ['timer'],
  apply(ctx) {
    styles.insert(CSS)

    const slots = ctx.get('slots')
    if (slots === undefined) return

    function Cell(props) {
      const cell = props.cell
      let cls = 'ms-cell'
      let content = null
      if (cell.revealed) {
        cls += ' revealed'
        if (cell.mine) {
          content = '💣'
          if (cell.exploded) cls += ' exploded'
          else cls += ' mine-shown'
        } else if (cell.adj > 0) {
          content = String(cell.adj)
          cls += ' num' + cell.adj
        }
      } else if (cell.mark === 1) {
        content = '🚩'
      } else if (cell.mark === 2) {
        content = '❓'
      }
      const ring = props.suggested ? React.createElement('span', { className: 'ms-ring' }) : null

      function fireByBinding(binding) {
        const ops = []
        if (binding === props.revealBinding) ops.push('reveal')
        if (binding === props.flagBinding) ops.push('flag')
        if (binding === props.chordBinding) ops.push('chord')
        if (ops.length === 0) return
        if (ops.length === 1) {
          if (ops[0] === 'reveal') props.onReveal()
          else if (ops[0] === 'flag') props.onFlag()
          else props.onChord()
          return
        }
        // 同键多操作：按格子状态智能分发
        if (cell.revealed) {
          if (ops.indexOf('chord') >= 0) props.onChord()
        } else if (cell.mark !== 0) {
          if (ops.indexOf('flag') >= 0) props.onFlag()
        } else {
          if (ops.indexOf('reveal') >= 0) props.onReveal()
          else if (ops.indexOf('flag') >= 0) props.onFlag()
        }
      }

      function mouseDown(e) {
        e.preventDefault()
        fireByBinding('m' + e.button)
      }
      function dblClick(e) {
        e.preventDefault()
        fireByBinding('dbl')
      }

      const handlers = {
        onMouseDown: mouseDown,
        onMouseEnter: function () { props.hoverRef.current = { r: props.r, c: props.c } },
        onMouseLeave: function () { if (props.hoverRef.current) props.hoverRef.current = null },
      }
      if (props.revealBinding === 'dbl' || props.flagBinding === 'dbl' || props.chordBinding === 'dbl') {
        handlers.onDoubleClick = dblClick
      }

      return React.createElement('button', Object.assign({ className: cls, type: 'button' }, handlers), content, ring)
    }

    function WhaleBubble(props) {
      const cls = 'ms-whale ' + (props.side === 'left' ? 'ms-whale--left' : 'ms-whale--right')
      return React.createElement('div', { className: cls },
        React.createElement('div', { className: 'ms-whale-body' },
          React.createElement('img', { className: 'ms-whale-img', src: props.img, alt: '鲸鱼娘' }),
          React.createElement('button', { className: 'ms-whale-close', type: 'button', title: '关闭', onClick: props.onClose }, '✕'),
        ),
        React.createElement('div', { className: 'ms-bubble' }, props.text),
      )
    }

    function GameWindow(props) {
      const [difficulty, setDifficulty] = React.useState('beginner')
      const [game, setGame] = React.useState(function () { return initialState(9, 9, 10) })
      const [pos, setPos] = React.useState(null)
      const [suggestion, setSuggestion] = React.useState(null)
      const [whaleMsg, setWhaleMsg] = React.useState(null)
      const [settings, setSettings] = React.useState(loadSettings)
      const [showSettings, setShowSettings] = React.useState(false)
      const [bindingOp, setBindingOp] = React.useState(null)
      const hoverRef = React.useRef(null)

      let preset = DIFFICULTIES[0]
      for (let i = 0; i < DIFFICULTIES.length; i++) if (DIFFICULTIES[i].id === difficulty) preset = DIFFICULTIES[i]
      if (difficulty === 'custom') {
        preset = { id: 'custom', label: '自定义', rows: settings.customRows, cols: settings.customCols, mines: settings.customMines }
      }

      React.useEffect(function () {
        if (game.status !== 'playing') return undefined
        return ctx.interval(function () {
          setGame(function (s) { return stepGame(s, { type: 'TICK' }) })
        }, 1000)
      }, [game.status])

      React.useEffect(function () {
        return function () {
          if (whaleTimer) { whaleTimer(); whaleTimer = null }
        }
      }, [])

      // 键盘键位：全局 keydown，作用到当前悬停的格子
      React.useEffect(function () {
        function onKey(e) {
          if (bindingOp) return
          const b = 'k-' + e.key.toLowerCase()
          const h = hoverRef.current
          if (!h) return
          if (b === settings.reveal) { e.preventDefault(); handleReveal(h.r, h.c) }
          else if (b === settings.flag) { e.preventDefault(); handleFlag(h.r, h.c) }
          else if (b === settings.chord) { e.preventDefault(); handleChord(h.r, h.c) }
        }
        window.addEventListener('keydown', onKey)
        return function () { window.removeEventListener('keydown', onKey) }
      }, [settings, game, bindingOp])

      // 键盘键绑定监听：bindingOp 激活时，下一次键盘按键绑定到该操作
      React.useEffect(function () {
        if (!bindingOp) return undefined
        function onKey(e) {
          e.preventDefault()
          e.stopPropagation()
          if (e.key === 'Escape') { setBindingOp(null); return }
          updateBinding(bindingOp, 'k-' + e.key.toLowerCase())
          setBindingOp(null)
        }
        window.addEventListener('keydown', onKey, true)
        return function () {
          window.removeEventListener('keydown', onKey, true)
        }
      }, [bindingOp])

      function dispatch(action) {
        setGame(function (s) { return stepGame(s, action) })
      }

      function clearWhale() {
        if (whaleTimer) { whaleTimer(); whaleTimer = null }
        setSuggestion(null)
        setWhaleMsg(null)
      }

      function updateBinding(op, binding) {
        setSettings(function (prev) {
          const next = Object.assign({}, prev)
          function conflict(a, b) {
            return a === 'flag' || b === 'flag'
          }
          const others = ['reveal', 'flag', 'chord'].filter(function (x) { return x !== op })
          for (let i = 0; i < others.length; i++) {
            const other = others[i]
            if (next[other] === binding && conflict(op, other)) next[other] = 'none'
          }
          next[op] = binding
          saveSettings(next)
          return next
        })
      }

      function updateCustom(key, value) {
        const n = parseInt(value, 10)
        if (isNaN(n)) return
        const clamp = key === 'customMines'
          ? Math.min(Math.max(n, 1), 999)
          : Math.min(Math.max(n, 4), 40)
        setSettings(function (prev) {
          const next = Object.assign({}, prev)
          next[key] = clamp
          saveSettings(next)
          return next
        })
      }

      function applyCustom() {
        setDifficulty('custom')
        clearWhale()
        setGame(initialState(settings.customRows, settings.customCols, settings.customMines))
      }

      const guess = game.status === 'playing' ? findGuess(game) : null

      function onAiClick() {
        if (whaleTimer) { whaleTimer(); whaleTimer = null }
        setSuggestion(null)
        const targets = guess && guess.length > 0 ? guess : allUnrevealed(game)
        const cell = targets[Math.floor(Math.random() * targets.length)]
        setWhaleMsg({ img: IMG_THINK, text: '那我随便选了啊……' })
        whaleTimer = ctx.timeout(function () {
          setSuggestion(cell)
          setWhaleMsg({ img: IMG_THINK, text: '就这个！' })
          whaleTimer = null
        }, 800)
      }

      function onSafeClick() {
        if (whaleTimer) { whaleTimer(); whaleTimer = null }
        const safe = findSafe(game)
        if (safe) {
          setSuggestion(safe)
          setWhaleMsg({ img: IMG_HAPPY, text: '这里不是雷' })
        } else {
          setSuggestion(null)
          setWhaleMsg({ img: IMG_SORRY, text: '推不出安全格' })
        }
      }

      function handleReveal(r, c) {
        const next = stepGame(game, { type: 'REVEAL', r: r, c: c })
        if (next === game) return
        setGame(next)
        if (whaleTimer) { whaleTimer(); whaleTimer = null }
        if (suggestion) {
          const followed = r === suggestion.r && c === suggestion.c
          let img
          let text
          if (next.status === 'won') { img = IMG_HAPPY; text = '漂亮，收工！🎉' }
          else if (followed && next.status === 'lost') { img = IMG_SORRY; text = '这把我的，兄弟 🙏' }
          else if (followed) { img = IMG_HAPPY; text = '怎么样，信我没错吧～ 😎' }
          else if (next.status === 'lost') { img = IMG_SMUG; text = '谁让你不听我的 😏' }
          else { img = IMG_SMUG; text = '哼，算你走运～' }
          setSuggestion(null)
          setWhaleMsg({ img: img, text: text })
          whaleTimer = ctx.timeout(function () { setWhaleMsg(null); whaleTimer = null }, 4500)
        } else if (whaleMsg) {
          setWhaleMsg(null)
        }
      }

      function handleFlag(r, c) {
        if (suggestion && r === suggestion.r && c === suggestion.c) clearWhale()
        dispatch({ type: 'FLAG', r: r, c: c })
      }

      function handleChord(r, c) {
        const next = stepGame(game, { type: 'CHORD', r: r, c: c })
        if (next === game) return
        setGame(next)
        if (next.status === 'lost') clearWhale()
      }

      function restart() {
        clearWhale()
        setGame(initialState(preset.rows, preset.cols, preset.mines))
      }

      let flagsUsed = 0
      for (let r = 0; r < game.rows; r++) for (let c = 0; c < game.cols; c++) if (game.cells[r][c].mark === 1) flagsUsed++
      const minesLeft = game.mines - flagsUsed
      const face = game.status === 'won' ? '😎' : game.status === 'lost' ? '😵' : '😊'
      const faceCls = game.status === 'won' ? 'ms-iconbtn ms-face--won'
        : game.status === 'lost' ? 'ms-iconbtn ms-face--lost' : 'ms-iconbtn'

      const hintParts = ['翻开 ' + bindLabel(settings.reveal)]
      hintParts.push('标记 ' + bindLabel(settings.flag))
      if (settings.chord !== 'none') hintParts.push('快速翻开 ' + bindLabel(settings.chord))
      const hintText = hintParts.join(' · ')

      function startDrag(e) {
        if (e.button !== 0) return
        const tag = e.target && e.target.tagName ? String(e.target.tagName).toLowerCase() : ''
        if (tag === 'button' || tag === 'select' || tag === 'option' || tag === 'input') return
        const rect = e.currentTarget.getBoundingClientRect()
        activeDrag = { pid: e.pointerId, dx: e.clientX - rect.left, dy: e.clientY - rect.top }
        if (typeof e.currentTarget.setPointerCapture === 'function') {
          try { e.currentTarget.setPointerCapture(e.pointerId) } catch (err) {}
        }
      }
      function moveDrag(e) {
        if (!activeDrag || activeDrag.pid !== e.pointerId) return
        setPos({ x: e.clientX - activeDrag.dx, y: e.clientY - activeDrag.dy })
      }
      function endDrag(e) {
        if (activeDrag && activeDrag.pid === e.pointerId) activeDrag = null
      }

      function changeDifficulty(e) {
        const id = e.target.value
        setDifficulty(id)
        clearWhale()
        if (id === 'custom') {
          setGame(initialState(settings.customRows, settings.customCols, settings.customMines))
        } else {
          let p = DIFFICULTIES[0]
          for (let i = 0; i < DIFFICULTIES.length; i++) if (DIFFICULTIES[i].id === id) p = DIFFICULTIES[i]
          setGame(initialState(p.rows, p.cols, p.mines))
        }
      }

      const cellSize = preset.cols > 30 ? 16 : preset.cols > 20 ? 20 : 24
      const boardW = preset.cols * cellSize + (preset.cols - 1) * 2 + 24

      const winStyle = pos
        ? { position: 'fixed', left: pos.x + 'px', top: pos.y + 'px', width: boardW + 'px', pointerEvents: 'auto' }
        : { position: 'fixed', right: '24px', bottom: '24px', width: boardW + 'px', pointerEvents: 'auto' }

      let side = 'right'
      if (typeof window !== 'undefined' && typeof window.innerWidth === 'number') {
        const vw = window.innerWidth
        const winRight = pos ? pos.x + boardW : vw - 24
        if (vw - winRight < 300) side = 'left'
      }

      const cells = []
      for (let r = 0; r < game.rows; r++) {
        for (let c = 0; c < game.cols; c++) {
          cells.push(React.createElement(Cell, {
            key: r + '-' + c,
            r: r,
            c: c,
            cell: game.cells[r][c],
            suggested: suggestion !== null && suggestion.r === r && suggestion.c === c,
            revealBinding: settings.reveal,
            flagBinding: settings.flag,
            chordBinding: settings.chord,
            hoverRef: hoverRef,
            onReveal: function () { handleReveal(r, c) },
            onFlag: function () { handleFlag(r, c) },
            onChord: function () { handleChord(r, c) },
          }))
        }
      }

      const bindRow = function (op, label) {
        const cur = settings[op]
        const isKey = cur && cur.slice(0, 2) === 'k-'
        return React.createElement('div', { className: 'ms-settings-field' },
          React.createElement('span', { className: 'ms-settings-label' }, label),
          React.createElement('select', {
            className: 'ms-select',
            value: isKey ? '__key__' : cur,
            onChange: function (e) { if (e.target.value !== '__key__') updateBinding(op, e.target.value) },
          },
            React.createElement('option', { value: 'm0' }, '左键'),
            React.createElement('option', { value: 'm1' }, '中键'),
            React.createElement('option', { value: 'm2' }, '右键'),
            React.createElement('option', { value: 'dbl' }, '双击'),
            React.createElement('option', { value: 'none' }, '未绑定'),
            isKey ? React.createElement('option', { value: '__key__' }, '键盘 ' + bindLabel(cur)) : null,
          ),
          React.createElement('button', {
            className: bindingOp === op ? 'ms-settings-keybtn ms-settings-bind--listening' : 'ms-settings-keybtn',
            type: 'button',
            onClick: function () { setBindingOp(bindingOp === op ? null : op) },
          }, '⌨ 键盘键'),
        )
      }

      return React.createElement('div', {
        className: 'ms-win',
        style: winStyle,
        onPointerDown: startDrag,
        onPointerMove: moveDrag,
        onPointerUp: endDrag,
        onPointerCancel: endDrag,
      },
        React.createElement('div', { className: 'ms-win-inner' },
          React.createElement('div', { className: 'ms-header' },
            React.createElement('div', { className: 'ms-header-row' },
              React.createElement('div', { className: 'ms-title' },
                '💣 扫雷',
                React.createElement('span', { className: 'ms-title-sub' }, 'DSH-MINESWEEPER')),
              React.createElement('div', { className: 'ms-header-actions' },
                React.createElement('button', { className: showSettings ? 'ms-iconbtn ms-iconbtn--active' : 'ms-iconbtn', type: 'button', title: '设置', onClick: function () { setShowSettings(function (v) { return !v }) } }, '⚙️'),
                React.createElement('button', { className: faceCls, type: 'button', title: '重新开始', onClick: restart }, face),
                React.createElement('button', { className: 'ms-iconbtn', type: 'button', title: '关闭', onClick: props.onClose }, '✕'),
              ),
            ),
            React.createElement('div', { className: 'ms-header-row' },
              React.createElement('select', { className: 'ms-select', value: difficulty, onChange: changeDifficulty, 'aria-label': '难度' },
                DIFFICULTIES.map(function (d) { return React.createElement('option', { key: d.id, value: d.id }, d.label) }),
                React.createElement('option', { value: 'custom' }, '自定义')),
            ),
          ),
          React.createElement('div', { className: 'ms-statusbar' },
            React.createElement('span', { className: 'ms-led ms-led--mines' }, '💣', led(minesLeft, 3)),
            React.createElement('span', { className: 'ms-spacer' }),
            React.createElement('span', { className: 'ms-led ms-led--timer' }, '⏱', led(game.elapsed, 3)),
          ),
          React.createElement('div', { className: 'ms-actions' },
            React.createElement('button', { className: 'ms-ai-btn', type: 'button', disabled: game.status === 'won' || game.status === 'lost', onClick: onAiClick }, React.createElement('img', { className: 'ms-ai-btn-img', src: IMG_THINK, alt: '' }), '随机选'),
            React.createElement('button', { className: 'ms-ai-btn', type: 'button', disabled: game.status === 'won' || game.status === 'lost', onClick: onSafeClick }, React.createElement('img', { className: 'ms-ai-btn-img', src: IMG_HAPPY, alt: '' }), '安全格'),
          ),
          React.createElement('div', { className: 'ms-stage' },
            showSettings
              ? React.createElement('div', { className: 'ms-settings' },
                  React.createElement('div', { className: 'ms-settings-title' }, '设置'),
                  React.createElement('div', { className: 'ms-settings-section' }, '操作键位（鼠标键/双击走下拉，键盘键点 ⌨ 后按任意键）'),
                  bindRow('reveal', '翻开'),
                  bindRow('flag', '标记（旗→问号→无）'),
                  bindRow('chord', '快速翻开周围'),
                  React.createElement('div', { className: 'ms-settings-note' }, '双击包含两次左键按下，左键绑定的操作会先触发'),
                  React.createElement('div', { className: 'ms-settings-note' }, '「翻开」与「快速翻开」可绑同一键：点未翻开格=翻开，点已翻开格=快速翻开'),
                  React.createElement('div', { className: 'ms-settings-section' }, '自定义难度'),
                  React.createElement('div', { className: 'ms-settings-grid' },
                    React.createElement('label', { className: 'ms-settings-num' },
                      React.createElement('span', null, '行'),
                      React.createElement('input', { type: 'number', min: 4, max: 40, value: String(settings.customRows), onChange: function (e) { updateCustom('customRows', e.target.value) } })),
                    React.createElement('label', { className: 'ms-settings-num' },
                      React.createElement('span', null, '列'),
                      React.createElement('input', { type: 'number', min: 4, max: 40, value: String(settings.customCols), onChange: function (e) { updateCustom('customCols', e.target.value) } })),
                    React.createElement('label', { className: 'ms-settings-num' },
                      React.createElement('span', null, '雷'),
                      React.createElement('input', { type: 'number', min: 1, max: 999, value: String(settings.customMines), onChange: function (e) { updateCustom('customMines', e.target.value) } })),
                  ),
                  React.createElement('button', { className: 'ms-settings-done', type: 'button', onClick: applyCustom }, '应用自定义'),
                  React.createElement('div', { className: 'ms-settings-note' }, '改动即时保存；点 ⚙️ 或下方完成返回游戏'),
                  React.createElement('button', { className: 'ms-settings-done', type: 'button', onClick: function () { setShowSettings(false) } }, '完成'),
                )
              : React.createElement('div', {
                  className: 'ms-board',
                  style: { gridTemplateColumns: 'repeat(' + preset.cols + ', ' + cellSize + 'px)', gridTemplateRows: 'repeat(' + preset.rows + ', ' + cellSize + 'px)' },
                  onContextMenu: function (e) { e.preventDefault() },
                }, cells),
          ),
          React.createElement('div', { className: 'ms-hint' }, hintText),
        ),
        whaleMsg ? React.createElement(WhaleBubble, { img: whaleMsg.img, text: whaleMsg.text, side: side, onClose: clearWhale }) : null,
      )
    }

    function Overlay() {
      const [open, setOpen] = React.useState(false)
      if (open) {
        return React.createElement(GameWindow, { onClose: function () { setOpen(false) } })
      }
      return React.createElement('button', {
        className: 'ms-btn',
        type: 'button',
        onClick: function () { setOpen(true) },
      }, React.createElement('span', { className: 'ms-btn-ico' }, '💣'), '扫雷')
    }

    slots.inject('shell.overlay', function () {
      return slots.register(
        { name: 'shell.overlay', id: 'minesweeper', order: 1000, label: '扫雷' },
        function () { return React.createElement(Overlay) },
      )
    })
  },
}
