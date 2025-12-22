import type { TurnData, PlanetContribution, ExperienceLevel } from '../types';
import { SHIP_DEFINITIONS } from '../data/shipDefinitions';

const MAX_CARRY_OVER = 30;

export function calculateTurns(turns: TurnData[]): TurnData[] {
    // Track global technologies across turns
    const globalTechs = new Set<string>();
    // We create a deep copy to avoid mutations of the original objects
    const newTurns: TurnData[] = JSON.parse(JSON.stringify(turns));

    for (let i = 0; i < newTurns.length; i++) {
        const currentTurn = newTurns[i];
        const prevTurn = i > 0 ? newTurns[i - 1] : null;

        // Add current turn techs to global registry
        const turnTechs = currentTurn.rp.purchasedTechs || [];
        turnTechs.forEach(t => globalTechs.add(t));

        // Helper to get available levels from global registry
        const getAvailableLevels = (prefix: string) => {
            const levels = [0];
            globalTechs.forEach(tech => {
                if (tech.startsWith(prefix)) {
                    const level = parseInt(tech.substring(prefix.length).trim());
                    if (!isNaN(level)) levels.push(level);
                }
            });
            return levels;
        };

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

            techList.forEach(name => {
                const levels = getAvailableLevels(name);
                let max = Math.max(...levels);

                if (name === 'Movement' && max === 0) max = 1;
                if (name === 'Ship Size' && max === 0) max = 1;
                if (name === 'Shipyard' && max === 0) max = 1;

                if (max > 0) {
                    // Military Academy and Tactics are global/automatic, exclude from unit badges
                    if (name !== 'Military Academy' && name !== 'Tactics') {
                        list.push(`${name} ${max}`);
                    }
                    if (name === 'Attack') attack = max;
                    if (name === 'Defense') defense = max;
                    if (name === 'Movement') move = max;
                }
            });

            return { list, attack, defense, move };
        };

        // --- Fleet Propagation ---
        // We do this EARLY so that counts from previous turn are available for CP calculations (upgrades)
        if (prevTurn) {
            Object.keys(prevTurn.fleet).forEach(acronym => {
                if (!currentTurn.fleet[acronym]) {
                    currentTurn.fleet[acronym] = {
                        groups: [],
                        notes: prevTurn.fleet[acronym].notes || ''
                    };
                }

                const prevGroups = prevTurn.fleet[acronym].groups || [];
                const currentGroups = [...(currentTurn.fleet[acronym].groups || [])];
                const ship = SHIP_DEFINITIONS.find(s => s.acronym === acronym);

                // Best techs available including current turn research
                const bestAvailable = getGlobalBestForCategory(ship?.category || 'Spaceship');

                prevGroups.forEach(prevGroup => {
                    const prevTotal = (prevGroup.count || 0) + (prevGroup.purchase || 0) + (prevGroup.adjust || 0);
                    let groupInCurrent = currentGroups.find(g => g.id === prevGroup.id);

                    // --- Preparation of inherited values ---
                    const inheritedCount = acronym === 'Militia' ? 0 : prevTotal;
                    let inheritedTechLevel = prevGroup.techLevel || [];
                    let inheritedTechs = { ...(prevGroup.techs || {}) };
                    let inheritedExperience: ExperienceLevel | undefined = prevGroup.experience || 'Green';

                    // --- Experience Logic ---
                    // If there is a purchase in the CURRENT turn for this group, reset its experience to baseline
                    const hasPurchase = (groupInCurrent?.purchase || 0) > 0;
                    if (hasPurchase) {
                        inheritedExperience = undefined;
                    } else if ((prevGroup.experience === 'Green' || !prevGroup.experience) && prevTotal > 0 && acronym !== 'Militia') {
                        inheritedExperience = 'Skilled';
                    }

                    // Apply Upgrade if it was marked in previous turn
                    // This means the "current" turn starts with the new techs
                    // OR if it's a Construction (always at max tech for free)
                    const isConstruction = ship?.category === 'Construction';
                    if ((prevGroup.isUpgraded || isConstruction) && ship) {
                        inheritedTechLevel = bestAvailable.list;
                        inheritedTechs.attack = Math.min(bestAvailable.attack, ship.maxAttack ?? ship.hullSize ?? 1).toString();
                        inheritedTechs.defense = Math.min(bestAvailable.defense, ship.maxDefense ?? ship.hullSize ?? 1).toString();
                        inheritedTechs.move = bestAvailable.move.toString();
                    }

                    if (groupInCurrent) {
                        // Preserve inherited stats
                        groupInCurrent.count = inheritedCount;

                        // Inherit or Reset experience
                        if (hasPurchase) {
                            groupInCurrent.experience = undefined;
                        } else if (groupInCurrent.experience === undefined) {
                            groupInCurrent.experience = inheritedExperience;
                        }

                        // --- Immediate Tech Sync Rule ---
                        const isNewGroup = (inheritedCount === 0 || (inheritedCount + (groupInCurrent.adjust || 0) === 0)) && (inheritedCount + (groupInCurrent.purchase || 0) + (groupInCurrent.adjust || 0)) > 0;
                        const hasCurrentPurchase = (groupInCurrent.purchase || 0) > 0;
                        const isConstruction = ship?.category === 'Construction';

                        if ((groupInCurrent.isUpgraded || isNewGroup || hasCurrentPurchase || isConstruction) && ship && acronym !== 'Militia') {
                            groupInCurrent.techLevel = [...bestAvailable.list];
                            groupInCurrent.techs = {
                                attack: Math.min(bestAvailable.attack, ship.maxAttack ?? ship.hullSize ?? 1).toString(),
                                defense: Math.min(bestAvailable.defense, ship.maxDefense ?? ship.hullSize ?? 1).toString(),
                                move: bestAvailable.move.toString()
                            };
                        } else {
                            // Inherit
                            groupInCurrent.techLevel = [...inheritedTechLevel];
                            groupInCurrent.techs = { ...inheritedTechs };
                        }

                        // Reset isUpgraded only if it was just "baked in" from a previous turn's upgrade
                        if (prevGroup.isUpgraded) {
                            groupInCurrent.isUpgraded = false;
                        } else {
                            groupInCurrent.isUpgraded = !!groupInCurrent.isUpgraded;
                        }

                        // Default current turn fields
                        if (groupInCurrent.purchase === undefined) groupInCurrent.purchase = 0;
                        if (groupInCurrent.adjust === undefined) groupInCurrent.adjust = 0;
                    } else {
                        // Create new group inheriting from previous turn
                        currentGroups.push({
                            ...prevGroup,
                            count: inheritedCount,
                            techLevel: [...inheritedTechLevel],
                            techs: { ...inheritedTechs },
                            experience: inheritedExperience,
                            isUpgraded: false,
                            purchase: 0,
                            adjust: 0
                        });
                    }
                });

                currentTurn.fleet[acronym].groups = currentGroups;
            });
        } else {
            // --- First Turn Initialization ---
            Object.keys(currentTurn.fleet).forEach(acronym => {
                const groupData = currentTurn.fleet[acronym];
                const ship = SHIP_DEFINITIONS.find(s => s.acronym === acronym);
                const bestAvailable = getGlobalBestForCategory(ship?.category || 'Spaceship');

                groupData.groups.forEach(group => {
                    const total = (group.count || 0) + (group.purchase || 0) + (group.adjust || 0);
                    const hasCurrentPurchase = (group.purchase || 0) > 0;
                    const isNewGroup = total > 0 && (group.count || 0) === 0;
                    const isConstruction = ship?.category === 'Construction';

                    if ((group.isUpgraded || isNewGroup || hasCurrentPurchase || isConstruction) && ship && acronym !== 'Militia') {
                        group.techLevel = [...bestAvailable.list];
                        group.techs = {
                            attack: Math.min(bestAvailable.attack, ship.maxAttack ?? ship.hullSize ?? 1).toString(),
                            defense: Math.min(bestAvailable.defense, ship.maxDefense ?? ship.hullSize ?? 1).toString(),
                            move: bestAvailable.move.toString()
                        };
                    } else if (total > 0 && (!group.techLevel || group.techLevel.length === 0)) {
                        // Default for Turn 1 if not explicitly new/purchased/upgraded but needs init
                        group.techLevel = [...bestAvailable.list];
                        group.techs = {
                            attack: Math.min(bestAvailable.attack, ship?.maxAttack ?? ship?.hullSize ?? 1).toString(),
                            defense: Math.min(bestAvailable.defense, ship?.maxDefense ?? ship?.hullSize ?? 1).toString(),
                            move: bestAvailable.move.toString()
                        };
                    }

                    // Reset experience on Turn 1 if it's a purchase
                    if (hasCurrentPurchase) {
                        group.experience = undefined;
                    }
                });
            });
        }

        // Helper to ensure numeric values from potentially string-y input data
        const val = (v: any) => Number(v || 0);

        // --- Planets & Production ---
        if (prevTurn) {
            const prevPlanets = prevTurn.planets || [];
            const currentPlanets = [...(currentTurn.planets || [])];
            const deletedIds = new Set(currentTurn.deletedPlanetIds || []);

            // Propagate deletions forward
            const inheritedDeletions = new Set(prevTurn.deletedPlanetIds || []);
            inheritedDeletions.forEach(id => deletedIds.add(id));
            currentTurn.deletedPlanetIds = Array.from(deletedIds);

            prevPlanets.forEach(prevPlanet => {
                // SKIP if deleted in current turn or inherited from previous
                if (deletedIds.has(prevPlanet.id)) return;

                let planetInCurrent = currentPlanets.find(p => p.id === prevPlanet.id);

                // Calculate target CP after growth from T-1
                let grownCP = prevPlanet.cp;
                if (prevPlanet.type === 'Colony') {
                    if (prevPlanet.cp === 3) grownCP = 5;
                    else if (prevPlanet.cp === 1) grownCP = 3;
                    else if (prevPlanet.cp === 0) grownCP = 1; // Colonies grow from 0 to 1
                } else if (prevPlanet.type === 'Homeworld') {
                    if (prevPlanet.cp === 15) grownCP = 20;
                    else if (prevPlanet.cp === 10) grownCP = 15;
                    else if (prevPlanet.cp === 5) grownCP = 10;
                    else if (prevPlanet.cp === 0) grownCP = 5;
                }

                if (!planetInCurrent) {
                    // Propagation of a newly inherited planet
                    currentPlanets.push({
                        ...JSON.parse(JSON.stringify(prevPlanet)),
                        cp: grownCP,
                        isManualCP: false,
                        isNewlyAdded: false // Becomes "old" in the next turn
                    });
                } else {
                    // Planet exists (persistent data or manual change)
                    // Update CP if not manual
                    planetInCurrent.isNewlyAdded = false; // Always force to false if it persisted or was manual
                    if (!planetInCurrent.isManualCP) {
                        planetInCurrent.cp = grownCP;
                    }

                    // Note: Aggressive facility sync was removed to allow manual removals.
                    // Facility propagation is handled via deep copy during turn addition.
                }
            });
            currentTurn.planets = currentPlanets;
        }

        // Calculate Income from Planets and Facilities
        let turnLPIncome = 0;
        let turnCPIncome = 0;
        let turnRPIncome = 0;
        let turnTPIncome = 0;

        const lpContribs: PlanetContribution[] = [];
        const cpContribs: PlanetContribution[] = [];
        const rpContribs: PlanetContribution[] = [];
        const tpContribs: PlanetContribution[] = [];

        (currentTurn.planets || []).forEach(planet => {
            const activeFacilities = planet.facilities.filter((f: any) => f.builtTurnId < currentTurn.id);

            let pCP = 0, pLP = 0, pRP = 0, pTP = 0;

            if (planet.type === 'Homeworld') {
                // Homeworld always produces CP based on capacity
                pCP += planet.cp;
                // Plus facility outputs
                activeFacilities.forEach((f: any) => {
                    if (f.type === 'IC') pCP += 5;
                    else if (f.type === 'RC') pRP += 5;
                    else if (f.type === 'TC') pTP += 5;
                    else if (f.type === 'LC') pLP += 5;
                });
            } else {
                // Colony rules
                const hasActiveFacility = activeFacilities.length > 0;
                if (hasActiveFacility) {
                    // Entire production is converted to the Facility output type
                    const mainFacility = activeFacilities[0]; // Colonies only have 1 facility
                    const totalColonyOutput = planet.cp + 5;

                    if (mainFacility.type === 'IC') pCP += totalColonyOutput;
                    else if (mainFacility.type === 'RC') pRP += totalColonyOutput;
                    else if (mainFacility.type === 'TC') pTP += totalColonyOutput;
                    else if (mainFacility.type === 'LC') pLP += totalColonyOutput;
                } else {
                    // No facility, produces CP normally
                    pCP += planet.cp;
                }
            }

            if (pCP > 0) cpContribs.push({ planetName: planet.name, amount: pCP });
            if (pLP > 0) lpContribs.push({ planetName: planet.name, amount: pLP });
            if (pRP > 0) rpContribs.push({ planetName: planet.name, amount: pRP });
            if (pTP > 0) tpContribs.push({ planetName: planet.name, amount: pTP });

            turnCPIncome += pCP;
            turnLPIncome += pLP;
            turnRPIncome += pRP;
            turnTPIncome += pTP;
        });

        currentTurn.lp.income = turnLPIncome;
        currentTurn.lp.planetContributions = lpContribs;
        currentTurn.cp.income = turnCPIncome;
        currentTurn.cp.planetContributions = cpContribs;
        currentTurn.rp.income = turnRPIncome;
        currentTurn.rp.planetContributions = rpContribs;
        currentTurn.tp.income = turnTPIncome;
        currentTurn.tp.planetContributions = tpContribs;

        // --- Maintenance Calculation ---
        let totalMaintenanceRequired = 0;
        let eliteLegendaryMaintenanceAccumulator = 0;
        const maintenanceMap: Record<string, number> = {};

        Object.keys(currentTurn.fleet).forEach(acronym => {
            const ship = SHIP_DEFINITIONS.find(s => s.acronym === acronym);
            if (!ship) return;

            // Exemptions: Ground Units, Constructions, and specific spaceships (CO, Miner, MinerX, Mine, MS)
            const isExempt =
                ship.category === 'Ground Unit' ||
                ship.category === 'Construction' ||
                ['CO', 'Miner', 'MinerX', 'Mine', 'MS'].includes(acronym);

            if (!isExempt) {
                const groups = currentTurn.fleet[acronym].groups || [];
                groups.forEach(g => {
                    const maintenanceCount = val(g.count) + val(g.adjust);
                    if (maintenanceCount > 0) {
                        const baseMaintenance = maintenanceCount * (ship.hullSize || 1);
                        if (g.experience === 'Elite' || g.experience === 'Legendary') {
                            eliteLegendaryMaintenanceAccumulator += baseMaintenance;
                            const cost = Math.floor(baseMaintenance / 2);
                            maintenanceMap[ship.type] = (maintenanceMap[ship.type] || 0) + cost;
                        } else {
                            totalMaintenanceRequired += baseMaintenance;
                            maintenanceMap[ship.type] = (maintenanceMap[ship.type] || 0) + baseMaintenance;
                        }
                    }
                });
            }
        });

        // Elite and Legendary Groups pay half maintenance (rounded down)
        totalMaintenanceRequired += Math.floor(eliteLegendaryMaintenanceAccumulator / 2);

        currentTurn.lp.totalMaintenance = totalMaintenanceRequired;
        currentTurn.lp.maintenanceContributions = Object.entries(maintenanceMap)
            .filter(([_, amount]) => amount > 0)
            .map(([type, amount]) => `${type} ${amount}`);

        // --- LP Calculations ---
        if (prevTurn) {
            currentTurn.lp.carryOver = val(prevTurn.lp.remaining);
        } else {
            currentTurn.lp.carryOver = 0;
        }

        // LP available before maintenance
        const lpPreMaintenance = val(currentTurn.lp.carryOver) + val(currentTurn.lp.income) + val(currentTurn.lp.adjustment) - val(currentTurn.lp.bid) - val(currentTurn.lp.placedOnLC);

        // Maintenance paid with LP (cannot go below 0 LP)
        const paidWithLP = Math.min(totalMaintenanceRequired, Math.max(0, lpPreMaintenance));
        currentTurn.lp.maintenance = paidWithLP;
        currentTurn.lp.remaining = lpPreMaintenance - paidWithLP;

        // --- CP Calculations ---
        if (prevTurn) {
            // Carry over CP cannot be below zero
            currentTurn.cp.carryOver = Math.min(Math.max(0, val(prevTurn.cp.remaining)), MAX_CARRY_OVER);
        } else {
            currentTurn.cp.carryOver = 0;
        }

        // Unpaid maintenance becomes CP penalty (3x)
        const unpaidMaintenance = Math.max(0, totalMaintenanceRequired - paidWithLP);
        currentTurn.cp.penalty = unpaidMaintenance * 3;

        // New: Calculate unit purchases and upgrades costs
        let totalPurchaseCost = 0;
        let totalUpgradeCost = 0;
        const purchaseBadges: Record<string, number> = {};
        const upgradeBadges: Record<string, number> = {};
        const facilityBadges: string[] = [];

        // Add Facility Costs (5 CP each, built this turn)
        currentTurn.planets.forEach(planet => {
            planet.facilities.forEach(f => {
                if (f.builtTurnId === currentTurn.id && !planet.isConquered) {
                    totalPurchaseCost += 5;
                    facilityBadges.push(`${planet.name} ${f.type} 5`);
                }
            });
        });

        Object.keys(currentTurn.fleet).forEach(acronym => {
            const ship = SHIP_DEFINITIONS.find(s => s.acronym === acronym);
            if (!ship) return;

            const groups = currentTurn.fleet[acronym].groups || [];
            let shipPurchaseCost = 0;
            let shipUpgradeCost = 0;

            groups.forEach(g => {
                // Purchases cost (Quantity * Cost)
                if (val(g.purchase) > 0) {
                    shipPurchaseCost += val(g.purchase) * (ship.cost || 0);
                }
                // Upgrades cost (Count * Hull Size)
                // Constructions are always upgraded for free
                if (!!g.isUpgraded && ship.category !== 'Construction') {
                    shipUpgradeCost += val(g.count) * (ship.hullSize || 0);
                }
            });

            if (shipPurchaseCost > 0) {
                totalPurchaseCost += shipPurchaseCost;
                purchaseBadges[ship.type] = (purchaseBadges[ship.type] || 0) + shipPurchaseCost;
            }
            if (shipUpgradeCost > 0) {
                totalUpgradeCost += shipUpgradeCost;
                upgradeBadges[ship.type] = (upgradeBadges[ship.type] || 0) + shipUpgradeCost;
            }
        });

        currentTurn.cp.purchases = totalPurchaseCost;
        currentTurn.cp.spentOnUpgrades = totalUpgradeCost;

        // Combine ship badges and facility badges
        const shipPurchaseBadges = Object.entries(purchaseBadges).map(([type, cost]) => `${type} ${cost}`);
        currentTurn.cp.purchasedUnits = [...shipPurchaseBadges, ...facilityBadges];

        currentTurn.cp.upgradedUnits = Object.entries(upgradeBadges).map(([type, cost]) => `${type} ${cost}`);

        const cpTotalIncome = val(currentTurn.cp.carryOver) + val(currentTurn.cp.income) + val(currentTurn.cp.mineralCards) + val(currentTurn.cp.pipeline);
        const cpSubtotal = cpTotalIncome - val(currentTurn.cp.penalty);
        const cpExpenses = val(currentTurn.cp.purchases) + val(currentTurn.cp.spentOnUpgrades);
        currentTurn.cp.remaining = cpSubtotal - cpExpenses + val(currentTurn.cp.adjustment);

        // --- RP Calculations ---
        if (prevTurn) {
            currentTurn.rp.carryOver = Math.min(val(prevTurn.rp.remaining), MAX_CARRY_OVER);
        } else {
            currentTurn.rp.carryOver = 0;
        }

        const rpTotalIncome = val(currentTurn.rp.carryOver) + val(currentTurn.rp.income);
        currentTurn.rp.remaining = rpTotalIncome - val(currentTurn.rp.spending) + val(currentTurn.rp.adjustment);

        // --- TP Calculations ---
        if (prevTurn) {
            currentTurn.tp.carryOver = val(prevTurn.tp.remaining);
        } else {
            currentTurn.tp.carryOver = 0;
        }

        const tpTotalIncome = val(currentTurn.tp.carryOver) + val(currentTurn.tp.income);
        currentTurn.tp.remaining = tpTotalIncome - val(currentTurn.tp.spending) + val(currentTurn.tp.adjustment);

    }

    return newTurns;
}
