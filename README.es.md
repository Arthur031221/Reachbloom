<div align="center">
<img src="assets/logo.svg" width="64" alt="Reachbloom">
<h1>Reachbloom</h1>
<p><a href="LICENSE"><img src="assets/license.svg" alt="MIT license" width="88" height="22"></a></p>
<p>Descubre hasta dónde puedes llegar en transporte público en 30 minutos.</p>
<p><b>6 consultas seleccionadas de BART coinciden con una búsqueda independiente de eventos en CSV.</b> Ambas usan el modelo de caminata documentado. Esto comprueba el cálculo, no los tiempos reales del viaje. <a href="benchmarks/reference-results.json">Casos y método</a>.</p>
<p><a href="https://arthur031221.github.io/Reachbloom/">Abrir el mapa</a> / <a href="docs/accuracy.md">Leer los supuestos</a></p>
<p><a href="README.md">English README</a> / <a href="README.zh-TW.md">繁體中文</a> / <a href="README.zh-CN.md">简体中文</a> / <a href="README.ja.md">日本語</a> / <a href="README.ko.md">한국어</a> / <a href="README.es.md">Español</a> / <a href="README.fr.md">Français</a> / <a href="README.de.md">Deutsch</a> / <a href="README.pt-BR.md">Português</a></p>
</div>

| Antes                                           | Con Reachbloom                                          |
| :---------------------------------------------- | :------------------------------------------------------ |
| Buscar salidas en varias tablas de horarios     | Mover un pin para ver las paradas accesibles            |
| Comparar de memoria dos casas u horas de salida | Colocar A y B en el mismo mapa                          |
| Enviar una captura sin contexto                 | Compartir la fecha, los orígenes y el tiempo disponible |

```sh
npx --yes git+https://github.com/Arthur031221/Reachbloom.git
```

![Una sesión real de BART: cambia el tiempo disponible, compara orígenes y consulta un itinerario](assets/demo.gif)

Un horario es un plan, no la ubicación en tiempo real de un vehículo.

## Tren, autobús y ferry en un mismo mapa

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="assets/hero-dark.png">
  <img src="assets/hero-light.png" alt="Alcance de BART desde Civic Center, con los controles de salida y las paradas alcanzables" width="1200">
</picture>

_Novedad en 1.0: horario ferroviario con fecha y supuesto de caminata visible._

Abre la [demo en vivo](https://arthur031221.github.io/Reachbloom/) sin cuenta ni clave de API. Los ejemplos incluidos abarcan el tren BART, Maywood Express Shuttle y Yurok River Otter Ferry. Son instantáneas de horarios con fecha, no ubicaciones de vehículos en tiempo real. Importa tu propio ZIP GTFS para explorar otra red regional. El archivo permanece en tu navegador.

Prueba este recorrido de cinco pasos por el mapa:

1. Mantén BART con fecha 2026-08-24 y hora 08:00.
2. Mueve el origen A cerca de Civic Center, en San Francisco.
3. Prueba los presupuestos de 15, 30 y 45 minutos.
4. Activa el origen B y cambia su hora de salida.
5. Busca Powell y abre los pasos a pie, de espera y de viaje.

El naranja representa A, el verde azulado B y el morado la zona accesible desde ambos. La cuadrícula estima los trayectos a pie en línea recta e ignora calles, barreras y agua. La zona compartida puede sugerir un lugar de encuentro. No busca viviendas que permitan ir al trabajo desde dos lugares distintos.

<table>
<tr><td><a href="assets/bus.png"><img src="assets/bus.png" alt="Mapa del horario de Maywood Express Shuttle" width="580"></a></td><td><a href="assets/ferry.png"><img src="assets/ferry.png" alt="Mapa del horario de River Otter Ferry" width="580"></a></td></tr>
<tr><td><i>Novedad en 1.0: una lanzadera de barrio.</i></td><td><i>Novedad en 1.0: un cruce en ferry.</i></td></tr>
</table>

## Por qué lo creé

> _Puedo leer una tabla de salidas. Aun así, quiero ver adónde me lleva esa salida._

Creé Reachbloom porque quería tener la fecha, el tiempo de espera y los supuestos de caminata junto al mapa. Quería mover un marcador, comparar otra hora de salida y compartir la misma vista. El horario se puede consultar y el cálculo se ejecuta en el navegador.

## Qué genera

| Salida                 | Incluye                                                                  |
| :--------------------- | :----------------------------------------------------------------------- |
| Mapa de alcance        | Salidas fechadas, estimación a pie y límite de viajes                    |
| Enlace compartido      | Ambos orígenes, horas, modo, tema e idioma                               |
| PNG                    | Marcadores de origen, horas de salida, presupuesto de viaje y atribución |
| Itinerario por paradas | Pasos de caminata, espera y viaje con horarios                           |

## Un horario que puedes recorrer

Los vehículos programados siguen las formas de las rutas del feed cuando están disponibles. Al reproducir, avanza el reloj de salida para que puedas ver cómo cambian los vehículos y el alcance. Filtra tren, autobús o ferry, elige de uno a ocho viajes y alterna entre temas claro y oscuro.

La interfaz está disponible en inglés, chino tradicional, chino simplificado, japonés, coreano, español, francés, alemán y portugués de Brasil. El diseño se adapta al teléfono. Al compartir un ejemplo incluido, el enlace contiene la fecha, las horas de salida, los orígenes, el modo, el número de viajes, el presupuesto, el idioma y el tema. Para reproducir una vista con un ZIP importado hay que abrirlo de nuevo en el dispositivo local, por lo que se desactiva el uso compartido de feeds privados.

La exportación crea un PNG de 1080 x 1350 con el mapa, los marcadores de origen, las horas de salida, el presupuesto de viaje y la atribución. También incluye una advertencia sobre la estimación a pie. Los mosaicos del mapa requieren conexión a Internet. El análisis de datos y el cálculo de itinerarios se ejecutan en workers.

## Ejecútalo en tu equipo

Se requieren Node.js 22.12 o posterior y Git. El comando anterior descarga el código fuente de GitHub, lo compila localmente e inicia un servidor en `http://127.0.0.1:4173`. La primera ejecución tarda más que abrir la demo en vivo.

<details>
<summary>macOS y Linux</summary>

```sh
npx --yes git+https://github.com/Arthur031221/Reachbloom.git
```

Para usar otro puerto, añádelo al final: `npx --yes git+https://github.com/Arthur031221/Reachbloom.git 4180`.

</details>

<details>
<summary>Windows PowerShell</summary>

```powershell
npx --yes git+https://github.com/Arthur031221/Reachbloom.git
```

Abre `http://127.0.0.1:4173`. Pulsa Ctrl+C para detener el servidor.

</details>

<details>
<summary>Compilar desde una copia local o alojar una versión estática</summary>

```sh
git clone https://github.com/Arthur031221/Reachbloom.git
cd Reachbloom
npm ci
npm run build
npx vite preview
```

Despliega `dist/` en cualquier alojamiento estático. GitHub Pages usa el flujo de trabajo incluido. Consulta las instrucciones de [instalación](docs/install.md) y [configuración](docs/config.md).

</details>

## Qué significa el resultado

El cálculo de transporte usa salidas y llegadas programadas con fecha, excepciones del calendario y servicio nocturno. En cada ronda de viajes recorro todos los viajes activos, incluidos los que adelantan a otros. La correspondencia de transbordos conserva el contexto de la ruta y del viaje, sigue el orden de especificidad de GTFS y respeta los tiempos mínimos y las prohibiciones. Un transbordo genérico requiere dos minutos en total, incluido el trayecto a pie entre servicios. No se modelan las esperas del vehículo para garantizar conexiones ni la continuación a bordo entre viajes. Estas conexiones usan un transbordo normal según el horario.

La velocidad a pie se estima en 4,8 km/h. Los trayectos a pie de acceso y salida tienen un límite de 1 km. Se permite un trayecto a pie de hasta 400 m entre viajes. La cuadrícula mostrada, de 120 m, conserva solo las celdas que quedan por completo dentro del radio a pie estimado. El cálculo es conservador en el límite y no representa una isócrona basada en calles. Se excluyen las paradas que requieren coordinar con antelación la recogida o el descenso para esas acciones. Se expanden los servicios con frecuencias exactas. Las plantillas de frecuencia no exactas se omiten con una nota.

Se rechazan las fechas cercanas a los cambios de horario de verano porque esta versión usa la hora local del operador. No incluye retrasos en tiempo real, tarifas ni rutas accesibles para sillas de ruedas, y no afirma tener la precisión de un planificador del operador. [Datos compatibles y limitaciones](docs/data-support.md) describe las entradas rechazadas y aproximadas.

La instantánea de BART indica una fecha de finalización del 2026-08-30, aunque su calendario continúa después. El mapa muestra los campos de vigencia y avisa cuando se consulta fuera de ese intervalo. Cada feed tiene su propia licencia. Consulta la [procedencia de los datos](data/README.md) y los [avisos de terceros](THIRD_PARTY_NOTICES.md).

## Comprobar el trabajo

```sh
npm ci
npm run typecheck
npm test
npm run build
npm run check:ui
```

La comprobación del navegador cubre el mapa real, errores de importación, los tres ejemplos, itinerarios, nueve idiomas, uso compartido, exportación PNG y desbordamiento en móviles. Si no tienes Chrome del sistema, instala Chromium primero con `npx playwright install chromium`. Las pruebas unitarias y las compilaciones se ejecutan con Node 22 y 24 en CI. Las comprobaciones del navegador, del paquete y de referencia se ejecutan con Node 22.

`npm run benchmark` mide el feed incluido en tu equipo. Para la verificación independiente con los CSV originales, crea un entorno de Python y ejecuta `PYTHON=.venv/bin/python npm run verify:reference`. La [implementación de referencia](tests/reference.py) usa una búsqueda de eventos en lugar del recorrido por rondas de la aplicación. Superar seis consultas fijas no demuestra que todos los feeds sean precisos.

[Uso](docs/usage.md) / [Arquitectura](docs/architecture.md) / [Precisión](docs/accuracy.md) / [Contribuir](CONTRIBUTING.md)

El código fuente está bajo licencia MIT. Los datos de transporte y los mosaicos del mapa tienen condiciones independientes.

Assisted by Claude/Codex.
