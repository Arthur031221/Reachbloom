<div align="center">
<img src="assets/logo.svg" width="64" alt="Reachbloom">
<h1>Reachbloom</h1>
<p><a href="LICENSE"><img src="assets/license.svg" alt="MIT license" width="88" height="22"></a></p>
<p>대중교통으로 30분 안에 어디까지 갈 수 있는지 확인하세요.</p>
<p><b>선정된 BART 쿼리 6개가 독립적인 CSV 이벤트 검색과 일치합니다.</b> 두 검색 모두 문서에 명시된 도보 모델을 사용합니다. 이는 계산을 확인할 뿐 실제 이동 시간을 검증하지는 않습니다. <a href="benchmarks/reference-results.json">사례와 방법</a>.</p>
<p><a href="https://arthur031221.github.io/Reachbloom/">지도 열기</a> / <a href="docs/accuracy.md">가정과 전제 읽기</a></p>
<p><a href="README.md">English README</a> / <a href="README.zh-TW.md">繁體中文</a> / <a href="README.zh-CN.md">简体中文</a> / <a href="README.ja.md">日本語</a> / <a href="README.ko.md">한국어</a> / <a href="README.es.md">Español</a> / <a href="README.fr.md">Français</a> / <a href="README.de.md">Deutsch</a> / <a href="README.pt-BR.md">Português</a></p>
</div>

| 사용 전                                      | Reachbloom 사용 후                       |
| :------------------------------------------- | :--------------------------------------- |
| 여러 시간표 표에서 출발편을 찾아보기         | 핀 하나를 움직여 도달 가능한 정류장 확인 |
| 두 집이나 출발 시간을 기억에 의존해 비교하기 | A와 B를 같은 지도에 표시                 |
| 맥락 없는 스크린샷 보내기                    | 날짜, 출발지, 이동 시간 예산 공유        |

```sh
npx --yes git+https://github.com/Arthur031221/Reachbloom.git
```

![실제 BART 사용 화면: 이동 시간 예산 변경, 출발지 비교, 경로 확인](assets/demo.gif)

시간표는 계획이며 차량의 실시간 위치를 나타내지 않습니다.

## 한 지도에서 철도, 버스, 페리 보기

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="assets/hero-dark.png">
  <img src="assets/hero-light.png" alt="Civic Center에서 출발하는 BART 도달 범위, 출발 설정과 도달 가능한 역 표시" width="1200">
</picture>

_1.0 새 기능: 날짜가 표시된 철도 시간표와 도보 가정._

계정이나 API 키 없이 [라이브 데모](https://arthur031221.github.io/Reachbloom/)를 열 수 있습니다. 기본 예제에는 BART 철도, Maywood Express Shuttle, Yurok River Otter Ferry가 포함됩니다. 날짜가 지정된 시간표 스냅샷이며 실시간 차량 위치가 아닙니다. GTFS ZIP을 가져와 다른 지역 교통망을 탐색할 수 있습니다. 파일은 브라우저 안에 보관됩니다.

다음 다섯 단계를 따라 지도를 사용해 보세요.

1. BART를 유지하고 날짜를 2026-08-24, 시간을 08:00으로 설정합니다.
2. 출발지 A를 샌프란시스코 Civic Center 근처로 옮깁니다.
3. 예산을 15분, 30분, 45분으로 바꿔 봅니다.
4. 출발지 B를 켜고 출발 시간을 바꿉니다.
5. Powell을 검색해 도보, 대기, 승차 단계를 엽니다.

주황색은 A, 청록색은 B, 보라색은 둘 다 도달할 수 있는 영역입니다. 격자는 직선거리로 도보를 추정하며 도로, 장벽, 물은 고려하지 않습니다. 공통 영역은 만남 장소를 찾는 데 참고할 수 있지만, 두 직장으로 통근할 집을 찾아 주지는 않습니다.

<table>
<tr><td><a href="assets/bus.png"><img src="assets/bus.png" alt="Maywood Express Shuttle 시간표 지도" width="580"></a></td><td><a href="assets/ferry.png"><img src="assets/ferry.png" alt="River Otter Ferry 시간표 지도" width="580"></a></td></tr>
<tr><td><i>1.0 새 기능: 동네 셔틀버스.</i></td><td><i>1.0 새 기능: 강을 건너는 페리.</i></td></tr>
</table>

## 만든 이유

> _시간표는 읽을 수 있습니다. 그래도 그 출발로 어디까지 갈 수 있는지 보고 싶습니다._

Reachbloom은 날짜, 대기 시간, 도보 가정을 지도 옆에 함께 보여주고 싶어서 만들었습니다. 핀을 옮기고 다른 출발 시간을 비교한 뒤 같은 화면을 다른 사람과 공유하고 싶었습니다. 시간표를 확인할 수 있고 계산은 브라우저에서 실행됩니다.

## 결과물

| 결과           | 포함 정보                                       |
| :------------- | :---------------------------------------------- |
| 도달 범위 지도 | 날짜별 출발, 도보 추정, 탑승 횟수 제한          |
| 공유 링크      | 두 출발점, 시간, 교통수단, 테마, 언어           |
| PNG            | 출발지 핀, 출발 시간, 이동 시간 예산, 출처 표시 |
| 정류장 여정    | 시간이 표시된 도보, 대기, 탑승 단계             |

## 시간표를 움직이며 살펴보기

피드에 노선 형상이 있으면 예정 차량이 그 형상을 따라 이동합니다. 재생하면 출발 시계가 진행되어 차량과 도달 범위의 변화를 볼 수 있습니다. 철도, 버스, 페리를 필터링하고, 승차 횟수를 1회부터 8회까지 선택하며, 밝은 테마와 어두운 테마를 전환할 수 있습니다.

인터페이스는 영어, 번체 중국어, 간체 중국어, 일본어, 한국어, 스페인어, 프랑스어, 독일어, 브라질 포르투갈어를 지원합니다. 화면은 휴대전화에 맞게 조정됩니다. 기본 예제를 공유하면 날짜, 출발 시간, 출발지, 교통수단, 승차 횟수, 예산, 언어, 테마가 링크에 포함됩니다. 가져온 ZIP은 각 기기에서 로컬로 다시 열어야 하므로 비공개 피드 공유는 비활성화됩니다.

내보내기는 지도, 출발지 핀, 출발 시간, 이동 시간 예산, 출처 표시와 도보 추정 안내를 포함한 1080 x 1350 PNG를 만듭니다. 지도 타일에는 인터넷 연결이 필요합니다. 데이터 파싱과 경로 계산은 워커에서 실행됩니다.

## 내 컴퓨터에서 실행하기

Node.js 22.12 이상과 Git가 필요합니다. 위 명령은 GitHub에서 소스 코드를 내려받아 로컬에서 빌드한 뒤 `http://127.0.0.1:4173`에서 서버를 시작합니다. 처음 실행은 라이브 데모를 여는 것보다 시간이 더 걸립니다.

<details>
<summary>macOS 및 Linux</summary>

```sh
npx --yes git+https://github.com/Arthur031221/Reachbloom.git
```

다른 포트를 사용하려면 명령 뒤에 포트 번호를 붙입니다: `npx --yes git+https://github.com/Arthur031221/Reachbloom.git 4180`.

</details>

<details>
<summary>Windows PowerShell</summary>

```powershell
npx --yes git+https://github.com/Arthur031221/Reachbloom.git
```

`http://127.0.0.1:4173`을 엽니다. Ctrl+C를 눌러 서버를 중지합니다.

</details>

<details>
<summary>체크아웃에서 빌드하거나 정적 사본 호스팅하기</summary>

```sh
git clone https://github.com/Arthur031221/Reachbloom.git
cd Reachbloom
npm ci
npm run build
npx vite preview
```

`dist/`를 원하는 정적 호스트에 배포합니다. GitHub Pages는 포함된 워크플로를 사용합니다. [설치 안내](docs/install.md)와 [설정 안내](docs/config.md)를 참조하세요.

</details>

## 결과의 의미

대중교통 계산은 날짜가 지정된 예정 출발·도착 시간, 서비스 달력 예외, 자정을 넘기는 운행을 사용합니다. 각 승차 라운드에서 운행 중인 모든 여정을 검색하며 추월하는 차량도 처리합니다. 환승 매칭은 노선과 여정 맥락을 유지하고 GTFS의 구체성 순서를 따르며 최소 시간과 환승 금지를 준수합니다. 일반 환승에는 환승 도보를 포함해 총 2분이 필요합니다. 환승을 위한 차량 대기와 다음 여정까지 차 안에 머무르는 연결은 모델링하지 않습니다. 이러한 연결은 시간표에 따른 일반 하차와 재승차로 처리합니다.

도보 속도는 시속 4.8km로 추정합니다. 정류장까지와 정류장에서의 도보는 각각 최대 1km이며, 승차 간 환승 도보는 한 번, 최대 400m입니다. 표시되는 120m 격자에서는 추정 도보 반경 안에 완전히 들어가는 셀만 표시합니다. 경계에서는 보수적으로 계산하며 도로망 기반 등시간권이 아닙니다. 사전 조율로 승차하거나 하차해야 하는 정류장은 해당 동작에서 제외됩니다. 정확한 배차 간격 서비스는 펼쳐 계산하고, 정확하지 않은 간격 템플릿은 안내와 함께 생략합니다.

이 버전은 기관의 현지 시각을 사용하므로 일광 절약 시간 변경 전후 날짜는 거부됩니다. 실시간 지연, 요금, 휠체어 경로는 제공하지 않으며 운영사의 경로 안내 수준의 정확도를 주장하지 않습니다. [지원 데이터와 제한 사항](docs/data-support.md)에서 거부되거나 근사 처리되는 입력을 설명합니다.

BART 스냅샷의 종료일은 2026-08-30으로 표시되어 있지만 달력은 그 이후까지 이어집니다. 지도에는 유효 기간 필드가 표시되며 그 범위를 벗어나면 경고합니다. 피드마다 라이선스가 다릅니다. [데이터 출처](data/README.md)와 [제3자 고지](THIRD_PARTY_NOTICES.md)를 참조하세요.

## 작업 확인

```sh
npm ci
npm run typecheck
npm test
npm run build
npm run check:ui
```

브라우저 점검은 실제 지도, 가져오기 오류, 예제 3개, 여정, 언어 9개, 공유, PNG 내보내기, 모바일 화면 넘침을 확인합니다. 시스템 Chrome을 사용할 수 없다면 먼저 `npx playwright install chromium`으로 Chromium을 설치하세요. CI의 단위 테스트와 빌드는 Node 22와 24에서 실행됩니다. 브라우저, 패키지, 참조 구현 검사는 Node 22에서 실행됩니다.

`npm run benchmark`는 내장 피드를 컴퓨터에서 측정합니다. 독립적인 원본 CSV 참조 점검을 하려면 Python 환경을 만들고 `PYTHON=.venv/bin/python npm run verify:reference`를 실행하세요. [참조 구현](tests/reference.py)은 앱의 라운드 검색 대신 이벤트 검색을 사용합니다. 고정 쿼리 6개가 통과해도 모든 피드의 정확성이 입증되는 것은 아닙니다.

[사용법](docs/usage.md) / [아키텍처](docs/architecture.md) / [정확도](docs/accuracy.md) / [기여하기](CONTRIBUTING.md)

소스 코드는 MIT 라이선스입니다. 대중교통 데이터와 지도 타일에는 별도의 이용 약관이 적용됩니다.

Assisted by Claude/Codex.
