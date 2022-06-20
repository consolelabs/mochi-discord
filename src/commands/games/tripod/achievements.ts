import { Combo, History, PieceEnum } from "triple-pod-game-engine"

export const achievements = {
  turn: {
    "Droid Apocalypse": (combos: Array<Combo>) =>
      combos.some((c) => c.num >= 12 && c.into === PieceEnum.TOMB),
    "Droid Doom": (combos: Array<Combo>) =>
      combos.some((c) => c.num >= 6 && c.into === PieceEnum.TOMB),
    Headshot: (combos: Array<Combo>) =>
      combos.some((c) => c.num >= 6 && c.from === PieceEnum.NINJA_BEAR),
    "Ca-ching!": (combos: Array<Combo>) =>
      combos.some((c) => c.into === PieceEnum.TREASURE),
    "It's payday": (combos: Array<Combo>) =>
      combos.some((c) => c.into === PieceEnum.LARGE_TREASURE),
    "Upper Class": (combos: Array<Combo>) =>
      combos.some((c) => c.into === PieceEnum.MANSION),
    "Upper-Upper Class": (combos: Array<Combo>) =>
      combos.some((c) => c.into === PieceEnum.MANSION),
    "Royal Welcome": (combos: Array<Combo>) =>
      combos.some((c) => c.into === PieceEnum.CASTLE),
    "Kings before Dukes": (combos: Array<Combo>) =>
      combos.some((c) => c.into === PieceEnum.SUPER_CASTLE),
    "Walking on Air": (combos: Array<Combo>) =>
      combos.some((c) => c.into === PieceEnum.FLOATING_CASTLE),
    Showoff: (combos: Array<Combo>) =>
      combos.some((c) => c.into === PieceEnum.SUPER_FLOATING_CASTLE),
    Unbeatable: (combos: Array<Combo>) =>
      combos.some((c) => c.into === PieceEnum.TRIPLE_CASTLE),
  },
  session: {
    // Used a slime
    "Be water, my friend": (histories: Array<History>) =>
      histories.some(
        (c, i) =>
          c.currentBoard.flat().filter((p) => p === PieceEnum.CRYSTAL)
            .length ===
          histories[i + 1]?.currentBoard
            .flat()
            .filter((p) => p === PieceEnum.CRYSTAL).length +
            1
      ),
    "No stones unturned": (histories: Array<History>) =>
      histories.some((h) => h.currentBoard.flat().includes(PieceEnum.ROCK)) &&
      !histories[histories.length - 1].currentBoard
        .flat()
        .includes(PieceEnum.ROCK),
  },
  game: {
    Matchguru: (stats: any) => stats.matchCount >= 1234,
  },
}
