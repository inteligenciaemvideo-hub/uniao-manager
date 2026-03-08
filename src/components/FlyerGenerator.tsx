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

// Team palette
const BLUE_DARK = "#0c1a3a";
const BLUE = "#1e3a8a";
const BLUE_LIGHT = "#2563eb";
const BLUE_GLOW = "#3b82f6";
const YELLOW = "#eab308";
const YELLOW_LIGHT = "#facc15";
const GOLD = "#d4a017";
const WHITE = "#ffffff";

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

  const removeWhiteBg = (img: HTMLImageElement, size: number): HTMLCanvasElement => {
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
      const r = d[i], g = d[i+1], b = d[i+2];
      if (r > 230 && g > 230 && b > 230) d[i+3] = 0;
      else if (r > 210 && g > 210 && b > 210) d[i+3] = Math.max(0, d[i+3] - 200);
    }
    cx.putImageData(id, 0, 0);
    return c;
  };

  const drawFlyer = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // ============ BACKGROUND ============
    // Deep blue gradient
    const bg = ctx.createRadialGradient(CANVAS_W / 2, CANVAS_H * 0.4, 100, CANVAS_W / 2, CANVAS_H * 0.4, CANVAS_H);
    bg.addColorStop(0, "#0f2557");
    bg.addColorStop(0.4, "#0a1a40");
    bg.addColorStop(0.8, "#060e24");
    bg.addColorStop(1, "#030812");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // Radial glow top center (blue)
    ctx.save();
    ctx.globalAlpha = 0.15;
    const topGlow = ctx.createRadialGradient(CANVAS_W / 2, 0, 50, CANVAS_W / 2, 0, 600);
    topGlow.addColorStop(0, BLUE_GLOW);
    topGlow.addColorStop(1, "transparent");
    ctx.fillStyle = topGlow;
    ctx.fillRect(0, 0, CANVAS_W, 700);
    ctx.restore();

    // Radial glow bottom (gold)
    ctx.save();
    ctx.globalAlpha = 0.07;
    const btmGlow = ctx.createRadialGradient(CANVAS_W / 2, CANVAS_H, 50, CANVAS_W / 2, CANVAS_H, 500);
    btmGlow.addColorStop(0, YELLOW);
    btmGlow.addColorStop(1, "transparent");
    ctx.fillStyle = btmGlow;
    ctx.fillRect(0, CANVAS_H - 500, CANVAS_W, 500);
    ctx.restore();

    // Subtle noise/texture lines
    ctx.save();
    ctx.globalAlpha = 0.015;
    for (let i = 0; i < CANVAS_H; i += 3) {
      ctx.fillStyle = WHITE;
      ctx.fillRect(0, i, CANVAS_W, 1);
    }
    ctx.restore();

    // ============ BORDERS ============
    // Top gold border
    const topBar = ctx.createLinearGradient(0, 0, CANVAS_W, 0);
    topBar.addColorStop(0, "transparent");
    topBar.addColorStop(0.15, GOLD);
    topBar.addColorStop(0.5, YELLOW_LIGHT);
    topBar.addColorStop(0.85, GOLD);
    topBar.addColorStop(1, "transparent");
    ctx.fillStyle = topBar;
    ctx.fillRect(0, 0, CANVAS_W, 6);

    // Bottom gold border
    ctx.fillStyle = topBar;
    ctx.fillRect(0, CANVAS_H - 6, CANVAS_W, 6);

    // Side thin accent lines
    const sideBar = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
    sideBar.addColorStop(0, "transparent");
    sideBar.addColorStop(0.2, GOLD + "60");
    sideBar.addColorStop(0.5, YELLOW_LIGHT + "90");
    sideBar.addColorStop(0.8, GOLD + "60");
    sideBar.addColorStop(1, "transparent");
    ctx.fillStyle = sideBar;
    ctx.fillRect(0, 0, 3, CANVAS_H);
    ctx.fillRect(CANVAS_W - 3, 0, 3, CANVAS_H);

    // Corner ornaments
    drawCornerOrnament(ctx, 15, 15, 80, "tl");
    drawCornerOrnament(ctx, CANVAS_W - 15, 15, 80, "tr");
    drawCornerOrnament(ctx, 15, CANVAS_H - 15, 80, "bl");
    drawCornerOrnament(ctx, CANVAS_W - 15, CANVAS_H - 15, 80, "br");

    // ============ HEADER ============
    // Event type badge
    const badgeText = eventType.toUpperCase();
    ctx.font = "700 28px 'Segoe UI', Arial, sans-serif";
    ctx.textAlign = "center";
    const bw = ctx.measureText(badgeText).width + 70;
    const bx = (CANVAS_W - bw) / 2;

    ctx.save();
    ctx.fillStyle = BLUE;
    roundRect(ctx, bx, 40, bw, 46, 23);
    ctx.fill();
    ctx.strokeStyle = GOLD + "80";
    ctx.lineWidth = 1.5;
    roundRect(ctx, bx, 40, bw, 46, 23);
    ctx.stroke();
    ctx.fillStyle = YELLOW_LIGHT;
    ctx.font = "700 24px 'Segoe UI', Arial, sans-serif";
    ctx.fillText(badgeText, CANVAS_W / 2, 70);
    ctx.restore();

    // Home/Away indicator
    const sideLabel = side === "home" ? "MANDANTE" : "VISITANTE";
    ctx.fillStyle = side === "home" ? YELLOW : "#94a3b8";
    ctx.font = "600 20px 'Segoe UI', Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`⚽  ${sideLabel}`, CANVAS_W / 2, 120);

    // Date & time line
    const formattedDate = new Date(date + "T12:00:00").toLocaleDateString("pt-BR", {
      weekday: "long", day: "2-digit", month: "long", year: "numeric"
    });
    ctx.fillStyle = "#cbd5e1";
    ctx.font = "500 22px 'Segoe UI', Arial, sans-serif";
    ctx.fillText(formattedDate.toUpperCase(), CANVAS_W / 2, 160);

    ctx.fillStyle = "#94a3b8";
    ctx.font = "500 20px 'Segoe UI', Arial, sans-serif";
    ctx.fillText(`${time}H  •  ${location.toUpperCase()}`, CANVAS_W / 2, 192);

    // Separator
    drawGoldSeparator(ctx, 220);

    // ============ LOGOS SECTION ============
    const logoSize = 320;
    const logoY = 280;
    const leftCx = CANVAS_W / 2 - 230;
    const rightCx = CANVAS_W / 2 + 230;
    const ourCx = side === "home" ? leftCx : rightCx;
    const oppCx = side === "home" ? rightCx : leftCx;

    // Glow behind each logo
    drawLogoGlow(ctx, ourCx, logoY + logoSize / 2, logoSize * 0.55, BLUE_GLOW);
    drawLogoGlow(ctx, oppCx, logoY + logoSize / 2, logoSize * 0.45, "#64748b");

    // Our team logo (always the fixed one)
    try {
      const teamImg = await loadImage(TEAM_LOGO_PATH);
      drawFitImage(ctx, teamImg, ourCx, logoY, logoSize);
    } catch {
      drawModernPlaceholder(ctx, ourCx, logoY + logoSize / 2, logoSize, "DISTRITO\nUNIÃO", BLUE_GLOW);
    }

    // Opponent logo
    if (oppLogo) {
      try {
        const img = await loadImage(oppLogo);
        const cleaned = removeWhiteBg(img, logoSize);
        ctx.drawImage(cleaned, oppCx - logoSize / 2, logoY, logoSize, logoSize);
      } catch {
        drawModernPlaceholder(ctx, oppCx, logoY + logoSize / 2, logoSize, "ADVERSÁRIO", "#64748b");
      }
    } else {
      drawModernPlaceholder(ctx, oppCx, logoY + logoSize / 2, logoSize, "ADVERSÁRIO", "#64748b");
    }

    // ============ VS / SCORE ============
    const vsY = logoY + logoSize / 2;

    if (mode === "resultado") {
      const leftScore = side === "home" ? localHomeScore : localAwayScore;
      const rightScore = side === "home" ? localAwayScore : localHomeScore;

      // Score glow
      ctx.save();
      ctx.shadowColor = YELLOW;
      ctx.shadowBlur = 20;
      ctx.fillStyle = WHITE;
      ctx.font = "900 110px 'Segoe UI', Arial, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(`${leftScore}`, CANVAS_W / 2 - 55, vsY + 38);
      ctx.fillText(`${rightScore}`, CANVAS_W / 2 + 55, vsY + 38);
      ctx.restore();

      ctx.fillStyle = YELLOW;
      ctx.font = "900 55px 'Segoe UI', Arial, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("×", CANVAS_W / 2, vsY + 22);
    } else {
      // VS circle
      ctx.save();
      // Outer ring
      ctx.beginPath();
      ctx.arc(CANVAS_W / 2, vsY, 48, 0, Math.PI * 2);
      ctx.fillStyle = BLUE;
      ctx.fill();
      ctx.strokeStyle = GOLD;
      ctx.lineWidth = 3;
      ctx.stroke();

      // Inner fill
      ctx.beginPath();
      ctx.arc(CANVAS_W / 2, vsY, 38, 0, Math.PI * 2);
      const vsGrad = ctx.createLinearGradient(CANVAS_W / 2 - 38, vsY - 38, CANVAS_W / 2 + 38, vsY + 38);
      vsGrad.addColorStop(0, YELLOW);
      vsGrad.addColorStop(1, GOLD);
      ctx.fillStyle = vsGrad;
      ctx.fill();

      ctx.fillStyle = BLUE_DARK;
      ctx.font = "900 30px 'Segoe UI', Arial, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("VS", CANVAS_W / 2, vsY + 11);
      ctx.restore();
    }

    // ============ TEAM NAMES ============
    const nameY = logoY + logoSize + 35;
    ctx.font = "800 28px 'Segoe UI', Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.fillStyle = YELLOW_LIGHT;
    ctx.fillText("DISTRITO UNIÃO FC", ourCx, nameY);

    ctx.fillStyle = "#e2e8f0";
    const oppName = opponent ? opponent.toUpperCase() : "ADVERSÁRIO";
    ctx.fillText(oppName, oppCx, nameY);

    // ============ SEPARATOR ============
    drawGoldSeparator(ctx, nameY + 35);

    // ============ MAIN TITLE ============
    const titleY = nameY + 100;
    const mainTitle = mode === "proximo_jogo" ? "PRÓXIMO" : "RESULTADO";
    const subTitle = mode === "proximo_jogo" ? "JOGO" : "FINAL";

    // Main title with glow
    ctx.save();
    ctx.shadowColor = BLUE_GLOW;
    ctx.shadowBlur = 40;
    ctx.fillStyle = WHITE;
    ctx.font = "900 105px 'Segoe UI', Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(mainTitle, CANVAS_W / 2, titleY);
    ctx.restore();

    // Sub title in gold
    ctx.save();
    ctx.shadowColor = YELLOW + "80";
    ctx.shadowBlur = 25;
    const titleGrad = ctx.createLinearGradient(CANVAS_W / 2 - 200, titleY, CANVAS_W / 2 + 200, titleY + 120);
    titleGrad.addColorStop(0, YELLOW_LIGHT);
    titleGrad.addColorStop(0.5, YELLOW);
    titleGrad.addColorStop(1, GOLD);
    ctx.fillStyle = titleGrad;
    ctx.font = "900 130px 'Segoe UI', Arial, sans-serif";
    ctx.fillText(subTitle, CANVAS_W / 2, titleY + 125);
    ctx.restore();

    // ============ FOOTER ============
    drawGoldSeparator(ctx, CANVAS_H - 80);

    ctx.fillStyle = "#64748b";
    ctx.font = "500 18px 'Segoe UI', Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("DISTRITO UNIÃO FC  •  FUTEBOL AMADOR", CANVAS_W / 2, CANVAS_H - 40);

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

          {/* Opponent logo upload only */}
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

function drawFitImage(ctx: CanvasRenderingContext2D, img: HTMLImageElement, cx: number, y: number, size: number) {
  const asp = img.width / img.height;
  let dw = size, dh = size;
  if (asp > 1) dh = size / asp; else dw = size * asp;
  ctx.drawImage(img, cx - dw / 2, y + (size - dh) / 2, dw, dh);
}

function drawLogoGlow(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, color: string) {
  ctx.save();
  ctx.globalAlpha = 0.12;
  const g = ctx.createRadialGradient(cx, cy, r * 0.2, cx, cy, r);
  g.addColorStop(0, color);
  g.addColorStop(1, "transparent");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawModernPlaceholder(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, label: string, color: string) {
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
  ctx.fillStyle = "#64748b";
  ctx.font = "600 18px 'Segoe UI', Arial, sans-serif";
  ctx.textAlign = "center";
  const lines = label.split("\n");
  lines.forEach((line, i) => {
    ctx.fillText(line, cx, cy + 6 + (i - (lines.length - 1) / 2) * 24);
  });
  ctx.restore();
}

function drawGoldSeparator(ctx: CanvasRenderingContext2D, y: number) {
  const g = ctx.createLinearGradient(150, 0, CANVAS_W - 150, 0);
  g.addColorStop(0, "transparent");
  g.addColorStop(0.2, "#d4a01740");
  g.addColorStop(0.5, "#facc15");
  g.addColorStop(0.8, "#d4a01740");
  g.addColorStop(1, "transparent");
  ctx.fillStyle = g;
  ctx.fillRect(150, y, CANVAS_W - 300, 2);

  // Small diamond in the center
  ctx.save();
  ctx.fillStyle = "#facc15";
  ctx.translate(CANVAS_W / 2, y + 1);
  ctx.rotate(Math.PI / 4);
  ctx.fillRect(-4, -4, 8, 8);
  ctx.restore();
}

function drawCornerOrnament(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, pos: "tl" | "tr" | "bl" | "br") {
  ctx.save();
  ctx.strokeStyle = "#d4a01750";
  ctx.lineWidth = 2;

  const s = size;
  ctx.beginPath();
  if (pos === "tl") {
    ctx.moveTo(x, y + s); ctx.lineTo(x, y); ctx.lineTo(x + s, y);
    // Inner corner accent
    ctx.moveTo(x + 8, y + s * 0.6); ctx.lineTo(x + 8, y + 8); ctx.lineTo(x + s * 0.6, y + 8);
  } else if (pos === "tr") {
    ctx.moveTo(x - s, y); ctx.lineTo(x, y); ctx.lineTo(x, y + s);
    ctx.moveTo(x - s * 0.6, y + 8); ctx.lineTo(x - 8, y + 8); ctx.lineTo(x - 8, y + s * 0.6);
  } else if (pos === "bl") {
    ctx.moveTo(x, y - s); ctx.lineTo(x, y); ctx.lineTo(x + s, y);
    ctx.moveTo(x + 8, y - s * 0.6); ctx.lineTo(x + 8, y - 8); ctx.lineTo(x + s * 0.6, y - 8);
  } else {
    ctx.moveTo(x - s, y); ctx.lineTo(x, y); ctx.lineTo(x, y - s);
    ctx.moveTo(x - s * 0.6, y - 8); ctx.lineTo(x - 8, y - 8); ctx.lineTo(x - 8, y - s * 0.6);
  }
  ctx.stroke();
  ctx.restore();
}

export default FlyerGenerator;
