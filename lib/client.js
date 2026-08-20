window.__ModuleLoader__.load({ id: "dsh-minesweeper", factory: (require) => {
var module = { exports: {} }; var exports = module.exports;
var React = require('react');
var styles = {
  insert: function (css) {
    var sel = 'style[data-plugin=' + JSON.stringify("dsh-minesweeper") + ']'
    var tag = (typeof document !== 'undefined') ? document.querySelector(sel) : null
    if (!tag && typeof document !== 'undefined') {
      tag = document.createElement('style')
      tag.dataset.plugin = "dsh-minesweeper"
      tag.textContent = css
      document.head.appendChild(tag)
    }
    return function () { if (tag) tag.remove() }
  },
};
module.exports = (function () {
// ===== DSH-Minesweeper — 纯客户端动态 Cordis 插件 =====
// 视觉：深海街机面板（自有深蓝色板，不随 GUI 主题变化）。
// 本文件为可读源码模板；build.ps1 会把 @@WHALE_*@@ 占位符替换为
// base64 data URI 并生成 lib/client.js。

const DIFFICULTIES = [
  { id: 'beginner', label: '初级 9×9', rows: 9, cols: 9, mines: 10 },
  { id: 'intermediate', label: '中级 16×16', rows: 16, cols: 16, mines: 40 },
  { id: 'expert', label: '高级 16×30', rows: 16, cols: 30, mines: 99 },
]

const IMG_THINK = 'data:image/webp;base64,' +
  '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' +
  'dfyd7hgxrEdH1KpbXXitwgDQqLsEMP2kUhxifQlk1Cm1WKDl0vUtqgDkKkt1RLLh5C81jKoFIGKNTvhuN4fFSKVjNnQI5EscXgxp1TFBx8wT2EFGWc5LhRMI184pms+VA9Bb+5uEBUXHlOUv1esaiZtxrjCrWoyN1ZOPAdLYTLu7gvajK0hfpvhsaaQHTRoJfn9HZF2iRaD5wZDvzerluGBAFSBaQr90O6sZz42LQMXnzfeoA0HiFn7XxUBBxy1m7j9mfZ0MezREiJo2kQRPVCw/iPjXV8KoxLyPbzDMJ5f9E7WsRE5arU7JTAOOMI3IvKNWx0+2eH3Wd5Nn+LlKvKCgU8D7gRxDWDF8yc7H73G5cpIrGCAAAFhNUCDYBAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgOS4xLWMwMDIgNzkuYjdjNjRjYywgMjAyNC8wNy8xNi0wNzo1OTo0MCAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczpkYz0iaHR0cDovL3B1cmwub3JnL2RjL2VsZW1lbnRzLzEuMS8iIHhtbG5zOnBob3Rvc2hvcD0iaHR0cDovL25zLmFkb2JlLmNvbS9waG90' +
  'b3Nob3AvMS4wLyIgeG1sbnM6eG1wTU09Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9tbS8iIHhtbG5zOnN0RXZ0PSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VFdmVudCMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIDI2LjAgKFdpbmRvd3MpIiB4bXA6Q3JlYXRlRGF0ZT0iMjAyNi0wOC0xOFQyMToxMjo0NyswODowMCIgeG1wOk1vZGlmeURhdGU9IjIwMjYtMDgtMThUMjE6MjE6MDkrMDg6MDAiIHhtcDpNZXRhZGF0YURhdGU9IjIwMjYtMDgtMThUMjE6MjE6MDkrMDg6MDAiIGRjOmZvcm1hdD0iaW1hZ2UvcG5nIiBwaG90b3Nob3A6Q29sb3JNb2RlPSIzIiB4bXBNTTpJbnN0YW5jZUlEPSJ4bXAuaWlkOjQ1NGNhMDMxLTc2ZTctNDM0MC05NmE3LWEwOTI4MjgyMDBmNiIgeG1wTU06RG9jdW1lbnRJRD0ieG1wLmRpZDo0NTRjYTAzMS03NmU3LTQzNDAtOTZhNy1hMDkyODI4MjAwZjYiIHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD0ieG1wLmRpZDo0NTRjYTAzMS03NmU3LTQzNDAtOTZhNy1hMDkyODI4MjAwZjYiPiA8eG1wTU06SGlzdG9yeT4gPHJkZjpTZXE+IDxyZGY6bGkgc3RFdnQ6YWN0aW9uPSJjcmVhdGVkIiBzdEV2dDppbnN0YW5jZUlEPSJ4bXAuaWlkOjQ1NGNhMDMxLTc2ZTctNDM0MC05NmE3LWEwOTI4MjgyMDBmNiIgc3RFdnQ6' +
  'd2hlbj0iMjAyNi0wOC0xOFQyMToxMjo0NyswODowMCIgc3RFdnQ6c29mdHdhcmVBZ2VudD0iQWRvYmUgUGhvdG9zaG9wIDI2LjAgKFdpbmRvd3MpIi8+IDwvcmRmOlNlcT4gPC94bXBNTTpIaXN0b3J5PiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gPD94cGFja2V0IGVuZD0iciI/Pg=='
const IMG_HAPPY = 'data:image/webp;base64,' +
  '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'
const IMG_SORRY = 'data:image/webp;base64,' +
  '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' +
  'ZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczpkYz0iaHR0cDovL3B1cmwub3JnL2RjL2VsZW1lbnRzLzEuMS8iIHhtbG5zOnBob3Rvc2hvcD0iaHR0cDovL25zLmFkb2JlLmNvbS9waG90b3Nob3AvMS4wLyIgeG1sbnM6eG1wTU09Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9tbS8iIHhtbG5zOnN0RXZ0PSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VFdmVudCMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIDI2LjAgKFdpbmRvd3MpIiB4bXA6Q3JlYXRlRGF0ZT0iMjAyNi0wOC0xOFQyMToyOTowNCswODowMCIgeG1wOk1vZGlmeURhdGU9IjIwMjYtMDgtMThUMjE6MzQ6NTUrMDg6MDAiIHhtcDpNZXRhZGF0YURhdGU9IjIwMjYtMDgtMThUMjE6MzQ6NTUrMDg6MDAiIGRjOmZvcm1hdD0iaW1hZ2UvcG5nIiBwaG90b3Nob3A6Q29sb3JNb2RlPSIzIiB4bXBNTTpJbnN0YW5jZUlEPSJ4bXAuaWlkOmRiY2U2YWRmLWYxYzctNzk0ZC04YjQ5LTVkYTcwZmNiNzU2OCIgeG1wTU06RG9jdW1lbnRJRD0ieG1wLmRpZDpkYmNlNmFkZi1mMWM3LTc5NGQtOGI0OS01ZGE3MGZjYjc1NjgiIHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD0ieG1wLmRpZDpkYmNlNmFkZi1mMWM3' +
  'LTc5NGQtOGI0OS01ZGE3MGZjYjc1NjgiPiA8eG1wTU06SGlzdG9yeT4gPHJkZjpTZXE+IDxyZGY6bGkgc3RFdnQ6YWN0aW9uPSJjcmVhdGVkIiBzdEV2dDppbnN0YW5jZUlEPSJ4bXAuaWlkOmRiY2U2YWRmLWYxYzctNzk0ZC04YjQ5LTVkYTcwZmNiNzU2OCIgc3RFdnQ6d2hlbj0iMjAyNi0wOC0xOFQyMToyOTowNCswODowMCIgc3RFdnQ6c29mdHdhcmVBZ2VudD0iQWRvYmUgUGhvdG9zaG9wIDI2LjAgKFdpbmRvd3MpIi8+IDwvcmRmOlNlcT4gPC94bXBNTTpIaXN0b3J5PiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gPD94cGFja2V0IGVuZD0iciI/Pg=='
const IMG_SMUG = 'data:image/webp;base64,' +
  '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'

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

})();
return module.exports; } });
