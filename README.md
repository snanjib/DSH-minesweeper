# DSH-Minesweeper
[![Release](https://img.shields.io/github/v/release/snanjib/DSH-minesweeper?style=flat-square)](https://github.com/snanjib/DSH-minesweeper/releases)
[![License](https://img.shields.io/github/license/snanjib/DSH-minesweeper?style=flat-square)](https://github.com/snanjib/DSH-minesweeper/blob/main/LICENSE)
[![Stars](https://img.shields.io/github/stars/snanjib/DSH-minesweeper?style=flat-square)](https://github.com/snanjib/DSH-minesweeper/stargazers)

在等待 agent 执行任务时可随时玩的经典扫雷小游戏，挂载在 DeepSeek Harness 框架级浮层 `shell.overlay`。

https://github.com/user-attachments/assets/5d6039f0-f149-48a1-9c5d-f60cff23e36c

## 功能

**扫雷本体**
- 三种预设难度：初级 9×9（10 雷）、中级 16×16（40 雷）、高级 16×30（99 雷），并支持自定义难度（行 / 列 / 雷）
- 首次点击安全（雷不会出现在第一格及其周围 8 格）
- 自由键位绑定：翻开 / 标记三循环（旗→问号→无）/ 快速翻开（chord）可任意绑定到鼠标键、双击或键盘键，在设置面板（⚙️）中配置
- 剩余雷数、计时器、😊/😵/😎 状态脸、重新开始
- 窗口可拖动、可自适应左右展开气泡，不遮挡对话

**鲸鱼娘帮选**
- 按钮区常驻两个按钮：
  - **随机选**：鲸鱼娘「那我随便选了啊……」→ 800ms 后「就这个！」，红圈标出随机选中的一格（优先从最小对等组随机，没有对等组时从全部未知格随机）
  - **安全格**：完备约束求解器（规则传播 + 回溯枚举）推出一个确定安全的格子，提示「这里不是雷」；推不出时提示「推不出安全格」
- 按你的选择给出反应：

  | 情形 | 鲸鱼娘 |
  |---|---|
  | 听劝 + 安全 / 通关 | 怎么样，信我没错吧～ 😎 / 漂亮，收工！🎉 |
  | 听劝 + 炸了 | 这把我的，兄弟 🙏 |
  | 不听 + 炸了 | 谁让你不听我的 😏 |
  | 不听 + 安全 | 哼，算你走运～ |

## 安装

本仓库是一个标准 DSH 树外插件（bundle）包：`dsh.bundle` 声明了 patch 层，`dsh.client` 声明了浏览器半区。

### 前置

- [Node.js](https://nodejs.org)（≥18）
- [pnpm](https://pnpm.io) —— `dsh plugin` 内部用 pnpm 装依赖，需在 `PATH` 上
- 能运行 DSH：推荐 `npx @deepseek-ai/dsh web`（首次会自动拉取包）；若你从源码运行 DSH，则用 checkout 里的 `pnpm dsh web`

### 安装本插件

**npm 用户**（DSH 通过 `npx @deepseek-ai/dsh` 运行）：

```bash
npx @deepseek-ai/dsh plugin --profile web add github:snanjib/DSH-minesweeper
```

**源码用户**（在 DSH checkout 根目录运行）：

```bash
pnpm dsh plugin --profile web add github:snanjib/DSH-minesweeper
```

> 也可用本地路径：把 `github:...` 换成本仓库的本地目录。

这一步会自动完成三件事：pnpm 链接依赖 → 把本包加入 profile 的 bundle 列表 → 应用本包的 `cordis.patch.yml`（插入 `minesweeper` 行）。

> 本仓库已提交构建产物 `lib/client.js`，且没有 `prepare` 构建脚本，从 git 安装无需任何额外许可或构建，装完即用。

然后让插件生效：

- **Web GUI**：重启 DSH（插件表与 bundle 层在进程启动时读取）。
- **CLI / 无头**：新开一个会话即生效。

### 卸载

```bash
npx @deepseek-ai/dsh plugin --profile web remove dsh-minesweeper
```

## 开发与构建

构建产物（`client.js`、`lib/client.js`）已提交，**直接安装无需构建**。仅当你修改了 `client.template.js` 或图片后才需要重建：

```bash
npm run build      # 等价于 node build.mjs
```

构建只需 Node.js（≥18），无其他依赖。它会：

1. 把 `assets/web/*.webp` 内嵌为 base64 → 生成 `client.js`
2. 把 `client.js` 包装成 `lib/client.js`（浏览器 bundle）

迭代流程：改 `client.template.js` → `npm run build` → 强刷页面（Ctrl+F5）。无需重新安装、无需发版。

### 更换鲸鱼娘图片

仓库只含压缩后的 `assets/web/*.webp`；原始 PNG 是本地资产（被 `.gitignore` 忽略，不随仓库分发）。若你换了图，先用 ImageMagick 压成 128px WebP（透明背景、裁边、清理残影）：

```bash
magick assets/whale-think.png -alpha set -channel A -threshold 6% +channel -fuzz 3% -trim +repage -resize "128x128>" -background none -gravity center -extent 128x128 assets/web/whale-think.webp
# 四张（think / happy / sorry / smug）同理，然后：
npm run build
```

## 实现说明

- 纯客户端插件：node 半区是空 `apply`（`lib/index.js`），浏览器半区经 `exports["./client"]`（`lib/client.js`）出货，`dsh.client` 声明 `platform: web`。
- 挂载点：`shell.overlay`（框架级浮层），`id: minesweeper`，`order: 1000`。
- 依赖：`timer` 服务（计时/动画定时）、`slots` 服务（挂载）；样式用插件自带的 `<style data-plugin>` 标签注入，随插件卸载自动清理。
- 鲸鱼娘表情图片由 AI 生成，压缩为 128px WebP 后内嵌，离线可用、无需外部资源。

## 目录结构

```
DSH-minesweeper/
├── package.json         # dsh.bundle + dsh.client 声明、exports、build 脚本
├── cordis.patch.yml     # bundle patch 层（insert minesweeper 行）
├── client.template.js   # 可读源码模板（图片用 @@WHALE_*@@ 占位）
├── client.js            # 构建产物（base64 内嵌）
├── build.mjs            # 跨平台构建脚本
├── lib/
│   ├── index.js         # node 半区（空 apply）
│   └── client.js        # 浏览器 bundle（构建产物）
├── assets/
│   ├── web/*.webp       # 压缩图（入库）
│   ├── dsh-minesweeper-demo.mp4   # 演示视频
│   └── *.png            # 原始大图（本地资产，.gitignore 忽略）
├── test-solver.cjs      # 帮选求解器回归测试
├── LICENSE
└── README.md
```

## License

[MIT](LICENSE)
