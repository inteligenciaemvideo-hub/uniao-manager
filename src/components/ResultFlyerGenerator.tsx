import { useRef, useCallback, useEffect, useState } from "react";
import { X, Download, Home, Plane } from "lucide-react";

interface Sponsor {
  id: string;
  name: string;
  logo_url?: string | null;
}

interface MatchEntry {
  player_id: string;
  player_name: string;
  type: string; // goal | assist | yellow_card | red_card
}

interface ResultFlyerProps {
  open: boolean;
  onClose: () => void;
  eventType: string;
  opponent: string;
  date: string;
  time: string;
  location: string;
  opponentLogoUrl?: string | null;
  homeScore: number;
  awayScore: number;
  matchEntries: MatchEntry[];
  sponsors?: Sponsor[];
}

const CANVAS_W = 1080;
const CANVAS_H = 1350;
const TEAM_LOGO_PATH = "/images/distrito-uniao-logo.png";

const BG_BLACK = "#050a12";
const BLUE_ACCENT = "#1a3a7a";
const BLUE_GLOW = "#2563eb";
const WHITE = "#ffffff";
const WHITE_DIM = "#8899bb";
const GOLD = "#eab308";

const loadImage = (src: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r); ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h); ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r); ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath();
}

const ResultFlyerGenerator = ({
  open, onClose, eventType, opponent, date, time, location,
  opponentLogoUrl, homeScore, awayScore, matchEntries, sponsors = [],
}: ResultFlyerProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [side, setSide] = useState<"home" | "away">("home");

  const goals = matchEntries.filter(e => e.type === "goal");
  const assists = matchEntries.filter(e => e.type === "assist");
  const yellows = matchEntries.filter(e => e.type === "yellow_card");
  const reds = matchEntries.filter(e => e.type === "red_card");

  const drawFlyer = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Background
    ctx.fillStyle = BG_BLACK;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // Blue side accents
    for (let i = 0; i < 8; i++) {
      ctx.save();
      ctx.globalAlpha = 0.12 - i * 0.012;
      const leftG = ctx.createLinearGradient(0, 0, 180, 0);
      leftG.addColorStop(0, BLUE_GLOW);
      leftG.addColorStop(1, "transparent");
      ctx.fillStyle = leftG;
      ctx.fillRect(0, i * (CANVAS_H / 8), 180, CANVAS_H / 8);
      const rightG = ctx.createLinearGradient(CANVAS_W, 0, CANVAS_W - 180, 0);
      rightG.addColorStop(0, BLUE_GLOW);
      rightG.addColorStop(1, "transparent");
      ctx.fillStyle = rightG;
      ctx.fillRect(CANVAS_W - 180, i * (CANVAS_H / 8), 180, CANVAS_H / 8);
      ctx.restore();
    }

    // Center glow
    ctx.save();
    ctx.globalAlpha = 0.1;
    const cGlow = ctx.createRadialGradient(CANVAS_W / 2, 250, 50, CANVAS_W / 2, 250, 500);
    cGlow.addColorStop(0, BLUE_GLOW);
    cGlow.addColorStop(1, "transparent");
    ctx.fillStyle = cGlow;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    ctx.restore();

    // ============ HEADER ============
    const headerY = 70;
    ctx.save();
    ctx.font = "900 50px 'Segoe UI', Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.shadowColor = "#000";
    ctx.shadowBlur = 20;
    ctx.fillStyle = WHITE;
    ctx.fillText(eventType.toUpperCase(), CANVAS_W / 2, headerY);
    ctx.restore();

    const dateStr = date ? new Date(date + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }) : "--/--";
    ctx.save();
    ctx.font = "600 22px 'Segoe UI', Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.fillStyle = BLUE_GLOW;
    ctx.fillText(`${dateStr} / ${location.toUpperCase()} / ${time}H`, CANVAS_W / 2, headerY + 40);
    ctx.restore();

    // ============ LOGOS + SCORE ============
    const logoCenterY = 230;
    const logoSize = 200;
    const leftCx = CANVAS_W / 2 - 200;
    const rightCx = CANVAS_W / 2 + 200;

    // Team logo
    try {
      const teamImg = await loadImage(TEAM_LOGO_PATH);
      drawFitLogo(ctx, teamImg, side === "home" ? leftCx : rightCx, logoCenterY, logoSize);
    } catch {}

    // Opponent logo
    if (opponentLogoUrl) {
      try {
        const oppImg = await loadImage(opponentLogoUrl);
        drawFitLogo(ctx, oppImg, side === "home" ? rightCx : leftCx, logoCenterY, logoSize);
      } catch {}
    }

    // Team names
    ctx.save();
    ctx.font = "700 18px 'Segoe UI', Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.fillStyle = WHITE;
    ctx.fillText("DISTRITO UNIÃO", side === "home" ? leftCx : rightCx, logoCenterY + logoSize / 2 + 25);
    ctx.fillStyle = WHITE_DIM;
    ctx.fillText(opponent.toUpperCase(), side === "home" ? rightCx : leftCx, logoCenterY + logoSize / 2 + 25);
    ctx.restore();

    // Score in center
    const leftScore = side === "home" ? homeScore : awayScore;
    const rightScore = side === "home" ? awayScore : homeScore;

    ctx.save();
    ctx.fillStyle = BG_BLACK;
    ctx.globalAlpha = 0.8;
    roundRect(ctx, CANVAS_W / 2 - 80, logoCenterY - 45, 160, 90, 16);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.shadowColor = BLUE_GLOW;
    ctx.shadowBlur = 30;
    ctx.fillStyle = WHITE;
    ctx.font = "900 80px 'Segoe UI', Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`${leftScore}`, CANVAS_W / 2 - 42, logoCenterY + 28);
    ctx.fillText(`${rightScore}`, CANVAS_W / 2 + 42, logoCenterY + 28);
    ctx.restore();

    ctx.fillStyle = GOLD;
    ctx.font = "900 36px 'Segoe UI', Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("×", CANVAS_W / 2, logoCenterY + 14);

    // ============ RESULT TITLE ============
    const titleY = logoCenterY + logoSize / 2 + 70;
    ctx.save();
    ctx.shadowColor = "#000";
    ctx.shadowBlur = 30;
    ctx.fillStyle = WHITE;
    ctx.font = "900 80px 'Segoe UI', Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("RESULTADO", CANVAS_W / 2, titleY);
    ctx.restore();

    ctx.save();
    ctx.fillStyle = BLUE_GLOW;
    ctx.font = "900 100px 'Segoe UI', Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.shadowColor = BLUE_GLOW;
    ctx.shadowBlur = 30;
    ctx.fillText("FINAL", CANVAS_W / 2, titleY + 95);
    ctx.restore();

    // ============ STATS SECTION ============
    let statsY = titleY + 140;
    const mx = 100;
    const colW = CANVAS_W - mx * 2;

    // Separator
    const sep = ctx.createLinearGradient(mx, 0, CANVAS_W - mx, 0);
    sep.addColorStop(0, "transparent");
    sep.addColorStop(0.5, BLUE_GLOW + "60");
    sep.addColorStop(1, "transparent");
    ctx.fillStyle = sep;
    ctx.fillRect(mx, statsY, colW, 2);
    statsY += 25;

    // Goals
    if (goals.length > 0) {
      ctx.save();
      ctx.font = "700 20px 'Segoe UI', Arial, sans-serif";
      ctx.fillStyle = GOLD;
      ctx.textAlign = "left";
      ctx.fillText("⚽  GOLS", mx + 10, statsY);
      ctx.restore();
      statsY += 10;

      // Group by player
      const goalsByPlayer: Record<string, { name: string; count: number }> = {};
      goals.forEach(g => {
        if (!goalsByPlayer[g.player_id]) goalsByPlayer[g.player_id] = { name: g.player_name, count: 0 };
        goalsByPlayer[g.player_id].count++;
      });

      Object.values(goalsByPlayer).forEach(({ name, count }) => {
        statsY += 30;
        ctx.save();
        ctx.font = "600 22px 'Segoe UI', Arial, sans-serif";
        ctx.fillStyle = WHITE;
        ctx.textAlign = "left";
        const displayName = name.length > 25 ? name.substring(0, 24) + "…" : name;
        ctx.fillText(displayName, mx + 40, statsY);
        if (count > 1) {
          ctx.fillStyle = GOLD;
          ctx.font = "700 18px 'Segoe UI', Arial, sans-serif";
          ctx.fillText(`(${count}x)`, mx + 40 + ctx.measureText(displayName).width + 10, statsY);
        }
        ctx.restore();
      });
      statsY += 15;
    }

    // Assists
    if (assists.length > 0) {
      statsY += 10;
      ctx.save();
      ctx.font = "700 20px 'Segoe UI', Arial, sans-serif";
      ctx.fillStyle = BLUE_GLOW;
      ctx.textAlign = "left";
      ctx.fillText("👟  ASSISTÊNCIAS", mx + 10, statsY);
      ctx.restore();
      statsY += 10;

      const assistsByPlayer: Record<string, { name: string; count: number }> = {};
      assists.forEach(a => {
        if (!assistsByPlayer[a.player_id]) assistsByPlayer[a.player_id] = { name: a.player_name, count: 0 };
        assistsByPlayer[a.player_id].count++;
      });

      Object.values(assistsByPlayer).forEach(({ name, count }) => {
        statsY += 30;
        ctx.save();
        ctx.font = "600 22px 'Segoe UI', Arial, sans-serif";
        ctx.fillStyle = WHITE_DIM;
        ctx.textAlign = "left";
        const displayName = name.length > 25 ? name.substring(0, 24) + "…" : name;
        ctx.fillText(displayName, mx + 40, statsY);
        if (count > 1) {
          ctx.fillStyle = BLUE_GLOW;
          ctx.font = "700 18px 'Segoe UI', Arial, sans-serif";
          ctx.fillText(`(${count}x)`, mx + 40 + ctx.measureText(displayName).width + 10, statsY);
        }
        ctx.restore();
      });
      statsY += 15;
    }

    // Cards
    if (yellows.length > 0 || reds.length > 0) {
      statsY += 10;
      ctx.save();
      ctx.font = "700 20px 'Segoe UI', Arial, sans-serif";
      ctx.fillStyle = "#f59e0b";
      ctx.textAlign = "left";
      ctx.fillText("🟨  CARTÕES", mx + 10, statsY);
      ctx.restore();
      statsY += 10;

      const allCards = [...yellows, ...reds];
      const cardsByPlayer: Record<string, { name: string; yellows: number; reds: number }> = {};
      allCards.forEach(c => {
        if (!cardsByPlayer[c.player_id]) cardsByPlayer[c.player_id] = { name: c.player_name, yellows: 0, reds: 0 };
        if (c.type === "yellow_card") cardsByPlayer[c.player_id].yellows++;
        if (c.type === "red_card") cardsByPlayer[c.player_id].reds++;
      });

      Object.values(cardsByPlayer).forEach(({ name, yellows: y, reds: r }) => {
        statsY += 30;
        ctx.save();
        ctx.font = "600 22px 'Segoe UI', Arial, sans-serif";
        ctx.fillStyle = WHITE_DIM;
        ctx.textAlign = "left";
        const displayName = name.length > 20 ? name.substring(0, 19) + "…" : name;
        ctx.fillText(displayName, mx + 40, statsY);
        let cardText = "";
        if (y > 0) cardText += `${y}🟨 `;
        if (r > 0) cardText += `${r}🟥`;
        ctx.font = "600 20px 'Segoe UI', Arial, sans-serif";
        ctx.textAlign = "right";
        ctx.fillText(cardText, CANVAS_W - mx - 20, statsY);
        ctx.restore();
      });
    }

    // ============ FOOTER - SPONSORS ============
    const footerY = CANVAS_H - 100;
    const fSep = ctx.createLinearGradient(150, 0, CANVAS_W - 150, 0);
    fSep.addColorStop(0, "transparent");
    fSep.addColorStop(0.5, BLUE_GLOW + "40");
    fSep.addColorStop(1, "transparent");
    ctx.fillStyle = fSep;
    ctx.fillRect(150, footerY - 30, CANVAS_W - 300, 1);

    const sponsorsWithLogo = sponsors.filter(s => s.logo_url);
    if (sponsorsWithLogo.length > 0) {
      const maxLogoH = 50;
      const gap = 30;
      const logoImages: { img: HTMLImageElement; w: number; h: number }[] = [];
      for (const sponsor of sponsorsWithLogo) {
        try {
          const img = await loadImage(sponsor.logo_url!);
          const asp = img.width / img.height;
          logoImages.push({ img, w: maxLogoH * asp, h: maxLogoH });
        } catch {}
      }
      const totalW = logoImages.reduce((sum, l) => sum + l.w, 0) + (logoImages.length - 1) * gap;
      let startX = CANVAS_W / 2 - totalW / 2;
      for (const logo of logoImages) {
        ctx.save();
        ctx.shadowColor = "#000";
        ctx.shadowBlur = 10;
        ctx.drawImage(logo.img, startX, footerY - logo.h / 2, logo.w, logo.h);
        ctx.restore();
        startX += logo.w + gap;
      }
    }

    ctx.save();
    ctx.font = "700 20px 'Segoe UI', Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.fillStyle = WHITE_DIM;
    ctx.fillText("DISTRITO UNIÃO FC  •  A REVOLUÇÃO", CANVAS_W / 2, CANVAS_H - 30);
    ctx.restore();

  }, [side, opponentLogoUrl, eventType, date, time, location, opponent, homeScore, awayScore, matchEntries, sponsors]);

  useEffect(() => {
    if (open) drawFlyer();
  }, [open, drawFlyer]);

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `resultado_${date}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-card rounded-2xl max-h-[95vh] overflow-y-auto">
        <div className="px-4 py-4 border-b border-border flex items-center justify-between sticky top-0 bg-card z-10">
          <h3 className="text-sm font-bold">Flyer de Resultado</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
            <X size={16} />
          </button>
        </div>
        <div className="p-4 space-y-4">
          {/* Home/Away */}
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

          <div className="rounded-xl overflow-hidden border border-border">
            <canvas ref={canvasRef} width={CANVAS_W} height={CANVAS_H} className="w-full h-auto" />
          </div>
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

export default ResultFlyerGenerator;
