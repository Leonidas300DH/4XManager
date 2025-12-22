export interface PlanetContribution {
  planetName: string;
  amount: number;
}

export interface ResourceData {
  income: number;
  expense: number;
  // Calculated fields
  remaining: number;
  carryOver: number;
}

export type PlanetType = 'Homeworld' | 'Colony';
export type FacilityType = 'IC' | 'RC' | 'TC' | 'LC';

export interface FacilityData {
  type: FacilityType;
  builtTurnId: number; // For activation delay
}

export interface PlanetData {
  id: string;
  name: string;
  type: PlanetType;
  cp: number;
  facilities: FacilityData[];
  image?: string;
  isManualCP?: boolean;
  isNewlyAdded?: boolean;
  isConquered?: boolean;
  demolishedFacilities?: Array<{ type: FacilityType; originalBuiltTurnId: number }>;
}

export interface CPResourceData extends ResourceData {
  maintenance: number;
  purchases: number;
  upgrades: number;
}

// Let's define the exact structure based on the screenshot
export interface TurnData {
  id: number; // 1-20

  // LP Section
  lp: {
    carryOver: number; // From previous turn
    income: number; // Colony/Facility LPs
    totalMaintenance: number;
    maintenance: number;
    bid: number;
    placedOnLC: number;
    adjustment: number;
    remaining: number;
    planetContributions?: PlanetContribution[];
    maintenanceContributions?: string[];
  };

  // CP Section
  cp: {
    carryOver: number;
    income: number; // Colony/Facility CPs
    mineralCards: number;
    pipeline: number;
    penalty: number; // 3x Penalty LPs? Wait, screenshot says "- 3x Penalty LPs". It seems it subtracts from CP?
    adjustment: number;
    // "Total CP" is a subtotal line
    purchases: number;
    remaining: number;
    spentOnUpgrades: number; // This seems to be an informational line or separate? Screenshot: "CP spent on upgrades" at bottom.
    purchasedUnits: string[]; // List for badges e.g. ["Scout 30"]
    upgradedUnits: string[]; // List for badges e.g. ["Scout 10"]
    planetContributions?: PlanetContribution[];
  };

  // RP Section
  rp: {
    carryOver: number;
    income: number;
    spending: number;
    adjustment: number;
    remaining: number;
    purchasedTechs: string[]; // Format: "Name Level" e.g. "Ship Size 2"
    planetContributions?: PlanetContribution[];
  };

  // TP Section
  tp: {
    carryOver: number;
    income: number;
    spending: number;
    adjustment: number;
    remaining: number;
    planetContributions?: PlanetContribution[];
  };

  // Fleet Section
  fleet: FleetData;

  // Planets Section
  planets: PlanetData[];
  deletedPlanetIds?: string[];

  // Logbook Section
  logCommentary?: string;
}

export type ExperienceLevel = 'Green' | 'Skilled' | 'Veteran' | 'Elite' | 'Legendary';

export interface ShipGroupData {
  id: number;
  count: number;
  purchase?: number;
  adjust?: number;
  techLevel?: string[];
  isUpgraded?: boolean;
  experience?: ExperienceLevel;
  techs: {
    attack?: string;
    defense?: string;
    tactics?: string;
    move?: string;
  };
}

export interface FleetData {
  [shipAcronym: string]: {
    groups: ShipGroupData[];
    notes?: string;
  };
}

export const INITIAL_TURN_DATA: TurnData = {
  id: 1,
  lp: { carryOver: 0, income: 0, totalMaintenance: 0, maintenance: 0, bid: 0, placedOnLC: 0, adjustment: 0, remaining: 0 },
  cp: { carryOver: 0, income: 0, mineralCards: 0, pipeline: 0, penalty: 0, adjustment: 0, purchases: 0, remaining: 0, spentOnUpgrades: 0, purchasedUnits: [], upgradedUnits: [] },
  rp: { carryOver: 0, income: 0, spending: 0, adjustment: 0, remaining: 0, purchasedTechs: [] },
  tp: { carryOver: 0, income: 0, spending: 0, adjustment: 0, remaining: 0 },
  fleet: {
    SC: { groups: [{ id: 1, count: 3, techLevel: ["Movement 1"], techs: { attack: "0", defense: "0", move: "1" } }] },
    Miner: { groups: [{ id: 1, count: 1, techLevel: ["Movement 1"], techs: { attack: "0", defense: "0", move: "1" } }] },
    CO: {
      groups: [
        { id: 1, count: 1, techLevel: ["Movement 1"], techs: { attack: "0", defense: "0", move: "1" } },
        { id: 2, count: 1, techLevel: ["Movement 1"], techs: { attack: "0", defense: "0", move: "1" } },
        { id: 3, count: 1, techLevel: ["Movement 1"], techs: { attack: "0", defense: "0", move: "1" } }
      ]
    },
    SY: { groups: [{ id: 1, count: 4, techLevel: ["Shipyard 1", "Ship Size 1"], techs: { attack: "0", defense: "0", move: "1" } }] }
  },
  planets: [
    {
      id: 'homeworld-start',
      name: 'Homeworld',
      type: 'Homeworld',
      cp: 20,
      facilities: [
        { type: 'RC', builtTurnId: 0 }, // Status 0 means pre-existing/active
        { type: 'LC', builtTurnId: 0 }
      ],
      image: '/images/planets/homeworld.jpg'
    }
  ],
  logCommentary: ""
};

export interface AppSettings {
  showHud: boolean;
  colors: {
    cp: string;
    lp: string;
    rp: string;
    tp: string;
  };
}

export const DEFAULT_SETTINGS: AppSettings = {
  showHud: true,
  colors: {
    cp: '#ffd700', // Yellow/Gold
    lp: '#44ff44', // Green
    rp: '#00f0ff', // Blue/Cyan
    tp: '#a040ff', // Purple
  }
};
