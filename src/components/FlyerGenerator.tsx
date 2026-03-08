import { useState, useRef, useCallback, useEffect } from "react";
import { X, Download, Image as ImageIcon, Home, Plane } from "lucide-react";

interface FlyerGeneratorProps {
  open: boolean;
  onClose: () => void;
  eventType: string;
  opponent: string;
  date: string;
  time: string;
  location: string;
  opponentLogoUrl?: string | null;
  homeScore?: number | null;
  awayScore?: number | null;
}

type FlyerMode = "proximo_jogo" | "resultado";
type MatchSide = "home" | "away";

const CANVAS_W = 1080;
const CANVAS_H = 1350;

const TEAM_LOGO_PATH = "/images/distrito-uniao-logo.png";

// Professional dark palette
const BG_BLACK = "#050a12";
const BORDER_BLUE = "#0d1b3e";
const BLUE_ACCENT = "#1a3a7a";
const BLUE_GLOW = "#2563eb";
const WHITE = "#ffffff";
const WHITE_DIM = "#8899bb";
const GOLD = "#d4a017";
const YELLOW = "#eab308";
const YELLOW_LIGHT = "#facc15";

const FlyerGenerator = ({
  open, onClose, eventType, opponent, date, time, location,
  opponentLogoUrl, homeScore, awayScore,
}: FlyerGeneratorProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useState<FlyerMode>("proximo_jogo");
  const [side, setSide] = useState<MatchSide>("home");
  const [opponentLogoFile, setOpponentLogoFile] = useState<string | null>(null);
  const [localHomeScore, setLocalHomeScore] = useState(homeScore ?? 0);
  const [localAwayScore, setLocalAwayScore] = useState(awayScore ?? 0);
  const oppLogoInputRef = useRef<HTMLInputElement>(null);

  const oppLogo = opponentLogoFile || opponentLogoUrl || null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setOpponentLogoFile(URL.createObjectURL(file));
  };

  const loadImage = (src: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });

  const removeBackground = (img: HTMLImageElement, size: number): HTMLCanvasElement => {
    const c = document.createElement("canvas");
    c.width = size; c.height = size;
    const cx = c.getContext("2d")!;
    const asp = img.width / img.height;
    let dw = size, dh = size;
    if (asp > 1) dh = size / asp; else dw = size * asp;
    cx.drawImage(img, (size - dw) / 2, (size - dh) / 2, dw, dh);
    const id = cx.getImageData(0, 0, size, size);
    const d = id.data;
    for (let i = 0; i < d.length; i += 4) {
      const r = d[i], g = d[i + 1], b = d[i + 2];
      // Remove white/near-white backgrounds
      if (r > 225 && g > 225 && b > 225) d[i + 3] = 0;
      else if (r > 200 && g > 200 && b > 200) d[i + 3] = Math.max(0, d[i + 3] - 180);
      // Remove pure black backgrounds
      if (r < 25 && g < 25 && b < 25) d[i + 3] = 0;
      else if (r < 45 && g < 45 && b < 45) d[i + 3] = Math.max(0, d[i + 3] - 150);
    }
    cx.putImageData(id, 0, 0);
    return c;
  };

  const drawFlyer = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const BORDER = 28;
    const INNER_X = BORDER;
    const INNER_Y = BORDER;
    const INNER_W = CANVAS_W - BORDER * 2;
    const INNER_H = CANVAS_H - BORDER * 2;

    // ============ OUTER BORDER (dark blue) ============
    ctx.fillStyle = BORDER_BLUE;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // ============ INNER BLACK PANEL ============
    const innerBg = ctx.createRadialGradient(CANVAS_W / 2, CANVAS_H * 0.4, 80, CANVAS_W / 2, CANVAS_H * 0.4, CANVAS_H * 0.8);
    innerBg.addColorStop(0, "#0e1525");
    innerBg.addColorStop(0.5, "#080f1e");
    innerBg.addColorStop(1, BG_BLACK);
    ctx.fillStyle = innerBg;
    roundRect(ctx, INNER_X, INNER_Y, INNER_W, INNER_H, 4);
    ctx.fill();

    // Subtle center blue radial glow
    ctx.save();
    ctx.globalAlpha = 0.08;
    const cGlow = ctx.createRadialGradient(CANVAS_W / 2, CANVAS_H * 0.38, 50, CANVAS_W / 2, CANVAS_H * 0.38, 500);
    cGlow.addColorStop(0, BLUE_GLOW);
    cGlow.addColorStop(1, "transparent");
    ctx.fillStyle = cGlow;
    ctx.fillRect(INNER_X, INNER_Y, INNER_W, INNER_H);
    ctx.restore();

    // Very subtle noise texture
    ctx.save();
    ctx.globalAlpha = 0.012;
    for (let i = INNER_Y; i < INNER_Y + INNER_H; i += 4) {
      ctx.fillStyle = WHITE;
      ctx.fillRect(INNER_X, i, INNER_W, 1);
    }
    ctx.restore();

    // Inner border accent line (thin blue)
    ctx.save();
    ctx.strokeStyle = BLUE_ACCENT + "50";
    ctx.lineWidth = 1;
    roundRect(ctx, INNER_X + 1, INNER_Y + 1, INNER_W - 2, INNER_H - 2, 3);
    ctx.stroke();
    ctx.restore();

    // ============ HEADER ============
    const headerY = 90;

    // Event type (e.g. "AMISTOSO")
    const badgeText = eventType.toUpperCase();
    ctx.save();
    ctx.font = "800 42px 'Segoe UI', Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.fillStyle = WHITE;
    ctx.letterSpacing = "6px";
    ctx.fillText(badgeText, CANVAS_W / 2, headerY);
    ctx.restore();

    // Date / Location / Time line
    const dateStr = date ? new Date(date + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }) : "--/--";
    const infoLine = `${dateStr} / ${location.toUpperCase()} / ${time}H`;
    ctx.save();
    ctx.font = "600 22px 'Segoe UI', Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.fillStyle = BLUE_GLOW;
    ctx.fillText(infoLine, CANVAS_W / 2, headerY + 45);
    ctx.restore();

    // Home/Away small indicator
    const sideLabel = side === "home" ? "🏠 MANDANTE" : "✈️ VISITANTE";
    ctx.save();
    ctx.font = "500 18px 'Segoe UI', Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.fillStyle = WHITE_DIM;
    ctx.fillText(sideLabel, CANVAS_W / 2, headerY + 80);
    ctx.restore();

    // Thin separator
    drawThinSeparator(ctx, headerY + 105);

    // ============ LOGOS SECTION ============
    const logoSize = 300;
    const logoCenterY = 420;
    const leftCx = CANVAS_W / 2 - 240;
    const rightCx = CANVAS_W / 2 + 240;
    const ourCx = side === "home" ? leftCx : rightCx;
    const oppCx = side === "home" ? rightCx : leftCx;

    // Outer glow behind logos (cohesion effect)
    drawLogoGlow(ctx, ourCx, logoCenterY, logoSize * 0.6, BLUE_GLOW, 0.12);
    drawLogoGlow(ctx, oppCx, logoCenterY, logoSize * 0.5, BLUE_ACCENT, 0.08);

    // Our team logo
    try {
      const teamImg = await loadImage(TEAM_LOGO_PATH);
      drawLogoWithShadow(ctx, teamImg, ourCx, logoCenterY, logoSize);
    } catch {
      drawPlaceholderLogo(ctx, ourCx, logoCenterY, logoSize, "DISTRITO\nUNIÃO", BLUE_GLOW);
    }

    // Opponent logo
    if (oppLogo) {
      try {
        const img = await loadImage(oppLogo);
        const cleaned = removeBackground(img, logoSize);
        ctx.save();
        ctx.shadowColor = "#000000";
        ctx.shadowBlur = 30;
        ctx.shadowOffsetY = 8;
        ctx.drawImage(cleaned, oppCx - logoSize / 2, logoCenterY - logoSize / 2, logoSize, logoSize);
        ctx.restore();
      } catch {
        drawPlaceholderLogo(ctx, oppCx, logoCenterY, logoSize, "ADVERSÁRIO", BLUE_ACCENT);
      }
    } else {
      drawPlaceholderLogo(ctx, oppCx, logoCenterY, logoSize, "ADVERSÁRIO", BLUE_ACCENT);
    }

    // ============ VS / SCORE ============
    if (mode === "resultado") {
      const leftScore = side === "home" ? localHomeScore : localAwayScore;
      const rightScore = side === "home" ? localAwayScore : localHomeScore;

      // Score background pill
      ctx.save();
      ctx.fillStyle = "#0a101f";
      ctx.globalAlpha = 0.7;
      roundRect(ctx, CANVAS_W / 2 - 80, logoCenterY - 45, 160, 90, 16);
      ctx.fill();
      ctx.restore();

      ctx.save();
      ctx.shadowColor = YELLOW;
      ctx.shadowBlur = 25;
      ctx.fillStyle = WHITE;
      ctx.font = "900 85px 'Segoe UI', Arial, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(`${leftScore}`, CANVAS_W / 2 - 42, logoCenterY + 28);
      ctx.fillText(`${rightScore}`, CANVAS_W / 2 + 42, logoCenterY + 28);
      ctx.restore();

      ctx.fillStyle = YELLOW;
      ctx.font = "900 40px 'Segoe UI', Arial, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("×", CANVAS_W / 2, logoCenterY + 14);
    } else {
      // VS badge - minimal and clean
      ctx.save();
      // Dark circle bg
      ctx.beginPath();
      ctx.arc(CANVAS_W / 2, logoCenterY, 42, 0, Math.PI * 2);
      ctx.fillStyle = "#0a0f1e";
      ctx.fill();
      // Blue accent ring
      ctx.beginPath();
      ctx.arc(CANVAS_W / 2, logoCenterY, 42, 0, Math.PI * 2);
      ctx.strokeStyle = BLUE_ACCENT + "80";
      ctx.lineWidth = 2;
      ctx.stroke();
      // Inner circle
      ctx.beginPath();
      ctx.arc(CANVAS_W / 2, logoCenterY, 32, 0, Math.PI * 2);
      ctx.fillStyle = BLUE_ACCENT;
      ctx.fill();

      ctx.fillStyle = WHITE;
      ctx.font = "900 26px 'Segoe UI', Arial, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("VS", CANVAS_W / 2, logoCenterY + 9);
      ctx.restore();
    }

    // ============ TEAM NAMES ============
    const nameY = logoCenterY + logoSize / 2 + 45;

    ctx.font = "800 26px 'Segoe UI', Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.fillStyle = WHITE;
    ctx.fillText("DISTRITO UNIÃO FC", ourCx, nameY);

    ctx.fillStyle = WHITE_DIM;
    const oppName = opponent ? opponent.toUpperCase() : "ADVERSÁRIO";
    ctx.fillText(oppName, oppCx, nameY);

    // ============ SEPARATOR ============
    drawThinSeparator(ctx, nameY + 40);

    // ============ MAIN TITLE ============
    const titleBaseY = nameY + 110;
    const mainTitle = mode === "proximo_jogo" ? "PRÓXIMO" : "RESULTADO";
    const subTitle = mode === "proximo_jogo" ? "JOGO" : "FINAL";

    // Main word - large white geometric block
    ctx.save();
    ctx.shadowColor = BLUE_GLOW + "60";
    ctx.shadowBlur = 50;
    ctx.fillStyle = WHITE;
    ctx.font = "900 100px 'Segoe UI', Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(mainTitle, CANVAS_W / 2, titleBaseY);
    ctx.restore();

    // Sub word - even larger, blue accent
    ctx.save();
    ctx.shadowColor = BLUE_GLOW + "40";
    ctx.shadowBlur = 35;
    ctx.fillStyle = BLUE_GLOW;
    ctx.font = "900 140px 'Segoe UI', Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(subTitle, CANVAS_W / 2, titleBaseY + 130);
    ctx.restore();

    // ============ TEAM NAME BELOW TITLE ============
    ctx.save();
    ctx.font = "700 28px 'Segoe UI', Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.fillStyle = WHITE_DIM;
    ctx.fillText("DISTRITO UNIÃO", CANVAS_W / 2, titleBaseY + 190);
    ctx.restore();

    // ============ FOOTER / SPONSORS AREA ============
    drawThinSeparator(ctx, CANVAS_H - 120);

    // Sponsor line
    ctx.save();
    ctx.font = "400 16px 'Segoe UI', Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.fillStyle = WHITE_DIM + "80";
    ctx.fillText("APOIO", CANVAS_W / 2, CANVAS_H - 85);
    ctx.restore();

    ctx.save();
    ctx.font = "700 20px 'Segoe UI', Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.fillStyle = WHITE_DIM;
    ctx.fillText("DISTRITO UNIÃO FC  •  FUTEBOL AMADOR", CANVAS_W / 2, CANVAS_H - 55);
    ctx.restore();

  }, [mode, side, oppLogo, eventType, date, time, location, opponent, localHomeScore, localAwayScore]);

  useEffect(() => {
    if (open) drawFlyer();
  }, [open, drawFlyer]);

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `flyer-${mode}-${date}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-card rounded-2xl max-h-[95vh] overflow-y-auto">
        <div className="px-4 py-4 border-b border-border flex items-center justify-between sticky top-0 bg-card z-10">
          <h3 className="text-sm font-bold">Gerar Flyer</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
            <X size={16} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Mode selector */}
          <div className="flex gap-2">
            <button
              onClick={() => setMode("proximo_jogo")}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                mode === "proximo_jogo" ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
              }`}
            >
              Próximo Jogo
            </button>
            <button
              onClick={() => setMode("resultado")}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                mode === "resultado" ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
              }`}
            >
              Resultado
            </button>
          </div>

          {/* Home/Away selector */}
          <div className="flex gap-2">
            <button
              onClick={() => setSide("home")}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${
                side === "home"
                  ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/40"
                  : "bg-secondary text-muted-foreground"
              }`}
            >
              <Home size={16} /> Em Casa
            </button>
            <button
              onClick={() => setSide("away")}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${
                side === "away"
                  ? "bg-blue-500/20 text-blue-400 border border-blue-500/40"
                  : "bg-secondary text-muted-foreground"
              }`}
            >
              <Plane size={16} /> Fora
            </button>
          </div>

          {/* Opponent logo upload */}
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Logo do adversário</label>
            <button
              onClick={() => oppLogoInputRef.current?.click()}
              className="w-full h-20 rounded-xl bg-secondary border-2 border-dashed border-border flex items-center justify-center gap-2 overflow-hidden hover:border-primary/40 transition-colors"
            >
              {oppLogo ? (
                <img src={oppLogo} alt="Logo adversário" className="h-16 w-16 object-contain" />
              ) : (
                <><ImageIcon size={16} className="text-muted-foreground" /><span className="text-xs text-muted-foreground">Anexar logo do adversário</span></>
              )}
            </button>
            <input ref={oppLogoInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
          </div>

          {/* Score inputs */}
          {mode === "resultado" && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Placar - Distrito União</label>
                <input type="number" min={0} value={localHomeScore}
                  onChange={(e) => setLocalHomeScore(Number(e.target.value))}
                  className="w-full h-10 rounded-lg bg-secondary/30 border border-border px-3 text-center text-lg font-bold" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Placar - Adversário</label>
                <input type="number" min={0} value={localAwayScore}
                  onChange={(e) => setLocalAwayScore(Number(e.target.value))}
                  className="w-full h-10 rounded-lg bg-secondary/30 border border-border px-3 text-center text-lg font-bold" />
              </div>
            </div>
          )}

          {/* Canvas preview */}
          <div className="rounded-xl overflow-hidden border border-border">
            <canvas ref={canvasRef} width={CANVAS_W} height={CANVAS_H} className="w-full h-auto" />
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button onClick={drawFlyer} className="flex-1 py-3 rounded-xl bg-secondary text-foreground font-semibold text-sm">
              Atualizar
            </button>
            <button onClick={handleDownload} className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2">
              <Download size={16} /> Baixar Flyer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============ HELPERS ============

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r); ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h); ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r); ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath();
}

function drawLogoWithShadow(ctx: CanvasRenderingContext2D, img: HTMLImageElement, cx: number, cy: number, size: number) {
  const asp = img.width / img.height;
  let dw = size, dh = size;
  if (asp > 1) dh = size / asp; else dw = size * asp;
  ctx.save();
  ctx.shadowColor = "#000000";
  ctx.shadowBlur = 30;
  ctx.shadowOffsetY = 8;
  ctx.drawImage(img, cx - dw / 2, cy - dh / 2, dw, dh);
  ctx.restore();
}

function drawLogoGlow(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, color: string, alpha: number) {
  ctx.save();
  ctx.globalAlpha = alpha;
  const g = ctx.createRadialGradient(cx, cy, r * 0.15, cx, cy, r);
  g.addColorStop(0, color);
  g.addColorStop(1, "transparent");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawPlaceholderLogo(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, label: string, color: string) {
  const r = size * 0.3;
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = color + "12";
  ctx.fill();
  ctx.strokeStyle = color + "30";
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 6]);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = "#4a5568";
  ctx.font = "600 18px 'Segoe UI', Arial, sans-serif";
  ctx.textAlign = "center";
  const lines = label.split("\n");
  lines.forEach((line, i) => {
    ctx.fillText(line, cx, cy + 6 + (i - (lines.length - 1) / 2) * 24);
  });
  ctx.restore();
}

function drawThinSeparator(ctx: CanvasRenderingContext2D, y: number) {
  const g = ctx.createLinearGradient(120, 0, CANVAS_W - 120, 0);
  g.addColorStop(0, "transparent");
  g.addColorStop(0.3, "#1a3a7a40");
  g.addColorStop(0.5, "#2563eb60");
  g.addColorStop(0.7, "#1a3a7a40");
  g.addColorStop(1, "transparent");
  ctx.fillStyle = g;
  ctx.fillRect(120, y, CANVAS_W - 240, 1);
}

export default FlyerGenerator;
