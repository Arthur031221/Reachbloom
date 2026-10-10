<div align="center">
<img src="assets/logo.svg" width="64" alt="Reachbloom">
<h1>Reachbloom</h1>
<p><a href="LICENSE"><img src="assets/license.svg" alt="MIT license" width="88" height="22"></a></p>
<p>公共交通で30分以内にどこまで行けるかを確認できます。</p>
<p><b>選定した BART の6件のクエリは、独立した CSV イベント検索と一致します。</b>どちらも文書化された徒歩モデルを使用しています。これは計算の確認であり、実際の所要時間を検証するものではありません。<a href="benchmarks/reference-results.json">ケースと手法</a>。</p>
<p><a href="https://arthur031221.github.io/Reachbloom/">地図を開く</a> / <a href="docs/accuracy.md">前提を読む</a></p>
<p><a href="README.md">English README</a> / <a href="README.zh-TW.md">繁體中文</a> / <a href="README.zh-CN.md">简体中文</a> / <a href="README.ja.md">日本語</a> / <a href="README.ko.md">한국어</a> / <a href="README.es.md">Español</a> / <a href="README.fr.md">Français</a> / <a href="README.de.md">Deutsch</a> / <a href="README.pt-BR.md">Português</a></p>
</div>

| 使用前                                | Reachbloom を使うと                     |
| :------------------------------------ | :-------------------------------------- |
| 複数の時刻表を見て出発便を探す        | ピンを1つ動かすだけで到達可能な駅を確認 |
| 2つの住まいや出発時刻を記憶で比較する | A と B を同じ地図上で比較               |
| 説明のないスクリーンショットを送る    | 日付、出発地、所要時間の予算を共有      |

```sh
npx --yes git+https://github.com/Arthur031221/Reachbloom.git
```

![BART の実際の操作画面：所要時間の予算を変更し、出発地を比較して経路を確認](assets/demo.gif)

時刻表は計画であり、車両のリアルタイム位置ではありません。

## 1つの地図で鉄道、バス、フェリーを表示

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="assets/hero-dark.png">
  <img src="assets/hero-light.png" alt="Civic Center からの BART 到達範囲。出発設定と到達可能な駅を表示" width="1200">
</picture>

_1.0 の新機能：日付付きの鉄道時刻表と徒歩の前提を表示。_

アカウントや API キーなしで[ライブデモ](https://arthur031221.github.io/Reachbloom/)を開けます。組み込みの例には BART 鉄道、Maywood Express Shuttle、Yurok River Otter Ferry が含まれます。これらは日付付きの時刻表スナップショットであり、車両のリアルタイム位置ではありません。独自の GTFS ZIP を読み込めば、別の地域交通網を探索できます。ファイルはブラウザー内に保持されます。

地図を次の5つの手順で試してください。

1. BART のまま、日付を 2026-08-24、時刻を 08:00 にします。
2. 出発地 A をサンフランシスコの Civic Center 付近に移動します。
3. 予算を15分、30分、45分と順に試します。
4. 出発地 B を有効にして、出発時刻を変更します。
5. Powell を検索し、徒歩、待ち時間、乗車の各手順を開きます。

オレンジは A、青緑は B、紫は両方から到達できる範囲です。グリッドは直線距離で徒歩を推定し、道路、障害物、水域を考慮しません。共通範囲は待ち合わせ場所の参考になりますが、2か所の職場へ通勤できる住まいを探す機能ではありません。

<table>
<tr><td><a href="assets/bus.png"><img src="assets/bus.png" alt="Maywood Express Shuttle の時刻表マップ" width="580"></a></td><td><a href="assets/ferry.png"><img src="assets/ferry.png" alt="River Otter Ferry の時刻表マップ" width="580"></a></td></tr>
<tr><td><i>1.0 の新機能：近隣を走るシャトル。</i></td><td><i>1.0 の新機能：川を渡るフェリー。</i></td></tr>
</table>

## 作った理由

> _時刻表は読めます。それでも、その便でどこまで行けるかを見たいのです。_

Reachbloom を作ったのは、日付、待ち時間、徒歩の前提を地図のそばにまとめたかったからです。ピンを動かし、別の出発時刻と比べ、同じ画面を人に共有したいと思いました。時刻表を確認でき、計算はブラウザー内で行われます。

## 出力内容

| 出力           | 内容                                         |
| :------------- | :------------------------------------------- |
| 到達範囲マップ | 日付付きの出発、徒歩推定、乗車上限           |
| 共有リンク     | 2つの出発地、時刻、交通手段、テーマ、言語    |
| PNG            | 出発地のピン、出発時刻、所要時間の予算、出典 |
| 停留所の経路   | 時刻付きの徒歩、待ち時間、乗車手順           |

## 操作できる時刻表

データに路線形状がある場合、予定車両はその形状に沿って移動します。再生すると出発時刻が進み、車両と到達範囲の変化を確認できます。鉄道、バス、フェリーを絞り込み、乗車回数を1～8回から選び、ライト／ダークテーマを切り替えられます。

インターフェースは英語、繁体字中国語、簡体字中国語、日本語、韓国語、スペイン語、フランス語、ドイツ語、ブラジルポルトガル語に対応しています。レイアウトはスマートフォンに合わせて調整されます。組み込み例の共有リンクには、日付、出発時刻、出発地、交通手段、乗車回数、予算、言語、テーマが含まれます。読み込んだ ZIP は各端末でローカルに開き直す必要があるため、非公開フィードの共有は無効になります。

エクスポートでは地図、出発地のピン、出発時刻、所要時間の予算、出典表記を含む 1080 x 1350 の PNG を作成し、徒歩推定の注意書きも付けます。地図タイルにはインターネット接続が必要です。解析と経路計算はワーカーで実行します。

## 自分のマシンで実行

Node.js 22.12 以降と Git が必要です。上記のコマンドは GitHub からソースをダウンロードしてローカルでビルドし、`http://127.0.0.1:4173` でサーバーを起動します。初回起動はライブデモを開くより時間がかかります。

<details>
<summary>macOS と Linux</summary>

```sh
npx --yes git+https://github.com/Arthur031221/Reachbloom.git
```

ポートを変更するには、コマンドの末尾に追加します：`npx --yes git+https://github.com/Arthur031221/Reachbloom.git 4180`。

</details>

<details>
<summary>Windows PowerShell</summary>

```powershell
npx --yes git+https://github.com/Arthur031221/Reachbloom.git
```

`http://127.0.0.1:4173` を開きます。Ctrl+C でサーバーを停止します。

</details>

<details>
<summary>チェックアウトからビルド、または静的コピーをホスト</summary>

```sh
git clone https://github.com/Arthur031221/Reachbloom.git
cd Reachbloom
npm ci
npm run build
npx vite preview
```

`dist/` を任意の静的ホストにデプロイできます。GitHub Pages では付属のワークフローを使用します。[インストール](docs/install.md)と[設定](docs/config.md)を参照してください。

</details>

## 結果の意味

交通計算では日付付きの予定出発・到着時刻、運行カレンダーの例外、日をまたぐ運行を使用します。各乗車ラウンドですべての有効な便を調べ、追い越す便も扱います。乗換判定では路線と便の情報を保持し、GTFS の具体性の順序に従い、最短時間と乗換禁止を守ります。通常の乗換には徒歩での移動も含めて合計2分が必要です。接続のための車両の待機や、別の便への車内での継続乗車はモデル化していません。これらの接続では、予定時刻に従って通常の降車と再乗車を扱います。

徒歩速度は時速4.8 km として推定します。駅まで／駅からの徒歩は最大1 km、乗車間の乗換歩行は1回、最大400 mです。表示する120 mグリッドでは、推定徒歩範囲内に完全に収まるセルだけを表示します。境界では保守的な推定となり、道路網に基づく等時間圏ではありません。事前手配が必要な乗車・降車は該当する操作から除外します。正確な運行間隔サービスは展開して計算します。正確でない間隔のテンプレートは注記付きで省略します。

このバージョンは事業者の壁時計時刻を使うため、夏時間の切り替え前後の日付は拒否されます。リアルタイムの遅延、運賃、車いす対応経路はなく、事業者の経路検索と同等の精度をうたうものでもありません。[対応データと制限](docs/data-support.md)では、拒否または近似する入力を説明します。

BART のスナップショットは終了日を 2026-08-30 としていますが、カレンダーはそれ以降も続いています。地図には有効期間の項目が表示され、その範囲外では警告が出ます。フィードごとにライセンスが異なります。[データの出典](data/README.md)と[サードパーティー通知](THIRD_PARTY_NOTICES.md)を参照してください。

## 動作確認

```sh
npm ci
npm run typecheck
npm test
npm run build
npm run check:ui
```

ブラウザー検査では、実際の地図、読み込みエラー、3つの例、経路、9言語、共有、PNG エクスポート、モバイルでのはみ出しを確認します。システムに Chrome がない場合は、先に `npx playwright install chromium` で Chromium をインストールしてください。CI の単体テストとビルドは Node 22 と 24 で実行します。ブラウザー、パッケージ、参照実装の検査は Node 22 で実行します。

`npm run benchmark` は組み込みフィードを手元のマシンで計測します。独立した元 CSV の参照検査を行うには、Python 環境を作成し `PYTHON=.venv/bin/python npm run verify:reference` を実行します。[参照実装](tests/reference.py)はアプリのラウンドスキャンではなくイベント検索を使います。固定された6件のクエリに合格しても、すべてのフィードで正確だとは証明できません。

[使い方](docs/usage.md) / [アーキテクチャ](docs/architecture.md) / [精度](docs/accuracy.md) / [貢献](CONTRIBUTING.md)

ソースコードは MIT ライセンスです。交通データと地図タイルには別途利用条件があります。

Assisted by Claude/Codex.
