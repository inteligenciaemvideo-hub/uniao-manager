import { useRef, useCallback, useEffect } from "react";

const CANVAS_W = 1080;
const CANVAS_H = 1350;
const TEAM_LOGO_PATH = "/images/distrito-uniao-logo.png";

const BG_BLACK = "#050a12";
const BORDER_BLUE = "#0d1b3e";
const BLUE_ACCENT = "#1a3a7a";
const BLUE_GLOW = "#2563eb";
const WHITE = "#ffffff";
const WHITE_DIM = "#8899bb";

interface Player {
  name: string;
  nickname: string;
  number: number;
  positions: string[];
}

interface Guest {
  nickname: string;
}

interface ConvocationCardProps {
  open: boolean;
  onClose: () => void;
  eventType: string;
  opponent: string;
  date: string;
  time: string;
  location: string;
  players: Player[];
  guests: Guest[];
}

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

function drawThinSeparator(ctx: CanvasRenderingContext2D, y: number) {
  const g = ctx.createLinearGradient(100, 0, CANVAS_W - 100, 0);
  g.addColorStop(0, "transparent");
  g.addColorStop(0.3, BLUE_ACCENT + "40");
  g.addColorStop(0.5, BLUE_GLOW + "60");
  g.addColorStop(0.7, BLUE_ACCENT + "40");
  g.addColorStop(1, "transparent");
  ctx.fillStyle = g;
  ctx.fillRect(100, y, CANVAS_W - 200, 1);
}

const ConvocationCard = ({
  open, onClose, eventType, opponent, date, time, location, players, guests
}: ConvocationCardProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const draw = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const BORDER = 28;
    const INNER_X = BORDER;
    const INNER_Y = BORDER;
    const INNER_W = CANVAS_W - BORDER * 2;
    const INNER_H = CANVAS_H - BORDER * 2;

    // Outer border
    ctx.fillStyle = BORDER_BLUE;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // Inner black panel
    const bg = ctx.createRadialGradient(CANVAS_W / 2, CANVAS_H * 0.3, 80, CANVAS_W / 2, CANVAS_H * 0.3, CANVAS_H * 0.8);
    bg.addColorStop(0, "#0e1525");
    bg.addColorStop(0.5, "#080f1e");
    bg.addColorStop(1, BG_BLACK);
    ctx.fillStyle = bg;
    roundRect(ctx, INNER_X, INNER_Y, INNER_W, INNER_H, 4);
    ctx.fill();

    // Subtle glow
    ctx.save();
    ctx.globalAlpha = 0.06;
    const cGlow = ctx.createRadialGradient(CANVAS_W / 2, 200, 50, CANVAS_W / 2, 200, 400);
    cGlow.addColorStop(0, BLUE_GLOW);
    cGlow.addColorStop(1, "transparent");
    ctx.fillStyle = cGlow;
    ctx.fillRect(INNER_X, INNER_Y, INNER_W, INNER_H);
    ctx.restore();

    // Inner border accent
    ctx.save();
    ctx.strokeStyle = BLUE_ACCENT + "50";
    ctx.lineWidth = 1;
    roundRect(ctx, INNER_X + 1, INNER_Y + 1, INNER_W - 2, INNER_H - 2, 3);
    ctx.stroke();
    ctx.restore();

    // ============ LOGO ============
    try {
      const logo = await loadImage(TEAM_LOGO_PATH);
      const logoSize = 120;
      const asp = logo.width / logo.height;
      let dw = logoSize, dh = logoSize;
      if (asp > 1) dh = logoSize / asp; else dw = logoSize * asp;
      ctx.save();
      ctx.shadowColor = "#000";
      ctx.shadowBlur = 20;
      ctx.drawImage(logo, CANVAS_W / 2 - dw / 2, 70, dw, dh);
      ctx.restore();
    } catch { /* skip */ }

    // ============ TITLE ============
    ctx.save();
    ctx.shadowColor = BLUE_GLOW + "60";
    ctx.shadowBlur = 40;
    ctx.fillStyle = WHITE;
    ctx.font = "900 72px 'Segoe UI', Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("CONVOCADOS", CANVAS_W / 2, 260);
    ctx.restore();

    // Event info
    const dateStr = date ? new Date(date + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }) : "--/--";
    const infoLine = opponent ? `VS ${opponent.toUpperCase()}` : eventType.toUpperCase();
    ctx.save();
    ctx.font = "700 30px 'Segoe UI', Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.fillStyle = BLUE_GLOW;
    ctx.fillText(infoLine, CANVAS_W / 2, 310);
    ctx.restore();

    ctx.save();
    ctx.font = "500 22px 'Segoe UI', Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.fillStyle = WHITE_DIM;
    ctx.fillText(`${dateStr}  •  ${time}H  •  ${location.toUpperCase()}`, CANVAS_W / 2, 348);
    ctx.restore();

    drawThinSeparator(ctx, 380);

    // ============ PLAYER LIST (two columns) ============
    const allNames: { name: string; number: string; isGuest: boolean }[] = [];
    players.forEach(p => allNames.push({ name: p.nickname || p.name, number: `#${p.number}`, isGuest: false }));
    guests.forEach(g => allNames.push({ name: g.nickname, number: "★", isGuest: true }));

    const startY = 420;
    const colWidth = (INNER_W - 80) / 2;
    const leftX = INNER_X + 50;
    const rightX = CANVAS_W / 2 + 20;
    const rowH = 52;
    const halfLen = Math.ceil(allNames.length / 2);

    allNames.forEach((item, i) => {
      const col = i < halfLen ? 0 : 1;
      const row = col === 0 ? i : i - halfLen;
      const x = col === 0 ? leftX : rightX;
      const y = startY + row * rowH;

      // Row background
      ctx.save();
      ctx.globalAlpha = i % 2 === 0 ? 0.04 : 0;
      ctx.fillStyle = WHITE;
      roundRect(ctx, x - 10, y - 14, colWidth, 42, 6);
      ctx.fill();
      ctx.restore();

      // Number badge
      ctx.save();
      ctx.font = "700 16px 'Segoe UI', Arial, sans-serif";
      ctx.textAlign = "center";
      ctx.fillStyle = item.isGuest ? "#eab308" : BLUE_GLOW;
      ctx.fillText(item.number, x + 16, y + 12);
      ctx.restore();

      // Name
      ctx.save();
      ctx.font = `${item.isGuest ? "600" : "700"} 22px 'Segoe UI', Arial, sans-serif`;
      ctx.textAlign = "left";
      ctx.fillStyle = item.isGuest ? "#eab308" : WHITE;
      const displayName = item.name.length > 16 ? item.name.substring(0, 15) + "…" : item.name;
      ctx.fillText(displayName.toUpperCase(), x + 40, y + 12);
      ctx.restore();

      if (item.isGuest) {
        ctx.save();
        ctx.font = "500 12px 'Segoe UI', Arial, sans-serif";
        ctx.textAlign = "left";
        ctx.fillStyle = "#eab30880";
        ctx.fillText("CONVIDADO", x + 40, y + 28);
        ctx.restore();
      }
    });

    // ============ FOOTER ============
    drawThinSeparator(ctx, CANVAS_H - 120);

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

  }, [players, guests, eventType, opponent, date, time, location]);

  useEffect(() => {
    if (open) draw();
  }, [open, draw]);

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    const safeDate = date || "sem-data";
    link.download = `escalacao_distrito_uniao_${safeDate}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-card rounded-2xl max-h-[95vh] overflow-y-auto">
        <div className="px-4 py-4 border-b border-border flex items-center justify-between sticky top-0 bg-card z-10">
          <h3 className="text-sm font-bold">Card Instagram - Convocados</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
            <span className="text-xs font-bold">✕</span>
          </button>
        </div>
        <div className="p-4 space-y-4">
          <div className="rounded-xl overflow-hidden border border-border">
            <canvas ref={canvasRef} width={CANVAS_W} height={CANVAS_H} className="w-full h-auto" />
          </div>
          <div className="flex gap-3">
            <button onClick={draw} className="flex-1 py-3 rounded-xl bg-secondary text-foreground font-semibold text-sm">
              Atualizar
            </button>
            <button onClick={handleDownload} className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2">
              ⬇ Baixar PNG
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConvocationCard;
