import React, { useState } from 'react';
import type { TurnData, PlanetData, FacilityType, PlanetType } from '../types';
import HudOverlay from './HudOverlay';
import { ConfirmModal } from './ConfirmModal';
import './PlanetsTab.css';

interface PlanetsTabProps {
    currentTurn: TurnData;
    updateCurrentTurn: (data: TurnData) => void;
    onRenamePlanetGlobal: (planetId: string, newName: string) => void;
    showHud?: boolean;
    readOnly?: boolean;
}

const COLONY_IMAGES = [
    '/images/planets/colony_1.jpg',
    '/images/planets/colony_2.jpg',
    '/images/planets/colony_3.jpg',
    '/images/planets/colony_4.jpg',
    '/images/planets/colony_5.jpg',
    '/images/planets/colony_6.jpg',
    '/images/planets/colony_7.jpg',
    '/images/planets/colony_8.jpg',
    '/images/planets/colony_9.jpg',
    '/images/planets/colony_10.jpg',
    '/images/planets/colony_11.jpg',
    '/images/planets/colony_12.jpg',
    '/images/planets/colony_13.jpg',
    '/images/planets/colony_14.jpg',
    '/images/planets/colony_15.jpg',
    '/images/planets/colony_16.jpg',
    '/images/planets/colony_17.jpg',
    '/images/planets/colony_18.jpg',
    '/images/planets/colony_19.jpg',
    '/images/planets/colony_20.jpg',
];

const PlanetsTab: React.FC<PlanetsTabProps> = ({ currentTurn, updateCurrentTurn, onRenamePlanetGlobal, showHud = false, readOnly = false }) => {
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
    const [confirmRemoveFac, setConfirmRemoveFac] = useState<{ planetId: string, type: FacilityType } | null>(null);
    const [confirmConquerId, setConfirmConquerId] = useState<string | null>(null);

    const handleAddColony = () => {
        const usedImages = currentTurn.planets
            .filter(p => p.type === 'Colony' && p.image)
            .map(p => p.image!);

        let availableImages = COLONY_IMAGES.filter(img => !usedImages.includes(img));
        if (availableImages.length === 0) {
            availableImages = COLONY_IMAGES;
        }
        const randomImage = availableImages[Math.floor(Math.random() * availableImages.length)];

        const newColony: PlanetData = {
            id: `colony-${Date.now()}`,
            name: `Colony ${currentTurn.planets.filter(p => p.type === 'Colony').length + 1}`,
            type: 'Colony',
            cp: 0,
            facilities: [],
            image: randomImage,
            isNewlyAdded: true
        };
        updateCurrentTurn({
            ...currentTurn,
            planets: [...currentTurn.planets, newColony]
        });
    };

    const handleRemovePlanet = (id: string) => {
        setConfirmDeleteId(id);
    };

    const confirmRemovePlanet = () => {
        if (!confirmDeleteId) return;
        updateCurrentTurn({
            ...currentTurn,
            planets: currentTurn.planets.filter(p => p.id !== confirmDeleteId),
            deletedPlanetIds: [...(currentTurn.deletedPlanetIds || []), confirmDeleteId]
        });
        setConfirmDeleteId(null);
    };

    const handleConquer = (id: string) => {
        setConfirmConquerId(id);
    };

    const confirmConquer = () => {
        if (!confirmConquerId) return;
        const planet = currentTurn.planets.find(p => p.id === confirmConquerId);
        if (!planet) return;

        updatePlanet(confirmConquerId, {
            isConquered: true,
            facilities: planet.facilities.map(f =>
                f.builtTurnId === currentTurn.id ? { ...f, builtTurnId: -1 } : f
            )
        });
        setConfirmConquerId(null);
    };

    const updatePlanet = (id: string, updates: Partial<PlanetData>) => {
        updateCurrentTurn({
            ...currentTurn,
            planets: currentTurn.planets.map(p => p.id === id ? { ...p, ...updates } : p)
        });
    };

    const handleAddFacility = (planetId: string, type: FacilityType) => {
        const planet = currentTurn.planets.find(p => p.id === planetId);
        if (!planet) return;

        // Smart Restoration Logic
        if (planet.demolishedFacilities) {
            const demolished = planet.demolishedFacilities.find(df => df.type === type);
            if (demolished) {
                updatePlanet(planetId, {
                    facilities: [...planet.facilities, { type, builtTurnId: demolished.originalBuiltTurnId }],
                    demolishedFacilities: planet.demolishedFacilities.filter(df => df.type !== type)
                });
                return;
            }
        }

        const newFacility = { type, builtTurnId: planet.isConquered ? -1 : currentTurn.id };
        updatePlanet(planetId, {
            facilities: [...planet.facilities, newFacility]
        });
    };

    const handleRemoveFacility = (planetId: string, type: FacilityType) => {
        const planet = currentTurn.planets.find(p => p.id === planetId);
        if (!planet) return;

        const facility = planet.facilities.find(f => f.type === type);
        if (!facility) return;

        // If active, ask for confirmation
        if (facility.builtTurnId < currentTurn.id) {
            setConfirmRemoveFac({ planetId, type });
        } else {
            // Immediate removal for pending facilities
            updatePlanet(planetId, {
                facilities: planet.facilities.filter(f => f.type !== type)
            });
        }
    };

    const confirmRemoveFacility = () => {
        if (!confirmRemoveFac) return;
        const { planetId, type } = confirmRemoveFac;
        const planet = currentTurn.planets.find(p => p.id === planetId);
        if (!planet) return;

        const facility = planet.facilities.find(f => f.type === type);
        if (!facility) return;

        updatePlanet(planetId, {
            facilities: planet.facilities.filter(f => f.type !== type),
            demolishedFacilities: [
                ...(planet.demolishedFacilities || []),
                { type, originalBuiltTurnId: facility.builtTurnId }
            ]
        });
        setConfirmRemoveFac(null);
    };

    const getCPLevels = (type: PlanetType) => {
        return type === 'Homeworld' ? [0, 5, 10, 15, 20] : [0, 1, 3, 5];
    };

    const getFacilityFullName = (type: FacilityType) => {
        const names: Record<FacilityType, string> = {
            'IC': 'Industrial Center',
            'RC': 'Research Center',
            'TC': 'Temporal Center',
            'LC': 'Logistic Center'
        };
        return `${names[type]} (${type})`;
    };

    return (
        <div className="planets-tab">

            <div className="planets-grid">
                {currentTurn.planets.map(planet => {
                    const isHomeworld = planet.type === 'Homeworld';
                    const maxFacilities = isHomeworld ? 2 : 1;
                    const cpLevels = getCPLevels(planet.type);
                    const activeFacilities = planet.facilities.filter(f => f.builtTurnId < currentTurn.id);

                    const productionSummary = isHomeworld ? (
                        (() => {
                            const totals = { CP: planet.cp, LP: 0, RP: 0, TP: 0 };
                            activeFacilities.forEach(f => {
                                if (f.type === 'IC') totals.CP += 5;
                                else if (f.type === 'RC') totals.RP += 5;
                                else if (f.type === 'TC') totals.TP += 5;
                                else if (f.type === 'LC') totals.LP += 5;
                            });
                            const parts = [];
                            if (totals.CP > 0) parts.push(`${totals.CP} CP`);
                            if (totals.LP > 0) parts.push(`${totals.LP} LP`);
                            if (totals.RP > 0) parts.push(`${totals.RP} RP`);
                            if (totals.TP > 0) parts.push(`${totals.TP} TP`);
                            return `Produces ${parts.join(' + ')}`;
                        })()
                    ) : (
                        activeFacilities.length > 0 ? (
                            (() => {
                                const typeNames: Record<FacilityType, string> = {
                                    'IC': 'CP',
                                    'RC': 'RP',
                                    'TC': 'TP',
                                    'LC': 'LP'
                                };
                                return `Produces ${planet.cp + 5} ${typeNames[activeFacilities[0].type]}`;
                            })()
                        ) : (
                            `Produces ${planet.cp} CP`
                        )
                    );

                    return (
                        <div key={planet.id} className={`planet-card ${isHomeworld ? 'homeworld' : ''}`}>
                            <div className="planet-illustration-container">
                                {planet.image ? (
                                    <HudOverlay enabled={showHud} imgSrc={planet.image} isPlanet={true}>
                                        <img src={planet.image} alt={planet.name} className="planet-image" />
                                    </HudOverlay>
                                ) : (
                                    <div className="planet-illustration-placeholder">
                                        <div className="square-placeholder">No Illustration</div>
                                    </div>
                                )}

                                <div className="planet-floating-header">
                                    <div className="planet-header-left">
                                        <input
                                            className="planet-name-badge"
                                            value={planet.name}
                                            onChange={(e) => onRenamePlanetGlobal(planet.id, e.target.value)}
                                            title="Click to rename"
                                        />
                                        <div className="planet-production-badge">
                                            {productionSummary}
                                        </div>
                                    </div>
                                    <div className="planet-header-right">
                                        <div className="planet-actions-top-row">
                                            <span className="planet-type-badge">{planet.type}</span>
                                            {!isHomeworld && (
                                                <button
                                                    className="remove-colony-badge-btn"
                                                    onClick={() => !readOnly && handleRemovePlanet(planet.id)}
                                                    disabled={readOnly}
                                                    title={readOnly ? "Read Only" : "Remove Colony"}
                                                >×</button>
                                            )}
                                        </div>
                                        {!isHomeworld && planet.isNewlyAdded && !planet.isConquered && (
                                            <button
                                                className="conquer-colony-btn"
                                                onClick={() => !readOnly && handleConquer(planet.id)}
                                                disabled={readOnly}
                                                title={readOnly ? "Read Only" : "Conquer Colony"}
                                            >CONQUER</button>
                                        )}
                                    </div>
                                </div>

                                <div className="planet-floating-footer">
                                    <div className="planet-footer-left">
                                        <div className="cp-buttons-mini">
                                            {cpLevels.map(level => (
                                                <button
                                                    key={level}
                                                    className={`cp-btn-mini ${planet.cp === level ? 'active' : ''}`}
                                                    disabled={readOnly}
                                                    onClick={() => !readOnly && updatePlanet(planet.id, { cp: level, isManualCP: true })}
                                                >
                                                    {level}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="planet-footer-right">
                                        <div className="facility-badges-container">
                                            {planet.facilities.map(fac => {
                                                const isUnderConstruction = fac.builtTurnId === currentTurn.id;
                                                const fullName = getFacilityFullName(fac.type).split(' (')[0];

                                                if (isUnderConstruction) {
                                                    return (
                                                        <div
                                                            key={fac.type}
                                                            className={`facility-under-construction ${fac.type.toLowerCase()} ${readOnly ? 'readonly' : ''}`}
                                                            onClick={() => !readOnly && handleRemoveFacility(planet.id, fac.type)}
                                                            title={readOnly ? "Read Only" : "Click to cancel construction"}
                                                        >
                                                            <span className="fac-name">{fullName}</span>
                                                            <span className="fac-status">Under Construction</span>
                                                        </div>
                                                    );
                                                } else {
                                                    const acronym = fac.type;
                                                    return (
                                                        <div
                                                            key={fac.type}
                                                            className={`facility-active-badge ${fac.type.toLowerCase()} ${readOnly ? 'readonly' : ''}`}
                                                            title={readOnly ? "Read Only" : `Remove ${getFacilityFullName(fac.type)}`}
                                                            onClick={() => !readOnly && handleRemoveFacility(planet.id, fac.type)}
                                                        >
                                                            {fullName} ({acronym})
                                                        </div>
                                                    );
                                                }
                                            })}

                                            {planet.facilities.length < maxFacilities && (
                                                <div className="facility-build-btns">
                                                    {(['IC', 'LC', 'RC', 'TC'] as FacilityType[])
                                                        .filter(type => isHomeworld || !planet.facilities.some(f => f.type === type))
                                                        .map(type => (
                                                            <button
                                                                key={type}
                                                                className={`build-fac-btn ${type.toLowerCase()}`}
                                                                disabled={readOnly}
                                                                onClick={() => !readOnly && handleAddFacility(planet.id, type)}
                                                                title={readOnly ? "Read Only" : `Build ${getFacilityFullName(type)} (5 CP)`}
                                                            >
                                                                <span className="fac-name">{getFacilityFullName(type).split(' (')[0]}</span>
                                                                <span className="fac-status">Build Facility</span>
                                                            </button>
                                                        ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}

                <button className="add-planet-card" onClick={handleAddColony} disabled={readOnly} title={readOnly ? "Read Only" : "Add Colony"}>
                    <div className="add-planet-content">
                        <span className="add-icon">+</span>
                        <span className="add-text">Add Colony</span>
                    </div>
                </button>
            </div>

            <ConfirmModal
                isOpen={confirmDeleteId !== null}
                title="Remove Planet"
                message="Are you sure you want to remove this planet? This action cannot be undone."
                onConfirm={confirmRemovePlanet}
                onCancel={() => setConfirmDeleteId(null)}
                confirmText="Remove"
                cancelText="Keep Planet"
                isDanger={true}
            />

            <ConfirmModal
                isOpen={confirmConquerId !== null}
                title="Conquer Colony"
                message="Are you sure you want to conquer this colony? This will make all facility constructions on this planet INSTANT and FREE. This action is irreversible."
                onConfirm={confirmConquer}
                onCancel={() => setConfirmConquerId(null)}
                confirmText="Conquer"
                cancelText="Cancel"
                isDanger={false}
            />

            <ConfirmModal
                isOpen={confirmRemoveFac !== null}
                title="Demolish Facility"
                message={`Are you sure you want to demolish the ${confirmRemoveFac ? getFacilityFullName(confirmRemoveFac.type).split(' (')[0] : ''}? This action cannot be undone.`}
                onConfirm={confirmRemoveFacility}
                onCancel={() => setConfirmRemoveFac(null)}
                confirmText="Demolish"
                cancelText="Keep Facility"
                isDanger={true}
            />
        </div >
    );
};

export default PlanetsTab;
