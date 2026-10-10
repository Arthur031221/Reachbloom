<div align="center">
<img src="assets/logo.svg" width="64" alt="Reachbloom">
<h1>Reachbloom</h1>
<p><a href="LICENSE"><img src="assets/license.svg" alt="MIT license" width="88" height="22"></a></p>
<p>看看乘坐公共交通，30 分钟内可以到达哪里。</p>
<p><b>6 个选定的 BART 查询与独立 CSV 事件搜索结果相符。</b>两者都使用文档所述的步行模型。这只能检验计算，不代表真实行程时间准确。<a href="benchmarks/reference-results.json">案例与方法</a>。</p>
<p><a href="https://arthur031221.github.io/Reachbloom/">打开地图</a> / <a href="docs/accuracy.md">阅读假设</a></p>
<p><a href="README.md">English README</a> / <a href="README.zh-TW.md">繁體中文</a> / <a href="README.zh-CN.md">简体中文</a> / <a href="README.ja.md">日本語</a> / <a href="README.ko.md">한국어</a> / <a href="README.es.md">Español</a> / <a href="README.fr.md">Français</a> / <a href="README.de.md">Deutsch</a> / <a href="README.pt-BR.md">Português</a></p>
</div>

| 使用前                       | 使用 Reachbloom 后           |
| :--------------------------- | :--------------------------- |
| 在多张时刻表中逐一查找班次   | 移动一个图钉即可查看可达站点 |
| 凭记忆比较两个住处或出发时间 | 将 A 和 B 放在同一张地图上   |
| 发送没有说明的截图           | 分享日期、起点和出行时间预算 |

```sh
npx --yes git+https://github.com/Arthur031221/Reachbloom.git
```

![真实 BART 操作画面：调整出行预算、比较起点并查看行程](assets/demo.gif)

时刻表是计划，并不代表车辆的实时位置。

## 一张地图看铁路、公交和渡轮

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="assets/hero-dark.png">
  <img src="assets/hero-light.png" alt="从 Civic Center 出发的 BART 可达范围，画面显示出发设置和可到达站点" width="1200">
</picture>

_1.0 新增：带日期的铁路时刻表，并显示步行假设。_

无需账号或 API 密钥，即可打开[在线演示](https://arthur031221.github.io/Reachbloom/)。内置示例涵盖 BART 铁路、Maywood Express Shuttle 和 Yurok River Otter Ferry。这些是带日期的时刻表快照，不是实时车辆位置。导入自己的 GTFS ZIP，即可探索其他地区的交通网络。文件会保留在你的浏览器中。

沿着地图尝试以下五个步骤：

1. 保留 BART，将日期设为 2026-08-24，时间设为 08:00。
2. 将起点 A 移到旧金山 Civic Center 附近。
3. 依次试用 15、30 和 45 分钟的预算。
4. 启用起点 B，并更改它的出发时间。
5. 搜索 Powell，查看步行、等候和乘车步骤。

橙色代表 A，蓝绿色代表 B，紫色代表两者都能到达的区域。网格使用直线距离估算步行，忽略街道、障碍物和水域。共同区域可作为会面地点参考。它不会寻找能同时通勤到两个工作地点的住处。

<table>
<tr><td><a href="assets/bus.png"><img src="assets/bus.png" alt="Maywood Express Shuttle 班次地图" width="580"></a></td><td><a href="assets/ferry.png"><img src="assets/ferry.png" alt="River Otter Ferry 班次地图" width="580"></a></td></tr>
<tr><td><i>1.0 新增：社区接驳巴士。</i></td><td><i>1.0 新增：河上渡轮。</i></td></tr>
</table>

## 为什么我构建它

> _我看得懂班次表，但仍想知道那班车能带我到哪里。_

我构建 Reachbloom，是想把日期、等候时间和步行假设放在地图旁。我想移动图钉、比较另一个出发时间，并把相同画面分享给别人。时刻表可以查看，计算也在浏览器中运行。

## 输出内容

| 输出     | 内容                                           |
| :------- | :--------------------------------------------- |
| 可达地图 | 日期班次、步行估算和乘车上限                   |
| 分享链接 | 两个起点、时间、交通方式、主题和语言           |
| PNG      | 起点图钉、出发时间、出行时间预算和数据来源标注 |
| 站点行程 | 含计时的步行、等候和乘车步骤                   |

## 可交互的时刻表

如果数据提供了路线形状，计划车辆会沿该形状行驶。播放功能会推进出发时钟，让你观察车辆和可达范围如何变化。可以筛选铁路、公交或渡轮，选择一至八次乘车，并切换浅色或深色主题。

界面支持英语、繁体中文、简体中文、日语、韩语、西班牙语、法语、德语和巴西葡萄牙语。布局会适配手机。分享内置示例时，链接会包含日期、出发时间、起点、交通方式、乘车次数、预算、语言和主题。导入的 ZIP 必须在本地重新打开，因此不会启用私人数据的分享功能。

导出功能会生成 1080 x 1350 PNG，包含地图、起点图钉、出发时间、出行时间预算和数据来源标注，并附有步行估算说明。地图瓦片需要互联网连接。数据解析和行程计算会在 Web Worker 中运行。

## 在你的电脑上运行

需要 Node.js 22.12 或更高版本，以及 Git。上方命令会从 GitHub 下载源代码并在本地构建，随后在 `http://127.0.0.1:4173` 启动服务器。首次运行比打开在线演示需要更长时间。

<details>
<summary>macOS 和 Linux</summary>

```sh
npx --yes git+https://github.com/Arthur031221/Reachbloom.git
```

要使用其他端口，请在命令后添加端口号：`npx --yes git+https://github.com/Arthur031221/Reachbloom.git 4180`。

</details>

<details>
<summary>Windows PowerShell</summary>

```powershell
npx --yes git+https://github.com/Arthur031221/Reachbloom.git
```

打开 `http://127.0.0.1:4173`。按 Ctrl+C 停止服务器。

</details>

<details>
<summary>从检出目录构建或托管静态副本</summary>

```sh
git clone https://github.com/Arthur031221/Reachbloom.git
cd Reachbloom
npm ci
npm run build
npx vite preview
```

将 `dist/` 部署到任意静态主机。GitHub Pages 使用附带的工作流。请参阅[安装说明](docs/install.md)和[配置说明](docs/config.md)。

</details>

## 结果意味着什么

交通计算使用带日期的计划出发与到达时间、服务日历例外以及跨夜服务。每一乘车轮次都会扫描所有有效行程，也会纳入超车班次。换乘匹配会保留线路和行程上下文，按 GTFS 规定的具体性顺序处理，并遵守最短时间和禁止换乘规则。一般换乘至少需要两分钟，包含换乘步行时间。不模拟车辆为接驳等待或乘客留在车内继续另一行程。这些连接仍可按计划时刻进行一般下车与重新上车。

步行速度按每小时 4.8 公里估算。到站和离站步行距离上限为 1 公里。两段乘车之间最多有一次换乘步行，距离不超过 400 米。地图显示 120 米网格，只保留完整位于估算步行半径内的网格。边界处采用保守估算，这不是基于街道网络的等时圈。需要事先安排接送或下车的站点不会纳入相应动作。精确班距服务会展开计算。非精确班距模板会略过并附注说明。

日光节约时间切换前后的日期会被拒绝，因为此版本使用运营机构的当地钟表时间。系统不提供实时延误、票价、无障碍路线，也不声称精度等同运营商的规划工具。[支持的数据与限制](docs/data-support.md)说明会拒绝或近似处理的输入。

BART 快照声明的结束日期是 2026-08-30，尽管其日历还延续到之后。地图会显示数据有效期字段，并在超出该范围时发出警告。每份数据都有各自的许可条款。请参阅[数据来源](data/README.md)和[第三方声明](THIRD_PARTY_NOTICES.md)。

## 检查成果

```sh
npm ci
npm run typecheck
npm test
npm run build
npm run check:ui
```

浏览器检查涵盖实际地图、导入错误、三个示例、行程、九种语言、分享、PNG 导出和手机端溢出。如果没有可用的系统 Chrome，请先运行 `npx playwright install chromium` 安装 Chromium。CI 的单元测试与构建使用 Node 22 和 24。浏览器、软件包与参考实现检查使用 Node 22。

`npm run benchmark` 会在你的电脑上测量内置数据集。如需进行独立原始 CSV 参考检查，请创建 Python 环境并运行 `PYTHON=.venv/bin/python npm run verify:reference`。[参考实现](tests/reference.py)采用事件搜索，而不是应用程序的轮次扫描。六个固定查询通过，并不能证明所有数据集都准确。

[使用方法](docs/usage.md) / [架构](docs/architecture.md) / [准确度](docs/accuracy.md) / [贡献指南](CONTRIBUTING.md)

源代码采用 MIT 许可。交通数据和地图瓦片有各自的条款。

Assisted by Claude/Codex.
