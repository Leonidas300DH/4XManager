import React, { useRef } from 'react';
import type { AppSettings } from '../types';
import { DEFAULT_SETTINGS } from '../types';
import './SettingsModal.css';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    settings: AppSettings;
    onUpdateSettings: (settings: AppSettings) => void;
    onSaveGame: () => void;
    onExportData: () => void;
    onImportData: (data: string) => void;
    onNewGame: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({
    isOpen,
    onClose,
    settings,
    onUpdateSettings,
    onSaveGame,
    onExportData,
    onImportData,
    onNewGame
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!isOpen) return null;

    const handleColorChange = (key: keyof AppSettings['colors'], value: string) => {
        onUpdateSettings({
            ...settings,
            colors: {
                ...settings.colors,
                [key]: value
            }
        });
    };

    const handleReset = () => {
        if (window.confirm('Reset all settings to default?')) {
            onUpdateSettings(DEFAULT_SETTINGS);
        }
    };

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const content = event.target?.result as string;
            onImportData(content);
        };
        reader.readAsText(file);
    };

    return (
        <div className="settings-overlay" onClick={onClose}>
            <div className="settings-content" onClick={e => e.stopPropagation()}>
                <div className="settings-header">
                    <h3>SYSTEM CONFIGURATION</h3>
                    <button className="close-settings" onClick={onClose}>&times;</button>
                </div>

                <div className="settings-body">
                    <section className="settings-section">
                        <h4>Visual Interface</h4>
                        <div className="setting-item">
                            <label>HUD Overlay</label>
                            <label className="settings-switch">
                                <input
                                    type="checkbox"
                                    checked={settings.showHud}
                                    onChange={e => onUpdateSettings({ ...settings, showHud: e.target.checked })}
                                />
                                <span className="slider round"></span>
                            </label>
                        </div>
                    </section>

                    <section className="settings-section">
                        <h4>Resource Signatures</h4>
                        <div className="color-grid">
                            <div className="color-item">
                                <label>CP (Yellow)</label>
                                <input
                                    type="color"
                                    value={settings.colors.cp}
                                    onChange={e => handleColorChange('cp', e.target.value)}
                                />
                            </div>
                            <div className="color-item">
                                <label>LP (Green)</label>
                                <input
                                    type="color"
                                    value={settings.colors.lp}
                                    onChange={e => handleColorChange('lp', e.target.value)}
                                />
                            </div>
                            <div className="color-item">
                                <label>RP (Blue)</label>
                                <input
                                    type="color"
                                    value={settings.colors.rp}
                                    onChange={e => handleColorChange('rp', e.target.value)}
                                />
                            </div>
                            <div className="color-item">
                                <label>TP (Purple)</label>
                                <input
                                    type="color"
                                    value={settings.colors.tp}
                                    onChange={e => handleColorChange('tp', e.target.value)}
                                />
                            </div>
                        </div>
                    </section>

                    <section className="settings-section">
                        <h4>📁 File Operations</h4>
                        <div className="action-grid-standard">
                            <button className="settings-btn new" onClick={onNewGame}>
                                📄 New Game
                            </button>
                            <div className="action-row">
                                <button className="settings-btn save" onClick={onSaveGame} title="Export current state to standard file">
                                    💾 Save
                                </button>
                                <button className="settings-btn export" onClick={onExportData} title="Export with timestamped filename">
                                    📥 Save As...
                                </button>
                                <button className="settings-btn import" onClick={() => fileInputRef.current?.click()} title="Import from a JSON file">
                                    📤 Load...
                                </button>
                            </div>
                            <input
                                type="file"
                                ref={fileInputRef}
                                style={{ display: 'none' }}
                                accept=".json"
                                onChange={handleFileInput}
                            />
                        </div>
                    </section>
                </div>

                <div className="settings-footer">
                    <button className="reset-btn" onClick={handleReset}>Reset Defaults</button>
                    <button className="apply-btn" onClick={onClose}>Close</button>
                </div>
            </div>
        </div>
    );
};

export default SettingsModal;
