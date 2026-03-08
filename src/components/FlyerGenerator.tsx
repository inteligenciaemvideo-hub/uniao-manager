import { useState, useRef, useCallback, useEffect } from "react";
import { X, Download, Image as ImageIcon } from "lucide-react";

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

const CANVAS_W = 1080;
const CANVAS_H = 1350;

const FlyerGenerator = ({
  open, onClose, eventType, opponent, date, time, location,
  teamLogoUrl, opponentLogoUrl, homeScore, awayScore,
}: FlyerGeneratorProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useState<FlyerMode>("proximo_jogo");
  const [teamLogoFile, setTeamLogoFile] = useState<string | null>(null);
  const [opponentLogoFile, setOpponentLogoFile] = useState<string | null>(null);
  const [localHomeScore, setLocalHomeScore] = useState(homeScore ?? 0);
  const [localAwayScore, setLocalAwayScore] = useState(awayScore ?? 0);
  const teamLogoInputRef = useRef<HTMLInputElement>(null);
  const oppLogoInputRef = useRef<HTMLInputElement>(null);

  // Use uploaded file or fallback to URL from DB
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

  const drawFlyer = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, CANVAS_W, CANVAS_H);
    grad.addColorStop(0, "#0a1628");
    grad.addColorStop(0.5, "#0d1f3c");
    grad.addColorStop(1, "#0a1628");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // Top accent line
    const accentGrad = ctx.createLinearGradient(0, 0, CANVAS_W, 0);
    accentGrad.addColorStop(0, "transparent");
    accentGrad.addColorStop(0.3, "#2563eb");
    accentGrad.addColorStop(0.7, "#2563eb");
    accentGrad.addColorStop(1, "transparent");
    ctx.fillStyle = accentGrad;
    ctx.fillRect(0, 0, CANVAS_W, 6);

    // Event type badge
    ctx.save();
    ctx.fillStyle = "#2563eb";
    const badgeText = eventType.toUpperCase();
    ctx.font = "bold 42px Arial, sans-serif";
    ctx.textAlign = "center";
    const badgeW = ctx.measureText(badgeText).width + 60;
    const badgeX = (CANVAS_W - badgeW) / 2;
    roundRect(ctx, badgeX, 60, badgeW, 60, 12);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.fillText(badgeText, CANVAS_W / 2, 103);
    ctx.restore();

    // Date / Location / Time subtitle
    const formattedDate = new Date(date + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
    const subtitle = `${formattedDate} / ${location} / ${time}HR`.toUpperCase();
    ctx.fillStyle = "#94a3b8";
    ctx.font = "600 26px Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(subtitle, CANVAS_W / 2, 170);

    // Logos section (center)
    const logoY = 280;
    const logoSize = 320;

    if (teamLogo) {
      try {
        const img = await loadImage(teamLogo);
        drawCircularImage(ctx, img, CANVAS_W / 2 - 200, logoY, logoSize);
      } catch {
        drawPlaceholderCircle(ctx, CANVAS_W / 2 - 200, logoY, logoSize, "SEU TIME");
      }
    } else {
      drawPlaceholderCircle(ctx, CANVAS_W / 2 - 200, logoY, logoSize, "SEU TIME");
    }

    if (oppLogo) {
      try {
        const img = await loadImage(oppLogo);
        drawCircularImage(ctx, img, CANVAS_W / 2 + 200, logoY, logoSize);
      } catch {
        drawPlaceholderCircle(ctx, CANVAS_W / 2 + 200, logoY, logoSize, "ADVERSÁRIO");
      }
    } else {
      drawPlaceholderCircle(ctx, CANVAS_W / 2 + 200, logoY, logoSize, "ADVERSÁRIO");
    }

    // VS or Score between logos
    if (mode === "resultado") {
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 80px Arial, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(`${localHomeScore}`, CANVAS_W / 2 - 60, logoY + logoSize / 2 + 25);
      ctx.fillStyle = "#94a3b8";
      ctx.font = "bold 50px Arial, sans-serif";
      ctx.fillText("x", CANVAS_W / 2, logoY + logoSize / 2 + 18);
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 80px Arial, sans-serif";
      ctx.fillText(`${localAwayScore}`, CANVAS_W / 2 + 60, logoY + logoSize / 2 + 25);
    }

    // Main title
    const titleY = logoY + logoSize + 100;
    const mainTitle = mode === "proximo_jogo" ? "PRÓXIMO" : "RESULTADO";
    const subTitle = mode === "proximo_jogo" ? "JOGO" : "FINAL";

    ctx.fillStyle = "#ffffff";
    ctx.font = "900 120px Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(mainTitle, CANVAS_W / 2, titleY);

    ctx.font = "900 140px Arial, sans-serif";
    ctx.fillText(subTitle, CANVAS_W / 2, titleY + 130);

    // Team name subtitle
    ctx.fillStyle = "#2563eb";
    ctx.font = "600 28px Arial, sans-serif";
    ctx.fillText("DISTRITO UNIÃO", CANVAS_W / 2, titleY + 180);

    // Opponent name
    if (opponent) {
      ctx.fillStyle = "#94a3b8";
      ctx.font = "600 26px Arial, sans-serif";
      ctx.fillText(`vs ${opponent.toUpperCase()}`, CANVAS_W / 2, titleY + 220);
    }

    // Bottom bar
    ctx.fillStyle = "#2563eb";
    ctx.fillRect(0, CANVAS_H - 6, CANVAS_W, 6);
  }, [mode, teamLogo, oppLogo, eventType, date, time, location, opponent, localHomeScore, localAwayScore]);

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
                mode === "proximo_jogo"
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground"
              }`}
            >
              Próximo Jogo
            </button>
            <button
              onClick={() => setMode("resultado")}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                mode === "resultado"
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground"
              }`}
            >
              Resultado
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
                  type="number"
                  min={0}
                  value={localHomeScore}
                  onChange={(e) => setLocalHomeScore(Number(e.target.value))}
                  className="w-full h-10 rounded-lg bg-secondary/30 border border-border px-3 text-center text-lg font-bold"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Placar - Adversário</label>
                <input
                  type="number"
                  min={0}
                  value={localAwayScore}
                  onChange={(e) => setLocalAwayScore(Number(e.target.value))}
                  className="w-full h-10 rounded-lg bg-secondary/30 border border-border px-3 text-center text-lg font-bold"
                />
              </div>
            </div>
          )}

          {/* Canvas preview */}
          <div className="rounded-xl overflow-hidden border border-border">
            <canvas
              ref={canvasRef}
              width={CANVAS_W}
              height={CANVAS_H}
              className="w-full h-auto"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={drawFlyer}
              className="flex-1 py-3 rounded-xl bg-secondary text-foreground font-semibold text-sm"
            >
              Atualizar Preview
            </button>
            <button
              onClick={handleDownload}
              className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2"
            >
              <Download size={16} /> Baixar Flyer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper: draw rounded rectangle
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

// Helper: draw circular image
function drawCircularImage(ctx: CanvasRenderingContext2D, img: HTMLImageElement, cx: number, cy: number, size: number) {
  const r = size / 2;
  ctx.save();
  // Draw the image fitting within the circle area without clipping (for logos with transparency)
  const aspect = img.width / img.height;
  let dw = size, dh = size;
  if (aspect > 1) { dh = size / aspect; } else { dw = size * aspect; }
  ctx.drawImage(img, cx - dw / 2, cy - dh / 2 + r / 4, dw, dh);
  ctx.restore();
}

// Helper: draw placeholder circle
function drawPlaceholderCircle(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, label: string) {
  const r = size / 2;
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy + r / 2, r / 1.5, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(37, 99, 235, 0.15)";
  ctx.fill();
  ctx.strokeStyle = "rgba(37, 99, 235, 0.3)";
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.fillStyle = "#64748b";
  ctx.font = "600 18px Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(label, cx, cy + r / 2 + 6);
  ctx.restore();
}

export default FlyerGenerator;
