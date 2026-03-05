export type SatisfactionEmoji = "😍" | "😊" | "😐" | "😕" | "😡" | null;

export type AbsenceReason = "doença" | "estudos" | "viagem" | "trabalho" | "não justificável";

export const absenceReasons: AbsenceReason[] = ["doença", "estudos", "viagem", "trabalho", "não justificável"];

export interface PlayerComment {
  id: string;
  text: string;
  date: string;
}

export interface PlayerFee {
  id: string;
  description: string;
  amount: number;
  paid: boolean;
  date: string;
}

export interface Player {
  id: string;
  name: string;
  nickname: string;
  positions: string[];
  number: number;
  photo: string;
  dominantFoot: "Direito" | "Esquerdo" | "Ambos";
  birthDate: string;
  phone: string;
  emergencyContact: string;
  status: "Ativo" | "Inativo";
  injured: boolean;
  goals: number;
  assists: number;
  yellowCards: number;
  redCards: number;
  monthlyPayments: Record<string, boolean>;
  attendanceHistory: boolean[];
  satisfaction: SatisfactionEmoji;
  comments: PlayerComment[];
  fees: PlayerFee[];
}

export interface FinancialEntry {
  id: string;
  type: "entrada" | "saida";
  category: string;
  description: string;
  amount: number;
  date: string;
  playerId?: string;
}

export interface GameEvent {
  id: string;
  type: "Treino" | "Amistoso" | "Torneio";
  date: string;
  time: string;
  location: string;
  opponent?: string;
  attendance: Record<string, "presente" | "falta_justificada" | "falta">;
  absenceReasons?: Record<string, AbsenceReason>;
}

export const mockPlayers: Player[] = [
  {
    id: "1", name: "Diego Costa", nickname: "Diesel", positions: ["Atacante"], number: 9,
    photo: "", dominantFoot: "Direito", birthDate: "1992-03-15", phone: "(11) 99999-0001",
    emergencyContact: "(11) 98888-0001", status: "Ativo", injured: false, goals: 15, assists: 4,
    yellowCards: 2, redCards: 0,
    monthlyPayments: { "Jan": true, "Fev": true, "Mar": true, "Abr": true, "Mai": true, "Jun": true },
    attendanceHistory: [true, true, true, true, false],
    satisfaction: "😍", comments: [{ id: "c1", text: "Artilheiro nato, comprometido.", date: "2025-06-10" }], fees: [],
  },
  {
    id: "2", name: "Rafael Mendes", nickname: "Rafa", positions: ["Meio-campo", "Atacante"], number: 10,
    photo: "", dominantFoot: "Esquerdo", birthDate: "1995-07-22", phone: "(11) 99999-0002",
    emergencyContact: "(11) 98888-0002", status: "Ativo", injured: false, goals: 8, assists: 12,
    yellowCards: 1, redCards: 0,
    monthlyPayments: { "Jan": true, "Fev": true, "Mar": true, "Abr": true, "Mai": true, "Jun": true },
    attendanceHistory: [true, true, true, true, true],
    satisfaction: "😊", comments: [], fees: [],
  },
  {
    id: "3", name: "Fernando Souza", nickname: "Nando", positions: ["Zagueiro"], number: 4,
    photo: "", dominantFoot: "Direito", birthDate: "1990-11-08", phone: "(11) 99999-0003",
    emergencyContact: "(11) 98888-0003", status: "Ativo", injured: true, goals: 1, assists: 0,
    yellowCards: 5, redCards: 1,
    monthlyPayments: { "Jan": true, "Fev": true, "Mar": false, "Abr": false, "Mai": false, "Jun": false },
    attendanceHistory: [false, true, false, false, false],
    satisfaction: "😡", comments: [{ id: "c2", text: "Muitas faltas e inadimplente.", date: "2025-06-12" }],
    fees: [{ id: "t1", description: "Multa cartão vermelho", amount: 30, paid: false, date: "2025-05-20" }, { id: "t2", description: "Multa por falta", amount: 15, paid: false, date: "2025-06-01" }],
  },
  {
    id: "4", name: "Lucas Oliveira", nickname: "Luquinha", positions: ["Lateral", "Meio-campo"], number: 6,
    photo: "", dominantFoot: "Direito", birthDate: "1997-01-30", phone: "(11) 99999-0004",
    emergencyContact: "(11) 98888-0004", status: "Ativo", injured: false, goals: 2, assists: 7,
    yellowCards: 3, redCards: 0,
    monthlyPayments: { "Jan": true, "Fev": true, "Mar": true, "Abr": true, "Mai": true, "Jun": false },
    attendanceHistory: [true, true, false, true, true],
    satisfaction: "😊", comments: [], fees: [{ id: "t3", description: "Multa por atraso", amount: 10, paid: true, date: "2025-06-05" }],
  },
  {
    id: "5", name: "Bruno Almeida", nickname: "Brunão", positions: ["Goleiro"], number: 1,
    photo: "", dominantFoot: "Direito", birthDate: "1993-05-12", phone: "(11) 99999-0005",
    emergencyContact: "(11) 98888-0005", status: "Ativo", injured: false, goals: 0, assists: 0,
    yellowCards: 0, redCards: 0,
    monthlyPayments: { "Jan": true, "Fev": true, "Mar": true, "Abr": true, "Mai": true, "Jun": true },
    attendanceHistory: [true, true, true, true, true],
    satisfaction: "😍", comments: [{ id: "c3", text: "100% presença, exemplar.", date: "2025-06-15" }], fees: [],
  },
  {
    id: "6", name: "Thiago Reis", nickname: "Thi", positions: ["Atacante"], number: 11,
    photo: "", dominantFoot: "Esquerdo", birthDate: "1998-09-25", phone: "(11) 99999-0006",
    emergencyContact: "(11) 98888-0006", status: "Ativo", injured: false, goals: 10, assists: 3,
    yellowCards: 1, redCards: 0,
    monthlyPayments: { "Jan": true, "Fev": true, "Mar": true, "Abr": true, "Mai": true, "Jun": true },
    attendanceHistory: [true, false, true, true, true],
    satisfaction: "😊", comments: [], fees: [],
  },
  {
    id: "7", name: "Marcos Paulo", nickname: "MP", positions: ["Meio-campo"], number: 8,
    photo: "", dominantFoot: "Direito", birthDate: "1994-04-18", phone: "(11) 99999-0007",
    emergencyContact: "(11) 98888-0007", status: "Inativo", injured: false, goals: 3, assists: 5,
    yellowCards: 2, redCards: 0,
    monthlyPayments: { "Jan": true, "Fev": true, "Mar": true, "Abr": false, "Mai": false, "Jun": false },
    attendanceHistory: [false, false, false, false, false],
    satisfaction: "😐", comments: [{ id: "c4", text: "Inativo desde abril.", date: "2025-04-10" }], fees: [],
  },
  {
    id: "8", name: "André Santos", nickname: "Dedé", positions: ["Zagueiro", "Lateral"], number: 3,
    photo: "", dominantFoot: "Direito", birthDate: "1991-12-02", phone: "(11) 99999-0008",
    emergencyContact: "(11) 98888-0008", status: "Ativo", injured: false, goals: 2, assists: 1,
    yellowCards: 4, redCards: 1,
    monthlyPayments: { "Jan": true, "Fev": true, "Mar": true, "Abr": true, "Mai": true, "Jun": true },
    attendanceHistory: [true, true, true, false, true],
    satisfaction: "😊", comments: [], fees: [{ id: "t4", description: "Multa cartão vermelho", amount: 30, paid: true, date: "2025-05-10" }],
  },
];

export const mockFinancials: FinancialEntry[] = [
  { id: "f1", type: "entrada", category: "Mensalidade", description: "Mensalidade Jun - Diego Costa", amount: 80, date: "2025-06-01", playerId: "1" },
  { id: "f2", type: "entrada", category: "Mensalidade", description: "Mensalidade Jun - Rafael Mendes", amount: 80, date: "2025-06-01", playerId: "2" },
  { id: "f3", type: "entrada", category: "Patrocínio", description: "Patrocínio Bar do Zé", amount: 500, date: "2025-06-05" },
  { id: "f4", type: "saida", category: "Campo", description: "Aluguel campo Society - Junho", amount: 350, date: "2025-06-02" },
  { id: "f5", type: "saida", category: "Uniforme", description: "Lavagem de uniformes", amount: 120, date: "2025-06-10" },
  { id: "f6", type: "saida", category: "Torneio", description: "Inscrição Copa da Amizade", amount: 200, date: "2025-06-15" },
  { id: "f7", type: "entrada", category: "Mensalidade", description: "Mensalidade Jun - Bruno Almeida", amount: 80, date: "2025-06-03", playerId: "5" },
  { id: "f8", type: "entrada", category: "Rateio", description: "Rateio campo treino", amount: 150, date: "2025-06-08" },
];

export const mockEvents: GameEvent[] = [
  {
    id: "e1", type: "Treino", date: "2025-06-20", time: "20:00", location: "Society Campo Belo",
    attendance: { "1": "presente", "2": "presente", "3": "falta", "4": "presente", "5": "presente", "6": "presente", "8": "presente" },
    absenceReasons: { "3": "não justificável" },
  },
  {
    id: "e2", type: "Amistoso", date: "2025-06-22", time: "16:00", location: "Arena Central", opponent: "Estrela FC",
    attendance: { "1": "presente", "2": "presente", "3": "falta", "4": "presente", "5": "presente", "6": "falta_justificada", "8": "presente" },
    absenceReasons: { "3": "não justificável", "6": "trabalho" },
  },
  {
    id: "e3", type: "Torneio", date: "2025-06-29", time: "14:00", location: "Complexo Esportivo Norte", opponent: "União Bairro",
    attendance: { "1": "presente", "2": "presente", "3": "presente", "4": "falta_justificada", "5": "presente", "6": "presente", "8": "falta" },
    absenceReasons: { "4": "viagem", "8": "doença" },
  },
  {
    id: "e4", type: "Treino", date: "2025-07-03", time: "20:00", location: "Society Campo Belo",
    attendance: { "1": "falta", "2": "presente", "3": "falta", "4": "presente", "5": "presente", "6": "presente", "8": "presente" },
    absenceReasons: { "1": "estudos", "3": "doença" },
  },
  {
    id: "e5", type: "Amistoso", date: "2025-07-06", time: "10:00", location: "Estádio Municipal", opponent: "Botafogo Amadores",
    attendance: {},
  },
];

export const getAttendancePercentage = (player: Player): number => {
  const total = player.attendanceHistory.length;
  if (total === 0) return 0;
  const present = player.attendanceHistory.filter(Boolean).length;
  return Math.round((present / total) * 100);
};

export const getPendingMonths = (player: Player): number => {
  return Object.values(player.monthlyPayments).filter(v => !v).length;
};

export const getPlayerAlerts = (players: Player[]) => {
  return players.filter(p => {
    if (p.status === "Inativo") return false;
    const pending = getPendingMonths(p);
    const attendance = getAttendancePercentage(p);
    return pending >= 2 || attendance < 50;
  }).map(p => ({
    player: p,
    reasons: [
      ...(getPendingMonths(p) >= 2 ? [`${getPendingMonths(p)} mens. atrasadas`] : []),
      ...(getAttendancePercentage(p) < 50 ? [`${getAttendancePercentage(p)}% presença`] : []),
    ],
  }));
};
