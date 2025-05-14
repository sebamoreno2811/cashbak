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
        name: "Palestino gana a Cruzeiro",
        odd: 3.55,
        date: "2025-05-14",
        active: 1
    },
    {
        id: 2,
        name: "Colo Colo gana a Racing",
        odd: 7.3,
        date: "2025-05-14",
        active: 1
    },
    {
        id: 3,
        name: "Inter de Milan ganará la Serie A",
        odd: 3.55,
        date: "2025-05-20",
        active: 1
    },
    {
        id: 4,
        name: "Colo Colo ganará la liga de Primera",
        odd: 3,
        date: "2025-05-20",
        active: 1
    },
    {
        id: 5,
        name: "Universidad de Chile ganará la liga de Primera",
        odd: 3,
        date: "2025-05-20",
        active: 1
    },
    {
        id: 6,
        name: "Palestino ganará la liga de Primera",
        odd: 20,
        date: "2025-05-20",
        active: 1
    }

  ]
  