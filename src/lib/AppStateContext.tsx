import { useState, createContext, useContext, ReactNode } from "react";
import { mockPlayers as initialPlayers, mockEvents as initialEvents, Player, GameEvent } from "@/lib/mockData";

interface AppState {
  players: Player[];
  setPlayers: React.Dispatch<React.SetStateAction<Player[]>>;
  addPlayer: (player: Player) => void;
  events: GameEvent[];
  setEvents: React.Dispatch<React.SetStateAction<GameEvent[]>>;
  addEvent: (event: GameEvent) => void;
  playerPhotos: Record<string, string>;
  setPlayerPhoto: (playerId: string, url: string) => void;
  playerReceipts: Record<string, string[]>;
  addPlayerReceipt: (playerId: string, url: string) => void;
  teamLogo: string | null;
  setTeamLogo: (url: string | null) => void;
  eventConvocations: Record<string, string[]>;
  setEventConvocation: (eventId: string, playerIds: string[]) => void;
  opponentLogos: Record<string, string>;
  setOpponentLogo: (eventId: string, url: string) => void;
  scheduledAbsences: Record<string, string[]>; // eventId -> playerIds
  setScheduledAbsences: (eventId: string, playerIds: string[]) => void;
}

const AppStateContext = createContext<AppState | null>(null);

export const useAppState = () => {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error("useAppState must be inside AppStateProvider");
  return ctx;
};

export const AppStateProvider = ({ children }: { children: ReactNode }) => {
  const [players, setPlayers] = useState<Player[]>(initialPlayers);
  const [events, setEvents] = useState<GameEvent[]>(initialEvents);
  const [playerPhotos, setPlayerPhotos] = useState<Record<string, string>>({});
  const [playerReceipts, setPlayerReceipts] = useState<Record<string, string[]>>({});
  const [teamLogo, setTeamLogoState] = useState<string | null>(null);
  const [eventConvocations, setEventConvocations] = useState<Record<string, string[]>>({});
  const [opponentLogos, setOpponentLogos] = useState<Record<string, string>>({});
  const [scheduledAbsences, setScheduledAbsencesState] = useState<Record<string, string[]>>({});

  const setPlayerPhoto = (playerId: string, url: string) => {
    setPlayerPhotos(prev => ({ ...prev, [playerId]: url }));
  };

  const addPlayerReceipt = (playerId: string, url: string) => {
    setPlayerReceipts(prev => ({
      ...prev,
      [playerId]: [...(prev[playerId] || []), url],
    }));
  };

  const setTeamLogo = (url: string | null) => setTeamLogoState(url);

  const setEventConvocation = (eventId: string, playerIds: string[]) => {
    setEventConvocations(prev => ({ ...prev, [eventId]: playerIds }));
  };

  const addPlayer = (player: Player) => {
    setPlayers(prev => [...prev, player]);
  };

  const addEvent = (event: GameEvent) => {
    setEvents(prev => [...prev, event]);
  };

  const setOpponentLogo = (eventId: string, url: string) => {
    setOpponentLogos(prev => ({ ...prev, [eventId]: url }));
  };

  const setScheduledAbsences = (eventId: string, playerIds: string[]) => {
    setScheduledAbsencesState(prev => ({ ...prev, [eventId]: playerIds }));
  };

  return (
    <AppStateContext.Provider value={{
      players, setPlayers, addPlayer,
      events, setEvents, addEvent,
      playerPhotos, setPlayerPhoto,
      playerReceipts, addPlayerReceipt,
      teamLogo, setTeamLogo,
      eventConvocations, setEventConvocation,
      opponentLogos, setOpponentLogo,
      scheduledAbsences, setScheduledAbsences,
    }}>
      {children}
    </AppStateContext.Provider>
  );
};
