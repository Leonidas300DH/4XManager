export interface Technology {
    name: string;
    level: number;
    cost: number;
    description: string;
    title?: string;
}

export const TECHNOLOGIES: Technology[] = [
    // Ship Size
    { name: "Ship Size", level: 1, cost: 0, description: "Can build Scout (SC), Colony Ship (CO), Shipyard (SY), Miner, Decoy, MS Pipeline." },
    { name: "Ship Size", level: 2, cost: 10, description: "Can build Destroyer (DD), Base, Defense Satellite Network (DSN)." },
    { name: "Ship Size", level: 3, cost: 15, description: "Can build Cruiser (CA)." },
    { name: "Ship Size", level: 4, cost: 20, description: "Can build Battlecruiser (BC)." },
    { name: "Ship Size", level: 5, cost: 20, description: "Can build Battleship (BB)." },
    { name: "Ship Size", level: 6, cost: 20, description: "Can build Dreadnought (DN)." },
    { name: "Ship Size", level: 7, cost: 32, description: "Can build Titan (TN)." },

    // Attack
    { name: "Attack", level: 0, cost: 0, description: "Add 0 to a ship's attack rating when in battle." },
    { name: "Attack", level: 1, cost: 20, description: "Add 1 to a ship's attack rating when in battle.", title: "Enhanced Targeting" },
    { name: "Attack", level: 2, cost: 30, description: "Add 2 to a ship's attack rating when in battle (limited by ship's Hull Size).", title: "Rapid-Fire Laser Emitters" },
    { name: "Attack", level: 3, cost: 25, description: "Add 3 to a ship's attack rating when in battle (limited by ship's Hull Size).", title: "Hypervelocity Missile Salvos" },
    { name: "Attack", level: 4, cost: 25, description: "Add 4 to attack rating. Requires Advanced Construction 1 and Attack 3. Only for Titans (TN) and Starbases.", title: "Apocalypse-Class Artillery" },

    // Defense
    { name: "Defense", level: 0, cost: 0, description: "Add 0 to a ship's defense rating when in battle." },
    { name: "Defense", level: 1, cost: 20, description: "Add 1 to a ship's defense rating when in battle.", title: "Reinforced Plating" },
    { name: "Defense", level: 2, cost: 30, description: "Add 2 to a ship's defense rating when in battle (limited by ship's Hull Size).", title: "Projected Force Shields" },
    { name: "Defense", level: 3, cost: 25, description: "Add 3 to a ship's defense rating when in battle (limited by ship's Hull Size).", title: "Integrated Countermeasure Grid" },

    // Tactics
    { name: "Tactics", level: 0, cost: 0, description: "When opposing ships have the same Weapon Class (E, D, C, etc.), the side with the higher Tactics fires first. If tied, defender fires first." },
    { name: "Tactics", level: 1, cost: 15, description: "Higher tactical rating fires first. Not limited by Hull Size.", title: "Coordinated Engagement" },
    { name: "Tactics", level: 2, cost: 15, description: "Higher tactical rating fires first. Not limited by Hull Size.", title: "Battlefield Control Doctrine" },
    { name: "Tactics", level: 3, cost: 15, description: "Higher tactical rating fires first. Not limited by Hull Size.", title: "Operational Singularity" },

    // Movement
    { name: "Movement", level: 1, cost: 0, description: "Can move 1 hex per turn.", title: "Impulse Thrusters" },
    { name: "Movement", level: 2, cost: 20, description: "Turn 1: 1 hex, Turn 2: 1 hex, Turn 3: 2 hexes.", title: "Vector-Control Engines" },
    { name: "Movement", level: 3, cost: 25, description: "Turn 1: 1 hex, Turn 2: 2 hexes, Turn 3: 2 hexes.", title: "High-Efficiency Drive Systems" },
    { name: "Movement", level: 4, cost: 25, description: "Can move 2 hexes per turn.", title: "Advanced Injection Systems" },
    { name: "Movement", level: 5, cost: 25, description: "Turn 1: 2 hexes, Turn 2: 2 hexes, Turn 3: 3 hexes.", title: "Dynamic Mass Redistribution" },
    { name: "Movement", level: 6, cost: 20, description: "Turn 1: 2 hexes, Turn 2: 3 hexes, Turn 3: 3 hexes.", title: "Structural Acceleration Compensation" },
    { name: "Movement", level: 7, cost: 20, description: "Can move 3 hexes per turn.", title: "Zero-Loss Propulsion Cycle" },

    // Terraforming
    { name: "Terraforming", level: 0, cost: 0, description: "Can only colonize non-barren planets." },
    { name: "Terraforming", level: 1, cost: 20, description: "Colony Ships (CO) may colonize any unoccupied planet including Barren planets." },

    // Exploration
    { name: "Exploration", level: 0, cost: 0, description: "Exploration as normal (must enter hex to reveal System marker)." },
    { name: "Exploration", level: 1, cost: 15, description: "Cruisers (CA) and Flagships can peek at one adjacent face-down System marker before moving, without triggering negative effects." },
    { name: "Exploration", level: 2, cost: 15, description: "(Optional Rule - Reaction Movement) Ships with Exploration 2 can be watchdogs that trigger Reaction Movement." },

    // Shipyard
    { name: "Shipyard", level: 1, cost: 0, description: "Each Shipyard (SY) can build 1 Hull Point of ships per Economic Phase." },
    { name: "Shipyard", level: 2, cost: 20, description: "Each Shipyard (SY) can build 1.5 Hull Points per Economic Phase (rounded down)." },
    { name: "Shipyard", level: 3, cost: 25, description: "Each Shipyard (SY) can build 2 Hull Points per Economic Phase." },

    // Fighter
    { name: "Fighter", level: 0, cost: 0, description: "Cannot build Carriers (CV) or Fighters (F)." },
    { name: "Fighter", level: 1, cost: 25, description: "Can build Carriers (CV) and Fighter (F) 1 squadrons (B5-0-x1).", title: "Interceptor Class" },
    { name: "Fighter", level: 2, cost: 25, description: "Can build and upgrade to Fighter (F) 2 (B6-0-x1). +1 Defense vs Point Defense.", title: "Striker Class" },
    { name: "Fighter", level: 3, cost: 25, description: "Can build and upgrade to Fighter (F) 3 (B7-1-x1). +1 Defense vs Point Defense.", title: "Vanguard Class" },
    { name: "Fighter", level: 4, cost: 25, description: "Requires Advanced Construction 2. Fighter (F) 4 squadrons (B8-2-x1). Can be built on Battle Carriers (BV).", title: "Dominance Class" },

    // Point Defense
    { name: "Point Defense", level: 0, cost: 0, description: "Scouts (SC) fire at Fighters (F) at E3 (normal attack)." },
    { name: "Point Defense", level: 1, cost: 20, description: "Scouts (SC) fire at Fighters (F) at A6 instead of E3." },
    { name: "Point Defense", level: 2, cost: 20, description: "Scouts (SC) fire at Fighters (F) at A7." },
    { name: "Point Defense", level: 3, cost: 20, description: "Scouts (SC) fire at Fighters (F) at A8." },

    // Cloaking
    { name: "Cloaking", level: 0, cost: 0, description: "Cannot build Raiders (R)." },
    { name: "Cloaking", level: 1, cost: 30, description: "Can build Raiders (R). Raiders (R) are cloaked vs enemies without Scanners. Cloaked Raiders (R): A-Class, +1 Attack first round, can move through enemies." },
    { name: "Cloaking", level: 2, cost: 30, description: "Raiders (R) increase in strength (A5/D5 instead of A4/D4) and require Scanner 2 to detect." },

    // Scanner
    { name: "Scanner", level: 0, cost: 0, description: "Cannot detect cloaked Raiders (R)." },
    { name: "Scanner", level: 1, cost: 20, description: "Destroyers (DD) can detect Raiders (R) with Cloaking 1. Detected Raiders (R) become D-Class." },
    { name: "Scanner", level: 2, cost: 20, description: "Destroyers (DD) can detect Raiders (R) with Cloaking 2." },

    // Mines
    { name: "Mines", level: 0, cost: 0, description: "Cannot build Mines." },
    { name: "Mines", level: 1, cost: 30, description: "Can build Mines. After mine sweeping, each Mine destroys one ship of your choice and is removed." },

    // Mine Sweep
    { name: "Mine Sweep", level: 0, cost: 0, description: "Cannot build Mine Sweepers (SW)." },
    { name: "Mine Sweep", level: 1, cost: 10, description: "Can build Mine Sweepers (SW). Each Mine Sweeper (SW) removes 1 Mine before combat." },
    { name: "Mine Sweep", level: 2, cost: 15, description: "Each Mine Sweeper (SW) removes 2 Mines before combat." },

    // Ground Combat
    { name: "Ground Combat", level: 1, cost: 0, description: "Can build Transports (T) and Infantry." },
    { name: "Ground Combat", level: 2, cost: 20, description: "Can build Space Marines and Heavy Infantry." },
    { name: "Ground Combat", level: 3, cost: 25, description: "Transports (T) upgraded to Armored (Defense 2) with Drop Ships (ground units can attack first round). Can build Grav Armor." },

    // Boarding
    { name: "Boarding", level: 0, cost: 0, description: "Cannot build Boarding Ships (BD)." },
    { name: "Boarding", level: 1, cost: 20, description: "Can build Boarding Ships (BD). Can capture enemy ships by rolling <= Attack Strength - Hull Size." },
    { name: "Boarding", level: 2, cost: 25, description: "Boarding Ships (BD) attack at strength 6 instead of 5." },

    // Security Forces
    { name: "Security Forces", level: 0, cost: 0, description: "No protection vs Boarding attacks." },
    { name: "Security Forces", level: 1, cost: 15, description: "All ships get +1 Hull Size vs Boarding attacks. Upgrades instantly to all ships." },
    { name: "Security Forces", level: 2, cost: 15, description: "All ships get +2 Hull Size vs Boarding attacks. Upgrades instantly to all ships." },

    // Military Academy
    { name: "Military Academy", level: 0, cost: 0, description: "All new ships start as Green (experience system). Not revealed in space combat." },
    { name: "Military Academy", level: 1, cost: 15, description: "All new ships start as Skilled instead of Green. Not revealed in space combat." },
    { name: "Military Academy", level: 2, cost: 20, description: "New ships start as Skilled. -1 modifier to Experience rolls (easier promotion)." },

    // Fast
    { name: "Fast", level: 0, cost: 0, description: "No Fast technology available." },
    { name: "Fast", level: 1, cost: 10, description: "Battlecruisers (BC), Flagships, and Unique Ships can move +1 hex on Turn 1 only." },
    { name: "Fast", level: 2, cost: 10, description: "Requires Advanced Construction 1. Destroyer X (DDX), Battle Carriers (BV), and Raider X (RX) can be equipped with Fast." },

    // Missile Boats
    { name: "Missile Boats", level: 0, cost: 0, description: "Cannot build Missile Boats (MB). (Alternate Empires only)" },
    { name: "Missile Boats", level: 1, cost: 20, description: "Can build Missile Boats (MB). Missile Boats (MB) fire as A-Class and launch Missiles. Can mount Attack 3 despite hull size, limited to Defense 1." },
    { name: "Missile Boats", level: 2, cost: 15, description: "Improved Missile Boats (MB)." },

    // Jammer
    { name: "Jammer", level: 0, cost: 0, description: "No Jammer technology. Cannot reduce enemy Missile attack." },
    { name: "Jammer", level: 1, cost: 15, description: "Cruisers (CA) with Jammer: reduce all enemy Missile Attack Strength by 2." },
    { name: "Jammer", level: 2, cost: 15, description: "With at least 2 Cruisers (CA) with Jammer 2: reduce all enemy Missile Attack to 0. Single Cruiser (CA) with Jammer 2 only gets Jammer 1 benefit." },

    // Advanced Construction
    { name: "Advanced Construction", level: 0, cost: 0, description: "Cannot be researched until you have built a Ship Size 4+ ship (Battlecruiser (BC), Battleship (BB), etc.)." },
    { name: "Advanced Construction", level: 1, cost: 10, description: "Build Destroyer X (DDX), Advanced Bases. Can research: Tractor Beams for Battleships (BB), Shield Projectors for Dreadnoughts (DN), Attack 4 for Titans (TN)/Starbases." },
    { name: "Advanced Construction", level: 2, cost: 10, description: "Can build Starbases (upgrade from Base for 12 CP), Cyber Armor, Battle Carriers (BV), Fighter (F) 4, Miner X." },
    { name: "Advanced Construction", level: 3, cost: 10, description: "Can build Raider X (RX), Scout X (SCX), and upgrade Flagship to Advanced Flagship." },

    // Tractor Beam
    { name: "Tractor Beam", level: 0, cost: 0, description: "Not available. Requires Advanced Construction 1." },
    { name: "Tractor Beam", level: 1, cost: 10, description: "Battleships (BB) can mount. One enemy ship per combat round cannot retreat." },

    // Shield Projector
    { name: "Shield Projector", level: 0, cost: 0, description: "Not available. Requires Advanced Construction 1." },
    { name: "Shield Projector", level: 1, cost: 10, description: "Dreadnoughts (DN) can mount. Protects one friendly ship from 1 hit each round. Cannot protect ships that also have Shield Projectors." },
];

export const TECH_GROUPS = Array.from(new Set(TECHNOLOGIES.map(t => t.name)));
