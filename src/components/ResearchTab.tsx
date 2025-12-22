import React from 'react';
import { type TurnData } from '../types';
import { TECHNOLOGIES, TECH_GROUPS, type Technology } from '../data/technologies';
import './ResearchTab.css';

interface ResearchTabProps {
    turns: TurnData[];
    currentTurnId: number;
    onUpdate: (turnIndex: number, section: keyof TurnData, field: string, value: any) => void;
    onSectionUpdate?: (turnIndex: number, section: keyof TurnData, updates: Record<string, any>) => void;
    readOnly?: boolean;
}

export const ResearchTab: React.FC<ResearchTabProps> = ({
    turns,
    currentTurnId,
    onUpdate,
    onSectionUpdate,
    readOnly = false
}) => {
    const currentTurnIndex = turns.findIndex(t => t.id === currentTurnId);
    const currentTurn = turns[currentTurnIndex];

    if (!currentTurn) return <div>Select a turn first</div>;

    // Helper to get owned level of a tech up to the PREVIOUS turn
    const getPreOwnedLevel = (techName: string): number => {
        let maxLevel = 0;
        for (const turn of turns) {
            if (turn.id >= currentTurnId) break; // Only check strictly previous turns

            if (turn.rp.purchasedTechs) {
                turn.rp.purchasedTechs.forEach(techStr => {
                    const lastSpaceIndex = techStr.lastIndexOf(' ');
                    const name = techStr.substring(0, lastSpaceIndex);
                    const level = parseInt(techStr.substring(lastSpaceIndex + 1));

                    if (name === techName && level > maxLevel) {
                        maxLevel = level;
                    }
                });
            }
        }
        return maxLevel;
    };

    // Helper to get max level purchased in CURRENT turn
    const getCurrentTurnPurchasedLevel = (techName: string): number => {
        let maxLevel = 0;
        if (currentTurn.rp.purchasedTechs) {
            currentTurn.rp.purchasedTechs.forEach(techStr => {
                const lastSpaceIndex = techStr.lastIndexOf(' ');
                const name = techStr.substring(0, lastSpaceIndex);
                const level = parseInt(techStr.substring(lastSpaceIndex + 1));

                if (name === techName && level > maxLevel) {
                    maxLevel = level;
                }
            });
        }
        return maxLevel;
    };

    const handleBuy = (tech: Technology) => {
        const techString = `${tech.name} ${tech.level}`;

        // Prevent duplicate purchases
        if (currentTurn.rp.purchasedTechs?.includes(techString)) return;

        const newPurchased = [...(currentTurn.rp.purchasedTechs || []), techString];
        const newSpending = currentTurn.rp.spending + tech.cost;

        if (onSectionUpdate) {
            onSectionUpdate(currentTurnIndex, 'rp', {
                purchasedTechs: newPurchased,
                spending: newSpending
            });
        } else {
            // Fallback if onSectionUpdate not provided (shouldn't happen with updated App)
            onUpdate(currentTurnIndex, 'rp', 'purchasedTechs', newPurchased);
            // Note: This fallback still has the race condition bug, but onSectionUpdate fixes it.
        }
    };

    const handleRemove = (tech: Technology) => {
        const techString = `${tech.name} ${tech.level}`;
        const newPurchased = (currentTurn.rp.purchasedTechs || []).filter(t => t !== techString);
        const newSpending = currentTurn.rp.spending - tech.cost;

        if (onSectionUpdate) {
            onSectionUpdate(currentTurnIndex, 'rp', {
                purchasedTechs: newPurchased,
                spending: newSpending
            });
        } else {
            onUpdate(currentTurnIndex, 'rp', 'purchasedTechs', newPurchased);
        }
    };

    const [sortOrder, setSortOrder] = React.useState<'default' | 'asc' | 'desc'>('default');
    const [filterOwned, setFilterOwned] = React.useState<'all' | 'owned' | 'not-owned'>('all');
    const [searchQuery, setSearchQuery] = React.useState('');

    // Determine max level across all techs to set table columns
    const maxLevel = Math.max(...TECHNOLOGIES.map(t => t.level));
    // Start from Level 1, exclude Level 0
    const levels = Array.from({ length: maxLevel }, (_, i) => i + 1);

    // Filter and Sort Logic
    const filteredGroups = React.useMemo(() => {
        let groups = [...TECH_GROUPS];

        // Search Filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            groups = groups.filter(group => group.toLowerCase().includes(query));
        }

        // Owned Filter
        if (filterOwned !== 'all') {
            groups = groups.filter(group => {
                const groupTechs = TECHNOLOGIES.filter(t => t.name === group);
                const preOwnedLevel = getPreOwnedLevel(group);
                const maxZeroCostLevel = Math.max(0, ...groupTechs.filter(t => t.cost === 0).map(t => t.level));
                const effectivePreOwnedLevel = Math.max(preOwnedLevel, maxZeroCostLevel);

                // Owned means we have at least level 1 (or level 0 if that counts as "owned" in this context, but usually means unlocked something)
                // Let's say "Owned" means effectivePreOwnedLevel > 0 OR we bought something this turn.
                const currentTurnPurchasedMax = getCurrentTurnPurchasedLevel(group);
                const isOwned = effectivePreOwnedLevel > 0 || currentTurnPurchasedMax > 0;

                return filterOwned === 'owned' ? isOwned : !isOwned;
            });
        }

        // Sort
        if (sortOrder !== 'default') {
            groups.sort((a, b) => {
                return sortOrder === 'asc' ? a.localeCompare(b) : b.localeCompare(a);
            });
        }

        return groups;
    }, [TECH_GROUPS, searchQuery, filterOwned, sortOrder, currentTurn, turns]);

    const toggleSort = () => {
        const next = { 'default': 'asc', 'asc': 'desc', 'desc': 'default' } as const;
        setSortOrder(next[sortOrder]);
    };

    const toggleFilter = () => {
        const next = { 'all': 'owned', 'owned': 'not-owned', 'not-owned': 'all' } as const;
        setFilterOwned(next[filterOwned]);
    };

    return (
        <div className="research-container">
            <div className="research-header">
                <h2>Research - Turn {currentTurnId}</h2>

                <div className="research-controls">
                    <input
                        type="text"
                        className="search-input"
                        placeholder="Search tech..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <button className="control-button" onClick={toggleSort}>
                        Sort: {sortOrder === 'default' ? 'Default' : sortOrder === 'asc' ? 'A-Z' : 'Z-A'}
                    </button>
                    <button className="control-button" onClick={toggleFilter}>
                        Filter: {filterOwned === 'all' ? 'All' : filterOwned === 'owned' ? 'Owned' : 'Not Owned'}
                    </button>
                </div>

                <div className="research-summary">
                    <span>Remaining RP: <span className={currentTurn.rp.remaining < 0 ? 'negative-text' : ''}>{currentTurn.rp.remaining}</span></span>
                </div>
            </div>

            <div className="research-table-container">
                <table className="research-table">
                    <thead>
                        <tr>
                            <th className="tech-name-header">Technology</th>
                            {levels.map(level => (
                                <th key={level}>Level {level}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {filteredGroups.map(groupName => {
                            const groupTechs = TECHNOLOGIES.filter(t => t.name === groupName);
                            const preOwnedLevel = getPreOwnedLevel(groupName);
                            const currentTurnPurchasedMax = getCurrentTurnPurchasedLevel(groupName);

                            // Calculate base level including 0-cost techs (auto-owned)
                            // If a tech has cost 0, we treat it as owned.
                            // We find the max level among 0-cost techs for this group.
                            const maxZeroCostLevel = Math.max(0, ...groupTechs.filter(t => t.cost === 0).map(t => t.level));

                            // Effective pre-owned is max of actual pre-owned and 0-cost levels
                            const effectivePreOwnedLevel = Math.max(preOwnedLevel, maxZeroCostLevel);

                            // Effective current level is the max of effective pre-owned and current-turn purchased
                            const effectiveCurrentLevel = Math.max(effectivePreOwnedLevel, currentTurnPurchasedMax);

                            return (
                                <tr key={groupName} className="tech-row">
                                    <td className="tech-name-cell">{groupName}</td>
                                    {levels.map(level => {
                                        const tech = groupTechs.find(t => t.level === level);

                                        // State determination
                                        const isPreOwned = level <= effectivePreOwnedLevel || (tech?.cost === 0);
                                        const isBoughtThisTurn = !isPreOwned && level <= currentTurnPurchasedMax;
                                        const isNextAvailable = !isPreOwned && !isBoughtThisTurn && level === effectiveCurrentLevel + 1;
                                        const isMultiLevelPurchase = isBoughtThisTurn && (level > effectivePreOwnedLevel + 1);
                                        const isMaxBought = level === currentTurnPurchasedMax;

                                        let cellClass = 'tech-cell';
                                        if (!tech) {
                                            cellClass += ' empty-cell';
                                            return <td key={level} className={cellClass}></td>;
                                        }

                                        if (isPreOwned) cellClass += ' owned-cell';
                                        else if (isBoughtThisTurn) {
                                            cellClass += ' current-turn-cell clickable';
                                            if (!isMaxBought) cellClass += ' locked-refund';
                                        } else if (isNextAvailable) cellClass += ' available-cell clickable';
                                        else cellClass += ' locked-cell';

                                        return (
                                            <td key={level} className={cellClass}>
                                                <div
                                                    className="cell-content"
                                                    onClick={() => {
                                                        if (readOnly) return;
                                                        if (isBoughtThisTurn && isMaxBought) handleRemove(tech);
                                                        else if (isNextAvailable) handleBuy(tech);
                                                    }}
                                                    title={
                                                        readOnly ? "Historical turn (Read Only)" :
                                                            isBoughtThisTurn
                                                                ? (isMaxBought ? "Click to Refund" : "Remove higher levels first")
                                                                : isNextAvailable ? "Click to Buy" : ""
                                                    }
                                                >
                                                    <div className="status-slot">
                                                        {isPreOwned && <span className="check-icon">✓</span>}
                                                        {isBoughtThisTurn && <span className="check-icon new">✓</span>}
                                                        {isMultiLevelPurchase && <span className="warning-icon" title="Warning: Purchasing multiple levels in one turn">⚠️</span>}
                                                        {!isPreOwned && !isBoughtThisTurn && !isNextAvailable && <span className="lock-icon">🔒</span>}
                                                    </div>

                                                    <div className="cost-slot">
                                                        {isBoughtThisTurn ? (
                                                            <span className="cost-label">Refund {tech.cost}</span>
                                                        ) : (
                                                            <span className={isPreOwned ? "cost-label-owned" : isNextAvailable ? "cost-label" : "cost-label-locked"}>
                                                                {!isPreOwned && tech.cost > 0 ? `${tech.cost} RP` : ''}
                                                            </span>
                                                        )}
                                                    </div>

                                                    <div className="title-slot">
                                                        {tech.title && <div className="tech-title">{tech.title}</div>}
                                                    </div>

                                                    <div className="desc-slot">
                                                        <span className="cell-desc">{tech.description}</span>
                                                    </div>
                                                </div>
                                            </td>
                                        );
                                    })}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
