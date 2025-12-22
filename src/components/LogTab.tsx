import React from 'react';
import type { TurnData } from '../types';
import './LogTab.css';

interface LogTabProps {
    turns: TurnData[];
    onUpdateComment: (turnId: number, comment: string) => void;
}

const LogTab: React.FC<LogTabProps> = ({ turns, onUpdateComment }) => {
    const getTurnSummary = (turn: TurnData) => {
        const events: string[] = [];

        // Colony changes
        const newColonies = turn.planets.filter(p => p.isNewlyAdded && p.type === 'Colony');
        if (newColonies.length > 0) {
            events.push(`Founded ${newColonies.length} new colon${newColonies.length > 1 ? 'ies' : 'y'}: ${newColonies.map(p => p.name).join(', ')}`);
        }

        const conquered = turn.planets.filter(p => p.isConquered);
        if (conquered.length > 0) {
            events.push(`Conquered planets: ${conquered.map(p => p.name).join(', ')}`);
        }

        if (turn.deletedPlanetIds && turn.deletedPlanetIds.length > 0) {
            events.push(`Lost or abandoned ${turn.deletedPlanetIds.length} planet(s)`);
        }

        // Research
        if (turn.rp.purchasedTechs.length > 0) {
            events.push(`Advanced technology: ${turn.rp.purchasedTechs.join(', ')}`);
        }

        // Fleet
        if (turn.cp.purchasedUnits.length > 0) {
            events.push(`Constructed units: ${turn.cp.purchasedUnits.join(', ')}`);
        }
        if (turn.cp.upgradedUnits.length > 0) {
            events.push(`Upgraded units: ${turn.cp.upgradedUnits.join(', ')}`);
        }

        // Economy Highlights
        if (turn.cp.adjustment !== 0) events.push(`CP Adjustment: ${turn.cp.adjustment > 0 ? '+' : ''}${turn.cp.adjustment}`);
        if (turn.lp.adjustment !== 0) events.push(`LP Adjustment: ${turn.lp.adjustment > 0 ? '+' : ''}${turn.lp.adjustment}`);
        if (turn.rp.adjustment !== 0) events.push(`RP Adjustment: ${turn.rp.adjustment > 0 ? '+' : ''}${turn.rp.adjustment}`);
        if (turn.tp.adjustment !== 0) events.push(`TP Adjustment: ${turn.tp.adjustment > 0 ? '+' : ''}${turn.tp.adjustment}`);

        return events;
    };

    return (
        <div className="log-tab-container">
            <div className="log-timeline">
                {[...turns].reverse().map(turn => {
                    const events = getTurnSummary(turn);
                    return (
                        <div key={turn.id} className="log-turn-card">
                            <div className="log-turn-header">
                                <span className="log-turn-number">TURN {turn.id}</span>
                                <div className="log-turn-status">
                                    {turn.lp.remaining < 0 || turn.cp.remaining < 0 || turn.rp.remaining < 0 || turn.tp.remaining < 0 ?
                                        <span className="log-status-warning">⚠️ Resource Deficit</span> :
                                        <span className="log-status-ok">✔ Operational</span>
                                    }
                                </div>
                            </div>

                            <div className="log-turn-body">
                                <div className="log-events-section">
                                    <h4>Activity Summary</h4>
                                    {events.length > 0 ? (
                                        <ul className="log-events-list">
                                            {events.map((e, i) => <li key={i}>{e}</li>)}
                                        </ul>
                                    ) : (
                                        <p className="no-events">No major operations recorded.</p>
                                    )}
                                </div>

                                <div className="log-comment-section">
                                    <h4>Commander's Log</h4>
                                    <textarea
                                        placeholder="Add mission notes, strategies, or reminders for this turn..."
                                        value={turn.logCommentary || ''}
                                        onChange={(e) => onUpdateComment(turn.id, e.target.value)}
                                        className="log-comment-input"
                                    />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default LogTab;
