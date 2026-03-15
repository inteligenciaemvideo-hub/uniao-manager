import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// ============ PLAYERS ============
export const usePlayers = () =>
  useQuery({
    queryKey: ["players"],
    queryFn: async () => {
      const { data, error } = await supabase.from("players").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

export const usePlayer = (id: string | undefined) =>
  useQuery({
    queryKey: ["players", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase.from("players").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

export const useAddPlayer = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (player: {
      name: string; nickname: string; positions: string[]; number: number;
      photo_url?: string; dominant_foot?: string; birth_date?: string;
      phone?: string; emergency_contact?: string;
    }) => {
      const { data, error } = await supabase.from("players").insert(player).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["players"] }),
  });
};

export const useUpdatePlayer = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; [key: string]: any }) => {
      const { error } = await supabase.from("players").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["players"] }),
  });
};

// ============ MONTHLY PAYMENTS ============
export const useMonthlyPayments = (playerId?: string) =>
  useQuery({
    queryKey: ["monthly_payments", playerId],
    queryFn: async () => {
      let q = supabase.from("monthly_payments").select("*");
      if (playerId) q = q.eq("player_id", playerId);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });

export const useUpsertPayment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (p: { player_id: string; month: string; paid: boolean }) => {
      const { error } = await supabase.from("monthly_payments").upsert(p, { onConflict: "player_id,month" });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["monthly_payments"] }),
  });
};

// ============ PLAYER COMMENTS ============
export const usePlayerComments = (playerId?: string) =>
  useQuery({
    queryKey: ["player_comments", playerId],
    queryFn: async () => {
      const { data, error } = await supabase.from("player_comments").select("*")
        .eq("player_id", playerId!).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!playerId,
  });

export const useAddComment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (c: { player_id: string; text: string; date: string }) => {
      const { error } = await supabase.from("player_comments").insert(c);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["player_comments"] }),
  });
};

// ============ PLAYER FEES ============
export const usePlayerFees = (playerId?: string) =>
  useQuery({
    queryKey: ["player_fees", playerId],
    queryFn: async () => {
      const { data, error } = await supabase.from("player_fees").select("*")
        .eq("player_id", playerId!).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!playerId,
  });

export const useAddFee = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (f: { player_id: string; description: string; amount: number; paid: boolean; date: string }) => {
      const { error } = await supabase.from("player_fees").insert(f);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["player_fees"] }),
  });
};

export const useUpdateFee = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; paid?: boolean }) => {
      const { error } = await supabase.from("player_fees").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["player_fees"] }),
  });
};

// ============ EVENTS ============
export const useEvents = () =>
  useQuery({
    queryKey: ["events"],
    queryFn: async () => {
      const { data, error } = await supabase.from("events").select("*").order("date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

export const useEvent = (id: string | undefined) =>
  useQuery({
    queryKey: ["events", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase.from("events").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

export const useAddEvent = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (event: { type: string; date: string; time: string; location: string; opponent?: string; opponent_logo_url?: string }) => {
      const { data, error } = await supabase.from("events").insert(event).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["events"] }),
  });
};

export const useUpdateEvent = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; [key: string]: any }) => {
      const { error } = await supabase.from("events").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["events"] }),
  });
};

// ============ EVENT ATTENDANCE ============
export const useEventAttendance = (eventId?: string) =>
  useQuery({
    queryKey: ["event_attendance", eventId],
    queryFn: async () => {
      const { data, error } = await supabase.from("event_attendance").select("*").eq("event_id", eventId!);
      if (error) throw error;
      return data;
    },
    enabled: !!eventId,
  });

export const useSaveAttendance = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ eventId, records }: {
      eventId: string;
      records: { player_id: string; status: string; absence_reason?: string | null }[];
    }) => {
      // Delete existing and re-insert
      await supabase.from("event_attendance").delete().eq("event_id", eventId);
      if (records.length > 0) {
        const { error } = await supabase.from("event_attendance").insert(
          records.map(r => ({ event_id: eventId, ...r }))
        );
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["event_attendance"] }),
  });
};

// ============ CONVOCATIONS ============
export const useEventConvocations = (eventId?: string) =>
  useQuery({
    queryKey: ["event_convocations", eventId],
    queryFn: async () => {
      const { data, error } = await supabase.from("event_convocations").select("player_id").eq("event_id", eventId!);
      if (error) throw error;
      return data.map(d => d.player_id);
    },
    enabled: !!eventId,
  });

export const useSaveConvocations = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ eventId, playerIds }: { eventId: string; playerIds: string[] }) => {
      await supabase.from("event_convocations").delete().eq("event_id", eventId);
      if (playerIds.length > 0) {
        const { error } = await supabase.from("event_convocations").insert(
          playerIds.map(pid => ({ event_id: eventId, player_id: pid }))
        );
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["event_convocations"] }),
  });
};

// ============ SCHEDULED ABSENCES ============
export const useScheduledAbsences = (eventId?: string) =>
  useQuery({
    queryKey: ["scheduled_absences", eventId],
    queryFn: async () => {
      const { data, error } = await supabase.from("scheduled_absences").select("player_id").eq("event_id", eventId!);
      if (error) throw error;
      return data.map(d => d.player_id);
    },
    enabled: !!eventId,
  });

export const useSaveScheduledAbsences = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ eventId, playerIds }: { eventId: string; playerIds: string[] }) => {
      await supabase.from("scheduled_absences").delete().eq("event_id", eventId);
      if (playerIds.length > 0) {
        const { error } = await supabase.from("scheduled_absences").insert(
          playerIds.map(pid => ({ event_id: eventId, player_id: pid }))
        );
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["scheduled_absences"] }),
  });
};

// ============ FINANCIALS ============
export const useFinancials = () =>
  useQuery({
    queryKey: ["financials"],
    queryFn: async () => {
      const { data, error } = await supabase.from("financials").select("*").order("date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

export const useAddFinancial = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (f: { type: string; category: string; description: string; amount: number; date: string; player_id?: string }) => {
      const { error } = await supabase.from("financials").insert(f);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["financials"] }),
  });
};

// ============ TEAM SETTINGS ============
export const useTeamSettings = () =>
  useQuery({
    queryKey: ["team_settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("team_settings").select("*").limit(1).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

export const useUpdateTeamSettings = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (updates: { team_logo_url?: string | null }) => {
      // Update the first row
      const { data: existing } = await supabase.from("team_settings").select("id").limit(1).maybeSingle();
      if (existing) {
        const { error } = await supabase.from("team_settings").update(updates).eq("id", existing.id);
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["team_settings"] }),
  });
};

// ============ EVENT GUESTS ============
export const useEventGuests = (eventId?: string) =>
  useQuery({
    queryKey: ["event_guests", eventId],
    queryFn: async () => {
      const { data, error } = await supabase.from("event_guests").select("*").eq("event_id", eventId!).order("created_at");
      if (error) throw error;
      return data;
    },
    enabled: !!eventId,
  });

export const useSaveEventGuests = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ eventId, nicknames }: { eventId: string; nicknames: string[] }) => {
      await supabase.from("event_guests").delete().eq("event_id", eventId);
      if (nicknames.length > 0) {
        const { error } = await supabase.from("event_guests").insert(
          nicknames.map(nickname => ({ event_id: eventId, nickname }))
        );
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["event_guests"] }),
  });
};

// ============ MATCH EVENTS (goals/assists) ============
export const useMatchEvents = (eventId?: string) =>
  useQuery({
    queryKey: ["match_events", eventId],
    queryFn: async () => {
      const { data, error } = await supabase.from("match_events").select("*").eq("event_id", eventId!);
      if (error) throw error;
      return data;
    },
    enabled: !!eventId,
  });

export const useSaveMatchEvents = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ eventId, events }: {
      eventId: string;
      events: { player_id: string; type: string }[];
    }) => {
      // Delete existing and re-insert
      await supabase.from("match_events").delete().eq("event_id", eventId);
      if (events.length > 0) {
        const { error } = await supabase.from("match_events").insert(
          events.map(e => ({ event_id: eventId, ...e }))
        );
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["match_events"] });
      qc.invalidateQueries({ queryKey: ["players"] });
    },
  });
};

export const useRecalculatePlayerStats = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data: allEvents, error: evError } = await supabase.from("match_events").select("*");
      if (evError) throw evError;

      const stats: Record<string, { goals: number; assists: number; yellow_cards: number; red_cards: number }> = {};
      for (const e of allEvents || []) {
        if (!stats[e.player_id]) stats[e.player_id] = { goals: 0, assists: 0, yellow_cards: 0, red_cards: 0 };
        if (e.type === "goal") stats[e.player_id].goals++;
        if (e.type === "assist") stats[e.player_id].assists++;
        if (e.type === "yellow_card") stats[e.player_id].yellow_cards++;
        if (e.type === "red_card") stats[e.player_id].red_cards++;
      }

      const { data: allPlayers } = await supabase.from("players").select("id");
      for (const p of allPlayers || []) {
        const s = stats[p.id] || { goals: 0, assists: 0, yellow_cards: 0, red_cards: 0 };
        await supabase.from("players").update({
          goals: s.goals, assists: s.assists,
          yellow_cards: s.yellow_cards, red_cards: s.red_cards,
        }).eq("id", p.id);
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["players"] }),
  });
};

// ============ SPONSORS ============
export const useSponsors = () =>
  useQuery({
    queryKey: ["sponsors"],
    queryFn: async () => {
      const { data, error } = await supabase.from("team_sponsors").select("*").order("created_at");
      if (error) throw error;
      return data;
    },
  });

export const useAddSponsor = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (sponsor: { name: string; logo_url?: string | null; [key: string]: any }) => {
      const { data, error } = await supabase.from("team_sponsors").insert(sponsor as any).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sponsors"] }),
  });
};

export const useUpdateSponsor = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; [key: string]: any }) => {
      const { error } = await supabase.from("team_sponsors").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sponsors"] }),
  });
};

export const useDeleteSponsor = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("team_sponsors").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sponsors"] }),
  });
};

// ============ ALL ATTENDANCE (for stats) ============
export const useAllAttendance = () =>
  useQuery({
    queryKey: ["all_event_attendance"],
    queryFn: async () => {
      const { data, error } = await supabase.from("event_attendance").select("*");
      if (error) throw error;
      return data;
    },
  });

// ============ STORAGE ============
export const uploadPhoto = async (bucket: string, path: string, file: File) => {
  const { data, error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true });
  if (error) throw error;
  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(data.path);
  return urlData.publicUrl;
};
