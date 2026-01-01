import React, { useState } from 'react';
import { type TurnData } from '../types';
import { Cell } from './Cell';
import './EconomyGrid.css';
import { TECHNOLOGIES } from '../data/technologies';
import { ConfirmModal } from './ConfirmModal';

interface EconomyGridProps {
    turns: TurnData[];
    currentTurnId: number;
    onTurnClick: (id: number) => void;
    onUpdate: (turnIndex: number, section: keyof TurnData, field: string, value: any) => void;
    onBatchUpdate: (turnIndex: number, updates: { section: keyof TurnData, field: string, value: any }[]) => void;
    onAddTurn: () => void;
    onDeleteTurn: () => void;
}

export const EconomyGrid: React.FC<EconomyGridProps> = ({
    turns,
    currentTurnId,
    onTurnClick,
    onUpdate,
    onBatchUpdate,
    onAddTurn,
    onDeleteTurn
}) => {
    const handleUpdate = onUpdate;
    const [confirmConfig, setConfirmConfig] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
        isDanger?: boolean;
        confirmText?: string;
        cancelText?: string;
        onExtraAction?: () => void;
        extraActionText?: string;
        extraActionClass?: string;
    }>({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => { },
        onExtraAction: undefined,
        extraActionText: '',
        extraActionClass: ''
    });

    const isPastTurn = (turnId: number) => turnId < turns[turns.length - 1].id;

    const handleAutoAdjustAndAdd = (turn: TurnData) => {
        const turnIndex = turns.findIndex(t => t.id === turn.id);
        const updates: { section: keyof TurnData, field: string, value: any }[] = [];

        if (turn.lp.remaining < 0) updates.push({ section: 'lp', field: 'adjustment', value: turn.lp.adjustment + Math.abs(turn.lp.remaining) });
        if (turn.cp.remaining < 0) updates.push({ section: 'cp', field: 'adjustment', value: turn.cp.adjustment + Math.abs(turn.cp.remaining) });
        if (turn.rp.remaining < 0) updates.push({ section: 'rp', field: 'adjustment', value: turn.rp.adjustment + Math.abs(turn.rp.remaining) });
        if (turn.tp.remaining < 0) updates.push({ section: 'tp', field: 'adjustment', value: turn.tp.adjustment + Math.abs(turn.tp.remaining) });

        if (updates.length > 0) {
            onBatchUpdate(turnIndex, updates);
        }

        onAddTurn();
        setConfirmConfig(prev => ({ ...prev, isOpen: false }));
    };

    const handleAddTurn = (e: React.MouseEvent) => {
        e.stopPropagation();
        const lastTurn = turns[turns.length - 1];
        const hasNegative = lastTurn.lp.remaining < 0 || lastTurn.cp.remaining < 0 || lastTurn.rp.remaining < 0 || lastTurn.tp.remaining < 0;

        if (hasNegative) {
            setConfirmConfig({
                isOpen: true,
                title: 'Negative Balances Detected',
                message: 'You cannot start a new economic phase while you have negative remaining balances. Would you like to auto-adjust these balances to 0 using the adjustment fields and proceed?',
                confirmText: 'Auto-adjust & Proceed',
                cancelText: 'Cancel',
                onConfirm: () => handleAutoAdjustAndAdd(lastTurn)
            });
            return;
        }

        setConfirmConfig({
            isOpen: true,
            title: 'New Economic Phase',
            message: 'Are you sure you want to add a new turn? You will no longer be able to edit the previous turns once the new one is created.',
            confirmText: 'CONFIRM',
            cancelText: 'CANCEL',
            onConfirm: () => {
                onAddTurn();
                setConfirmConfig(prev => ({ ...prev, isOpen: false }));
            }
        });
    };

    const handleDeleteTurn = (e: React.MouseEvent) => {
        e.stopPropagation();

        setConfirmConfig({
            isOpen: true,
            title: 'Delete Economic Phase',
            message: "WARNING: Deleting this turn will UNDO and permanently delete ALL data entered for this economic phase (fleet purchases, research, resource adjustments, and income). This action cannot be reversed. Are you sure you want to proceed?",
            onConfirm: () => {
                onDeleteTurn();
                setConfirmConfig(prev => ({ ...prev, isOpen: false }));
            },
            isDanger: true
        });
    };

    const getTechCost = (techStr: string): number => {
        const lastSpaceIndex = techStr.lastIndexOf(' ');
        const name = techStr.substring(0, lastSpaceIndex);
        const level = parseInt(techStr.substring(lastSpaceIndex + 1));

        const tech = TECHNOLOGIES.find(t => t.name === name && t.level === level);
        return tech ? tech.cost : 0;
    };


    // Helper to render a standard row of cells
    const renderRow = (
        label: string,
        section: keyof TurnData | 'derived',
        field: string | null,
        isExpense: boolean = false,
        isReadOnly: boolean = false,
        isHeaderLabel: boolean = false,
        customRender?: (turn: TurnData, index: number) => React.ReactNode,
        isAdjustment: boolean = false,
        isNewSection: boolean = false,
        sectionClass: string = ''
    ) => (
        <tr className={`${isAdjustment ? 'adjustment-row' : ''} ${isNewSection ? 'new-section' : ''} ${sectionClass}`}>
            <td className={`sticky-col ${isHeaderLabel ? 'header-label' : ''}`}>
                <div className="grid-label">{label}</div>
            </td>
            {turns.map((turn, index) => {
                const isCurrent = turn.id === currentTurnId;
                const cellClass = isCurrent ? 'current-turn-col' : '';

                if (customRender) {
                    return (
                        <td key={turn.id} className={cellClass}>
                            {customRender(turn, index)}
                        </td>
                    );
                }

                if (section === 'derived' || !field) return <td key={turn.id} className={cellClass}></td>;

                // @ts-ignore
                const value = turn[section][field];

                return (
                    <td key={turn.id} className={cellClass}>
                        <Cell
                            value={value}
                            onChange={(v) => handleUpdate(index, section as keyof TurnData, field, v)}
                            readOnly={isReadOnly || isPastTurn(turn.id)}
                            isExpense={isExpense}
                        />
                    </td>
                );
            })}
            {/* Empty cell for Add/Delete Turn column */}
            <td></td>
        </tr>
    );

    return (
        <div className="economy-grid-container">
            <div className="economy-table-container">
                <table className="economy-table">
                    <thead>
                        <tr>
                            <th className="sticky-col top-left">
                                <div className="grid-label header-label">Economic Phase</div>
                            </th>
                            {turns.map(turn => (
                                <th
                                    key={turn.id}
                                    className={`sticky-header ${turn.id === currentTurnId ? 'current-turn-header' : ''}`}
                                    onClick={() => onTurnClick(turn.id)}
                                    style={{ cursor: 'pointer' }}
                                >
                                    {isPastTurn(turn.id) && <span className="lock-icon-header">🔒</span>}
                                    {turn.id}
                                </th>
                            ))}
                            <th className="sticky-header add-turn-th">
                                <div className="turn-controls">
                                    <button className="add-turn-button" onClick={(e) => handleAddTurn(e)} title="Add New Turn">+</button>
                                    {turns.length > 1 && (
                                        <button className="delete-turn-button" onClick={(e) => handleDeleteTurn(e)} title="Delete Last Turn">−</button>
                                    )}
                                </div>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {/* LP Section */}
                        {renderRow("Logistic Points (LP) Carry over (unlimited)", 'lp', 'carryOver', false, true, false, undefined, false, false, 'section-lp')}
                        {renderRow("+ Colony/Facility LPs", 'lp', 'income', false, false, false, (turn) => (
                            <div className="income-cell-wrapper">
                                <Cell value={turn.lp.income} readOnly />
                                {turn.lp.planetContributions && turn.lp.planetContributions.length > 0 && (
                                    <div className="contribution-badges">
                                        {turn.lp.planetContributions.map((c, i) => (
                                            <span key={i} className="contribution-badge lp" title={`${c.planetName}: +${c.amount} LP`}>
                                                {c.planetName}: {c.amount}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ), false, false, 'section-lp')}
                        {renderRow("Total Maintenance Required", 'lp', 'totalMaintenance', false, true, false, (turn) => (
                            <div className="income-cell-wrapper">
                                <Cell value={turn.lp.totalMaintenance} readOnly />
                                {turn.lp.maintenanceContributions && turn.lp.maintenanceContributions.length > 0 && (
                                    <div className="contribution-badges">
                                        {turn.lp.maintenanceContributions.map((c, i) => (
                                            <span key={i} className="contribution-badge lp">
                                                {c}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ), false, false, 'section-lp')}
                        {renderRow("- Maintenance", 'lp', 'maintenance', true, true, false, undefined, false, false, 'section-lp')}
                        {renderRow("- Turn order bid", 'lp', 'bid', true, false, false, undefined, false, false, 'section-lp')}
                        {renderRow("- LPs placed on LC colonies", 'lp', 'placedOnLC', true, false, false, undefined, false, false, 'section-lp')}
                        {renderRow("LP Adjustment (+/-)", 'lp', 'adjustment', false, false, false, undefined, true, false, 'section-lp')}
                        {renderRow("Remaining LP (unlimited)", 'derived', null, false, true, true, (turn) => (
                            <Cell
                                value={turn.lp.remaining}
                                readOnly
                                className="highlight-cell"
                                renderContent={(val) => <>{val}</>}
                            />
                        ), false, false, 'section-lp')}

                        {/* CP Section */}
                        {renderRow("Construction Points (CP) Carry over", 'cp', 'carryOver', false, true, false, undefined, false, true, 'section-cp')}
                        {renderRow("+ Colony/Facility CPs", 'cp', 'income', false, false, false, (turn) => (
                            <div className="income-cell-wrapper">
                                <Cell value={turn.cp.income} readOnly />
                                {turn.cp.planetContributions && turn.cp.planetContributions.length > 0 && (
                                    <div className="contribution-badges">
                                        {turn.cp.planetContributions.map((c, i) => (
                                            <span key={i} className="contribution-badge cp" title={`${c.planetName}: +${c.amount} CP`}>
                                                {c.planetName}: {c.amount}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ), false, false, 'section-cp')}
                        {renderRow("+ Mineral/Resource Card CPs", 'cp', 'mineralCards', false, false, false, undefined, false, false, 'section-cp')}
                        {renderRow("+ MS Pipeline CPs", 'cp', 'pipeline', false, false, false, undefined, false, false, 'section-cp')}

                        {/* Total CP (Subtotal) */}
                        {renderRow("Total CP (Subtotal)", 'derived', null, false, true, true, (turn) => (
                            <Cell
                                value={turn.cp.carryOver + turn.cp.income + turn.cp.mineralCards + turn.cp.pipeline}
                                readOnly
                                className="subtotal-cell"
                            />
                        ), false, false, 'section-cp')}


                        {renderRow("- 3x Penalty LPs", 'cp', 'penalty', true, true, false, undefined, false, false, 'section-cp')}

                        {/* Subtotal (After Penalty) */}
                        {renderRow("Subtotal (After Penalty)", 'derived', null, false, true, true, (turn) => (
                            <Cell
                                value={(turn.cp.carryOver + turn.cp.income + turn.cp.mineralCards + turn.cp.pipeline) - turn.cp.penalty}
                                readOnly
                                className="subtotal-cell"
                            />
                        ), false, false, 'section-cp')}

                        {/* Units Purchased */}
                        <tr className="tech-display-row section-cp">
                            <td className="sticky-col">
                                <div className="grid-label">- Purchases</div>
                            </td>
                            {turns.map(turn => (
                                <td key={turn.id} className={turn.id === currentTurnId ? 'current-turn-col' : ''}>
                                    <div className="tech-display-cell">
                                        {turn.cp.purchasedUnits && turn.cp.purchasedUnits.length > 0 ? (
                                            <div className="tech-tags">
                                                {turn.cp.purchasedUnits.map((unit, i) => (
                                                    <span key={i} className="tech-tag">
                                                        {unit}
                                                    </span>
                                                ))}
                                            </div>
                                        ) : (
                                            <span className="empty-tech">-</span>
                                        )}
                                    </div>
                                </td>
                            ))}
                            <td></td>
                        </tr>

                        {/* Units Upgraded */}
                        <tr className="tech-display-row section-cp">
                            <td className="sticky-col">
                                <div className="grid-label">CP spent on upgrades</div>
                            </td>
                            {turns.map(turn => (
                                <td key={turn.id} className={turn.id === currentTurnId ? 'current-turn-col' : ''}>
                                    <div className="tech-display-cell">
                                        {turn.cp.upgradedUnits && turn.cp.upgradedUnits.length > 0 ? (
                                            <div className="tech-tags">
                                                {turn.cp.upgradedUnits.map((unit, i) => (
                                                    <span key={i} className="tech-tag">
                                                        {unit}
                                                    </span>
                                                ))}
                                            </div>
                                        ) : (
                                            <span className="empty-tech">-</span>
                                        )}
                                    </div>
                                </td>
                            ))}
                            <td></td>
                        </tr>

                        {renderRow("CP Adjustment (+/-)", 'cp', 'adjustment', false, false, false, undefined, true, false, 'section-cp')}

                        {renderRow("Remaining CP (30 Max)", 'derived', null, false, true, true, (turn) => (
                            <Cell
                                value={turn.cp.remaining}
                                readOnly
                                className={`highlight-cell ${turn.cp.remaining > 30 ? 'warning-cell' : ''}`}
                                renderContent={(val) => (
                                    <>
                                        {val}
                                        {turn.cp.remaining > 30 && <span className="warning-icon-small" title="Carry over limit exceeded">⚠️</span>}
                                    </>
                                )}
                            />
                        ), false, false, 'section-cp')}

                        {/* RP Section */}
                        {renderRow("Research Points (RP) Carry over", 'rp', 'carryOver', false, true, false, undefined, false, true, 'section-rp')}
                        {renderRow("RP Income", 'rp', 'income', false, false, false, (turn) => (
                            <div className="income-cell-wrapper">
                                <Cell value={turn.rp.income} readOnly />
                                {turn.rp.planetContributions && turn.rp.planetContributions.length > 0 && (
                                    <div className="contribution-badges">
                                        {turn.rp.planetContributions.map((c, i) => (
                                            <span key={i} className="contribution-badge rp" title={`${c.planetName}: +${c.amount} RP`}>
                                                {c.planetName}: {c.amount}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ), false, false, 'section-rp')}
                        {renderRow("RP Spending", 'rp', 'spending', true, false, false, undefined, false, false, 'section-rp')}

                        {/* Techs Purchased - Special Row */}
                        <tr className="tech-display-row section-rp">
                            <td className="sticky-col">
                                <div className="grid-label">Techs Purchased</div>
                            </td>
                            {turns.map(turn => (
                                <td key={turn.id} className={turn.id === currentTurnId ? 'current-turn-col' : ''}>
                                    <div className="tech-display-cell">
                                        {turn.rp.purchasedTechs && turn.rp.purchasedTechs.length > 0 ? (
                                            <div className="tech-tags">
                                                {turn.rp.purchasedTechs.map((techStr, i) => (
                                                    <span key={i} className="tech-tag">
                                                        {techStr} ({getTechCost(techStr)})
                                                    </span>
                                                ))}
                                            </div>
                                        ) : (
                                            <span className="empty-tech">-</span>
                                        )}
                                    </div>
                                </td>
                            ))}
                            <td></td>
                        </tr>

                        {renderRow("RP Adjustment (+/-)", 'rp', 'adjustment', false, false, false, undefined, true, false, 'section-rp')}

                        {renderRow("Remaining RP (30 Max)", 'derived', null, false, true, true, (turn) => (
                            <Cell
                                value={turn.rp.remaining}
                                readOnly
                                className={`highlight-cell ${turn.rp.remaining < 0 ? 'negative-cell' : ''} ${turn.rp.remaining > 30 ? 'warning-cell' : ''}`}
                                renderContent={(val) => (
                                    <>
                                        {val}
                                        {turn.rp.remaining > 30 && <span className="warning-icon-small" title="Carry over limit exceeded">⚠️</span>}
                                    </>
                                )}
                            />
                        ), false, false, 'section-rp')}

                        {/* TP Section */}
                        {renderRow("Temporal Points (TP) Carry over", 'tp', 'carryOver', false, true, false, undefined, false, true, 'section-tp')}
                        {renderRow("+ Colony/Facility TPs", 'tp', 'income', false, false, false, (turn) => (
                            <div className="income-cell-wrapper">
                                <Cell value={turn.tp.income} readOnly />
                                {turn.tp.planetContributions && turn.tp.planetContributions.length > 0 && (
                                    <div className="contribution-badges">
                                        {turn.tp.planetContributions.map((c, i) => (
                                            <span key={i} className="contribution-badge tp" title={`${c.planetName}: +${c.amount} TP`}>
                                                {c.planetName}: {c.amount}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ), false, false, 'section-tp')}
                        {renderRow("- TP spending", 'tp', 'spending', true, false, false, undefined, false, false, 'section-tp')}
                        {renderRow("TP Adjustment (+/-)", 'tp', 'adjustment', false, false, false, undefined, true, false, 'section-tp')}
                        {renderRow("Remaining TP (unlimited)", 'derived', null, false, true, true, (turn) => (
                            <Cell value={turn.tp.remaining} readOnly className="highlight-cell" />
                        ), false, false, 'section-tp')}
                    </tbody>
                </table>
            </div>

            <ConfirmModal
                isOpen={confirmConfig.isOpen}
                title={confirmConfig.title}
                message={confirmConfig.message}
                onConfirm={confirmConfig.onConfirm}
                onCancel={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
                isDanger={confirmConfig.isDanger}
                onExtraAction={confirmConfig.onExtraAction}
                extraActionText={confirmConfig.extraActionText}
                extraActionClass={confirmConfig.extraActionClass}
            />
        </div>
    );
};

