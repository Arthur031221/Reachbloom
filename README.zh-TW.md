<div align="center">
<img src="assets/logo.svg" width="64" alt="Reachbloom">
<h1>Reachbloom</h1>
<p><a href="LICENSE"><img src="assets/license.svg" alt="MIT license" width="88" height="22"></a></p>
<p>看看 30 分鐘內，搭乘大眾運輸可以到達哪裡。</p>
<p><b>6 個選定的 BART 查詢，與獨立 CSV 事件搜尋結果相符。</b>兩者都使用文件所述的步行模型。這只能檢查計算，不代表真實行程時間準確。<a href="benchmarks/reference-results.json">案例與方法</a>。</p>
<p><a href="https://arthur031221.github.io/Reachbloom/">開啟地圖</a> / <a href="docs/accuracy.md">閱讀假設</a></p>
<p><a href="README.md">English README</a> / <a href="README.zh-TW.md">繁體中文</a> / <a href="README.zh-CN.md">简体中文</a> / <a href="README.ja.md">日本語</a> / <a href="README.ko.md">한국어</a> / <a href="README.es.md">Español</a> / <a href="README.fr.md">Français</a> / <a href="README.de.md">Deutsch</a> / <a href="README.pt-BR.md">Português</a></p>
</div>

| 使用前                       | 使用 Reachbloom 後           |
| :--------------------------- | :--------------------------- |
| 在多張時刻表中逐一追查班次   | 移動一個圖釘即可查看可達車站 |
| 憑記憶比較兩個住處或出發時間 | 將 A 和 B 放在同一張地圖上   |
| 傳送沒有說明的截圖           | 分享日期、起點與交通時間預算 |

```sh
npx --yes git+https://github.com/Arthur031221/Reachbloom.git
```

![真實 BART 操作畫面：調整交通時間預算、比較起點並查看行程](assets/demo.gif)

時刻表是計畫，不代表車輛的即時位置。

## 同一張地圖看鐵路、公車和渡輪

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="assets/hero-dark.png">
  <img src="assets/hero-light.png" alt="Civic Center 出發的 BART 可達範圍，畫面顯示出發設定與可到達車站" width="1200">
</picture>

_1.0 新增：附日期的鐵路時刻表，並列出步行假設。_

無須帳號或 API 金鑰，即可開啟[線上示範](https://arthur031221.github.io/Reachbloom/)。內建範例涵蓋 BART 鐵路、Maywood Express Shuttle 和 Yurok River Otter Ferry。這些是有日期的時刻表快照，不是即時車輛位置。匯入自己的 GTFS ZIP，即可探索其他區域交通網路。檔案會留在你的瀏覽器中。

沿著地圖試走以下五個步驟：

1. 保留 BART，日期設為 2026-08-24，時間設為 08:00。
2. 將起點 A 移到舊金山 Civic Center 附近。
3. 依序試用 15、30 和 45 分鐘的預算。
4. 啟用起點 B，並更改它的出發時間。
5. 搜尋 Powell，查看步行、等候和搭乘步驟。

橘色代表 A，藍綠色代表 B，紫色代表兩者都能到達的區域。網格以直線距離估算步行，忽略街道、障礙物和水域。共同區域可作為會面地點參考。它不會尋找能同時通勤到兩個工作地點的住家。

<table>
<tr><td><a href="assets/bus.png"><img src="assets/bus.png" alt="Maywood Express Shuttle 班次地圖" width="580"></a></td><td><a href="assets/ferry.png"><img src="assets/ferry.png" alt="River Otter Ferry 班次地圖" width="580"></a></td></tr>
<tr><td><i>1.0 新增：社區接駁車。</i></td><td><i>1.0 新增：河上渡輪。</i></td></tr>
</table>

## 為什麼我打造它

> _我看得懂班次表，但仍想看見那班車能帶我去哪裡。_

我打造 Reachbloom，是想把日期、等候時間和步行假設放在地圖旁。我想移動圖釘、比較另一個出發時間，並把相同畫面分享給別人。時刻表可以檢視，計算也在瀏覽器中執行。

## 輸出內容

| 輸出     | 內容                                           |
| :------- | :--------------------------------------------- |
| 可達地圖 | 日期班次、步行估算和乘車上限                   |
| 分享連結 | 兩個起點、時間、交通方式、主題和語言           |
| PNG      | 起點圖釘、出發時間、交通時間預算和資料來源標示 |
| 站點行程 | 含計時的步行、等候和搭乘步驟                   |

## 可互動的時刻表

若資料中有路線形狀，排定班次會沿著該形狀行駛。播放功能會推進出發時鐘，讓你觀察車輛與可達範圍如何變化。可篩選鐵路、公車或渡輪，選擇一至八次乘車，並切換淺色或深色主題。

介面支援英文、繁體中文、簡體中文、日文、韓文、西班牙文、法文、德文和巴西葡萄牙文。版面會配合手機調整。分享內建範例時，連結會包含日期、出發時間、起點、交通方式、乘車次數、預算、語言和主題。匯入的 ZIP 必須在本機重新開啟，因此不會啟用私人資料的分享功能。

匯出功能會建立 1080 x 1350 PNG，包含地圖、起點圖釘、出發時間、交通時間預算和資料來源標示，並附上步行估算說明。地圖圖磚需要網際網路連線。資料解析和行程計算會在 Web Worker 中執行。

## 在你的電腦上執行

需要 Node.js 22.12 或更新版本，以及 Git。上方指令會從 GitHub 下載原始碼並在本機建置，接著在 `http://127.0.0.1:4173` 啟動伺服器。首次執行會比開啟線上示範花更多時間。

<details>
<summary>macOS 與 Linux</summary>

```sh
npx --yes git+https://github.com/Arthur031221/Reachbloom.git
```

要使用其他連接埠，請在指令後加上連接埠號碼：`npx --yes git+https://github.com/Arthur031221/Reachbloom.git 4180`。

</details>

<details>
<summary>Windows PowerShell</summary>

```powershell
npx --yes git+https://github.com/Arthur031221/Reachbloom.git
```

開啟 `http://127.0.0.1:4173`。按 Ctrl+C 停止伺服器。

</details>

<details>
<summary>從工作目錄建置或架設靜態版本</summary>

```sh
git clone https://github.com/Arthur031221/Reachbloom.git
cd Reachbloom
npm ci
npm run build
npx vite preview
```

將 `dist/` 部署到任何靜態主機。GitHub Pages 使用內附的工作流程。請參閱[安裝說明](docs/install.md)和[設定說明](docs/config.md)。

</details>

## 結果代表什麼

大眾運輸計算使用有日期的預定出發與抵達時間、服務日曆例外，以及跨夜班次。每一乘車輪次都會掃描所有有效行程，也會納入超車班次。轉乘配對會保留路線與行程脈絡，依 GTFS 規定的具體程度順序處理，並遵守最短轉乘時間與禁止轉乘規則。一般轉乘總計至少需要兩分鐘，包含轉乘步行時間。不模擬車輛為接駁等待或乘客留在車內繼續另一行程。這些連接仍可按預定時刻進行一般下車與重新上車。

步行速度估為每小時 4.8 公里。到站與離站步行距離上限為 1 公里。兩段乘車間最多可步行轉乘一次，距離上限 400 公尺。地圖顯示 120 公尺網格，並只保留完整位於估算步行半徑內的網格。邊界處採保守估算，這不是依街道網路計算的等時圈。需要事先安排接送或下車的車站不會納入相應動作。精確班距服務會展開計算。非精確班距樣板則略過並附註說明。

日光節約時間切換前後的日期會被拒絕，因為此版本使用營運單位的掛鐘時間。系統不提供即時延誤、票價、無障礙路線，也不宣稱精度等同營運商的規劃工具。[支援的資料與限制](docs/data-support.md)說明會拒絕或近似處理的輸入。

BART 快照宣告的結束日期為 2026-08-30，雖然其日曆仍延續到之後。地圖會顯示資料有效期間欄位，並在超出該範圍時發出警告。每份資料都有各自的授權條款。請參閱[資料來源](data/README.md)和[第三方聲明](THIRD_PARTY_NOTICES.md)。

## 檢查成果

```sh
npm ci
npm run typecheck
npm test
npm run build
npm run check:ui
```

瀏覽器檢查涵蓋實際地圖、匯入錯誤、三個範例、行程、九種語言、分享、PNG 匯出和手機版溢位。若沒有可用的系統 Chrome，請先執行 `npx playwright install chromium` 安裝 Chromium。CI 的單元測試與建置使用 Node 22 和 24。瀏覽器、套件與參考實作檢查使用 Node 22。

`npm run benchmark` 會在你的電腦上測量內建資料集。若要執行獨立原始 CSV 參考檢查，請建立 Python 環境並執行 `PYTHON=.venv/bin/python npm run verify:reference`。[參考實作](tests/reference.py)使用事件搜尋，而非應用程式的輪次掃描。六個固定查詢通過，不代表所有資料集都準確。

[使用方式](docs/usage.md) / [架構](docs/architecture.md) / [準確度](docs/accuracy.md) / [貢獻指南](CONTRIBUTING.md)

原始碼採 MIT 授權。交通資料和地圖圖磚各有其授權條款。

Assisted by Claude/Codex.
