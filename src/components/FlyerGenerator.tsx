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
  teamLogoUrl?: string | null;
  opponentLogoUrl?: string | null;
  homeScore?: number | null;
  awayScore?: number | null;
}

type FlyerMode = "proximo_jogo" | "resultado";
type MatchSide = "home" | "away";

const CANVAS_W = 1080;
const CANVAS_H = 1350;

// Team colors
const BLUE = "#1e3a8a";
const BLUE_LIGHT = "#2563eb";
const YELLOW = "#eab308";
const WHITE = "#ffffff";
const DARK_BG = "#0a0e1a";

const FlyerGenerator = ({
  open, onClose, eventType, opponent, date, time, location,
  teamLogoUrl, opponentLogoUrl, homeScore, awayScore,
}: FlyerGeneratorProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useState<FlyerMode>("proximo_jogo");
  const [side, setSide] = useState<MatchSide>("home");
  const [teamLogoFile, setTeamLogoFile] = useState<string | null>(null);
  const [opponentLogoFile, setOpponentLogoFile] = useState<string | null>(null);
  const [localHomeScore, setLocalHomeScore] = useState(homeScore ?? 0);
  const [localAwayScore, setLocalAwayScore] = useState(awayScore ?? 0);
  const teamLogoInputRef = useRef<HTMLInputElement>(null);
  const oppLogoInputRef = useRef<HTMLInputElement>(null);

  const teamLogo = teamLogoFile || teamLogoUrl || null;
  const oppLogo = opponentLogoFile || opponentLogoUrl || null;

  const handleFileUpload = (setter: (url: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setter(URL.createObjectURL(file));
  };

  const loadImage = (src: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });

  // Remove white/light background from logo
  const removeBackground = (img: HTMLImageElement, size: number): HTMLCanvasElement => {
    const offscreen = document.createElement("canvas");
    offscreen.width = size;
    offscreen.height = size;
    const octx = offscreen.getContext("2d")!;

    const aspect = img.width / img.height;
    let dw = size, dh = size;
    if (aspect > 1) { dh = size / aspect; } else { dw = size * aspect; }
    const dx = (size - dw) / 2;
    const dy = (size - dh) / 2;
    octx.drawImage(img, dx, dy, dw, dh);

    const imageData = octx.getImageData(0, 0, size, size);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i], g = data[i + 1], b = data[i + 2];
      // Remove white/near-white and light gray pixels
      if (r > 220 && g > 220 && b > 220) {
        data[i + 3] = 0; // fully transparent
      } else if (r > 200 && g > 200 && b > 200) {
        data[i + 3] = Math.max(0, data[i + 3] - 180); // semi-transparent
      }
    }
    octx.putImageData(imageData, 0, 0);
    return offscreen;
  };

  const drawFlyer = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // === BACKGROUND ===
    const bgGrad = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
    bgGrad.addColorStop(0, "#060b18");
    bgGrad.addColorStop(0.4, "#0c1529");
    bgGrad.addColorStop(0.7, "#0a1225");
    bgGrad.addColorStop(1, "#050810");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // Subtle diagonal pattern
    ctx.save();
    ctx.globalAlpha = 0.03;
    for (let i = -CANVAS_H; i < CANVAS_W + CANVAS_H; i += 40) {
      ctx.strokeStyle = WHITE;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i + CANVAS_H, CANVAS_H);
      ctx.stroke();
    }
    ctx.restore();

    // === TOP BORDER - gradient stripe ===
    const topBorder = ctx.createLinearGradient(0, 0, CANVAS_W, 0);
    topBorder.addColorStop(0, BLUE);
    topBorder.addColorStop(0.5, YELLOW);
    topBorder.addColorStop(1, BLUE);
    ctx.fillStyle = topBorder;
    ctx.fillRect(0, 0, CANVAS_W, 8);

    // === LEFT/RIGHT accent bars ===
    const sideGrad = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
    sideGrad.addColorStop(0, YELLOW);
    sideGrad.addColorStop(0.3, BLUE_LIGHT);
    sideGrad.addColorStop(0.7, BLUE_LIGHT);
    sideGrad.addColorStop(1, YELLOW);
    ctx.fillStyle = sideGrad;
    ctx.fillRect(0, 8, 5, CANVAS_H - 16);
    ctx.fillRect(CANVAS_W - 5, 8, 5, CANVAS_H - 16);

    // === BOTTOM BORDER ===
    const botBorder = ctx.createLinearGradient(0, 0, CANVAS_W, 0);
    botBorder.addColorStop(0, BLUE);
    botBorder.addColorStop(0.5, YELLOW);
    botBorder.addColorStop(1, BLUE);
    ctx.fillStyle = botBorder;
    ctx.fillRect(0, CANVAS_H - 8, CANVAS_W, 8);

    // === DECORATIVE GLOW behind logos ===
    const glowY = 520;
    ctx.save();
    ctx.globalAlpha = 0.08;
    const glowRad = ctx.createRadialGradient(CANVAS_W / 2, glowY, 50, CANVAS_W / 2, glowY, 500);
    glowRad.addColorStop(0, BLUE_LIGHT);
    glowRad.addColorStop(1, "transparent");
    ctx.fillStyle = glowRad;
    ctx.fillRect(0, 200, CANVAS_W, 700);
    ctx.restore();

    // === EVENT TYPE BADGE ===
    const badgeText = eventType.toUpperCase();
    ctx.font = "bold 32px 'Segoe UI', Arial, sans-serif";
    ctx.textAlign = "center";
    const badgeW = ctx.measureText(badgeText).width + 80;
    const badgeX = (CANVAS_W - badgeW) / 2;

    ctx.save();
    const badgeGrad = ctx.createLinearGradient(badgeX, 50, badgeX + badgeW, 50);
    badgeGrad.addColorStop(0, BLUE);
    badgeGrad.addColorStop(1, BLUE_LIGHT);
    ctx.fillStyle = badgeGrad;
    roundRect(ctx, badgeX, 50, badgeW, 52, 26);
    ctx.fill();
    // Yellow accent line under badge
    ctx.fillStyle = YELLOW;
    ctx.fillRect(badgeX + 20, 102, badgeW - 40, 3);
    ctx.fillStyle = WHITE;
    ctx.font = "bold 30px 'Segoe UI', Arial, sans-serif";
    ctx.fillText(badgeText, CANVAS_W / 2, 84);
    ctx.restore();

    // === MATCH INFO LINE ===
    const formattedDate = new Date(date + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
    const matchSideText = side === "home" ? "🏠 EM CASA" : "✈️ FORA";
    ctx.fillStyle = YELLOW;
    ctx.font = "700 24px 'Segoe UI', Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(matchSideText, CANVAS_W / 2, 145);

    ctx.fillStyle = "#94a3b8";
    ctx.font = "600 24px 'Segoe UI', Arial, sans-serif";
    ctx.fillText(`${formattedDate.toUpperCase()} • ${time}H`, CANVAS_W / 2, 185);

    ctx.fillStyle = "#64748b";
    ctx.font = "500 22px 'Segoe UI', Arial, sans-serif";
    ctx.fillText(`📍 ${location.toUpperCase()}`, CANVAS_W / 2, 220);

    // === DIVIDER LINE ===
    const divGrad = ctx.createLinearGradient(200, 0, CANVAS_W - 200, 0);
    divGrad.addColorStop(0, "transparent");
    divGrad.addColorStop(0.3, YELLOW + "44");
    divGrad.addColorStop(0.5, YELLOW);
    divGrad.addColorStop(0.7, YELLOW + "44");
    divGrad.addColorStop(1, "transparent");
    ctx.fillStyle = divGrad;
    ctx.fillRect(200, 250, CANVAS_W - 400, 2);

    // === LOGOS SECTION ===
    const logoSize = 300;
    const logoY = 340;
    // If home: our team on left, opponent on right
    // If away: opponent on left, our team on right
    const leftCx = CANVAS_W / 2 - 220;
    const rightCx = CANVAS_W / 2 + 220;

    const ourLogoCx = side === "home" ? leftCx : rightCx;
    const oppLogoCx = side === "home" ? rightCx : leftCx;

    // Draw logo glow circles
    drawLogoGlow(ctx, ourLogoCx, logoY + logoSize / 2, logoSize / 2, BLUE_LIGHT);
    drawLogoGlow(ctx, oppLogoCx, logoY + logoSize / 2, logoSize / 2, "#475569");

    // Draw team logos
    if (teamLogo) {
      try {
        const img = await loadImage(teamLogo);
        const cleaned = removeBackground(img, logoSize);
        ctx.drawImage(cleaned, ourLogoCx - logoSize / 2, logoY, logoSize, logoSize);
      } catch {
        drawModernPlaceholder(ctx, ourLogoCx, logoY + logoSize / 2, logoSize, "SEU TIME", BLUE_LIGHT);
      }
    } else {
      drawModernPlaceholder(ctx, ourLogoCx, logoY + logoSize / 2, logoSize, "SEU TIME", BLUE_LIGHT);
    }

    if (oppLogo) {
      try {
        const img = await loadImage(oppLogo);
        const cleaned = removeBackground(img, logoSize);
        ctx.drawImage(cleaned, oppLogoCx - logoSize / 2, logoY, logoSize, logoSize);
      } catch {
        drawModernPlaceholder(ctx, oppLogoCx, logoY + logoSize / 2, logoSize, "ADVERSÁRIO", "#475569");
      }
    } else {
      drawModernPlaceholder(ctx, oppLogoCx, logoY + logoSize / 2, logoSize, "ADVERSÁRIO", "#475569");
    }

    // === VS / SCORE ===
    const vsY = logoY + logoSize / 2;
    if (mode === "resultado") {
      // Score display
      const leftScore = side === "home" ? localHomeScore : localAwayScore;
      const rightScore = side === "home" ? localAwayScore : localHomeScore;

      ctx.fillStyle = WHITE;
      ctx.font = "900 100px 'Segoe UI', Arial, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(`${leftScore}`, CANVAS_W / 2 - 60, vsY + 35);
      ctx.fillStyle = YELLOW;
      ctx.font = "900 50px 'Segoe UI', Arial, sans-serif";
      ctx.fillText("×", CANVAS_W / 2, vsY + 25);
      ctx.fillStyle = WHITE;
      ctx.font = "900 100px 'Segoe UI', Arial, sans-serif";
      ctx.fillText(`${rightScore}`, CANVAS_W / 2 + 60, vsY + 35);
    } else {
      // VS badge
      ctx.save();
      ctx.fillStyle = YELLOW;
      ctx.beginPath();
      ctx.arc(CANVAS_W / 2, vsY, 40, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = DARK_BG;
      ctx.font = "900 32px 'Segoe UI', Arial, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("VS", CANVAS_W / 2, vsY + 12);
      ctx.restore();
    }

    // === TEAM NAMES UNDER LOGOS ===
    ctx.font = "700 26px 'Segoe UI', Arial, sans-serif";
    ctx.textAlign = "center";
    
    const ourTeamName = "DISTRITO UNIÃO";
    const oppTeamName = opponent ? opponent.toUpperCase() : "ADVERSÁRIO";

    ctx.fillStyle = WHITE;
    ctx.fillText(ourTeamName, ourLogoCx, logoY + logoSize + 40);
    ctx.fillStyle = "#94a3b8";
    ctx.fillText(oppTeamName, oppLogoCx, logoY + logoSize + 40);

    // === MAIN TITLE BLOCK ===
    const titleY = logoY + logoSize + 130;

    // Decorative line above title
    const tLineGrad = ctx.createLinearGradient(300, 0, CANVAS_W - 300, 0);
    tLineGrad.addColorStop(0, "transparent");
    tLineGrad.addColorStop(0.5, YELLOW);
    tLineGrad.addColorStop(1, "transparent");
    ctx.fillStyle = tLineGrad;
    ctx.fillRect(300, titleY - 30, CANVAS_W - 600, 2);

    const mainTitle = mode === "proximo_jogo" ? "PRÓXIMO" : "RESULTADO";
    const subTitle = mode === "proximo_jogo" ? "JOGO" : "FINAL";

    // Title shadow/glow
    ctx.save();
    ctx.shadowColor = BLUE_LIGHT;
    ctx.shadowBlur = 30;
    ctx.fillStyle = WHITE;
    ctx.font = "900 110px 'Segoe UI', Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(mainTitle, CANVAS_W / 2, titleY + 50);
    ctx.restore();

    // Subtitle with yellow accent
    ctx.fillStyle = YELLOW;
    ctx.font = "900 130px 'Segoe UI', Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(subTitle, CANVAS_W / 2, titleY + 175);

    // Decorative line below title
    ctx.fillStyle = tLineGrad;
    ctx.fillRect(300, titleY + 200, CANVAS_W - 600, 2);

    // === FOOTER ===
    ctx.fillStyle = "#334155";
    ctx.font = "500 20px 'Segoe UI', Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("DISTRITO UNIÃO FUTEBOL", CANVAS_W / 2, CANVAS_H - 50);

    // Corner decorations
    drawCorner(ctx, 20, 20, 60, "tl");
    drawCorner(ctx, CANVAS_W - 20, 20, 60, "tr");
    drawCorner(ctx, 20, CANVAS_H - 20, 60, "bl");
    drawCorner(ctx, CANVAS_W - 20, CANVAS_H - 20, 60, "br");

  }, [mode, side, teamLogo, oppLogo, eventType, date, time, location, opponent, localHomeScore, localAwayScore]);

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
                side === "home" ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/40" : "bg-secondary text-muted-foreground"
              }`}
            >
              <Home size={16} /> Em Casa
            </button>
            <button
              onClick={() => setSide("away")}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${
                side === "away" ? "bg-blue-500/20 text-blue-400 border border-blue-500/40" : "bg-secondary text-muted-foreground"
              }`}
            >
              <Plane size={16} /> Fora
            </button>
          </div>

          {/* Logo uploads */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Logo do seu time</label>
              <button
                onClick={() => teamLogoInputRef.current?.click()}
                className="w-full h-20 rounded-xl bg-secondary border-2 border-dashed border-border flex items-center justify-center gap-2 overflow-hidden hover:border-primary/40 transition-colors"
              >
                {teamLogo ? (
                  <img src={teamLogo} alt="Logo time" className="h-16 w-16 object-contain" />
                ) : (
                  <><ImageIcon size={16} className="text-muted-foreground" /><span className="text-xs text-muted-foreground">Anexar</span></>
                )}
              </button>
              <input ref={teamLogoInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload(setTeamLogoFile)} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Logo do adversário</label>
              <button
                onClick={() => oppLogoInputRef.current?.click()}
                className="w-full h-20 rounded-xl bg-secondary border-2 border-dashed border-border flex items-center justify-center gap-2 overflow-hidden hover:border-primary/40 transition-colors"
              >
                {oppLogo ? (
                  <img src={oppLogo} alt="Logo adversário" className="h-16 w-16 object-contain" />
                ) : (
                  <><ImageIcon size={16} className="text-muted-foreground" /><span className="text-xs text-muted-foreground">Anexar</span></>
                )}
              </button>
              <input ref={oppLogoInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload(setOpponentLogoFile)} />
            </div>
          </div>

          {/* Score inputs for resultado mode */}
          {mode === "resultado" && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Placar - Seu time</label>
                <input
                  type="number" min={0} value={localHomeScore}
                  onChange={(e) => setLocalHomeScore(Number(e.target.value))}
                  className="w-full h-10 rounded-lg bg-secondary/30 border border-border px-3 text-center text-lg font-bold"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Placar - Adversário</label>
                <input
                  type="number" min={0} value={localAwayScore}
                  onChange={(e) => setLocalAwayScore(Number(e.target.value))}
                  className="w-full h-10 rounded-lg bg-secondary/30 border border-border px-3 text-center text-lg font-bold"
                />
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
              Atualizar Preview
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

// Helper: rounded rectangle
function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

// Helper: logo glow effect
function drawLogoGlow(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, color: string) {
  ctx.save();
  ctx.globalAlpha = 0.06;
  const glow = ctx.createRadialGradient(cx, cy, r * 0.5, cx, cy, r * 1.2);
  glow.addColorStop(0, color);
  glow.addColorStop(1, "transparent");
  ctx.fillStyle = glow;
  ctx.fillRect(cx - r * 1.2, cy - r * 1.2, r * 2.4, r * 2.4);
  ctx.restore();

  // Subtle ring
  ctx.save();
  ctx.globalAlpha = 0.1;
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.75, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

// Helper: modern placeholder
function drawModernPlaceholder(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, label: string, color: string) {
  const r = size / 2 * 0.6;
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = color + "15";
  ctx.fill();
  ctx.strokeStyle = color + "40";
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 6]);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = "#64748b";
  ctx.font = "600 18px 'Segoe UI', Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(label, cx, cy + 6);
  ctx.restore();
}

// Helper: corner decorations
function drawCorner(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, pos: "tl" | "tr" | "bl" | "br") {
  ctx.save();
  ctx.strokeStyle = YELLOW + "50";
  ctx.lineWidth = 2;
  ctx.beginPath();
  if (pos === "tl") {
    ctx.moveTo(x, y + size); ctx.lineTo(x, y); ctx.lineTo(x + size, y);
  } else if (pos === "tr") {
    ctx.moveTo(x - size, y); ctx.lineTo(x, y); ctx.lineTo(x, y + size);
  } else if (pos === "bl") {
    ctx.moveTo(x, y - size); ctx.lineTo(x, y); ctx.lineTo(x + size, y);
  } else {
    ctx.moveTo(x - size, y); ctx.lineTo(x, y); ctx.lineTo(x, y - size);
  }
  ctx.stroke();
  ctx.restore();
}

export default FlyerGenerator;
