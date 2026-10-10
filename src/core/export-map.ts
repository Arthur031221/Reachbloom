type Pin = { x: number; y: number; name: string; color: string };
type ExportOptions = {
  canvas: HTMLCanvasElement;
  pins: Pin[];
  date: string;
  time: string;
  timeB?: string;
  minutes: number;
  agency: string;
  caveat: string;
  minutesLabel: string;
  scheduledLabel: string;
  dark: boolean;
};

export function exportImage(options: ExportOptions) {
  const out = document.createElement("canvas");
  out.width = 1080;
  out.height = 1350;
  const ctx = out.getContext("2d")!;
  ctx.fillStyle = options.dark ? "#162b35" : "#f4f8fa";
  ctx.fillRect(0, 0, out.width, out.height);
  const source = options.canvas;
  const scale = Math.min(1080 / source.width, 1130 / source.height);
  const left = (1080 - source.width * scale) / 2;
  const top = (1130 - source.height * scale) / 2;
  ctx.drawImage(source, left, top, source.width * scale, source.height * scale);
  for (const pin of options.pins) {
    const x = left + pin.x * scale,
      y = top + pin.y * scale;
    if (x < 0 || x > 1080 || y < 0 || y > 1130) continue;
    ctx.beginPath();
    ctx.arc(x, y, 18, 0, Math.PI * 2);
    ctx.fillStyle = pin.color;
    ctx.fill();
    ctx.strokeStyle = "white";
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = "white";
    ctx.font = "bold 21px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(pin.name, x, y);
  }
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "#132a38";
  ctx.fillRect(0, 1130, 1080, 220);
  ctx.fillStyle = "white";
  ctx.font = "bold 38px sans-serif";
  ctx.fillText(
    `Reachbloom | ${options.minutes} ${options.minutesLabel} | ${options.date}`,
    45,
    1181,
    990,
  );
  ctx.font = "24px sans-serif";
  ctx.fillStyle = "#cbdce3";
  ctx.fillText(
    `A ${options.time}${options.timeB ? ` | B ${options.timeB}` : ""} | ${options.scheduledLabel}`,
    45,
    1220,
    990,
  );
  const wrap = (text: string) => {
    const lines: string[] = [];
    let line = "";
    const words = text.split(/(\s+)/);
    for (const word of words) {
      if (ctx.measureText(line + word).width <= 990) {
        line += word;
        continue;
      }
      if (line.trim()) lines.push(line.trim());
      line = "";
      if (ctx.measureText(word).width <= 990) {
        line = word.trimStart();
        continue;
      }
      for (const character of word) {
        if (ctx.measureText(line + character).width > 990) {
          lines.push(line);
          line = "";
        }
        line += character;
      }
    }
    if (line.trim()) lines.push(line.trim());
    return lines;
  };
  let font = 24;
  let lines = wrap(options.caveat);
  while (lines.length > 2 && font > 14) {
    ctx.font = `${--font}px sans-serif`;
    lines = wrap(options.caveat);
  }
  lines.forEach((line, row) => ctx.fillText(line, 45, 1258 + row * (font + 4)));
  ctx.font = "18px sans-serif";
  ctx.fillText(
    `© OpenStreetMap contributors | ${options.agency}`,
    45,
    1320,
    990,
  );
  return out.toDataURL("image/png");
}
