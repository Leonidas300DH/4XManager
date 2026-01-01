export interface ShipDefinition {
    type: string;
    acronym: string;
    hullSize: number;
    shipSize: string | number;
    baseClass: string;
    baseAttack: string | number;
    baseDefense: string | number;
    tactics: string | number;
    move: number;
    specialTech: string;
    notes: string;
    maxCount: number;
    groups: number[];
    maxAttack?: number;
    maxDefense?: number;
    moveType?: 'normal' | 'fixed-1' | 'none';
    category?: 'Spaceship' | 'Construction' | 'Ground Unit';
    cost?: number;
}

export const SHIP_DEFINITIONS: ShipDefinition[] = [
    // Spaceships
    {
        type: "Scout", acronym: "SC", hullSize: 1, shipSize: 1, baseClass: "E", baseAttack: 3, baseDefense: 0, tactics: 3, move: 1,
        specialTech: "May have increased firepower versus fighters depending on level of Point Defense technology - A6 at Point Defense 1, A7 at Point Defense 2, A8 at Point Defense 3.", notes: "", maxCount: 6, groups: [1, 2, 3, 4, 5, 6], category: 'Spaceship',
        cost: 6
    },
    {
        type: "Scout X", acronym: "SCX", hullSize: 1, shipSize: 1, baseClass: "E", baseAttack: 2, baseDefense: 0, tactics: 3, move: 1,
        specialTech: "Same as Scout. Movement technology +3 levels (maximum 7). Only 1 group (#7).", notes: "Requires AC3", maxCount: 1, groups: [7],
        maxAttack: 2, maxDefense: 2, category: 'Spaceship',
        cost: 6
    },
    {
        type: "Destroyer", acronym: "DD", hullSize: 1, shipSize: 2, baseClass: "D", baseAttack: 4, baseDefense: 0, tactics: 3, move: 1,
        specialTech: "Can detect cloaked ships (raiders) depending on level of Scanner technology.", notes: "", maxCount: 6, groups: [1, 2, 3, 4, 5, 6], category: 'Spaceship',
        cost: 9
    },
    {
        type: "Destroyer X", acronym: "DDX", hullSize: 1, shipSize: 2, baseClass: "D", baseAttack: 4, baseDefense: 0, tactics: 3, move: 1,
        specialTech: "Same as Destroyer. Can mount Attack/Defense technology +1 above Hull Size. Heavy Warheads: always scores a hit on a roll of 1 or 2 (1 only against Titans). Can be equipped with Fast 2.", notes: "Requires AC1", maxCount: 6, groups: [1, 2, 3, 4, 5, 6],
        maxAttack: 2, maxDefense: 2, category: 'Spaceship',
        cost: 9
    },
    {
        type: "Cruiser", acronym: "CA", hullSize: 2, shipSize: 3, baseClass: "C", baseAttack: 4, baseDefense: 1, tactics: 3, move: 1,
        specialTech: "Can be equipped with Exploration Technology. Can be equipped with Jammer (reduces enemy Missile attacks).", notes: "", maxCount: 6, groups: [1, 2, 3, 4, 5, 6], category: 'Spaceship',
        cost: 12
    },
    {
        type: "Battlecruiser", acronym: "BC", hullSize: 2, shipSize: 4, baseClass: "B", baseAttack: 5, baseDefense: 1, tactics: 4, move: 1,
        specialTech: "Can be equipped with Fast 1 technology (+1 hex on turn 1 only).", notes: "", maxCount: 6, groups: [1, 2, 3, 4, 5, 6], category: 'Spaceship',
        cost: 15
    },
    {
        type: "Battleship", acronym: "BB", hullSize: 3, shipSize: 5, baseClass: "A", baseAttack: 5, baseDefense: 2, tactics: 5, move: 1,
        specialTech: "Can be equipped with Tractor Beam. Tractor Beam: select one enemy ship at start of each combat round - that ship may not retreat.", notes: "", maxCount: 6, groups: [1, 2, 3, 4, 5, 6], category: 'Spaceship',
        cost: 20
    },
    {
        type: "Dreadnought", acronym: "DN", hullSize: 3, shipSize: 6, baseClass: "A", baseAttack: 6, baseDefense: 3, tactics: 6, move: 1,
        specialTech: "Can be equipped with Shield Projector. Shield Projector: protect one friendly ship - that ship may not be targeted until the Dreadnought is destroyed. Cannot protect Titans or ships with Shield Projector.", notes: "", maxCount: 4, groups: [1, 2, 3, 4], category: 'Spaceship',
        cost: 24
    },
    {
        type: "Titan", acronym: "TN", hullSize: 5, shipSize: 7, baseClass: "A", baseAttack: 8, baseDefense: 3, tactics: "-", move: 1,
        specialTech: "Does 2 damage per hit. Can carry up to 3 fighter squadrons.", notes: "Cannot be screened/boarded/retreat", maxCount: 5, groups: [1, 2, 3, 4, 5],
        maxAttack: 4, maxDefense: 3, category: 'Spaceship',
        cost: 32
    },
    {
        type: "Raider", acronym: "R", hullSize: 2, shipSize: "-", baseClass: "A/D", baseAttack: "4/5", baseDefense: 0, tactics: 3, move: 1,
        specialTech: "Attacks at Class D when detected by Scanner, Class A when undetected. +1 to attack rating the first round of combat when attacking ships without appropriate Scanner technology. Raiders get no benefits from their Cloaking technology while in nebulae.", notes: "", maxCount: 6, groups: [1, 2, 3, 4, 5, 6], category: 'Spaceship',
        cost: 12
    },
    {
        type: "Raider X", acronym: "RX", hullSize: 2, shipSize: "-", baseClass: "A/D", baseAttack: "4/5", baseDefense: 0, tactics: 3, move: 1,
        specialTech: "Same as Raider. Can carry 1 Ground Unit. Can be equipped with Fast 2.", notes: "Requires AC3", maxCount: 6, groups: [1, 2, 3, 4, 5, 6], category: 'Spaceship',
        cost: 12
    },
    {
        type: "Carrier", acronym: "CV", hullSize: 1, shipSize: "-", baseClass: "E", baseAttack: 3, baseDefense: 1, tactics: 5, move: 1,
        specialTech: "Can carry up to 3 fighter squadrons. Can not be targeted until all friendly fighters present in the battle are destroyed.", notes: "", maxCount: 6, groups: [1, 2, 3, 4, 5, 6], category: 'Spaceship',
        cost: 12
    },
    {
        type: "Battle Carrier", acronym: "BV", hullSize: 3, shipSize: "-", baseClass: "B", baseAttack: 5, baseDefense: 3, tactics: 5, move: 1,
        specialTech: "Can carry up to 6 fighter squadrons. Anti-Sensor Hull: immune to Mines. Can be equipped with Exploration 2 and Fast 2. Can not be targeted until all friendly fighters present in the battle are destroyed.", notes: "", maxCount: 6, groups: [1, 2, 3, 4, 5, 6],
        maxAttack: 3, maxDefense: 3, category: 'Spaceship',
        cost: 20
    },
    {
        type: "Fighter", acronym: "F", hullSize: 1, shipSize: "-", baseClass: "B", baseAttack: 5, baseDefense: 0, tactics: "-", move: 0,
        specialTech: "Carried by Carrier, Battle Carrier, or Titan. Fighter 1: B5-0, Fighter 2: B6-0, Fighter 3: B7-1, Fighter 4: B8-2.", notes: "", maxCount: 6, groups: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
        moveType: 'none', maxAttack: 0, maxDefense: 0, category: 'Spaceship',
        cost: 5
    },
    {
        type: "Transport", acronym: "T", hullSize: 2, shipSize: 1, baseClass: "-", baseAttack: 0, baseDefense: 0, tactics: 5, move: 1,
        specialTech: "Can carry up to 6 Ground Units (slots used = Hull Size). Can also carry Fighters. Cannot explore. Cannot be boarded with Ground Units on board. Maintenance = 0.", notes: "", maxCount: 6, groups: [1, 2, 3, 4, 5, 6],
        maxAttack: 0, maxDefense: 0, category: 'Spaceship',
        cost: 6
    },
    {
        type: "Boarding Ship", acronym: "BD", hullSize: 2, shipSize: "-", baseClass: "F", baseAttack: 5, baseDefense: 0, tactics: 4, move: 1,
        specialTech: "Can capture enemy ships instead of destroying them. Attack strength = 5 (Boarding 1) or 6 (Boarding 2) minus target Hull Size minus Security Forces.", notes: "", maxCount: 6, groups: [1, 2, 3, 4, 5, 6], category: 'Spaceship',
        cost: 9
    },
    {
        type: "Mine Sweeper", acronym: "SW", hullSize: 1, shipSize: "-", baseClass: "-", baseAttack: 0, baseDefense: 1, tactics: 6, move: 1,
        specialTech: "Removes some mines before combat. Mine Sweeper 1: removes 1 mine. Mine Sweeper 2: removes 2 mines.", notes: "", maxCount: 6, groups: [1, 2, 3, 4, 5, 6],
        maxAttack: 0, maxDefense: 0, category: 'Spaceship',
        cost: 6
    },
    {
        type: "Missile Boat", acronym: "MB", hullSize: 1, shipSize: "-", baseClass: "A", baseAttack: 4, baseDefense: 3, tactics: 4, move: 1,
        specialTech: "MB 1+ (Alt. Empire)", notes: "", maxCount: 6, groups: [1, 2, 3, 4, 5, 6],
        maxAttack: 3, maxDefense: 1, category: 'Spaceship',
        cost: 6
    },
    {
        type: "Colony Ship", acronym: "CO", hullSize: 1, shipSize: 1, baseClass: "-", baseAttack: 0, baseDefense: 0, tactics: "-", move: 0,
        specialTech: "Can colonize planets. Always has a movement tech of 1. Is destroyed instantly during movement or combat if there are enemy combat ships present and there are no friendly combat ships. Can not retreat. Maintenance = 0.", notes: "", maxCount: 1, groups: [1, 2, 3, 4, 5, 6, 7, 8],
        maxAttack: 0, maxDefense: 0, moveType: 'fixed-1', category: 'Spaceship',
        cost: 8
    },
    {
        type: "Mining Ship", acronym: "Miner", hullSize: 1, shipSize: 1, baseClass: "-", baseAttack: 0, baseDefense: 0, tactics: "-", move: 0,
        specialTech: "Can pick up minerals and Space Wrecks. Always has a movement tech of 1. Is destroyed instantly during movement or combat if there are enemy combat ships present and there are no friendly combat ships. Can not retreat. Maintenance = 0.", notes: "", maxCount: 1, groups: [1, 2, 3, 4],
        maxAttack: 0, maxDefense: 0, moveType: 'fixed-1', category: 'Spaceship',
        cost: 5
    },
    {
        type: "Miner X", acronym: "MinerX", hullSize: 1, shipSize: "-", baseClass: "-", baseAttack: 0, baseDefense: 0, tactics: "-", move: 0,
        specialTech: "Can pick up minerals and Space Wrecks. Normal movement (not limited to Movement 1). Maintenance = 0.", notes: "", maxCount: 4, groups: [1, 2, 3, 4],
        maxAttack: 0, maxDefense: 0, category: 'Spaceship',
        cost: 5
    },
    {
        type: "Mine", acronym: "Mine", hullSize: 1, shipSize: "-", baseClass: "-", baseAttack: 0, baseDefense: 0, tactics: "-", move: 0,
        specialTech: "After mines have been swept, each mine destroys one ship of the mine player's choice and is itself removed. Never carries any additional technology. Always has a movement rate of 1. Can not attack. Maintenance = 0.", notes: "", maxCount: 6, groups: [1, 2, 3, 4, 5, 6],
        maxAttack: 0, maxDefense: 0, moveType: 'fixed-1', category: 'Spaceship',
        cost: 5
    },
    {
        type: "Decoy", acronym: "Decoy", hullSize: 0, shipSize: "-", baseClass: "-", baseAttack: 0, baseDefense: 0, tactics: "-", move: 0,
        specialTech: "Automatically removed in combat. Purchased during the economic phase at friendly colony.", notes: "", maxCount: 6, groups: [1, 2, 3, 4, 5, 6],
        maxAttack: 0, maxDefense: 0, category: 'Spaceship',
        cost: 1
    },
    {
        type: "MS Pipeline", acronym: "MS", hullSize: 1, shipSize: "-", baseClass: "-", baseAttack: 0, baseDefense: 0, tactics: "-", move: 0,
        specialTech: "Always has a movement tech of 1. Can give a Construction Point bonus from trade and a movement bonus to ships. Is destroyed instantly during movement or combat if there are enemy combat ships present and there are no friendly combat ships. Can not retreat. Maintenance = 0.", notes: "", maxCount: 6, groups: [1, 2, 3, 4, 5, 6],
        maxAttack: 0, maxDefense: 0, moveType: 'fixed-1', category: 'Spaceship',
        cost: 3
    },

    // Constructions
    {
        type: "Shipyard", acronym: "SY", hullSize: 1, shipSize: 1, baseClass: "C", baseAttack: 3, baseDefense: 1, tactics: "-", move: 1,
        specialTech: "Allows ships to be built. May only be built at a colony that produced income. Only one may be built at any one colony per economic phase. Automatically upgraded to the highest technology for free (limited by hull size). Maintenance = 0.", notes: "", maxCount: 6, groups: [1, 2, 3, 4, 5, 6],
        moveType: 'none', category: 'Construction',
        cost: 6
    },
    {
        type: "Base", acronym: "Base", hullSize: 3, shipSize: 2, baseClass: "A", baseAttack: 7, baseDefense: 3, tactics: "-", move: 3,
        specialTech: "Cannot move. Only one Base can be in any system. Is not built by Ship Yards – a producing colony can build one base/turn. Automatically upgraded to the highest technology for free. Maintenance = 0.", notes: "", maxCount: 4, groups: [1, 2, 3, 4],
        moveType: 'none', category: 'Construction',
        cost: 12
    },
    {
        type: "Starbase", acronym: "SB", hullSize: 4, shipSize: "-", baseClass: "A", baseAttack: 7, baseDefense: 4, tactics: "-", move: 3,
        specialTech: "Upgrade from Base. Has 2 attacks per round. Automatically upgraded to the highest technology for free. Maintenance = 0.", notes: "", maxCount: 4, groups: [1, 2, 3, 4],
        maxAttack: 4, moveType: 'none', category: 'Construction',
        cost: 12
    },
    {
        type: "Defense Satellite Network", acronym: "DSN", hullSize: 2, shipSize: 2, baseClass: "B", baseAttack: 4, baseDefense: 2, tactics: "-", move: 2,
        specialTech: "Cannot retreat. Cannot gain Experience. Maintenance = 0.", notes: "", maxCount: 4, groups: [1, 2, 3, 4],
        moveType: 'none', category: 'Construction',
        cost: 6
    },

    // Ground Units
    {
        type: "Infantry", acronym: "Inf", hullSize: 1, shipSize: "-", baseClass: "D", baseAttack: 5, baseDefense: 1, tactics: "-", move: 0,
        specialTech: "Maintenance = 0. Free: 1 per 3 unblockaded colonies worth 5 points each Economic Phase.", notes: "At Start", maxCount: 10, groups: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
        moveType: 'none', maxAttack: 0, maxDefense: 0, category: 'Ground Unit',
        cost: 1
    },
    {
        type: "Heavy Infantry", acronym: "HI", hullSize: 2, shipSize: "-", baseClass: "D/C", baseAttack: "4/6", baseDefense: 2, tactics: "-", move: 0,
        specialTech: "Maintenance = 0. Class D Attack 4 when attacking. Class C Attack 6 when defending. Free unit option: with Ground Combat 2, can be Heavy Infantry OR Marines.", notes: "Ground Combat 2", maxCount: 10, groups: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
        moveType: 'none', maxAttack: 0, maxDefense: 0, category: 'Ground Unit',
        cost: 2
    },
    {
        type: "Marines", acronym: "Mar", hullSize: 2, shipSize: "-", baseClass: "C/D", baseAttack: "6/5", baseDefense: 1, tactics: "-", move: 0,
        specialTech: "Maintenance = 0. Class C Attack 6 when attacking. Class D Attack 5 when defending. Free unit option: with Ground Combat 2, can be Heavy Infantry OR Marines.", notes: "Ground Combat 2", maxCount: 10, groups: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
        moveType: 'none', maxAttack: 0, maxDefense: 0, category: 'Ground Unit',
        cost: 2
    },
    {
        type: "Grav Armor", acronym: "Grav", hullSize: 2, shipSize: "-", baseClass: "C", baseAttack: 6, baseDefense: 2, tactics: "-", move: 0,
        specialTech: "Maintenance = 0. Support: player with more Grav Armor can support Class D non-Grav units. Difference = units supported. Supported units get +1 Attack & +1 Defense.", notes: "Ground Combat 3", maxCount: 10, groups: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
        moveType: 'none', maxAttack: 0, maxDefense: 0, category: 'Ground Unit',
        cost: 3
    },
    {
        type: "Cyber Armor", acronym: "Cyber", hullSize: 3, shipSize: "-", baseClass: "B", baseAttack: 8, baseDefense: 3, tactics: "-", move: 0,
        specialTech: "Maintenance = 0. Counts as 3 Grav Armor for support. Support: player with more Grav Armor can support Class D non-Grav units. Difference = units supported. Supported units get +1 Attack & +1 Defense.", notes: "Ground Combat 3 + Advanced Construction 2", maxCount: 10, groups: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
        moveType: 'none', maxAttack: 0, maxDefense: 0, category: 'Ground Unit',
        cost: 4
    },
    {
        type: "Militia", acronym: "Militia", hullSize: 1, shipSize: "-", baseClass: "E", baseAttack: 5, baseDefense: 0, tactics: "-", move: 0,
        specialTech: "Not built. Auto-spawns when Colony is ground attacked: 1 per Colony point value. Removed at end of combat.", notes: "-", maxCount: 10, groups: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
        moveType: 'none', maxAttack: 0, maxDefense: 0, category: 'Ground Unit',
        cost: 0
    }
];
