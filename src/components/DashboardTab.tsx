import React from 'react';
import type { TurnData } from '../types';
import { SHIP_DEFINITIONS } from '../data/shipDefinitions';
import { TECHNOLOGIES } from '../data/technologies';
import './DashboardTab.css';

interface DashboardTabProps {
    turns: TurnData[];
}

const DashboardTab: React.FC<DashboardTabProps> = ({ turns }) => {
    const latestTurn = turns[turns.length - 1];

    // Helper to get global techs reached by empire
    const getEmpireTechs = () => {
        const techs = new Set<string>();
        turns.forEach(t => t.rp.purchasedTechs.forEach(tech => techs.add(tech)));
        return techs;
    };

    const empireTechs = getEmpireTechs();

    const getTechLevel = (name: string) => {
        const levels = [0];
        empireTechs.forEach(t => {
            if (t.startsWith(name)) {
                const lv = parseInt(t.substring(name.length).trim());
                if (!isNaN(lv)) levels.push(lv);
            }
        });
        return Math.max(...levels);
    };

    // Calculate Max Levels for each tech in the game
    const techMaxLevels: Record<string, number> = {};
    TECHNOLOGIES.forEach(t => {
        if (!techMaxLevels[t.name] || t.level > techMaxLevels[t.name]) {
            techMaxLevels[t.name] = t.level;
        }
    });

    // Tech Inventory (All reached levels)
    const techInventory = Object.entries(techMaxLevels)
        .map(([name]) => ({ name, level: getTechLevel(name) }))
        .filter(t => t.level > 0);

    // Fleet Readiness Logic
    const fleetDetails = Object.entries(latestTurn.fleet).flatMap(([acronym, data]) => {
        const shipDef = SHIP_DEFINITIONS.find(s => s.acronym === acronym);
        if (!shipDef || data.groups.length === 0) return [];

        return data.groups.filter(g => ((g.count || 0) + (g.purchase || 0) + (g.adjust || 0)) > 0).map(g => {
            const currentTotal = (g.count || 0) + (g.purchase || 0) + (g.adjust || 0);
            const currentAttack = parseInt(g.techs?.attack || '0');
            const currentDefense = parseInt(g.techs?.defense || '0');
            const currentMove = parseInt(g.techs?.move || '1');
            const currentTactics = parseInt(g.techs?.tactics || '0');

            // Find best available for this category
            const bestAttack = getTechLevel('Attack');
            const bestDefense = getTechLevel('Defense');
            const bestMove = Math.max(1, getTechLevel('Movement'));
            const bestTactics = getTechLevel('Tactics');

            // Check if ship can hold more
            const canHoldAttack = currentAttack < Math.min(bestAttack, shipDef.maxAttack ?? shipDef.hullSize ?? 1);
            const canHoldDefense = currentDefense < Math.min(bestDefense, shipDef.maxDefense ?? shipDef.hullSize ?? 1);
            const canHoldMove = currentMove < bestMove;
            const canHoldTactics = currentTactics < bestTactics;

            const isObsolete = (canHoldAttack || canHoldDefense || canHoldMove || canHoldTactics) && shipDef.category !== 'Construction';

            return {
                name: shipDef.type,
                acronym: acronym,
                count: currentTotal,
                attack: currentAttack,
                defense: currentDefense,
                move: currentMove,
                class: shipDef.baseClass,
                isObsolete,
                id: `${acronym}-${g.id}`
            };
        });
    });

    const getPlanetProduction = (planet: any) => {
        const lp = planet.facilities.filter((f: any) => f.type === 'LC' && f.builtTurnId < latestTurn.id).length * 5;
        const cp = planet.cp + (planet.facilities.filter((f: any) => f.type === 'IC' && f.builtTurnId < latestTurn.id).length * 5);
        const rp = planet.facilities.filter((f: any) => f.type === 'RC' && f.builtTurnId < latestTurn.id).length * 5;
        const tp = planet.facilities.filter((f: any) => f.type === 'TC' && f.builtTurnId < latestTurn.id).length * 5;
        return { lp, cp, rp, tp };
    };

    return (
        <div className="dashboard-container empire-report">
            <header className="report-header">
                <div className="report-title">
                    <h2>EMPIRE STATUS REPORT</h2>
                    <span className="stardate">TURN {latestTurn.id} // SECURE CHANNEL</span>
                </div>
                <div className="report-summary-counts">
                    <div className="summary-stat">
                        <label>Vessels</label>
                        <span>{fleetDetails.reduce((acc, f) => acc + f.count, 0)}</span>
                    </div>
                    <div className="summary-stat">
                        <label>Planets</label>
                        <span>{latestTurn.planets.length}</span>
                    </div>
                    <div className="summary-stat warning">
                        <label>Obsolete</label>
                        <span>{fleetDetails.filter(f => f.isObsolete).reduce((acc, f) => acc + f.count, 0)}</span>
                    </div>
                </div>
            </header>

            <div className="report-grid">
                {/* Planetary Registry */}
                <section className="report-section planetary-registry">
                    <h3><span className="icon">🪐</span> Planetary Registry</h3>
                    <div className="registry-table-wrapper">
                        <table className="report-table">
                            <thead>
                                <tr>
                                    <th>Designation</th>
                                    <th>Type</th>
                                    <th className="cell-lp">LP</th>
                                    <th className="cell-cp">CP</th>
                                    <th className="cell-rp">RP</th>
                                    <th className="cell-tp">TP</th>
                                </tr>
                            </thead>
                            <tbody>
                                {latestTurn.planets.map(planet => {
                                    const prod = getPlanetProduction(planet);
                                    return (
                                        <tr key={planet.id}>
                                            <td className="planet-name">{planet.name}</td>
                                            <td><span className={`tag ${planet.type.toLowerCase()}`}>{planet.type}</span></td>
                                            <td className="cell-lp">{prod.lp || '-'}</td>
                                            <td className="cell-cp">{prod.cp || '-'}</td>
                                            <td className="cell-rp">{prod.rp || '-'}</td>
                                            <td className="cell-tp">{prod.tp || '-'}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </section>

                <div className="side-column">
                    {/* Admiralty Overview */}
                    <section className="report-section admiralty-overview">
                        <h3><span className="icon">⚓</span> Admiralty Details</h3>
                        <div className="fleet-table-wrapper">
                            <table className="report-table compact">
                                <thead>
                                    <tr>
                                        <th>Vessel (Class)</th>
                                        <th>Qty</th>
                                        <th>A/D/M</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {fleetDetails.map(f => (
                                        <tr key={f.id} className={f.isObsolete ? 'row-obsolete' : ''}>
                                            <td>
                                                <div className="ship-main-info">
                                                    <span className="ship-type">{f.name}</span>
                                                    <span className="ship-acronym">[{f.acronym}]</span>
                                                    {f.class !== '-' && <span className="ship-class">({f.class})</span>}
                                                </div>
                                            </td>
                                            <td className="ship-count">{f.count}</td>
                                            <td className="ship-stats">{f.attack}/{f.defense}/{f.move}</td>
                                            <td>
                                                {f.isObsolete ?
                                                    <span className="status-badge obsolete" title="Needs Refit (Tech Upgrade Available)">OBSOLETE</span> :
                                                    <span className="status-badge ready">READY</span>
                                                }
                                            </td>
                                        </tr>
                                    ))}
                                    {fleetDetails.length === 0 && (
                                        <tr><td colSpan={4} className="empty-msg">No active fleet detected.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </section>

                    {/* Tech Inventory */}
                    <section className="report-section tech-achievement">
                        <h3><span className="icon">📡</span> Technical Inventory</h3>
                        <div className="tech-list">
                            {techInventory.length > 0 ? (
                                techInventory.map((tech, idx) => {
                                    const type = tech.name.toLowerCase().includes('attack') ? 'attack' :
                                        tech.name.toLowerCase().includes('defense') ? 'defense' :
                                            tech.name.toLowerCase().includes('movement') ? 'move' :
                                                tech.name.toLowerCase().includes('tactics') ? 'tactics' : 'special';
                                    return (
                                        <div key={idx} className={`tech-badge tech-badge-${type} ${tech.level >= techMaxLevels[tech.name] ? 'maxed' : ''}`}>
                                            {tech.name} {tech.level}
                                        </div>
                                    );
                                })
                            ) : <p className="empty-msg">No technologies researched yet.</p>}
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default DashboardTab;
