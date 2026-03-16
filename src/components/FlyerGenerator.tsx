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
  teamLogoUrl?: string | null;
}

type MatchSide = "home" | "away";

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
  ctx.shadowBlur = 50;
  ctx.shadowOffsetY = 8;
  ctx.drawImage(img, cx - dw / 2, cy - dh / 2, dw, dh);
  ctx.restore();
}

const BG_COLORS = [
  { label: "Preto", value: "#030810" },
  { label: "Azul Escuro", value: "#0a1e40" },
  { label: "Azul Marinho", value: "#1a3f7a" },
  { label: "Verde Escuro", value: "#0a3a1a" },
  { label: "Vinho", value: "#3a0a1e" },
];

const FlyerGenerator = ({
  open, onClose, eventType, opponent, date, time, location,
  opponentLogoUrl, sponsors = [], teamLogoUrl,
}: FlyerGeneratorProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [side, setSide] = useState<MatchSide>("home");
  const [opponentLogoFile, setOpponentLogoFile] = useState<string | null>(null);
  const [teamLogoFile, setTeamLogoFile] = useState<string | null>(null);
  const [bgColor, setBgColor] = useState("#030810");
  const oppLogoInputRef = useRef<HTMLInputElement>(null);
  const teamLogoInputRef = useRef<HTMLInputElement>(null);

  const oppLogo = opponentLogoFile || opponentLogoUrl || null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setOpponentLogoFile(URL.createObjectURL(file));
  };

  const handleTeamLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setTeamLogoFile(URL.createObjectURL(file));
  };

  const teamLogo = teamLogoFile || teamLogoUrl || TEAM_LOGO_PATH;

  const drawFlyer = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // ============ BACKGROUND - SOLID BLACK ============
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // Blue vertical stripe accents on edges (matching ref image 1)
    const stripeCount = 12;
    for (let i = 0; i < stripeCount; i++) {
      const segH = CANVAS_H / stripeCount;
      ctx.save();
      ctx.globalAlpha = 0.25 - i * 0.012;
      // Left stripe
      const lG = ctx.createLinearGradient(0, 0, 100, 0);
      lG.addColorStop(0, "#1e40af");
      lG.addColorStop(1, "transparent");
      ctx.fillStyle = lG;
      ctx.fillRect(0, i * segH, 100, segH);
      // Right stripe
      const rG = ctx.createLinearGradient(CANVAS_W, 0, CANVAS_W - 100, 0);
      rG.addColorStop(0, "#1e40af");
      rG.addColorStop(1, "transparent");
      ctx.fillStyle = rG;
      ctx.fillRect(CANVAS_W - 100, i * segH, 100, segH);
      ctx.restore();
    }

    // Subtle diagonal blue accent lines
    ctx.save();
    ctx.globalAlpha = 0.06;
    ctx.fillStyle = "#2563eb";
    ctx.beginPath();
    ctx.moveTo(0, 0); ctx.lineTo(80, 0); ctx.lineTo(0, CANVAS_H); ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(CANVAS_W, 0); ctx.lineTo(CANVAS_W - 80, 0); ctx.lineTo(CANVAS_W, CANVAS_H); ctx.closePath();
    ctx.fill();
    ctx.restore();

    // ============ TOP: EVENT TYPE ============
    const topY = 90;
    ctx.save();
    ctx.font = "900 52px 'Segoe UI', Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.letterSpacing = "4px";
    ctx.fillStyle = "#ffffff";
    ctx.shadowColor = "#000";
    ctx.shadowBlur = 20;
    ctx.fillText(eventType.toUpperCase(), CANVAS_W / 2, topY);
    ctx.restore();

    // Date / Location / Time line
    const dateStr = date ? new Date(date + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }) : "--/--";
    const infoText = `${dateStr}/${location.toUpperCase()}/${time}H`;
    ctx.save();
    ctx.font = "700 20px 'Segoe UI', Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.fillStyle = "#4a8af4";
    ctx.fillText(infoText, CANVAS_W / 2, topY + 40);
    ctx.restore();

    // ============ LOGOS - OVERLAPPING CENTER ============
    const logoCenterY = 370;
    const logoSize = 340;
    const overlapGap = 60;

    const leftCx = CANVAS_W / 2 - overlapGap - 20;
    const rightCx = CANVAS_W / 2 + overlapGap + 20;
    const ourCx = side === "home" ? leftCx : rightCx;
    const oppCx = side === "home" ? rightCx : leftCx;

    // Glow behind center
    ctx.save();
    ctx.globalAlpha = 0.12;
    const cGlow = ctx.createRadialGradient(CANVAS_W / 2, logoCenterY, 20, CANVAS_W / 2, logoCenterY, 350);
    cGlow.addColorStop(0, "#2563eb");
    cGlow.addColorStop(1, "transparent");
    ctx.fillStyle = cGlow;
    ctx.fillRect(0, logoCenterY - 350, CANVAS_W, 700);
    ctx.restore();

    // Our team logo
    try {
      const teamImg = await loadImage(teamLogo);
      drawFitLogo(ctx, teamImg, ourCx, logoCenterY, logoSize);
    } catch {}

    // Opponent logo
    if (oppLogo) {
      try {
        const img = await loadImage(oppLogo);
        drawFitLogo(ctx, img, oppCx, logoCenterY, logoSize);
      } catch {}
    } else {
      // Placeholder circle
      ctx.save();
      ctx.beginPath();
      ctx.arc(oppCx, logoCenterY, logoSize * 0.3, 0, Math.PI * 2);
      ctx.strokeStyle = "#1e3a6e50";
      ctx.lineWidth = 3;
      ctx.setLineDash([10, 8]);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = "#445577";
      ctx.font = "700 20px 'Segoe UI', Arial, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("ADVERSÁRIO", oppCx, logoCenterY + 6);
      ctx.restore();
    }

    // ============ BIG TITLE: DIA DE JOGO ============
    const titleY = logoCenterY + logoSize / 2 + 100;

    // "DIA DE"
    ctx.save();
    ctx.shadowColor = "#000";
    ctx.shadowBlur = 40;
    ctx.fillStyle = "#ffffff";
    ctx.font = "900 130px 'Segoe UI', Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("DIA DE", CANVAS_W / 2, titleY);
    ctx.restore();

    // "JOGO" - large, bold
    ctx.save();
    ctx.shadowColor = "#000";
    ctx.shadowBlur = 50;
    ctx.fillStyle = "#ffffff";
    ctx.font = "900 180px 'Segoe UI', Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("JOGO", CANVAS_W / 2, titleY + 165);
    ctx.restore();

    // Team name small below
    ctx.save();
    ctx.font = "600 24px 'Segoe UI', Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.fillStyle = "#5580bb";
    ctx.fillText("DISTRITO UNIÃO", CANVAS_W / 2, titleY + 210);
    ctx.restore();

    // ============ FOOTER - SPONSORS ============
    const footerY = CANVAS_H - 90;

    // Separator line
    const sep = ctx.createLinearGradient(150, 0, CANVAS_W - 150, 0);
    sep.addColorStop(0, "transparent");
    sep.addColorStop(0.5, "#2563eb50");
    sep.addColorStop(1, "transparent");
    ctx.fillStyle = sep;
    ctx.fillRect(150, footerY - 40, CANVAS_W - 300, 1);

    // Sponsor logos
    const sponsorsWithLogo = sponsors.filter(s => s.logo_url);
    if (sponsorsWithLogo.length > 0) {
      const maxLogoH = 55;
      const gap = 35;
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
        ctx.shadowBlur = 12;
        ctx.drawImage(logo.img, startX, footerY - logo.h / 2, logo.w, logo.h);
        ctx.restore();
        startX += logo.w + gap;
      }
    }

    // Bottom text
    ctx.save();
    ctx.font = "700 18px 'Segoe UI', Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.fillStyle = "#556688";
    ctx.fillText("DISTRITO UNIÃO FC  •  A REVOLUÇÃO", CANVAS_W / 2, CANVAS_H - 25);
    ctx.restore();

  }, [side, oppLogo, teamLogo, bgColor, eventType, date, time, location, opponent, sponsors]);

  useEffect(() => {
    if (open) drawFlyer();
  }, [open, drawFlyer]);

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `flyer-dia-de-jogo-${date}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-card rounded-2xl max-h-[95vh] overflow-y-auto">
        <div className="px-4 py-4 border-b border-border flex items-center justify-between sticky top-0 bg-card z-10">
          <h3 className="text-sm font-bold">Flyer - Dia de Jogo</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
            <X size={16} />
          </button>
        </div>

        <div className="p-4 space-y-4">
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
            <label className="text-xs text-muted-foreground mb-1 block">Logo do adversário (PNG transparente recomendado)</label>
            <button
              onClick={() => oppLogoInputRef.current?.click()}
              className="w-full h-20 rounded-xl bg-secondary border-2 border-dashed border-border flex items-center justify-center gap-2 overflow-hidden hover:border-primary/40 transition-colors"
            >
              {oppLogo ? (
                <img src={oppLogo} alt="Logo adversário" className="h-16 w-16 object-contain" />
              ) : (
                <><ImageIcon size={16} className="text-muted-foreground" /><span className="text-xs text-muted-foreground">Anexar logo (PNG sem fundo)</span></>
              )}
            </button>
            <input ref={oppLogoInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
          </div>

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

export default FlyerGenerator;
