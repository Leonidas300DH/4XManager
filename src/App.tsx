import { useState, useEffect } from 'react';
import './styles/variables.css';
import './App.css';
import { EconomyGrid } from './components/EconomyGrid';
import { ResearchTab } from './components/ResearchTab';
import { FleetTab } from './components/FleetTab';
import PlanetsTab from './components/PlanetsTab';
import LogTab from './components/LogTab';
import DashboardTab from './components/DashboardTab';
import SettingsModal from './components/SettingsModal';
import { INITIAL_TURN_DATA, DEFAULT_SETTINGS, type TurnData, type AppSettings } from './types';
import { calculateTurns } from './utils/calculations';

function App() {
  const [activeTab, setActiveTab] = useState('economy');
  const [currentTurnId, setCurrentTurnId] = useState<number>(1);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('4x_app_settings');
    return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
  });

  const [turns, setTurns] = useState<TurnData[]>(() => {
    const saved = localStorage.getItem('4x_save_data');
    if (saved) {
      try {
        return calculateTurns(JSON.parse(saved));
      } catch (e) {
        return [{ ...INITIAL_TURN_DATA, id: 1 }];
      }
    }
    return [{ ...INITIAL_TURN_DATA, id: 1 }];
  });

  // Apply colors and HUD status
  useEffect(() => {
    localStorage.setItem('4x_app_settings', JSON.stringify(settings));

    // Apply colors to CSS variables
    const root = document.documentElement;
    root.style.setProperty('--cp-color', settings.colors.cp);
    root.style.setProperty('--lp-color', settings.colors.lp);
    root.style.setProperty('--rp-color', settings.colors.rp);
    root.style.setProperty('--tp-color', settings.colors.tp);
  }, [settings]);

  // Auto-save game data
  useEffect(() => {
    localStorage.setItem('4x_save_data', JSON.stringify(turns));
  }, [turns]);

  const handleNewGame = () => {
    if (window.confirm('WARNING: This will permanently delete your current session data. Proceed with a NEW MISSION?')) {
      const resetTurns: TurnData[] = [{ ...INITIAL_TURN_DATA, id: 1 }];
      setTurns(resetTurns);
      setCurrentTurnId(1);
      setIsSettingsOpen(false);
    }
  };

  const addTurn = () => {
    const nextId = turns.length + 1;
    setTurns(prev => {
      const lastTurn = prev[prev.length - 1];
      const newTurn: TurnData = JSON.parse(JSON.stringify(lastTurn));

      newTurn.id = nextId;
      newTurn.logCommentary = "";

      // Reset current turn specific fields
      newTurn.lp.bid = 0;
      newTurn.lp.placedOnLC = 0;
      newTurn.lp.adjustment = 0;

      newTurn.cp.purchases = 0;
      newTurn.cp.adjustment = 0;
      newTurn.cp.purchasedUnits = [];
      newTurn.cp.upgradedUnits = [];
      newTurn.cp.spentOnUpgrades = 0;

      newTurn.rp.spending = 0;
      newTurn.rp.adjustment = 0;
      newTurn.rp.purchasedTechs = [];

      newTurn.tp.spending = 0;
      newTurn.tp.adjustment = 0;

      // Reset current turn specific fields in the new turn's fleet
      Object.values(newTurn.fleet).forEach(f => {
        f.groups.forEach(g => {
          g.purchase = 0;
          g.adjust = 0;
          g.isUpgraded = false;
        });
      });

      return calculateTurns([...prev, newTurn]);
    });
    setCurrentTurnId(nextId);
  };

  const deleteTurn = () => {
    if (turns.length <= 1) return;

    const newLength = turns.length - 1;
    setTurns(prev => {
      const newTurns = prev.slice(0, -1);
      return calculateTurns(newTurns);
    });

    // Ensure we don't stay on a deleted turn
    setCurrentTurnId(prev => Math.min(prev, newLength));
  };

  const handleUpdate = (turnIndex: number, section: keyof TurnData, field: string, value: any) => {
    setTurns(prevTurns => {
      const newTurns = [...prevTurns];
      const turn = { ...newTurns[turnIndex] };
      const sectionData = { ...(turn[section] as any) };

      // Helper to set nested value
      const setNestedValue = (obj: any, path: string[], val: any): any => {
        const [current, ...rest] = path;
        if (rest.length === 0) {
          return { ...obj, [current]: val };
        }

        // Handle array vs object
        if (Array.isArray(obj[current])) {
          const newArray = [...obj[current]];
          newArray[Number(rest[0])] = setNestedValue(newArray[Number(rest[0])], rest.slice(1), val);
          return { ...obj, [current]: newArray };
        }

        return {
          ...obj,
          [current]: setNestedValue(obj[current] || {}, rest, val)
        };
      };

      if (field.includes('.')) {
        const path = field.split('.');
        (turn as any)[section] = setNestedValue(sectionData, path, value);
      } else {
        (sectionData as any)[field] = value;
        (turn as any)[section] = sectionData as any;
      }

      newTurns[turnIndex] = turn;
      return calculateTurns(newTurns);
    });
  };

  const handleSectionUpdate = (turnIndex: number, section: keyof TurnData, updates: Record<string, any>) => {
    setTurns(prevTurns => {
      const newTurns = [...prevTurns];
      // @ts-ignore
      (newTurns[turnIndex] as any) = {
        ...newTurns[turnIndex],
        [section]: {
          ...(newTurns[turnIndex][section] as any),
          ...updates
        }
      };
      return calculateTurns(newTurns);
    });
  };

  const updateCurrentTurnPlanets = (updatedTurn: TurnData) => {
    setTurns(prev => {
      const idx = prev.findIndex(t => t.id === updatedTurn.id);
      if (idx === -1) return prev;
      const newTurns = [...prev];
      newTurns[idx] = updatedTurn;
      return calculateTurns(newTurns);
    });
  };

  const renamePlanetGlobal = (planetId: string, newName: string) => {
    setTurns(prev => {
      const updatedTurns = prev.map(turn => ({
        ...turn,
        planets: turn.planets.map(p => p.id === planetId ? { ...p, name: newName } : p)
      }));
      return calculateTurns(updatedTurns);
    });
  };

  const handleLogUpdate = (turnId: number, comment: string) => {
    setTurns(prev => {
      const idx = prev.findIndex(t => t.id === turnId);
      if (idx === -1) return prev;
      const newTurns = [...prev];
      newTurns[idx] = { ...newTurns[idx], logCommentary: comment };
      return newTurns;
    });
  };

  const handleSaveGame = () => {
    // Standard "Save" - Fixed filename
    const data = JSON.stringify({ settings, turns }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `4x_manager_save.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportData = () => {
    // "Save As" - Timestamped filename
    const data = JSON.stringify({ settings, turns }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `4x_manager_save_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportData = (jsonStr: string) => {
    try {
      const data = JSON.parse(jsonStr);
      if (data.settings) setSettings(data.settings);
      if (data.turns) {
        setTurns(calculateTurns(data.turns));
        setCurrentTurnId(data.turns[data.turns.length - 1].id);
      }
      alert('Data stream synchronized successfully.');
    } catch (e) {
      alert('Error: Data corruption detected. Sync failed.');
    }
  };

  const currentTurnData = turns.find(t => t.id === currentTurnId) || turns[turns.length - 1];

  const renderResourceValue = (value: number, label: string) => (
    <div className={`resource-stat ${value < 0 ? 'resource-warning' : ''} ${label.toLowerCase()}`}>
      <span className="resource-label">{label}:</span>
      <span className="resource-value">{value}</span>
    </div>
  );

  const isReadOnly = currentTurnId < turns.length;

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-top-row">
          <div className="header-logo-group">
            <h1>Space Empires 4x</h1>
            <div className="header-actions">
              <button className="icon-btn" title="Open Systems Menu" onClick={() => setIsSettingsOpen(true)}>⚙️</button>
            </div>
          </div>
          <div className="header-stats">
            <div className="turn-navigation">
              <button
                className="nav-button"
                onClick={() => setCurrentTurnId(Math.max(1, currentTurnId - 1))}
                disabled={currentTurnId <= 1}
                title="Previous Turn"
              >
                &lsaquo;
              </button>
              <div className="turn-list">
                {(() => {
                  const visibleTurnIds = new Set<number>();
                  // Current selection and its neighbors
                  visibleTurnIds.add(currentTurnId);
                  if (currentTurnId > 1) visibleTurnIds.add(currentTurnId - 1);
                  if (currentTurnId < turns.length) visibleTurnIds.add(currentTurnId + 1);

                  // Always show the latest turn (the active one)
                  visibleTurnIds.add(turns.length);

                  const sortedIds = Array.from(visibleTurnIds).sort((a, b) => a - b);
                  const result: React.ReactNode[] = [];

                  for (let i = 0; i < sortedIds.length; i++) {
                    const id = sortedIds[i];
                    if (i > 0 && id - sortedIds[i - 1] > 1) {
                      result.push(<span key={`dots-${id}`} className="turn-dots">...</span>);
                    }
                    const turn = turns.find(t => t.id === id);
                    if (turn) {
                      result.push(
                        <button
                          key={turn.id}
                          className={`turn-item ${turn.id < turns.length ? 'past' : ''} ${turn.id === currentTurnId ? 'current' : ''}`}
                          onClick={() => setCurrentTurnId(turn.id)}
                        >
                          {turn.id < turns.length && <span className="lock-icon-btn">🔒</span>}
                          Turn {turn.id}
                        </button>
                      );
                    }
                  }
                  return result;
                })()}
              </div>
              <button
                className="nav-button"
                onClick={() => setCurrentTurnId(Math.min(turns.length, currentTurnId + 1))}
                disabled={currentTurnId >= turns.length}
                title="Next Turn"
              >
                &rsaquo;
              </button>
            </div>
            <div className="resources-display">
              {renderResourceValue(currentTurnData.cp.remaining, 'CP')}
              {renderResourceValue(currentTurnData.rp.remaining, 'RP')}
              {renderResourceValue(currentTurnData.lp.remaining, 'LP')}
              {renderResourceValue(currentTurnData.tp.remaining, 'TP')}
            </div>
          </div>
        </div>
        <nav className="app-tabs">
          <button
            className={`tab-button ${activeTab === 'economy' ? 'active' : ''}`}
            onClick={() => setActiveTab('economy')}
          >
            <svg className="tab-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 10h12" />
              <path d="M4 14h9" />
              <path d="M19 6a7.7 7.7 0 0 0-5.2-2A7.9 7.9 0 0 0 6 12c0 4.4 3.5 8 7.8 8 2 0 3.8-.8 5.2-2" />
            </svg>
            Economy
          </button>
          <button
            className={`tab-button ${activeTab === 'research' ? 'active' : ''}`}
            onClick={() => setActiveTab('research')}
          >
            <svg className="tab-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 2v7.31"></path>
              <path d="M14 2v7.31"></path>
              <path d="M8.5 2h7"></path>
              <path d="M14 9.3a6.5 6.5 0 1 1-4 0"></path>
            </svg>
            Research
          </button>
          <button
            className={`tab-button ${activeTab === 'fleet' ? 'active' : ''}`}
            onClick={() => setActiveTab('fleet')}
          >
            <svg className="tab-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2l9 21H3L12 2z"></path>
              <path d="M12 2v21"></path>
            </svg>
            Fleet
          </button>
          <button
            className={`tab-button ${activeTab === 'constructions' ? 'active' : ''}`}
            onClick={() => setActiveTab('constructions')}
          >
            <svg className="tab-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 21h18" />
              <path d="M5 21V7l8-4 8 4v14" />
              <path d="M9 10a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2" />
            </svg>
            Constructions
          </button>
          <button
            className={`tab-button ${activeTab === 'ground' ? 'active' : ''}`}
            onClick={() => setActiveTab('ground')}
          >
            <svg className="tab-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
            Ground Units
          </button>
          <button
            className={`tab-button ${activeTab === 'planets' ? 'active' : ''}`}
            onClick={() => setActiveTab('planets')}
          >
            <svg className="tab-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              <path d="M2 12h20" />
            </svg>
            Planets
          </button>
          <button className={`tab-button ${activeTab === 'log' ? 'active' : ''}`} onClick={() => setActiveTab('log')}>
            <svg className="tab-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <path d="M14 2v6h6"></path>
              <path d="M10 9H8"></path>
              <path d="M16 13H8"></path>
              <path d="M16 17H8"></path>
            </svg>
            Logbook
          </button>
          <button className={`tab-button ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
            <svg className="tab-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 3v18h18"></path>
              <path d="M18.7 8.3L12 15l-3.3-3.3L3 18"></path>
            </svg>
            Dashboard
          </button>
        </nav>
      </header>
      <main className="app-content">
        {activeTab === 'economy' ? (
          <EconomyGrid
            turns={turns}
            currentTurnId={currentTurnId}
            onTurnClick={setCurrentTurnId}
            onUpdate={handleUpdate}
            onAddTurn={addTurn}
            onDeleteTurn={deleteTurn}
          />
        ) : activeTab === 'research' ? (
          <ResearchTab
            turns={turns}
            currentTurnId={currentTurnId}
            onUpdate={handleUpdate}
            onSectionUpdate={handleSectionUpdate}
            readOnly={isReadOnly}
          />
        ) : activeTab === 'fleet' ? (
          <FleetTab
            currentTurn={turns.find(t => t.id === currentTurnId)!}
            onUpdate={handleUpdate}
            turnIndex={turns.findIndex(t => t.id === currentTurnId)}
            category="Spaceship"
            turns={turns}
            showHud={settings.showHud}
            readOnly={isReadOnly}
          />
        ) : activeTab === 'constructions' ? (
          <FleetTab
            currentTurn={turns.find(t => t.id === currentTurnId)!}
            onUpdate={handleUpdate}
            turnIndex={turns.findIndex(t => t.id === currentTurnId)}
            category="Construction"
            turns={turns}
            showHud={settings.showHud}
            readOnly={isReadOnly}
          />
        ) : activeTab === 'ground' ? (
          <FleetTab
            currentTurn={turns.find(t => t.id === currentTurnId)!}
            onUpdate={handleUpdate}
            turnIndex={turns.findIndex(t => t.id === currentTurnId)}
            category="Ground Unit"
            turns={turns}
            showHud={settings.showHud}
            readOnly={isReadOnly}
          />
        ) : activeTab === 'planets' ? (
          <PlanetsTab
            currentTurn={currentTurnData}
            updateCurrentTurn={updateCurrentTurnPlanets}
            onRenamePlanetGlobal={renamePlanetGlobal}
            showHud={settings.showHud}
            readOnly={isReadOnly}
          />
        ) : activeTab === 'log' ? (
          <LogTab
            turns={turns}
            onUpdateComment={handleLogUpdate}
          />
        ) : activeTab === 'dashboard' ? (
          <DashboardTab turns={turns} />
        ) : null}
      </main>

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={setSettings}
        onSaveGame={handleSaveGame}
        onExportData={handleExportData}
        onImportData={handleImportData}
        onNewGame={handleNewGame}
      />

      {/* SVG Filters for HUD Chromatic Aberration */}
      <svg style={{ position: 'absolute', width: 0, height: 0, pointerEvents: 'none' }}>
        <defs>
          <filter id="redOnly">
            <feColorMatrix type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" />
          </filter>
          <filter id="blueOnly">
            <feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" />
          </filter>
        </defs>
      </svg>
    </div >
  );
}

export default App;
