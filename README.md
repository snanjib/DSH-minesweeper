# DSH-Minesweeper

在等待 agent 执行任务时可随时玩的经典扫雷小游戏，挂载在框架级浮层 `shell.overlay`。

[演示视频](assets/dsh-minesweeper-demo.mp4)

## 功能

**扫雷本体**
- 三种难度：初级 9×9（10 雷）、中级 16×16（40 雷）、高级 16×30（99 雷），并支持自定义难度
- 首次点击安全（雷不会出现在第一格及其周围 8 格）
- 自由键位绑定：翻开 / 标记三循环 / 快速翻开（chord）可任意绑定到鼠标键、双击或键盘键，在设置面板（⚙️）中配置
- 剩余雷数、计时器、😊/😵/😎 状态脸、重新开始
- 窗口可拖动，不遮挡对话

**鲸鱼娘帮选**
- 按钮区常驻两个按钮：
  - **随机选**：鲸鱼娘「那我随便选了啊……」→ 800ms 后「就这个！」，红圈标出随机选中的一格（优先从最小对等组中随机，没有对等组时从全部未知格随机）
  - **安全格**：完备约束求解器（规则传播 + 回溯枚举）推出一个确定安全的格子，「这里不是雷」；推不出时提示「推不出安全格」
- 按你的选择给出反应：
  | 情形 | 鲸鱼娘 |
  |---|---|
  | 听劝 + 安全 / 通关 | 怎么样，信我没错吧～ 😎 / 漂亮，收工！🎉 |
  | 听劝 + 炸了 | 这把我的，兄弟 🙏 |
  | 不听 + 炸了 | 谁让你不听我的 😏 |
  | 不听 + 安全 | 哼，算你走运～ |

## 实现说明

- **纯客户端**动态 Cordis 插件，无 Host 半区。
- `client.js` 即 `cordis_define` 的 `code.client` 函数体（返回 Cordis Plugin，已内嵌 base64 图片，自包含）。
- 挂载点：`shell.overlay`，`id: minesweeper`，`order: 1000`。
- 依赖：`timer` 服务（计时/动画定时）、`styles` 内置（样式）、`slots` 服务（挂载）。
- 所有副作用（计时器、样式、slot 注册）均归属 Plugin Fiber，停止/更新时自动清理。
- 鲸鱼娘表情图片由 AI 生成，压缩为 128px WebP 后内嵌在 `client.js` 中。

## 目录结构

```
dsh-minesweeper/
├── client.js            # 最终插件源码（内嵌图片，提交给 cordis_define）
├── client.template.js   # 可读源码模板（图片用 @@WHALE_*@@ 占位）
├── build.ps1            # 由模板 + 图片生成 client.js
├── assets/
│   ├── web/             # 压缩后的 128px WebP（入库）
│   └── *.png            # 原始大图（被 .gitignore 忽略，仅本地保留）
└── README.md
```

## 永久化安装（profile 常驻）

本仓库同时是一个标准 DSH 树外插件包（`dsh-minesweeper`）：

```
package.json        # 声明 dsh.client（web 平台）、exports["./client"]
lib/index.js        # node 半区（空 apply）
lib/client.js       # 浏览器 bundle（由 build-bundle.mjs 生成）
```

安装进 profile（一次即可，pnpm link 依赖，改动即时反映在下次页面加载）：

```powershell
# 在 DSH checkout 目录下运行，<插件路径> 替换为本仓库的本地路径
pnpm dsh plugin --profile web add <插件路径>
```

然后在 `$DSH_HOME/profiles/web/cordis.patch.yml` 追加行（该层热重载、重启保留）：

```yaml
- insert:
    - id: minesweeper
      name: dsh-minesweeper
```

### 迭代流程

改 `client.template.js` → `.\build.ps1`（重新内嵌 base64 + 重新生成 lib/client.js）→ 刷新页面（必要时 Ctrl+F5）。无需重新安装、无需发版。

## 重新生成 client.js

原始大图（`assets/*.png`）仅在本地，压缩图 `assets/web/*.webp` 已入库。改图后重新压缩并重跑 build：

```powershell
# 1. 把新 png 缩到 128px webp（透明背景、裁边、清理残影）
magick assets\whale-think.png -alpha set -channel A -threshold 6% +channel -fuzz 3% -trim +repage -resize "128x128>" -background none -gravity center -extent 128x128 assets\web\whale-think.webp
# 2. 重新内嵌 base64
.\build.ps1
```

## 激活方式（开发流程）

1. 将 `client.js` 内容作为 `code.client` 传入 `cordis_define`（`pluginId: mines-1`，生成新 package）。
2. 用返回的 `packageId` 执行 `cordis_run`（`update` 模式切换版本）。
