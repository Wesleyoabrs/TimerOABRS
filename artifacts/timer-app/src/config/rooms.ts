export interface RoomConfig {
  id: string;
  floor: number;
  sublabel?: string; // optional room name for same-floor rooms
}

export const ROOMS: RoomConfig[] = [
  { id: "1",  floor: 2  },
  { id: "2",  floor: 3  },
  { id: "3",  floor: 4  },
  { id: "4",  floor: 5  },
  { id: "5",  floor: 6  },
  { id: "6",  floor: 7  },
  { id: "7",  floor: 8  },
  { id: "8",  floor: 9  },
  { id: "9",  floor: 10 },
  { id: "10", floor: 11 },
  { id: "11", floor: 12, sublabel: "Sala do Diretor Tesoureiro" },
  { id: "12", floor: 12, sublabel: "Sala da Secretaria-Geral Adjunta" },
  { id: "13", floor: 13 },
  { id: "14", floor: 14 },
];
