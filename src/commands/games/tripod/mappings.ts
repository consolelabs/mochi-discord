import { PieceEnum } from "triple-pod-game-engine"

export const mappings: Record<
  PieceEnum,
  { name: string; noHighlight?: boolean; emojiName: string; image: string }
> = {
  [PieceEnum.EMPTY]: {
    name: "Empty",
    image: "empty.png",
    emojiName: "blank",
  },
  [PieceEnum.GRASS]: {
    name: "Glitteroot Bud",
    image: "glitteroot-bud.png",
    emojiName: "glitteroot_bud",
  },
  [PieceEnum.BUSH]: {
    name: "Glitteroot Shrub",
    image: "glitteroot-shrub.png",
    emojiName: "glitteroot_shrub",
  },
  [PieceEnum.SUPER_BUSH]: {
    name: "Glitteroot Shrub Enhanced",
    image: "glitteroot-shrub-enhanced.png",
    emojiName: "glitteroot_shrub_enhanced",
  },
  [PieceEnum.TREE]: {
    name: "Glitteroot",
    image: "glitteroot.png",
    emojiName: "glitteroot",
  },
  [PieceEnum.SUPER_TREE]: {
    name: "Glitteroot Enhanced",
    image: "glitteroot-enhanced.png",
    emojiName: "glitteroot_enhanced",
  },
  [PieceEnum.HUT]: {
    name: "Pod",
    image: "pod.png",
    emojiName: "pod",
  },
  [PieceEnum.SUPER_HUT]: {
    name: "Pod Enhanced",
    image: "pod-enhanced.png",
    emojiName: "pod_enhanced",
  },
  [PieceEnum.HOUSE]: {
    name: "Shelter",
    image: "shelter.png",
    emojiName: "shelter",
  },
  [PieceEnum.SUPER_HOUSE]: {
    name: "Shelter Enhanced",
    image: "shelter-enhanced.png",
    emojiName: "shelter_enhanced",
  },
  [PieceEnum.MANSION]: {
    name: "Condo",
    image: "condo.png",
    emojiName: "condo",
  },
  [PieceEnum.SUPER_MANSION]: {
    name: "Condo Enhanced",
    image: "condo-enhanced.png",
    emojiName: "condo_enhanced",
  },
  [PieceEnum.CASTLE]: {
    name: "Apartment",
    image: "apartment.png",
    emojiName: "apartment",
  },
  [PieceEnum.SUPER_CASTLE]: {
    name: "Apartment Enhanced",
    image: "apartment-enhanced.png",
    emojiName: "apartment_enhanced",
  },
  [PieceEnum.FLOATING_CASTLE]: {
    name: "Soaring Tower",
    image: "soaring-tower.png",
    emojiName: "soaring_tower",
  },
  [PieceEnum.SUPER_FLOATING_CASTLE]: {
    name: "Soaring Tower Enhanced",
    image: "soaring-tower-enhanced.png",
    emojiName: "soaring_tower_enhanced",
  },
  [PieceEnum.TRIPLE_CASTLE]: {
    name: "Galaxy Fortress",
    image: "galaxy-fortress.png",
    emojiName: "galaxy_fortress",
  },
  [PieceEnum.BEAR]: {
    name: "Droid",
    image: "droid.png",
    emojiName: "droid",
  },
  [PieceEnum.NINJA_BEAR]: {
    name: "Rocket Droid",
    image: "rocket-droid.png",
    emojiName: "rocket_droid",
  },
  [PieceEnum.TOMB]: {
    name: "Scarlet Shard",
    image: "scarlet-shard.png",
    emojiName: "scarlet_shard",
  },
  [PieceEnum.CHURCH]: {
    name: "Energy Stone",
    image: "energy-stone.png",
    emojiName: "energy_stone",
  },
  [PieceEnum.CATHEDRAL]: {
    name: "Energy Reactor",
    image: "energy-reactor.png",
    emojiName: "energy_reactor",
  },
  [PieceEnum.CRYSTAL]: {
    name: "Mimic Slime",
    image: "mimic-slime.png",
    emojiName: "mimic_slime",
  },
  [PieceEnum.ROCK]: {
    name: "Marble Piece",
    image: "marble-piece.png",
    emojiName: "marble_piece",
  },
  [PieceEnum.MOUNTAIN]: {
    name: "Marble Chunk",
    image: "marble-chunk.png",
    emojiName: "marble_chunk",
  },
  [PieceEnum.TREASURE]: {
    name: "Loot Chest",
    image: "loot-chest.png",
    emojiName: "loot_chest",
  },
  [PieceEnum.LARGE_TREASURE]: {
    name: "Cybercore Crate",
    image: "cybercore-crate.png",
    emojiName: "cybercore_crate",
  },
  [PieceEnum.ROBOT]: {
    name: "Unstable Bomb",
    image: "unstable-bomb.png",
    emojiName: "unstable_bomb",
  },
  [PieceEnum.AIRDROPPER]: {
    name: "Airdropper",
    image: "airdropper.png",
    noHighlight: true,
    emojiName: "airdropper",
  },
  [PieceEnum.REROLL_BOX]: {
    name: "Reroll Box",
    image: "reroll-box.png",
    noHighlight: true,
    emojiName: "reroll_box",
  },
  [PieceEnum.TELEPORT_PORTAL]: {
    name: "Teleport Portal",
    image: "teleport-portal.png",
    noHighlight: true,
    emojiName: "teleport_portal",
  },
  [PieceEnum.TERRAFORMER]: {
    name: "Terraformer",
    image: "terraformer.png",
    noHighlight: true,
    emojiName: "terraformer",
  },
  [PieceEnum.MEGA_BOMB]: {
    name: "Mega Bomb",
    image: "mega-bomb.png",
    noHighlight: true,
    emojiName: "mega_bomb",
  },
  [PieceEnum.BOMB]: {
    name: "Mini Bomb",
    image: "mini-bomb.png",
    noHighlight: true,
    emojiName: "mini_bomb",
  },
}
