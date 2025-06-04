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
        name: "Chile gana a Argentina",
        odd: 5.5,
        date: "2025-06-05",
        active: 1
    },
    {
        id: 2,
        name: "Chile gana o empata contra Argentina",
        odd: 2.1,
        date: "2025-06-05",
        active: 1
    },
    {
        id: 3,
        name: "Argentina gana a Chile",
        odd: 1.7,
        date: "2025-06-05",
        active: 1
    },
    {
        id: 4,
        name: "Brasil gana a Ecuador",
        odd: 2.15,
        date: "2025-06-05",
        active: 1
    },
    {
        id: 5,
        name: "Ecuador gana a Brasil",
        odd: 3.7,
        date: "2025-06-05",
        active: 1
    },
    {
        id: 6,
        name: "Colombia gana a Peru",
        odd: 1.35,
        date: "2025-06-06",
        active: 1
    },
    {
        id: 7,
        name: "Venezuela gana a Bolivia",
        odd: 1.35,
        date: "2025-06-06",
        active: 1
    },
    {
        id: 8,
        name: "Bolivia gana o empata contra Venezuela",
        odd: 3,
        date: "2025-06-06",
        active: 1
    },
    {
        id: 9,
        name: "Paraguay gana a Uruguay",
        odd: 2.6,
        date: "2025-06-06",
        active: 1
    },
    {
        id: 10,
        name: "Uruguay gana a Paraguay",
        odd: 3.3,
        date: "2025-06-06",
        active: 1
    }

  ]
  