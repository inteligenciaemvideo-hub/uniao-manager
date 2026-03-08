import { useState, useRef, useCallback } from "react";
import { Target, Handshake, SquareSlash, CircleX, ChevronDown, ChevronUp, Instagram } from "lucide-react";
import { usePlayers, useSponsors } from "@/hooks/useSupabase";
import { useNavigate } from "react-router-dom";
import PlayerAvatar from "@/components/PlayerAvatar";

const CANVAS_W = 1080;
const CANVAS_H = 1350;
const TEAM_LOGO_PATH = "/images/distrito-uniao-logo.png";

const BG_BLACK = "#050a12";
const BORDER_BLUE = "#0d1b3e";
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

type RankingType = "goals" | "assists" | "cards";

interface RankingEntry {
  id: string;
  name: string;
  nickname: string;
  number: number;
  photo_url: string | null;
  value: number;
  secondary?: string;
}

const Stats = () => {
  const navigate = useNavigate();
  const { data: players = [] } = usePlayers();
  const { data: sponsors = [] } = useSponsors();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ goals: true, assists: true, cards: true });
  const [exportType, setExportType] = useState<RankingType | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const scorers = [...players].sort((a, b) => b.goals - a.goals).filter(p => p.goals > 0);
  const assisters = [...players].sort((a, b) => b.assists - a.assists).filter(p => p.assists > 0);
  const carders = [...players].sort((a, b) => (b.yellow_cards + b.red_cards) - (a.yellow_cards + a.red_cards)).filter(p => p.yellow_cards + p.red_cards > 0);

  const totalGoals = players.reduce((s, p) => s + p.goals, 0);
  const totalAssists = players.reduce((s, p) => s + p.assists, 0);
  const totalYellows = players.reduce((s, p) => s + p.yellow_cards, 0);
  const totalReds = players.reduce((s, p) => s + p.red_cards, 0);

  const toggle = (key: string) => setExpanded(prev => ({ ...prev, [key]: !prev[key] }));

  const getRankingData = (type: RankingType): { title: string; emoji: string; entries: RankingEntry[] } => {
    switch (type) {
      case "goals":
        return {
          title: "ARTILHARIA",
          emoji: "⚽",
          entries: scorers.map(p => ({ id: p.id, name: p.name, nickname: p.nickname, number: p.number, photo_url: p.photo_url, value: p.goals })),
        };
      case "assists":
        return {
          title: "ASSISTÊNCIAS",
          emoji: "👟",
          entries: assisters.map(p => ({ id: p.id, name: p.name, nickname: p.nickname, number: p.number, photo_url: p.photo_url, value: p.assists })),
        };
      case "cards":
        return {
          title: "CARTÕES",
          emoji: "🟨",
          entries: carders.map(p => ({
            id: p.id, name: p.name, nickname: p.nickname, number: p.number, photo_url: p.photo_url,
            value: p.yellow_cards + p.red_cards,
            secondary: `${p.yellow_cards}🟨 ${p.red_cards > 0 ? p.red_cards + "🟥" : ""}`.trim(),
          })),
        };
    }
  };

  const generateCard = useCallback(async (type: RankingType) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { title, emoji, entries } = getRankingData(type);

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
    ctx.globalAlpha = 0.08;
    const cGlow = ctx.createRadialGradient(CANVAS_W / 2, 300, 50, CANVAS_W / 2, 300, 500);
    cGlow.addColorStop(0, BLUE_GLOW);
    cGlow.addColorStop(1, "transparent");
    ctx.fillStyle = cGlow;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    ctx.restore();

    // Team logo
    try {
      const logo = await loadImage(TEAM_LOGO_PATH);
      const logoSize = 130;
      const asp = logo.width / logo.height;
      let dw = logoSize, dh = logoSize;
      if (asp > 1) dh = logoSize / asp; else dw = logoSize * asp;
      ctx.save();
      ctx.shadowColor = "#000";
      ctx.shadowBlur = 25;
      ctx.drawImage(logo, CANVAS_W / 2 - dw / 2, 50, dw, dh);
      ctx.restore();
    } catch {}

    // Title
    ctx.save();
    ctx.shadowColor = BLUE_GLOW + "60";
    ctx.shadowBlur = 40;
    ctx.fillStyle = WHITE;
    ctx.font = "900 72px 'Segoe UI', Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(title, CANVAS_W / 2, 260);
    ctx.restore();

    // Subtitle
    ctx.save();
    ctx.font = "600 26px 'Segoe UI', Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.fillStyle = BLUE_GLOW;
    ctx.fillText("TEMPORADA 2026", CANVAS_W / 2, 305);
    ctx.restore();

    // Separator
    const sepG = ctx.createLinearGradient(150, 0, CANVAS_W - 150, 0);
    sepG.addColorStop(0, "transparent");
    sepG.addColorStop(0.5, BLUE_GLOW + "60");
    sepG.addColorStop(1, "transparent");
    ctx.fillStyle = sepG;
    ctx.fillRect(150, 330, CANVAS_W - 300, 2);

    // Ranking entries
    const startY = 380;
    const rowH = 75;
    const maxEntries = Math.min(entries.length, 12);
    const mx = 100;

    for (let i = 0; i < maxEntries; i++) {
      const entry = entries[i];
      const y = startY + i * rowH;

      // Row bg
      ctx.save();
      ctx.globalAlpha = i % 2 === 0 ? 0.06 : 0.02;
      ctx.fillStyle = WHITE;
      roundRect(ctx, mx, y, CANVAS_W - mx * 2, rowH - 8, 10);
      ctx.fill();
      ctx.restore();

      // Position number
      const isTop3 = i < 3;
      ctx.save();
      if (isTop3) {
        ctx.fillStyle = i === 0 ? GOLD : i === 1 ? "#c0c0c0" : "#cd7f32";
        ctx.font = "900 32px 'Segoe UI', Arial, sans-serif";
      } else {
        ctx.fillStyle = WHITE_DIM;
        ctx.font = "700 24px 'Segoe UI', Arial, sans-serif";
      }
      ctx.textAlign = "center";
      ctx.fillText(`${i + 1}`, mx + 35, y + 42);
      ctx.restore();

      // Player name
      ctx.save();
      ctx.font = isTop3 ? "800 28px 'Segoe UI', Arial, sans-serif" : "600 24px 'Segoe UI', Arial, sans-serif";
      ctx.textAlign = "left";
      ctx.fillStyle = isTop3 ? WHITE : WHITE_DIM;
      const name = entry.nickname || entry.name;
      const displayName = name.length > 20 ? name.substring(0, 19) + "…" : name;
      ctx.fillText(displayName.toUpperCase(), mx + 80, y + 35);
      ctx.restore();

      // Jersey number
      ctx.save();
      ctx.font = "500 16px 'Segoe UI', Arial, sans-serif";
      ctx.textAlign = "left";
      ctx.fillStyle = BLUE_GLOW;
      ctx.fillText(`#${entry.number}`, mx + 80, y + 56);
      ctx.restore();

      // Value
      ctx.save();
      ctx.font = isTop3 ? "900 36px 'Segoe UI', Arial, sans-serif" : "700 28px 'Segoe UI', Arial, sans-serif";
      ctx.textAlign = "right";
      ctx.fillStyle = isTop3 ? WHITE : WHITE_DIM;
      const valueText = entry.secondary || `${entry.value}`;
      ctx.fillText(valueText, CANVAS_W - mx - 20, y + 42);
      ctx.restore();
    }

    if (entries.length === 0) {
      ctx.save();
      ctx.font = "500 28px 'Segoe UI', Arial, sans-serif";
      ctx.textAlign = "center";
      ctx.fillStyle = WHITE_DIM;
      ctx.fillText("Nenhum registro ainda", CANVAS_W / 2, startY + 60);
      ctx.restore();
    }

    // Footer separator
    const footerY = CANVAS_H - 100;
    const fSep = ctx.createLinearGradient(150, 0, CANVAS_W - 150, 0);
    fSep.addColorStop(0, "transparent");
    fSep.addColorStop(0.5, BLUE_GLOW + "40");
    fSep.addColorStop(1, "transparent");
    ctx.fillStyle = fSep;
    ctx.fillRect(150, footerY - 30, CANVAS_W - 300, 1);

    // Sponsor logos
    const sponsorsWithLogo = (sponsors || []).filter((s: any) => s.logo_url);
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

    // Footer text
    ctx.save();
    ctx.font = "700 20px 'Segoe UI', Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.fillStyle = WHITE_DIM;
    ctx.fillText("DISTRITO UNIÃO FC  •  A REVOLUÇÃO", CANVAS_W / 2, CANVAS_H - 30);
    ctx.restore();

    setExportType(type);
  }, [players, sponsors]);

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas || !exportType) return;
    const link = document.createElement("a");
    link.download = `stats_${exportType}_distrito_uniao.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const renderSection = (
    key: string,
    title: string,
    icon: React.ReactNode,
    entries: { id: string; name: string; nickname: string; number: number; photo_url: string | null; goals?: number; assists?: number; yellow_cards?: number; red_cards?: number }[],
    type: RankingType,
    renderValue: (entry: any, i: number) => React.ReactNode,
  ) => (
    <div className="card-elevated">
      <button onClick={() => toggle(key)} className="w-full flex items-center justify-between mb-1">
        <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          {icon} {title}
        </h4>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); generateCard(type); }}
            className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary hover:bg-primary/20 transition-colors"
            title="Exportar para Instagram"
          >
            <Instagram size={14} />
          </button>
          {expanded[key] ? <ChevronUp size={16} className="text-muted-foreground" /> : <ChevronDown size={16} className="text-muted-foreground" />}
        </div>
      </button>
      {expanded[key] && (
        <div className="space-y-1 mt-3">
          {entries.length > 0 ? entries.map((player, i) => (
            <div
              key={player.id}
              className="flex items-center gap-3 py-2 px-2 rounded-lg hover:bg-secondary/50 transition-colors cursor-pointer"
              onClick={() => navigate(`/jogador/${player.id}`)}
            >
              <span className={`text-sm font-bold w-6 text-center ${i === 0 ? "text-yellow-400" : i === 1 ? "text-gray-400" : i === 2 ? "text-amber-600" : "text-muted-foreground"}`}>
                {i + 1}
              </span>
              <PlayerAvatar playerId={player.id} nickname={player.nickname} photoUrl={player.photo_url || undefined} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{player.name}</p>
                <p className="text-[10px] text-muted-foreground">#{player.number}</p>
              </div>
              {renderValue(player, i)}
            </div>
          )) : (
            <p className="text-xs text-muted-foreground py-2">Nenhum registro ainda.</p>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="px-4 py-5 space-y-5 animate-fade-in pb-24">
      <h2 className="text-lg font-bold">Estatísticas da Temporada</h2>

      <div className="grid grid-cols-4 gap-2">
        <div className="card-elevated text-center py-3">
          <Target size={14} className="mx-auto text-primary mb-1" />
          <p className="text-lg font-bold">{totalGoals}</p>
          <p className="text-[10px] text-muted-foreground">Gols</p>
        </div>
        <div className="card-elevated text-center py-3">
          <Handshake size={14} className="mx-auto text-primary mb-1" />
          <p className="text-lg font-bold">{totalAssists}</p>
          <p className="text-[10px] text-muted-foreground">Assist.</p>
        </div>
        <div className="card-elevated text-center py-3">
          <SquareSlash size={14} className="mx-auto text-warning mb-1" />
          <p className="text-lg font-bold">{totalYellows}</p>
          <p className="text-[10px] text-muted-foreground">Amarelos</p>
        </div>
        <div className="card-elevated text-center py-3">
          <CircleX size={14} className="mx-auto text-destructive mb-1" />
          <p className="text-lg font-bold">{totalReds}</p>
          <p className="text-[10px] text-muted-foreground">Vermelhos</p>
        </div>
      </div>

      {renderSection(
        "goals", "Artilharia",
        <Target size={14} className="text-primary" />,
        scorers, "goals",
        (p: any, i: number) => (
          <span className={`text-sm font-bold ${i === 0 ? "text-primary" : ""}`}>{p.goals} ⚽</span>
        ),
      )}

      {renderSection(
        "assists", "Assistências",
        <Handshake size={14} className="text-primary" />,
        assisters, "assists",
        (p: any, i: number) => (
          <span className={`text-sm font-bold ${i === 0 ? "text-primary" : ""}`}>{p.assists} 👟</span>
        ),
      )}

      {renderSection(
        "cards", "Cartões",
        <SquareSlash size={14} className="text-warning" />,
        carders, "cards",
        (p: any) => (
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-400">{p.yellow_cards} 🟨</span>
            {p.red_cards > 0 && <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-destructive/20 text-destructive">{p.red_cards} 🟥</span>}
          </div>
        ),
      )}

      {/* Hidden canvas for export */}
      <canvas ref={canvasRef} width={CANVAS_W} height={CANVAS_H} className="hidden" />

      {/* Export modal */}
      {exportType && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-card rounded-2xl max-h-[95vh] overflow-y-auto">
            <div className="px-4 py-4 border-b border-border flex items-center justify-between sticky top-0 bg-card z-10">
              <h3 className="text-sm font-bold">Card Instagram - {getRankingData(exportType).title}</h3>
              <button onClick={() => setExportType(null)} className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                <span className="text-xs font-bold">✕</span>
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div className="rounded-xl overflow-hidden border border-border">
                <canvas ref={canvasRef} width={CANVAS_W} height={CANVAS_H} className="w-full h-auto" />
              </div>
              <div className="flex gap-3">
                <button onClick={() => generateCard(exportType)} className="flex-1 py-3 rounded-xl bg-secondary text-foreground font-semibold text-sm">
                  Atualizar
                </button>
                <button onClick={handleDownload} className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2">
                  ⬇ Baixar PNG
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Stats;
