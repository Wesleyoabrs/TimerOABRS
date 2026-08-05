export interface RoomConfig {
  id: string;
  floor: number;
  label: string;
}

// Sala 1 = 2° andar … Sala 13 = 14° andar
export const ROOMS: RoomConfig[] = Array.from({ length: 13 }, (_, i) => ({
  id: String(i + 1),
  floor: i + 2,
  label: `${i + 2}° andar`,
}));
