import React, { useMemo, useState } from 'react';
import { type TurnData, type ShipGroupData, type ExperienceLevel } from '../types';
import { SHIP_DEFINITIONS, type ShipDefinition } from '../data/shipDefinitions';
import HudOverlay from './HudOverlay';
import './FleetTab.css';

interface FleetTabProps {
    currentTurn: TurnData;
    onUpdate: (turnIndex: number, section: keyof TurnData, field: string, value: any) => void;
    turnIndex: number;
    category?: 'Spaceship' | 'Construction' | 'Ground Unit';
    turns: TurnData[];
    showHud?: boolean;
    readOnly?: boolean;
}

const EXPERIENCE_LEVELS: ExperienceLevel[] = ['Green', 'Skilled', 'Veteran', 'Elite', 'Legendary'];

const SUPPORTED_EXP_SHIPS = [
    'SC', 'SCX', 'DD', 'DDX', 'CA', 'BC', 'BB', 'DN', 'TN',
    'R', 'RX', 'CV', 'BV', 'F', 'T', 'BD', 'SW', 'MB'
];

export const FleetTab: React.FC<FleetTabProps> = ({ currentTurn, onUpdate, turnIndex, category, turns, showHud = false, readOnly = false }) => {
    // Collect all purchased techs from all turns up to the current turnIndex
    const purchasedTechs = useMemo(() => {
        const allTechs = new Set<string>();
        for (let i = 0; i <= turnIndex; i++) {
            const turnTechs = turns[i]?.rp?.purchasedTechs || [];
            turnTechs.forEach(t => allTechs.add(t));
        }
        return Array.from(allTechs);
    }, [turns, turnIndex]);

    // Helper to extract available levels for a specific tech type (e.g., "Attack")
    const getAvailableLevels = (techPrefix: string): number[] => {
        const levels = [0]; // Always available
        purchasedTechs.forEach(tech => {
            if (tech.startsWith(techPrefix)) {
                // Remove the prefix and trim to get the level number
                // e.g. "Point Defense 1" -> "1", "Attack 2" -> "2"
                const levelStr = tech.substring(techPrefix.length).trim();
                const level = parseInt(levelStr);
                if (!isNaN(level)) {
                    levels.push(level);
                }
            }
        });
        return Array.from(new Set(levels)).sort((a, b) => a - b);
    };

    const [sortOrder, setSortOrder] = useState<'default' | 'asc' | 'desc' | 'cost-asc' | 'cost-desc' | 'size-asc' | 'size-desc' | 'class-asc' | 'class-desc'>('default');
    const [filterType, setFilterType] = useState<'all' | 'active' | 'buildable'>('all');
    // If category prop is provided, ignore internal state for category
    const [internalCategoryFilter, setInternalCategoryFilter] = useState<'All Units' | 'Spaceship' | 'Construction' | 'Ground Unit'>('All Units');

    const categoryFilter = category || internalCategoryFilter;

    const availableAttackLevels = useMemo(() => getAvailableLevels('Attack'), [purchasedTechs]);
    const availableDefenseLevels = useMemo(() => getAvailableLevels('Defense'), [purchasedTechs]);
    const availableTacticsLevels = useMemo(() => getAvailableLevels('Tactics'), [purchasedTechs]);
    // Move always starts at 1 (Cost 0 tech), and we don't want 0 as an option
    const availableMoveLevels = useMemo(() => {
        const levels = getAvailableLevels('Movement');
        if (!levels.includes(1)) levels.push(1);
        return levels.filter(l => l > 0).sort((a, b) => a - b);
    }, [purchasedTechs]);
    const availableFastLevels = useMemo(() => getAvailableLevels('Fast'), [purchasedTechs]);
    const availablePDLevels = useMemo(() => getAvailableLevels('Point Defense'), [purchasedTechs]);

    const getShipSizeTechLevel = (): number => {
        const levels = getAvailableLevels('Ship Size');
        const max = Math.max(...levels);
        // Default to 1 as everyone starts with Ship Size 1 capability
        return max === 0 ? 1 : max;
    };

    // Fighter tech level helper - returns { level, baseAttack, baseDefense }
    const getFighterTechStats = (): { level: number; baseAttack: number; baseDefense: number } => {
        const levels = getAvailableLevels('Fighter');
        const max = Math.max(...levels);
        // Fighter stats by tech level:
        // Fighter 1: B5-0, Fighter 2: B6-0, Fighter 3: B7-1, Fighter 4: B8-2
        switch (max) {
            case 1: return { level: 1, baseAttack: 5, baseDefense: 0 };
            case 2: return { level: 2, baseAttack: 6, baseDefense: 0 };
            case 3: return { level: 3, baseAttack: 7, baseDefense: 1 };
            case 4: return { level: 4, baseAttack: 8, baseDefense: 2 };
            default: return { level: 0, baseAttack: 5, baseDefense: 0 }; // No tech = locked
        }
    };

    const calculateStat = (base: number | string, tech: number): string | number => {
        if (typeof base === 'number') {
            return base + tech;
        }
        if (tech === 0) return base;
        return `${base} (+${tech})`;
    };



    const handleGroupUpdate = (acronym: string, groupId: number, field: keyof ShipGroupData | 'techs', value: any, techType?: string) => {
        const newFleet = { ...currentTurn.fleet };
        if (!newFleet[acronym]) newFleet[acronym] = { groups: [], notes: '' };

        const groups = [...(newFleet[acronym].groups || [])];
        let groupIndex = groups.findIndex(g => g.id === groupId);
        let group: ShipGroupData;

        if (groupIndex === -1) {
            // Initialization Logic for new groups
            let initialTechs = { attack: "0", defense: "0", move: "1", tactics: "0" };
            let initialExp: ExperienceLevel | undefined = undefined;

            if (field === 'count' && value > 0) {
                const ship = SHIP_DEFINITIONS.find(s => s.acronym === acronym);
                const maxAttack = ship?.maxAttack ?? ship?.hullSize ?? 1;
                const maxDefense = ship?.maxDefense ?? ship?.hullSize ?? 1;

                const bestAttack = Math.max(...availableAttackLevels.filter(l => l <= maxAttack));
                const bestDefense = Math.max(...availableDefenseLevels.filter(l => l <= maxDefense));
                const bestTactics = Math.max(...availableTacticsLevels);

                let bestMove = 1;
                if (ship && ship.moveType !== 'none' && ship.moveType !== 'fixed-1') {
                    const bestPurchased = Math.max(...availableMoveLevels);
                    bestMove = Math.max(bestPurchased, ship.move);
                }

                initialTechs = {
                    attack: bestAttack.toString(),
                    defense: bestDefense.toString(),
                    move: bestMove.toString(),
                    tactics: ship?.category === 'Spaceship' ? bestTactics.toString() : "0"
                };
            }

            group = {
                id: groupId,
                count: 0,
                purchase: 0,
                adjust: 0,
                isUpgraded: false,
                techLevel: [],
                techs: initialTechs,
                experience: initialExp
            };
            groups.push(group);
            groupIndex = groups.length - 1;
        } else {
            group = { ...groups[groupIndex] };
        }

        if (field === 'purchase' || field === 'adjust') {
            const ship = SHIP_DEFINITIONS.find(s => s.acronym === acronym);
            const isGroundUnit = ship?.category === 'Ground Unit';
            const maxCount = ship?.maxCount !== undefined ? ship.maxCount : 6;
            const prevCount = group.count || 0;

            if (field === 'purchase') {
                const adjust = group.adjust || 0;
                const maxPurchase = Math.max(0, maxCount - (prevCount + adjust));
                const validPurchase = Math.max(0, Math.min(value, maxPurchase));
                group.purchase = validPurchase;
                if (validPurchase > 0) {
                    group.experience = undefined;
                }
            } else {
                const purchase = group.purchase || 0;
                const minAdjust = -(prevCount + purchase);
                const maxAdjust = maxCount - (prevCount + purchase);
                const validAdjust = Math.max(minAdjust, Math.min(value, maxAdjust));
                group.adjust = validAdjust;
            }

            // Sync Tech Logic: (prevCount === 0) && totalCount > 0
            const purchase = group.purchase || 0;
            const adjust = group.adjust || 0;
            const isNewGroup = prevCount === 0 && (purchase + adjust) > 0;

            if (isNewGroup && ship) {
                // Best available techs for category
                const relevantTechs: string[] = [];
                const cat = ship.category;
                const techList = (cat === 'Ground Unit'
                    ? ['Ground Combat', 'Security Forces', 'Military Academy']
                    : cat === 'Construction'
                        ? ['Shipyard', 'Advanced Construction', 'Ship Size', 'Terraforming', 'Mines', 'Mine Sweep', 'Attack', 'Defense']
                        : ['Attack', 'Defense', 'Movement', 'Tactics', 'Point Defense', 'Cloaking', 'Scanner', 'Fighter', 'Missile Boats', 'Fast', 'Boarding', 'Security Forces', 'Military Academy', 'Advanced Construction']
                );

                const newGroupTechs = { ...group.techs };

                techList.forEach(name => {
                    const levels = getAvailableLevels(name);
                    let max = Math.max(...levels);

                    if (name === 'Movement' && max === 0) max = 1;
                    if (name === 'Ship Size' && max === 0) max = 1;
                    if (name === 'Shipyard' && max === 0) max = 1;

                    if (max > 0) {
                        if (name !== 'Military Academy' && (name !== 'Tactics' || cat === 'Spaceship')) {
                            relevantTechs.push(`${name} ${max}`);
                        }

                        // Sync internal techs for stats calculation
                        if (name === 'Attack' && !isGroundUnit) {
                            const shipMaxAttack = ship.maxAttack ?? ship.hullSize ?? 1;
                            newGroupTechs.attack = Math.min(max, shipMaxAttack).toString();
                        } else if (name === 'Defense' && !isGroundUnit) {
                            const shipMaxDefense = ship.maxDefense ?? ship.hullSize ?? 1;
                            newGroupTechs.defense = Math.min(max, shipMaxDefense).toString();
                        } else if (name === 'Movement' && !isGroundUnit) {
                            newGroupTechs.move = max.toString();
                        } else if (name === 'Tactics' && cat === 'Spaceship') {
                            newGroupTechs.tactics = max.toString();
                        }
                    }
                });

                group.techLevel = relevantTechs;
                group.techs = newGroupTechs;
            }
        } else if (field === 'techs' && techType) {
            group.techs = { ...group.techs, [techType]: value };
        } else if (field === 'isUpgraded') {
            group.isUpgraded = !!value;
        } else {
            // Use type assertion for generic fields
            (group as any)[field] = value;
        }

        // --- ENFORCE DATA CLEANING ---
        if (group.purchase === undefined) group.purchase = 0;
        if (group.adjust === undefined) group.adjust = 0;
        if (group.isUpgraded === undefined) group.isUpgraded = false;

        // Update the array with the modified group clone
        groups[groupIndex] = group;
        newFleet[acronym] = {
            ...newFleet[acronym],
            groups: groups
        };

        onUpdate(turnIndex, 'fleet', acronym, newFleet[acronym]);
    };

    const handleNotesUpdate = (acronym: string, notes: string) => {
        const newFleet = { ...currentTurn.fleet };
        if (!newFleet[acronym]) {
            newFleet[acronym] = { groups: [], notes: '' };
        }
        newFleet[acronym] = {
            ...newFleet[acronym],
            notes
        };
        onUpdate(turnIndex, 'fleet', acronym, newFleet[acronym]);
    };

    // Helper to get current group state
    const getGroupState = (acronym: string, groupId: number): ShipGroupData => {
        const groups = currentTurn.fleet?.[acronym]?.groups || [];
        return groups.find(g => g.id === groupId) || { id: groupId, count: 0, techs: {} as any, experience: 'Green' };
    };

    const renderTechSelect = (
        acronym: string,
        groupId: number,
        techType: 'attack' | 'defense' | 'move',
        levels: number[],
        currentVal: string | undefined,
        type: 'add' | 'replace' = 'add'
    ) => (
        <select
            className="tech-select"
            value={currentVal || (type === 'replace' ? "1" : "0")}
            disabled={readOnly}
            onChange={(e) => handleGroupUpdate(acronym, groupId, 'techs', e.target.value, techType)}
        >
            {levels.map(l => (
                <option key={l} value={l.toString()}>
                    {type === 'replace' ? l : (l === 0 ? '-' : `+${l}`)}
                </option>
            ))}
        </select>
    );

    const getEffectiveMoveLevel = (ship: ShipDefinition, moveTech: number): number => {
        if (ship.moveType === 'fixed-1') return 1;

        let level = Math.max(ship.move, moveTech);

        // Scout X special rule: +3 Move Levels (max 7)
        if (ship.acronym === 'SCX') {
            level = Math.min(7, level + 3);
        }

        return level;
    };

    const renderTechBadges = (ship: ShipDefinition) => {
        const badges = [];
        const isFighterShip = ship.acronym === 'F';

        // Attack Badge - Fighters capped at Attack 1 (hull size 1)
        const maxAttack = isFighterShip ? 1 : (ship.maxAttack ?? ship.hullSize);
        const bestAttack = Math.max(...availableAttackLevels.filter(l => l <= maxAttack));
        if (bestAttack > 0) {
            badges.push({ label: `Attack ${bestAttack}`, type: 'attack' });
        }

        // Defense Badge - Fighters capped at Defense 1 (hull size 1)
        const maxDefense = isFighterShip ? 1 : (ship.maxDefense ?? ship.hullSize);
        const bestDefense = Math.max(...availableDefenseLevels.filter(l => l <= maxDefense));
        if (bestDefense > 0) {
            badges.push({ label: `Defense ${bestDefense}`, type: 'defense' });
        }

        // Tactics Badge
        const bestTactics = Math.max(...availableTacticsLevels);
        if (bestTactics > 0) {
            badges.push({ label: `Tactics ${bestTactics}`, type: 'tactics' });
        }

        // Military Academy Badge
        const bestAcademy = Math.max(...getAvailableLevels('Military Academy'));
        if (bestAcademy > 0) {
            badges.push({ label: `Military Academy ${bestAcademy}`, type: 'special' });
        }

        // Security Forces Badge
        const bestSecurity = Math.max(...getAvailableLevels('Security Forces'));
        if (bestSecurity > 0) {
            badges.push({ label: `Security Forces ${bestSecurity}`, type: 'special' });
        }

        // Fast Badge - ONLY for BC (Battlecruiser)
        // For all other ships, Fast tech just enables building new units

        // Point Defense Badge (SC only)
        if (ship.acronym === 'SC') {
            const bestPD = Math.max(...availablePDLevels);
            if (bestPD > 0) {
                // PD 1 = A6, PD 2 = A7, PD 3 = A8
                const pdStrength = 5 + bestPD;
                badges.push({ label: `Point Defense ${bestPD} (A${pdStrength})`, type: 'pd' });
            }
        }

        // Move Badge - Fighters never benefit from Move tech
        if (ship.moveType !== 'none' && !isFighterShip) {
            const bestMove = Math.max(...availableMoveLevels);
            // Badge label shows the TECH level by default
            let labelLevel = bestMove;

            // Chart shows the EFFECTIVE level (including Scout X bonus)
            const effectiveLevel = getEffectiveMoveLevel(ship, bestMove);

            // Scout X Request: Show effective level in the badge label
            if (ship.acronym === 'SCX') {
                labelLevel = effectiveLevel;
            }

            if (effectiveLevel > 0) {
                badges.push({
                    label: `Move ${labelLevel}`,
                    type: 'move',
                    level: effectiveLevel,
                    fastBonus: getFastBonus(ship),
                    fixed: ship.moveType === 'fixed-1'
                });
            }
        }


        // --- SPECIFIC TECH BADGES ---

        const hasTech = (name: string) => purchasedTechs.some(t => t.startsWith(name));

        // DD: Scanner
        if (ship.acronym === 'DD' && hasTech('Scanner')) {
            badges.push({ label: 'Scanner', type: 'special' });
        }

        // DDX: Scanner, Heavy Warheads (Fast enables building but no badge)
        if (ship.acronym === 'DDX') {
            if (hasTech('Scanner')) badges.push({ label: 'Scanner', type: 'special' });
            if (hasTech('Heavy Warheads')) badges.push({ label: 'Heavy Warheads', type: 'special' });
        }

        // CA: Exploration 1 & 2, Jammer
        if (ship.acronym === 'CA') {
            if (hasTech('Jammer')) badges.push({ label: 'Jammer', type: 'special' });

            const explLevels = getAvailableLevels('Exploration');
            const maxExpl = Math.max(...explLevels);
            if (maxExpl > 0) {
                badges.push({ label: `Exploration ${maxExpl}`, type: 'special' });
            }
        }

        // BC: Fast 1 (gives +1 movement on first hex) - BC only benefits from Fast 1, not higher levels
        if (ship.acronym === 'BC') {
            const fastLevels = getAvailableLevels('Fast');
            const maxFast = Math.max(...fastLevels);
            if (maxFast >= 1) {
                badges.push({ label: 'Fast 1', type: 'move' });
            }
        }

        // BB: Tractor Beam
        if (ship.acronym === 'BB') {
            if (hasTech('Tractor Beam')) badges.push({ label: 'Tractor Beam', type: 'special' });
        }

        // DN: Shield Projector
        if (ship.acronym === 'DN') {
            if (hasTech('Shield Projector')) badges.push({ label: 'Shield Projector', type: 'special' });
        }

        // Raider: Cloaking
        if (ship.acronym === 'R') {
            if (hasTech('Cloaking')) badges.push({ label: 'Cloaking', type: 'special' });
        }

        // Raider X: Cloaking (Fast enables building but no badge)
        if (ship.acronym === 'RX') {
            if (hasTech('Cloaking')) badges.push({ label: 'Cloaking', type: 'special' });
        }

        // Battle Carrier (BV): Exploration 2 only (Fast enables building but no badge)
        if (ship.acronym === 'BV') {
            const explLevels = getAvailableLevels('Exploration');
            const maxExpl = Math.max(...explLevels);
            if (maxExpl >= 2) {
                badges.push({ label: `Exploration ${maxExpl}`, type: 'special' });
            }
        }

        // Fighter: Show Fighter tech level
        if (ship.acronym === 'F') {
            const fighterLevels = getAvailableLevels('Fighter');
            const maxFighter = Math.max(...fighterLevels);
            if (maxFighter > 0) {
                badges.push({ label: `Fighter ${maxFighter}`, type: 'special' });
            }
        }

        // BD: Boarding
        if (ship.acronym === 'BD') {
            const boardingLevels = getAvailableLevels('Boarding');
            const maxBoarding = Math.max(...boardingLevels);
            if (maxBoarding > 0) {
                badges.push({ label: `Boarding ${maxBoarding}`, type: 'special' });
            }
        }

        // Mine / SW
        if (ship.acronym === 'Mine' || ship.acronym === 'SW') {
            const type = ship.acronym === 'Mine' ? 'Mines' : 'Mine Sweep';
            const levels = getAvailableLevels(type);
            const maxLevel = Math.max(...levels);
            if (maxLevel > 0) {
                badges.push({ label: `${type} ${maxLevel}`, type: 'special' });
            }
        }

        // Ground Units
        if (ship.category === 'Ground Unit') {
            const levels = getAvailableLevels('Ground Combat');
            const maxLevel = Math.max(...levels);
            if (maxLevel > 0) {
                badges.push({ label: `Ground Combat ${maxLevel}`, type: 'special' });
            }
        }

        // MB: Missile Boats
        if (ship.acronym === 'MB') {
            const levels = getAvailableLevels('Missile Boats');
            const maxLevel = Math.max(...levels);
            if (maxLevel > 0) {
                badges.push({ label: `Missile Boats ${maxLevel}`, type: 'special' });
            }
        }

        return (
            <div className="tech-badges">
                {badges.map((b, i) => (
                    <div key={i} className={`tech-badge tech-badge-${b.type === 'special' ? 'special' : b.type}`} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>{b.label}</span>
                        {b.type === 'move' && b.level !== undefined && b.fastBonus !== undefined && (
                            <MovementChart level={b.level} fastBonus={b.fastBonus} small fixed={b.fixed} />
                        )}
                    </div>
                ))}
            </div>
        );
    };

    const getFastBonus = (ship: ShipDefinition): number => {
        const userFastLevel = Math.max(...availableFastLevels);
        if (userFastLevel === 0) return 0;

        // BC: Only benefits from Fast 1 (gives +1 movement on first hex)
        if (ship.acronym === 'BC' && userFastLevel >= 1) {
            return 1;
        }

        // Other ships with Fast tech in specialTech (legacy handling)
        if (!ship.specialTech) return 0;
        const parts = ship.specialTech.split(',').map(s => s.trim());
        for (const part of parts) {
            const match = part.match(/Fast (\d+)/);
            if (match) {
                const reqLevel = parseInt(match[1]);
                if (userFastLevel >= reqLevel) {
                    return 1;
                }
            }
        }
        return 0;
    };

    // Filter and Sort Logic
    const filteredShips = useMemo(() => {
        let ships = [...SHIP_DEFINITIONS];

        // Filter
        if (filterType === 'active') {
            ships = ships.filter(ship => {
                const groups = currentTurn.fleet?.[ship.acronym]?.groups || [];
                const totalCount = groups.reduce((sum, g) => sum + g.count, 0);
                return totalCount > 0;
            });
        } else if (filterType === 'buildable') {
            const currentShipSizeTech = getShipSizeTechLevel();
            ships = ships.filter(ship => {
                if (typeof ship.shipSize === 'number') {
                    return ship.shipSize <= currentShipSizeTech;
                }
                return false; // Exclude ships with size "-" (upgrades/special)
            });
        }

        // Sort
        if (sortOrder === 'asc') {
            ships.sort((a, b) => a.type.localeCompare(b.type));
        } else if (sortOrder === 'desc') {
            ships.sort((a, b) => b.type.localeCompare(a.type));
        } else if (sortOrder === 'cost-asc') {
            ships.sort((a, b) => (a.cost ?? 0) - (b.cost ?? 0));
        } else if (sortOrder === 'cost-desc') {
            ships.sort((a, b) => (b.cost ?? 0) - (a.cost ?? 0));
        } else if (sortOrder === 'size-asc') {
            ships.sort((a, b) => {
                const aSize = typeof a.shipSize === 'number' ? a.shipSize : 99;
                const bSize = typeof b.shipSize === 'number' ? b.shipSize : 99;
                return aSize - bSize;
            });
        } else if (sortOrder === 'size-desc') {
            ships.sort((a, b) => {
                const aSize = typeof a.shipSize === 'number' ? a.shipSize : 0;
                const bSize = typeof b.shipSize === 'number' ? b.shipSize : 0;
                return bSize - aSize;
            });
        } else if (sortOrder === 'class-asc') {
            ships.sort((a, b) => a.baseClass.localeCompare(b.baseClass));
        } else if (sortOrder === 'class-desc') {
            ships.sort((a, b) => b.baseClass.localeCompare(a.baseClass));
        }

        return ships;
    }, [filterType, sortOrder, currentTurn.fleet, purchasedTechs]);



    const categoriesToShow = useMemo(() => {
        if (categoryFilter === 'All Units') return ['Spaceship', 'Construction', 'Ground Unit'];
        return [categoryFilter];
    }, [categoryFilter]);

    return (
        <div className="fleet-container">
            <div className="fleet-toolbar">
                <div className="toolbar-group">
                    <label>Sort:</label>
                    <select
                        className="toolbar-select"
                        value={sortOrder}
                        onChange={(e) => setSortOrder(e.target.value as any)}
                    >
                        <option value="default">Default</option>
                        <option value="asc">Name A-Z</option>
                        <option value="desc">Name Z-A</option>
                        <option value="cost-asc">Cost ↑</option>
                        <option value="cost-desc">Cost ↓</option>
                        <option value="size-asc">Ship Size ↑</option>
                        <option value="size-desc">Ship Size ↓</option>
                        <option value="class-asc">Class A-Z</option>
                        <option value="class-desc">Class Z-A</option>
                    </select>
                </div>

                <div className="toolbar-group">
                    <label>Show:</label>
                    <select
                        className="toolbar-select"
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value as any)}
                    >
                        <option value="all">All</option>
                        <option value="active">Active Only</option>
                        <option value="buildable">Buildable Only</option>
                    </select>
                </div>

                {category === undefined && (
                    <div className="toolbar-group">
                        <select
                            className="toolbar-select"
                            value={categoryFilter}
                            onChange={(e) => setInternalCategoryFilter(e.target.value as any)}
                        >
                            <option value="All Units">All Units</option>
                            <option value="Spaceship">Spaceships</option>
                            <option value="Construction">Constructions</option>
                            <option value="Ground Unit">Ground Units</option>
                        </select>
                    </div>
                )}
            </div>

            {categoriesToShow.map(currentCategory => {
                const categoryShips = filteredShips.filter(s => (s.category || 'Spaceship') === currentCategory);

                if (categoryShips.length === 0) return null;

                return (
                    <div key={currentCategory} className="fleet-category-section">
                        <h2 className="category-title">{currentCategory === 'Spaceship' ? 'Spaceships' : currentCategory === 'Construction' ? 'Constructions' : 'Ground Units'}</h2>
                        {categoryShips.map(ship => {
                            const isGroundUnit = ship.category === 'Ground Unit';
                            const isConstruction = ship.category === 'Construction';

                            const getGlobalBestForCategory = (cat: string) => {
                                const techList = (cat === 'Ground Unit'
                                    ? ['Ground Combat', 'Security Forces', 'Military Academy']
                                    : cat === 'Construction'
                                        ? ['Shipyard', 'Advanced Construction', 'Ship Size', 'Terraforming', 'Mines', 'Mine Sweep', 'Attack', 'Defense']
                                        : ['Attack', 'Defense', 'Movement', 'Tactics', 'Point Defense', 'Cloaking', 'Scanner', 'Fighter', 'Missile Boats', 'Fast', 'Boarding', 'Security Forces', 'Military Academy', 'Advanced Construction']
                                );

                                const list: string[] = [];
                                let attack = 0;
                                let defense = 0;
                                let move = 1;
                                let tactics = 0;

                                techList.forEach(name => {
                                    const levels = getAvailableLevels(name);
                                    let max = Math.max(...levels);

                                    if (name === 'Movement' && max === 0) max = 1;
                                    if (name === 'Ship Size' && max === 0) max = 1;
                                    if (name === 'Shipyard' && max === 0) max = 1;

                                    if (max > 0) {
                                        // Military Academy and Tactics are global/automatic, exclude from unit badges
                                        if (name !== 'Military Academy' && (name !== 'Tactics' || cat === 'Spaceship')) {
                                            list.push(`${name} ${max}`);
                                        }
                                        if (name === 'Attack') attack = max;
                                        if (name === 'Defense') defense = max;
                                        if (name === 'Movement') move = max;
                                        if (name === 'Tactics' && cat === 'Spaceship') tactics = max;
                                    }
                                });

                                return { list, attack, defense, move, tactics };
                            };

                            const renderTable = () => (
                                <table className={`ship-table ${(isGroundUnit || isConstruction) ? 'compact' : ''}`}>
                                    <thead>
                                        <tr>
                                            <th>Group</th>
                                            <th title="Count from previous turn">Prev<br />Count</th>
                                            <th title="Adjustment (+/-)">Adjust</th>
                                            <th title="Purchase (Positive only)">Purchase</th>
                                            <th title="Current Turn Total">Total<br />Count</th>
                                            {!isGroundUnit && !isConstruction && <th>Tech Level</th>}
                                            {!isGroundUnit && !isConstruction && <th></th>}
                                            {!isGroundUnit && !isConstruction && <th>Exp</th>}
                                            {!isGroundUnit && <th className="hidden-column">Attack</th>}
                                            {!isGroundUnit && <th className="hidden-column">Defense</th>}
                                            <th style={{ textAlign: 'center' }}>Att</th>
                                            <th style={{ textAlign: 'center' }}>Def</th>
                                            {!isGroundUnit && !isConstruction && <th>Hull</th>}
                                            {!isGroundUnit && !isConstruction && <th>Move</th>}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(ship.acronym === 'Militia' ? [1] : ship.groups).map(groupId => {
                                            const group = getGroupState(ship.acronym, groupId);

                                            const shipSizeTech = getShipSizeTechLevel();
                                            const fighterStats = getFighterTechStats();
                                            const fastLevels = getAvailableLevels('Fast');
                                            const maxFast = Math.max(...fastLevels);

                                            // Lock logic for different ship types
                                            const isFighter = ship.acronym === 'F';
                                            const isCarrier = ship.acronym === 'CV';
                                            const isBattleCarrier = ship.acronym === 'BV';

                                            let isLocked = false;
                                            if (isFighter) {
                                                // Fighters: locked until Fighter 1 acquired
                                                isLocked = fighterStats.level === 0;
                                            } else if (isCarrier) {
                                                // Carrier: locked until Fighter 1 acquired
                                                isLocked = fighterStats.level === 0;
                                            } else if (isBattleCarrier) {
                                                // Battle Carrier: locked until Fighter 1 AND Fast 2 acquired
                                                isLocked = fighterStats.level === 0 || maxFast < 2;
                                            } else {
                                                // Normal ships: locked by Ship Size tech
                                                isLocked = typeof ship.shipSize === 'number' && ship.shipSize > shipSizeTech;
                                            }

                                            const purchaseValue = group.purchase || 0;
                                            const adjustValue = group.adjust || 0;
                                            const prevCountValue = group.count || 0;
                                            const totalCount = prevCountValue + purchaseValue + adjustValue;

                                            // Logic: prevCount === 0 && (purchase + adjust) > 0
                                            const isNewGroup = prevCountValue === 0 && (purchaseValue + adjustValue) > 0;
                                            const bestGlobal = getGlobalBestForCategory(ship?.category || 'Spaceship');

                                            // Override logic for Upgrades: If upgraded, use bestGlobal values
                                            // Constructions are always treated as upgraded (max available tech)
                                            const isConstruct = ship?.category === 'Construction';
                                            const useUpgraded = group.isUpgraded || isConstruct;

                                            const displayTechList = ((isNewGroup || useUpgraded) ? bestGlobal.list : (group.techLevel || []))
                                                .filter(t => !t.startsWith('Military Academy') && !t.startsWith('Security Forces'))
                                                .filter(t => !isFighter || !t.startsWith('Move')); // Fighters don't benefit from Move

                                            // Fighters: Attack/Defense capped at hull size 1
                                            const effectiveMaxAttack = isFighter ? 1 : (ship.maxAttack ?? ship.hullSize ?? 1);
                                            const effectiveMaxDefense = isFighter ? 1 : (ship.maxDefense ?? ship.hullSize ?? 1);
                                            const attackVal = (isNewGroup || useUpgraded) ? Math.min(bestGlobal.attack, effectiveMaxAttack) : parseInt(group.techs.attack || "0");
                                            const defenseVal = (isNewGroup || useUpgraded) ? Math.min(bestGlobal.defense, effectiveMaxDefense) : parseInt(group.techs.defense || "0");
                                            const moveVal = (isNewGroup || useUpgraded) ? bestGlobal.move : parseInt(group.techs.move || "1");
                                            const tacticsVal = (isNewGroup || useUpgraded) ? bestGlobal.tactics : parseInt(group.techs.tactics || "0");

                                            // Check if already maxed out
                                            const isAlreadyMaxed =
                                                attackVal >= Math.min(bestGlobal.attack, effectiveMaxAttack) &&
                                                defenseVal >= Math.min(bestGlobal.defense, effectiveMaxDefense) &&
                                                moveVal >= bestGlobal.move &&
                                                (ship.category !== 'Spaceship' || tacticsVal >= bestGlobal.tactics);

                                            const academyLevel = Math.max(...getAvailableLevels('Military Academy'));
                                            const effectiveExp = group.experience || (academyLevel > 0 ? 'Skilled' : 'Green');

                                            const isActive = totalCount > 0;

                                            const maxAttack = ship.maxAttack ?? ship.hullSize;
                                            const maxDefense = ship.maxDefense ?? ship.hullSize;

                                            const filteredAttackLevels = availableAttackLevels.filter(l => l <= maxAttack);
                                            const filteredDefenseLevels = availableDefenseLevels.filter(l => l <= maxDefense);

                                            let currentAttack: string | number = ship.baseAttack;
                                            let currentDefense: string | number = ship.baseDefense;

                                            if (!isGroundUnit) {
                                                if (isFighter) {
                                                    // Fighters: use Fighter tech base stats + Attack/Defense tech (capped at hull size 1)
                                                    const fighterAttackBonus = Math.min(attackVal, 1); // Hull size 1 = max Attack 1
                                                    const fighterDefenseBonus = Math.min(defenseVal, 1); // Hull size 1 = max Defense 1
                                                    currentAttack = fighterStats.baseAttack + fighterAttackBonus;
                                                    currentDefense = fighterStats.baseDefense + fighterDefenseBonus;
                                                } else {
                                                    currentAttack = calculateStat(ship.baseAttack, attackVal);
                                                    currentDefense = calculateStat(ship.baseDefense, defenseVal);
                                                }
                                            }

                                            // Determine effective move level for chart
                                            const effectiveMoveLevel = getEffectiveMoveLevel(ship, moveVal);

                                            return (
                                                <tr key={groupId} className={!isActive ? "inactive-row" : ""}>
                                                    <td>#{groupId}</td>
                                                    <td className="fixed-value">{prevCountValue}</td>
                                                    <td>
                                                        <input
                                                            type="number"
                                                            className="count-input adjust-input"
                                                            value={group.adjust || 0}
                                                            disabled={readOnly}
                                                            onChange={(e) => handleGroupUpdate(ship.acronym, groupId, 'adjust', parseInt(e.target.value) || 0)}
                                                        />
                                                    </td>
                                                    <td>
                                                        <input
                                                            type="number"
                                                            className={`count-input purchase-input ${isLocked ? 'locked' : ''}`}
                                                            value={group.purchase || 0}
                                                            disabled={isLocked || readOnly}
                                                            onChange={(e) => handleGroupUpdate(ship.acronym, groupId, 'purchase', parseInt(e.target.value) || 0)}
                                                            min="0"
                                                        />
                                                    </td>
                                                    <td className="total-count-cell">
                                                        <span className="total-count-value">
                                                            {totalCount}
                                                        </span>
                                                    </td>
                                                    {!isGroundUnit && !isConstruction && (
                                                        <td>
                                                            <div className="tech-badges-list">
                                                                {isActive && displayTechList.length > 0 ? (
                                                                    displayTechList.map((tech: string, i: number) => {
                                                                        const type = tech.toLowerCase().includes('attack') ? 'attack' :
                                                                            tech.toLowerCase().includes('defense') ? 'defense' :
                                                                                tech.toLowerCase().includes('move') ? 'move' :
                                                                                    tech.toLowerCase().includes('tactics') ? 'tactics' : 'special';

                                                                        let displayLabel = tech.replace('Movement ', 'Move ');

                                                                        // Cap display for Attack/Defense based on hull size
                                                                        if (displayLabel.startsWith('Attack ')) {
                                                                            const level = parseInt(displayLabel.split(' ')[1]);
                                                                            const limit = ship.maxAttack ?? ship.hullSize ?? 1;
                                                                            if (level > limit) displayLabel = `Attack ${limit}`;
                                                                        } else if (displayLabel.startsWith('Defense ')) {
                                                                            const level = parseInt(displayLabel.split(' ')[1]);
                                                                            const limit = ship.maxDefense ?? ship.hullSize ?? 1;
                                                                            if (level > limit) displayLabel = `Defense ${limit}`;
                                                                        }

                                                                        return (
                                                                            <span key={i} className={`tech-badge-mini tech-badge-${type}`}>
                                                                                {displayLabel}
                                                                            </span>
                                                                        );
                                                                    })
                                                                ) : null}
                                                            </div>
                                                        </td>
                                                    )}
                                                    {!isGroundUnit && !isConstruction && (
                                                        <td style={{ textAlign: 'center' }}>
                                                            {isActive ? (
                                                                group.isUpgraded ? (
                                                                    <button
                                                                        className="status-badge ready"
                                                                        onClick={() => !readOnly && handleGroupUpdate(ship.acronym, groupId, 'isUpgraded', false)}
                                                                        title="Cancel Upgrade"
                                                                    >
                                                                        Ready
                                                                    </button>
                                                                ) : (isAlreadyMaxed || isNewGroup || useUpgraded) ? (
                                                                    <span className="status-badge ready">Ready</span>
                                                                ) : (
                                                                    <button
                                                                        className="status-badge obsolete"
                                                                        onClick={() => !readOnly && handleGroupUpdate(ship.acronym, groupId, 'isUpgraded', true)}
                                                                        title="Tech Upgrade Available"
                                                                    >
                                                                        Obsolete
                                                                    </button>
                                                                )
                                                            ) : null}
                                                        </td>
                                                    )}
                                                    {!isGroundUnit && !isConstruction && (
                                                        <td>
                                                            {SUPPORTED_EXP_SHIPS.includes(ship.acronym) && ship.category !== 'Construction' ? (
                                                                <select
                                                                    className="tech-select exp-select"
                                                                    value={effectiveExp}
                                                                    disabled={readOnly}
                                                                    onChange={(e) => handleGroupUpdate(ship.acronym, groupId, 'experience', e.target.value)}
                                                                >
                                                                    {EXPERIENCE_LEVELS.map(exp => (
                                                                        <option key={exp} value={exp}>{exp}</option>
                                                                    ))}
                                                                </select>
                                                            ) : (
                                                                <span className="fixed-value">-</span>
                                                            )}
                                                        </td>
                                                    )}
                                                    {!isGroundUnit && (
                                                        <td className="hidden-column">
                                                            {renderTechSelect(ship.acronym, groupId, 'attack', filteredAttackLevels, group.techs.attack)}
                                                        </td>
                                                    )}
                                                    {!isGroundUnit && (
                                                        <td className="hidden-column">
                                                            {renderTechSelect(ship.acronym, groupId, 'defense', filteredDefenseLevels, group.techs.defense)}
                                                        </td>
                                                    )}
                                                    <td style={{ textAlign: 'center' }}>
                                                        <span className={!isGroundUnit && (isFighter ? (currentAttack as number) > 5 : attackVal > 0) ? "stat-value enhanced" : "stat-value"}>
                                                            {currentAttack}
                                                        </span>
                                                    </td>
                                                    <td style={{ textAlign: 'center' }}>
                                                        <span className={!isGroundUnit && (isFighter ? (currentDefense as number) > 0 : defenseVal > 0) ? "stat-value enhanced" : "stat-value"}>
                                                            {currentDefense}
                                                        </span>
                                                    </td>
                                                    {!isGroundUnit && !isConstruction && (() => {
                                                        const baseHull = ship.hullSize;
                                                        const isLegendary = effectiveExp === 'Legendary';
                                                        const displayHull = isLegendary ? baseHull + 1 : baseHull;
                                                        return (
                                                            <td style={{ textAlign: 'center' }}>
                                                                <span className={isLegendary ? "stat-value hull-legendary" : "stat-value"}>
                                                                    {displayHull}
                                                                </span>
                                                            </td>
                                                        );
                                                    })()}
                                                    {!isGroundUnit && !isConstruction && (
                                                        <td>
                                                            {ship.moveType === 'fixed-1' ? (
                                                                <div className="move-cell">
                                                                    <MovementChart level={1} fastBonus={0} fixed />
                                                                </div>
                                                            ) : ship.moveType === 'none' ? (
                                                                <span className="fixed-value">-</span>
                                                            ) : (
                                                                <div className="move-cell">
                                                                    <MovementChart
                                                                        level={effectiveMoveLevel}
                                                                        fastBonus={getFastBonus(ship)}
                                                                    />
                                                                </div>
                                                            )}
                                                        </td>
                                                    )}
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            );

                            return (
                                <div key={ship.acronym} className={`ship-card layout-side-by-side category-${(ship.category || 'spaceship').toLowerCase().replace(/\s+/g, '-')}`}>
                                    <div className="category-header">
                                        <div className="ship-header-content">
                                            <div className="ship-header-left">
                                                <div className="ship-header-top">
                                                    <div className="ship-name">
                                                        {ship.type} <span style={{ fontSize: '0.8em', opacity: 0.7 }}>({ship.acronym})</span>
                                                        {ship.category !== 'Ground Unit' && (() => {
                                                            const fighterStats = getFighterTechStats();
                                                            const fastLevels = getAvailableLevels('Fast');
                                                            const maxFast = Math.max(...fastLevels);

                                                            // Special lock conditions
                                                            let isShipLocked = false;
                                                            if (ship.acronym === 'F' || ship.acronym === 'CV') {
                                                                isShipLocked = fighterStats.level === 0;
                                                            } else if (ship.acronym === 'BV') {
                                                                isShipLocked = fighterStats.level === 0 || maxFast < 2;
                                                            } else if (typeof ship.shipSize === 'number') {
                                                                isShipLocked = ship.shipSize > getShipSizeTechLevel();
                                                            }

                                                            return (
                                                                <span className={`ship-size-badge ${isShipLocked ? 'locked' : ''}`}>
                                                                    {isShipLocked ? '🔒 ' : ''}
                                                                    Size: {ship.shipSize}
                                                                </span>
                                                            );
                                                        })()}
                                                    </div>
                                                    <div className="ship-stats-right">
                                                        <span className="stat-badge cost-badge">Cost: {ship.cost !== undefined ? (ship.cost === 0 ? 'Free' : `${ship.cost} CP`) : '-'}</span>
                                                        <span className="stat-badge">Class: {ship.baseClass}</span>
                                                        {(() => {
                                                            let enhancedAttack: string | number = ship.baseAttack;
                                                            let enhancedDefense: string | number = ship.baseDefense;

                                                            if (!isGroundUnit) {
                                                                // Special handling for Fighters
                                                                if (ship.acronym === 'F') {
                                                                    const fStats = getFighterTechStats();
                                                                    const attackBonus = Math.min(Math.max(...availableAttackLevels), 1);
                                                                    const defenseBonus = Math.min(Math.max(...availableDefenseLevels), 1);
                                                                    enhancedAttack = fStats.baseAttack + attackBonus;
                                                                    enhancedDefense = fStats.baseDefense + defenseBonus;
                                                                } else {
                                                                    const maxAttack = ship.maxAttack ?? ship.hullSize;
                                                                    const bestAttack = Math.max(...availableAttackLevels.filter(l => l <= maxAttack));
                                                                    enhancedAttack = calculateStat(ship.baseAttack, bestAttack);

                                                                    const maxDefense = ship.maxDefense ?? ship.hullSize;
                                                                    const bestDefense = Math.max(...availableDefenseLevels.filter(l => l <= maxDefense));
                                                                    enhancedDefense = calculateStat(ship.baseDefense, bestDefense);
                                                                }
                                                            }

                                                            return (
                                                                <>
                                                                    {!isGroundUnit && <span className="stat-badge">Attack: {enhancedAttack}</span>}
                                                                    {!isGroundUnit && <span className="stat-badge">Defense: {enhancedDefense}</span>}
                                                                </>
                                                            );
                                                        })()}
                                                        {!isGroundUnit && <span className="stat-badge">Hull Size: x{ship.hullSize}</span>}
                                                    </div>
                                                </div>
                                                {ship.category !== 'Ground Unit' && renderTechBadges(ship)}
                                                {(ship.specialTech || ship.notes) && (
                                                    <div className="ship-notes">
                                                        {ship.specialTech && <div><strong>Special:</strong> {ship.specialTech}</div>}
                                                        {ship.notes && <div><strong>Notes:</strong> {ship.notes}</div>}
                                                    </div>
                                                )}
                                                <div className="ship-custom-notes">
                                                    <textarea
                                                        className="notes-textarea"
                                                        placeholder="Notes..."
                                                        value={currentTurn.fleet?.[ship.acronym]?.notes || ''}
                                                        onChange={(e) => handleNotesUpdate(ship.acronym, e.target.value)}
                                                    />
                                                </div>
                                                <div className="compact-table-container">
                                                    {renderTable()}
                                                </div>
                                            </div>
                                            <div className="ship-illustration">
                                                <HudOverlay
                                                    enabled={showHud}
                                                    imgSrc={`/images/ships/${ship.type.toLowerCase().replace(/\s+/g, '_')}.jpg`}
                                                >
                                                    <img
                                                        src={`/images/ships/${ship.type.toLowerCase().replace(/\s+/g, '_')}.jpg`}
                                                        alt={ship.type}
                                                        className="ship-image"
                                                        onError={(e) => e.currentTarget.style.display = 'none'}
                                                    />
                                                </HudOverlay>
                                                <div className="illustration-placeholder">
                                                    <span>IMG</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                );
            })}
        </div >
    );
};

// Simple Movement Chart Component
const MovementChart: React.FC<{ level: number, fastBonus: number, small?: boolean, fixed?: boolean }> = ({ level, fastBonus, small, fixed }) => {
    // Returns [Red Count, Orange Count, Yellow Count]
    const getPhases = (lvl: number) => {
        if (fixed) return [1, 0, 0]; // Fixed 1 hex per turn max

        switch (lvl) {
            case 1: return [1, 1, 1];
            case 2: return [1, 1, 2];
            case 3: return [1, 2, 2];
            case 4: return [2, 2, 2];
            case 5: return [2, 2, 3];
            case 6: return [2, 3, 3];
            case 7: return [3, 3, 3];
            default: return [1, 1, 1];
        }
    };

    const phases = getPhases(level);

    // Apply Fast bonus to first phase (Red)
    if (fastBonus > 0 && phases.length > 0 && !fixed) {
        phases[0] += fastBonus;
    }

    return (
        <div className="movement-chart" style={small ? { transform: 'scale(0.8)', marginTop: 0 } : {}}>
            {phases.map((count, i) => (
                <div key={i} className={`move-phase phase-${i + 1} ${count === 0 ? 'empty' : ''}`}>
                    {count > 0 ? count : '-'}
                </div>
            ))}
        </div>
    );
};
