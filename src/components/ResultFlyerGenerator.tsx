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

const loadImage = (src: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });

function drawFitLogo(ctx: CanvasRenderingContext2D, img: HTMLImageElement, cx: number, cy: number, size: number) {
  const asp = img.width / img.height;
  let dw = size, dh = size;
  if (asp > 1) dh = size / asp; else dw = size * asp;
  ctx.save();
  ctx.shadowColor = "#00000080";
  ctx.shadowBlur = 30;
  ctx.drawImage(img, cx - dw / 2, cy - dh / 2, dw, dh);
  ctx.restore();
}

const ResultFlyerGenerator = ({
  open, onClose, eventType, opponent, date, time, location,
  opponentLogoUrl, homeScore, awayScore, matchEntries, sponsors = [],
}: ResultFlyerProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [side, setSide] = useState<"home" | "away">("home");

  const goals = matchEntries.filter(e => e.type === "goal");
  const assists = matchEntries.filter(e => e.type === "assist");

  const drawFlyer = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // ============ BACKGROUND - BLUE (matching ref image 2) ============
    const bgGrad = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
    bgGrad.addColorStop(0, "#1a3f7a");
    bgGrad.addColorStop(0.5, "#163670");
    bgGrad.addColorStop(1, "#0e2550");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // Subtle hexagon/geometric pattern overlay
    ctx.save();
    ctx.globalAlpha = 0.06;
    for (let row = 0; row < 15; row++) {
      for (let col = 0; col < 12; col++) {
        const x = col * 100 + (row % 2 === 0 ? 0 : 50);
        const y = row * 100;
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const angle = (Math.PI / 3) * i - Math.PI / 6;
          const px = x + 40 * Math.cos(angle);
          const py = y + 40 * Math.sin(angle);
          if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.strokeStyle = "#4488cc";
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    }
    ctx.restore();

    // Dark overlay at edges
    ctx.save();
    ctx.globalAlpha = 0.3;
    const edgeL = ctx.createLinearGradient(0, 0, 150, 0);
    edgeL.addColorStop(0, "#061230");
    edgeL.addColorStop(1, "transparent");
    ctx.fillStyle = edgeL;
    ctx.fillRect(0, 0, 150, CANVAS_H);
    const edgeR = ctx.createLinearGradient(CANVAS_W, 0, CANVAS_W - 150, 0);
    edgeR.addColorStop(0, "#061230");
    edgeR.addColorStop(1, "transparent");
    ctx.fillStyle = edgeR;
    ctx.fillRect(CANVAS_W - 150, 0, 150, CANVAS_H);
    ctx.restore();

    // ============ TITLE: FIM DE JOGO ============
    const titleY = 180;

    // "FIM DE" - white bold
    ctx.save();
    ctx.font = "900 140px 'Segoe UI', Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.fillStyle = "#ffffff";
    ctx.shadowColor = "#00000060";
    ctx.shadowBlur = 20;
    ctx.fillText("FIM DE", CANVAS_W / 2, titleY);
    ctx.restore();

    // "JOGO" - dark/navy bold (contrast against blue bg)
    ctx.save();
    ctx.font = "900 180px 'Segoe UI', Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.fillStyle = "#0a1e40";
    ctx.shadowColor = "#00000040";
    ctx.shadowBlur = 10;
    ctx.fillText("JOGO", CANVAS_W / 2, titleY + 170);
    ctx.restore();

    // ============ LOGOS + SCORE ============
    const scoreY = titleY + 330;
    const logoSize = 160;
    const scoreCx = CANVAS_W / 2;

    const leftCx = scoreCx - 220;
    const rightCx = scoreCx + 220;
    const ourCx = side === "home" ? leftCx : rightCx;
    const oppCx2 = side === "home" ? rightCx : leftCx;

    // Our team logo
    try {
      const teamImg = await loadImage(TEAM_LOGO_PATH);
      drawFitLogo(ctx, teamImg, ourCx, scoreY, logoSize);
    } catch {}

    // Opponent logo
    if (opponentLogoUrl) {
      try {
        const oppImg = await loadImage(opponentLogoUrl);
        drawFitLogo(ctx, oppImg, oppCx2, scoreY, logoSize);
      } catch {}
    }

    // Score in center - big bold
    const leftScore = side === "home" ? homeScore : awayScore;
    const rightScore = side === "home" ? awayScore : homeScore;

    // Score background
    ctx.save();
    ctx.fillStyle = "#0d1f45";
    ctx.globalAlpha = 0.6;
    const scoreBoxW = 200;
    const scoreBoxH = 100;
    ctx.beginPath();
    ctx.roundRect(scoreCx - scoreBoxW / 2, scoreY - scoreBoxH / 2, scoreBoxW, scoreBoxH, 16);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.font = "900 90px 'Segoe UI', Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.fillStyle = "#ffffff";
    ctx.shadowColor = "#000";
    ctx.shadowBlur = 15;
    ctx.fillText(`${leftScore}`, scoreCx - 55, scoreY + 32);
    ctx.fillText(`${rightScore}`, scoreCx + 55, scoreY + 32);
    ctx.restore();

    // X separator
    ctx.save();
    ctx.font = "900 50px 'Segoe UI', Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.fillStyle = "#fbbf24";
    ctx.fillText("X", scoreCx, scoreY + 18);
    ctx.restore();

    // ============ GOAL SCORERS ============
    let statsY = scoreY + logoSize / 2 + 60;

    if (goals.length > 0) {
      // Group by player
      const goalsByPlayer: Record<string, { name: string; count: number }> = {};
      goals.forEach(g => {
        if (!goalsByPlayer[g.player_id]) goalsByPlayer[g.player_id] = { name: g.player_name, count: 0 };
        goalsByPlayer[g.player_id].count++;
      });

      Object.values(goalsByPlayer).forEach(({ name, count }) => {
        ctx.save();
        ctx.font = "700 28px 'Segoe UI', Arial, sans-serif";
        ctx.textAlign = "left";
        ctx.fillStyle = "#ffffff";
        const displayName = name.length > 25 ? name.substring(0, 24) + "…" : name;
        const text = count > 1 ? `⚽  ${displayName.toUpperCase()} (${count}x)` : `⚽  ${displayName.toUpperCase()}`;
        ctx.fillText(text, 120, statsY);
        ctx.restore();
        statsY += 42;
      });
    }

    // Assists
    if (assists.length > 0) {
      statsY += 10;
      const assistsByPlayer: Record<string, { name: string; count: number }> = {};
      assists.forEach(a => {
        if (!assistsByPlayer[a.player_id]) assistsByPlayer[a.player_id] = { name: a.player_name, count: 0 };
        assistsByPlayer[a.player_id].count++;
      });

      Object.values(assistsByPlayer).forEach(({ name, count }) => {
        ctx.save();
        ctx.font = "600 24px 'Segoe UI', Arial, sans-serif";
        ctx.textAlign = "left";
        ctx.fillStyle = "#8fb8e8";
        const displayName = name.length > 25 ? name.substring(0, 24) + "…" : name;
        const text = count > 1 ? `👟  ${displayName.toUpperCase()} (${count}x)` : `👟  ${displayName.toUpperCase()}`;
        ctx.fillText(text, 120, statsY);
        ctx.restore();
        statsY += 36;
      });
    }

    // ============ FOOTER - SPONSORS ============
    const footerY = CANVAS_H - 90;

    // Separator
    const sep = ctx.createLinearGradient(150, 0, CANVAS_W - 150, 0);
    sep.addColorStop(0, "transparent");
    sep.addColorStop(0.5, "#ffffff30");
    sep.addColorStop(1, "transparent");
    ctx.fillStyle = sep;
    ctx.fillRect(150, footerY - 40, CANVAS_W - 300, 1);

    // Sponsor logos
    const sponsorsWithLogo = sponsors.filter(s => s.logo_url);
    if (sponsorsWithLogo.length > 0) {
      const maxLogoH = 50;
      const gap = 30;
      const logoImgs: { img: HTMLImageElement; w: number; h: number }[] = [];
      for (const sponsor of sponsorsWithLogo) {
        try {
          const img = await loadImage(sponsor.logo_url!);
          const asp = img.width / img.height;
          logoImgs.push({ img, w: maxLogoH * asp, h: maxLogoH });
        } catch {}
      }
      const totalW = logoImgs.reduce((s, l) => s + l.w, 0) + (logoImgs.length - 1) * gap;
      let startX = CANVAS_W / 2 - totalW / 2;
      for (const logo of logoImgs) {
        ctx.save();
        ctx.shadowColor = "#000";
        ctx.shadowBlur = 10;
        ctx.drawImage(logo.img, startX, footerY - logo.h / 2, logo.w, logo.h);
        ctx.restore();
        startX += logo.w + gap;
      }
    }

    // Bottom text
    ctx.save();
    ctx.font = "700 18px 'Segoe UI', Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.fillStyle = "#8899bb";
    ctx.fillText("DISTRITO UNIÃO FC  •  A REVOLUÇÃO", CANVAS_W / 2, CANVAS_H - 25);
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

export default ResultFlyerGenerator;
