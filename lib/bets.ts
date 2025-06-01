export type Bets = {
    id: number
    name: string
    odd: number
    date: string
    active: number
  }
  
  export const bets: Bets[] = [
    // Categoría 1: Retro corta
    {
        id: 1,
        name: "Inter de Milan Gana la Champions",
        odd: 3.70,
        date: "2025-05-31",
        active: 1
    },
    {
        id: 2,
        name: "PSG gana la Champions",
        odd: 2.12,
        date: "2025-05-31",
        active: 1
    },
    {
        id: 3,
        name: "U. de Chile le gana a Ohhigins",
        odd: 1.55,
        date: "2025-05-31",
        active: 1
    }

  ]
  