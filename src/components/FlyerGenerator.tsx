import { useState, useRef, useCallback, useEffect } from "react";
import { X, Download, Image as ImageIcon, Home, Plane } from "lucide-react";

interface Sponsor {
  id: string;
  name: string;
  logo_url?: string | null;
}

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
  sponsors?: Sponsor[];
}

type FlyerMode = "proximo_jogo" | "resultado";
type MatchSide = "home" | "away";

const CANVAS_W = 1080;
const CANVAS_H = 1350;

const TEAM_LOGO_PATH = "/images/distrito-uniao-logo.png";

const BG_BLACK = "#050a12";
const BORDER_BLUE = "#0d1b3e";
const BLUE_ACCENT = "#1a3a7a";
const BLUE_GLOW = "#2563eb";
const WHITE = "#ffffff";
const WHITE_DIM = "#8899bb";

const FlyerGenerator = ({
  open, onClose, eventType, opponent, date, time, location,
  opponentLogoUrl, homeScore, awayScore, sponsors = [],
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

  const drawFlyer = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // ============ BACKGROUND ============
    ctx.fillStyle = BG_BLACK;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // Blue side stripes (like reference)
    const stripeW = 60;
    for (let i = 0; i < 8; i++) {
      ctx.save();
      ctx.globalAlpha = 0.15 - i * 0.015;
      const leftG = ctx.createLinearGradient(0, 0, stripeW * 3, 0);
      leftG.addColorStop(0, BLUE_GLOW);
      leftG.addColorStop(1, "transparent");
      ctx.fillStyle = leftG;
      ctx.fillRect(0, i * (CANVAS_H / 8), stripeW * 3, CANVAS_H / 8);

      const rightG = ctx.createLinearGradient(CANVAS_W, 0, CANVAS_W - stripeW * 3, 0);
      rightG.addColorStop(0, BLUE_GLOW);
      rightG.addColorStop(1, "transparent");
      ctx.fillStyle = rightG;
      ctx.fillRect(CANVAS_W - stripeW * 3, i * (CANVAS_H / 8), stripeW * 3, CANVAS_H / 8);
      ctx.restore();
    }

    // Diagonal blue stripe overlays
    ctx.save();
    ctx.globalAlpha = 0.08;
    ctx.fillStyle = BLUE_ACCENT;
    ctx.beginPath();
    ctx.moveTo(0, 0); ctx.lineTo(120, 0); ctx.lineTo(0, CANVAS_H); ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(CANVAS_W, 0); ctx.lineTo(CANVAS_W - 120, 0); ctx.lineTo(CANVAS_W, CANVAS_H); ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Subtle center radial glow
    ctx.save();
    ctx.globalAlpha = 0.1;
    const cGlow = ctx.createRadialGradient(CANVAS_W / 2, CANVAS_H * 0.35, 50, CANVAS_W / 2, CANVAS_H * 0.35, 500);
    cGlow.addColorStop(0, BLUE_GLOW);
    cGlow.addColorStop(1, "transparent");
    ctx.fillStyle = cGlow;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    ctx.restore();

    // ============ HEADER ============
    const headerY = 80;

    // Event type badge
    const badgeText = eventType.toUpperCase();
    ctx.save();
    ctx.font = "900 58px 'Segoe UI', Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.shadowColor = "#000";
    ctx.shadowBlur = 20;
    ctx.fillStyle = WHITE;
    ctx.fillText(badgeText, CANVAS_W / 2, headerY);
    ctx.restore();

    // Date / Location / Time
    const dateStr = date ? new Date(date + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }) : "--/--";
    const infoLine = `${dateStr}/${location.toUpperCase()}/${time}H`;
    ctx.save();
    ctx.font = "600 24px 'Segoe UI', Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.fillStyle = BLUE_GLOW;
    ctx.shadowColor = "#000";
    ctx.shadowBlur = 10;
    ctx.fillText(infoLine, CANVAS_W / 2, headerY + 45);
    ctx.restore();

    // Home/Away indicator
    const sideLabel = side === "home" ? "🏠 MANDANTE" : "✈️ VISITANTE";
    ctx.save();
    ctx.font = "500 20px 'Segoe UI', Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.fillStyle = WHITE_DIM;
    ctx.fillText(sideLabel, CANVAS_W / 2, headerY + 85);
    ctx.restore();

    // ============ LOGOS - OVERLAPPING PROFESSIONAL STYLE ============
    const logoCenterY = 400;
    const logoSize = 380;
    const overlap = 80; // logos overlap in the center

    const leftCx = CANVAS_W / 2 - overlap - 10;
    const rightCx = CANVAS_W / 2 + overlap + 10;
    const ourCx = side === "home" ? leftCx : rightCx;
    const oppCx = side === "home" ? rightCx : leftCx;

    // Glow behind logos
    drawLogoGlow(ctx, CANVAS_W / 2, logoCenterY, logoSize * 0.7, BLUE_GLOW, 0.12);

    // Team name above our logo
    ctx.save();
    ctx.font = "800 22px 'Segoe UI', Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.fillStyle = WHITE;
    ctx.shadowColor = "#000";
    ctx.shadowBlur = 15;
    ctx.fillText("DISTRITO UNIÃO FC", ourCx, logoCenterY - logoSize / 2 - 20);
    ctx.restore();

    // Opponent name above their logo
    ctx.save();
    ctx.font = "800 22px 'Segoe UI', Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.fillStyle = WHITE_DIM;
    ctx.shadowColor = "#000";
    ctx.shadowBlur = 15;
    const oppName = opponent ? opponent.toUpperCase() : "ADVERSÁRIO";
    ctx.fillText(oppName, oppCx, logoCenterY - logoSize / 2 - 20);
    ctx.restore();

    // Our team logo - draw large with shadow
    try {
      const teamImg = await loadImage(TEAM_LOGO_PATH);
      drawFitLogo(ctx, teamImg, ourCx, logoCenterY, logoSize);
    } catch {
      drawPlaceholderLogo(ctx, ourCx, logoCenterY, logoSize, "DISTRITO\nUNIÃO");
    }

    // Opponent logo
    if (oppLogo) {
      try {
        const img = await loadImage(oppLogo);
        drawFitLogo(ctx, img, oppCx, logoCenterY, logoSize);
      } catch {
        drawPlaceholderLogo(ctx, oppCx, logoCenterY, logoSize, "ADVERSÁRIO");
      }
    } else {
      drawPlaceholderLogo(ctx, oppCx, logoCenterY, logoSize, "ADVERSÁRIO");
    }

    // ============ VS / SCORE ============
    if (mode === "resultado") {
      const leftScore = side === "home" ? localHomeScore : localAwayScore;
      const rightScore = side === "home" ? localAwayScore : localHomeScore;

      // Score bg
      ctx.save();
      ctx.fillStyle = BG_BLACK;
      ctx.globalAlpha = 0.85;
      roundRect(ctx, CANVAS_W / 2 - 90, logoCenterY + logoSize / 2 + 10, 180, 80, 16);
      ctx.fill();
      ctx.restore();

      ctx.save();
      ctx.shadowColor = BLUE_GLOW;
      ctx.shadowBlur = 30;
      ctx.fillStyle = WHITE;
      ctx.font = "900 72px 'Segoe UI', Arial, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(`${leftScore}`, CANVAS_W / 2 - 45, logoCenterY + logoSize / 2 + 68);
      ctx.fillText(`${rightScore}`, CANVAS_W / 2 + 45, logoCenterY + logoSize / 2 + 68);
      ctx.restore();

      ctx.fillStyle = BLUE_GLOW;
      ctx.font = "900 40px 'Segoe UI', Arial, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("×", CANVAS_W / 2, logoCenterY + logoSize / 2 + 58);
    }

    // ============ MAIN TITLE ============
    const titleBaseY = mode === "resultado" ? logoCenterY + logoSize / 2 + 160 : logoCenterY + logoSize / 2 + 80;
    const mainTitle = mode === "proximo_jogo" ? "DIA DE" : "RESULTADO";
    const subTitle = mode === "proximo_jogo" ? "JOGO" : "FINAL";

    // Main word
    ctx.save();
    ctx.shadowColor = "#000";
    ctx.shadowBlur = 40;
    ctx.fillStyle = WHITE;
    ctx.font = "900 110px 'Segoe UI', Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(mainTitle, CANVAS_W / 2, titleBaseY);
    ctx.restore();

    // Sub word - larger, with blue glow outline effect
    ctx.save();
    ctx.shadowColor = BLUE_GLOW;
    ctx.shadowBlur = 40;
    ctx.font = "900 150px 'Segoe UI', Arial, sans-serif";
    ctx.textAlign = "center";
    // Stroke outline
    ctx.strokeStyle = WHITE_DIM + "60";
    ctx.lineWidth = 2;
    ctx.strokeText(subTitle, CANVAS_W / 2, titleBaseY + 140);
    // Fill
    ctx.fillStyle = WHITE;
    ctx.fillText(subTitle, CANVAS_W / 2, titleBaseY + 140);
    ctx.restore();

    // Team name below title
    ctx.save();
    ctx.font = "600 26px 'Segoe UI', Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.fillStyle = WHITE_DIM;
    ctx.fillText("DISTRITO UNIÃO", CANVAS_W / 2, titleBaseY + 190);
    ctx.restore();

    // ============ FOOTER - SPONSORS ============
    const footerY = CANVAS_H - 100;

    // Separator
    drawThinSeparator(ctx, footerY - 30);

    // Sponsor logos
    const sponsorsWithLogo = sponsors.filter(s => s.logo_url);
    if (sponsorsWithLogo.length > 0) {
      const sponsorAreaW = CANVAS_W - 200;
      const maxLogoH = 50;
      const gap = 30;
      const totalW = sponsorsWithLogo.length * 80 + (sponsorsWithLogo.length - 1) * gap;
      let startX = CANVAS_W / 2 - totalW / 2;

      for (const sponsor of sponsorsWithLogo) {
        try {
          const img = await loadImage(sponsor.logo_url!);
          const asp = img.width / img.height;
          const h = maxLogoH;
          const w = h * asp;
          ctx.save();
          ctx.shadowColor = "#000";
          ctx.shadowBlur = 10;
          ctx.drawImage(img, startX, footerY - maxLogoH / 2, w, h);
          ctx.restore();
          startX += w + gap;
        } catch {
          // Skip failed logo
        }
      }
    } else {
      // Fallback text
      ctx.save();
      ctx.font = "400 16px 'Segoe UI', Arial, sans-serif";
      ctx.textAlign = "center";
      ctx.fillStyle = WHITE_DIM + "80";
      ctx.fillText("APOIO", CANVAS_W / 2, footerY - 10);
      ctx.restore();
    }

    ctx.save();
    ctx.font = "700 20px 'Segoe UI', Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.fillStyle = WHITE_DIM;
    ctx.fillText("DISTRITO UNIÃO FC  •  A REVOLUÇÃO", CANVAS_W / 2, CANVAS_H - 30);
    ctx.restore();

  }, [mode, side, oppLogo, eventType, date, time, location, opponent, localHomeScore, localAwayScore, sponsors]);

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

function drawFitLogo(ctx: CanvasRenderingContext2D, img: HTMLImageElement, cx: number, cy: number, size: number) {
  const asp = img.width / img.height;
  let dw = size, dh = size;
  if (asp > 1) dh = size / asp; else dw = size * asp;
  ctx.save();
  ctx.shadowColor = "#000000";
  ctx.shadowBlur = 40;
  ctx.shadowOffsetY = 10;
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

function drawPlaceholderLogo(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, label: string) {
  const r = size * 0.3;
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = BLUE_ACCENT + "12";
  ctx.fill();
  ctx.strokeStyle = BLUE_ACCENT + "30";
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
