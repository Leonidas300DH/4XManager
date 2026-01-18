import React, { useEffect, useRef, useState, useMemo } from 'react';
import './HudOverlay.css';

interface HudOverlayProps {
    enabled: boolean;
    imgSrc?: string;
    children?: React.ReactNode;
    isPlanet?: boolean;
}

const LOG_MESSAGES = [
    "AUSPEX SCAN...", "WARP FLUX: OK", "MACHINE SPIRIT", "SYNCING...", "SCAN: CLEAR",
    "ARRAY: SYNC", "VOX: SECURE", "SCHEMATICS", "BUFFER: STABLE", "LENS: AUTO",
    "THERMAL: NEG", "RE-CALIBRATE", "SYNCING...", "PING: 2ms", "OMEGA ENCR",
    "DATA PURGE", "CORE: NOMINAL", "POWER: STABLE", "RELAY: ACTIVE"
];

const HEX_CHARS = "0123456789ABCDEF";

const HudOverlay: React.FC<HudOverlayProps> = ({ enabled, imgSrc, children, isPlanet = false }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [isOnline, setIsOnline] = useState(false);
    const [sysStatus, setSysStatus] = useState("OFFLINE");
    const [uptime, setUptime] = useState("00:00:000");
    const [coords, setCoords] = useState("000.000 . 000");
    const [zoom, setZoom] = useState("1.000x");
    const [dataRate, setDataRate] = useState("0 TB/s");
    const [hex, setHex] = useState("");
    const [logs, setLogs] = useState<{ id: string, msg: string, type?: string }[]>([]);
    const [isGlitching, setIsGlitching] = useState(false);
    const [isChromatic, setIsChromatic] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const [isWarning, setIsWarning] = useState(false);

    // Additional features
    const [dataStreams, setDataStreams] = useState<{ id: string, top: string, left: string, text: string }[]>([]);

    const startTime = useRef(Date.now());

    // Layout variation - NO top-left corner, distribute across other positions
    const layoutStyle = useMemo(() => {
        const topPad = isPlanet ? '80px' : '15px';
        const variants = [
            { // 0: Top-right, bottom-left, bottom-right, middle sides
                status: { top: topPad, right: '15px', textAlign: 'right' as const },
                data: { bottom: '15px', left: '15px', textAlign: 'left' as const },
                log: { bottom: '15px', right: '15px' },
                satLog1: { top: '50%', left: '15px', transform: 'translateY(-50%)', opacity: 0.5 },
                satLog2: { top: '50%', right: '15px', transform: 'translateY(-50%)', textAlign: 'right' as const, opacity: 0.4 },
                hex: { bottom: '60px', left: '50%', transform: 'translateX(-50%)' },
                signal: { top: topPad, left: '50%', transform: 'translateX(-50%)' }
            },
            { // 1: Bottom-heavy with top center
                status: { top: topPad, left: '50%', transform: 'translateX(-50%)', textAlign: 'center' as const },
                data: { bottom: '15px', right: '15px', textAlign: 'right' as const },
                log: { bottom: '15px', left: '15px' },
                satLog1: { top: '50%', right: '15px', transform: 'translateY(-50%)', textAlign: 'right' as const, opacity: 0.5 },
                satLog2: { bottom: '80px', left: '50%', transform: 'translateX(-50%)', textAlign: 'center' as const, opacity: 0.4 },
                hex: { top: topPad, right: '15px' },
                signal: { bottom: '15px', left: '50%', transform: 'translateX(-50%)' }
            },
            { // 2: Sides focused
                status: { top: '30%', right: '15px', textAlign: 'right' as const },
                data: { top: '30%', left: '15px', textAlign: 'left' as const },
                log: { bottom: '15px', right: '15px' },
                satLog1: { bottom: '15px', left: '15px', opacity: 0.6 },
                satLog2: { top: topPad, right: '15px', textAlign: 'right' as const, opacity: 0.4 },
                hex: { bottom: '15px', left: '50%', transform: 'translateX(-50%)' },
                signal: { top: topPad, left: '50%', transform: 'translateX(-50%)' }
            },
            { // 3: Bottom corners + top-middle + side middle
                status: { top: topPad, left: '50%', transform: 'translateX(-50%)', textAlign: 'center' as const },
                data: { bottom: '15px', left: '15px', textAlign: 'left' as const },
                log: { bottom: '15px', right: '15px' },
                satLog1: { top: '45%', left: '15px', opacity: 0.5 },
                satLog2: { top: '45%', right: '15px', textAlign: 'right' as const, opacity: 0.5 },
                hex: { top: topPad, right: '15px' },
                signal: { bottom: '60px', left: '50%', transform: 'translateX(-50%)' }
            }
        ];
        return variants[Math.floor(Math.random() * variants.length)];
    }, [isPlanet]);

    useEffect(() => {
        if (enabled) {
            const timer = setTimeout(() => {
                setIsOnline(true);
                setSysStatus("ONLINE");
                startTime.current = Date.now();
                addLog("FEED ACQUIRED", "success");
            }, 600);
            return () => clearTimeout(timer);
        } else {
            setIsOnline(false);
            setSysStatus("OFFLINE");
        }
    }, [enabled]);

    const addLog = (msg: string, type?: string) => {
        setLogs(prev => {
            const id = Math.floor(Math.random() * 999).toString().padStart(3, '0');
            const newLogs = [{ id, msg, type }, ...prev];
            return newLogs.slice(0, 7);
        });
    };

    const spawnDataStream = () => {
        const id = Math.random().toString(36).substr(2, 9);
        // Start at 20% for planets to avoid top 15% badges, else 5%
        const topOffset = isPlanet ? 20 : 5;
        const topRange = isPlanet ? 60 : 85;
        const top = (topOffset + Math.random() * topRange) + '%';
        const left = (15 + Math.random() * 70) + '%';
        const text = Math.random().toString(16).substr(2, 6).toUpperCase();
        setDataStreams(prev => [...prev, { id, top, left, text }]);
        setTimeout(() => setDataStreams(prev => prev.filter(s => s.id !== id)), 6000);
    };

    // Main loops
    useEffect(() => {
        if (!isOnline) return;

        const intervalFast = setInterval(() => {
            const diff = Date.now() - startTime.current;
            const mins = Math.floor(diff / 60000).toString().padStart(2, '0');
            const secs = Math.floor((diff % 60000) / 1000).toString().padStart(2, '0');
            const ms = (diff % 1000).toString().padStart(3, '0');
            setUptime(`${mins}:${secs}:${ms}`);

            setCoords(`COORDS: ${(Math.random() * 100).toFixed(2)} . ${(Math.random() * 100).toFixed(2)}`);
            setDataRate(`RATE: ${(Math.random() * 50 + 120).toFixed(1)} TB/s`);

            const h = Array(18).fill(0).map(() => HEX_CHARS[Math.floor(Math.random() * 16)]).join('');
            setHex(h.match(/.{1,6}/g)?.join(' ') || h);

            // Glitch - Reduced frequency further
            if (Math.random() > 0.995) {
                setIsGlitching(true);
                setTimeout(() => setIsGlitching(false), 120);
            }
            if (Math.random() > 0.998) {
                setIsChromatic(true);
                setTimeout(() => setIsChromatic(false), 180);
            }
        }, 150);

        const intervalSlow = setInterval(() => {
            setZoom(`${(1 + (Math.random() * 0.04) - 0.02).toFixed(3)}x`);

            if (Math.random() > 0.4) {
                const msg = LOG_MESSAGES[Math.floor(Math.random() * LOG_MESSAGES.length)];
                const type = Math.random() > 0.93 ? 'warning' : '';
                addLog(msg, type);
            }

            if (Math.random() > 0.98) spawnDataStream(); // Extremely rare now

            if (Math.random() > 0.85) {
                setIsScanning(true);
                setTimeout(() => setIsScanning(false), 2500);
            }

            if (Math.random() > 0.95) {
                setIsWarning(true);
                setTimeout(() => setIsWarning(false), 2000);
            }
        }, 2000);

        return () => {
            clearInterval(intervalFast);
            clearInterval(intervalSlow);
        };
    }, [isOnline]);

    if (!enabled) return <>{children}</>;

    return (
        <div className={`ship-image-wrapper ${enabled ? 'hud-active' : ''}`} style={{ overflow: 'hidden' }}>
            {children}
            <div className={`hud-overlay-container ${isChromatic ? 'chromatic-active' : ''}`} ref={containerRef}>
                {imgSrc && (
                    <>
                        <div
                            className={`glitch-layer ${isGlitching ? 'glitch-active' : ''}`}
                            style={{ backgroundImage: `url(${imgSrc})` }}
                        />
                        <div className="chromatic-layer chromatic-r" style={{ backgroundImage: `url(${imgSrc})` }} />
                        <div className="chromatic-layer chromatic-b" style={{ backgroundImage: `url(${imgSrc})` }} />
                    </>
                )}
                <div className="vignette" />
                <div className="scanlines" />
                <div className={`scan-line ${isScanning ? 'active' : ''}`} />

                <div className="hud-corner tl" />
                <div className="hud-corner tr" />
                <div className="hud-corner bl" />
                <div className="hud-corner br" />

                <div className="status-panel" style={layoutStyle.status}>
                    <div className="status-line">
                        <span className={`status-dot ${isWarning ? 'warning' : ''}`} />
                        SYS: {sysStatus}
                    </div>
                    <div>UPTIME: {uptime}</div>
                    <div style={{ opacity: 0.5, fontSize: '6px' }}>SEC-44 // ULTRAMAR</div>
                </div>

                <div className="data-panel" style={layoutStyle.data}>
                    <div>{coords}</div>
                    <div>ZOOM: {zoom}</div>
                    <div style={{ fontSize: '6px', opacity: 0.6 }}>{dataRate}</div>
                </div>

                <div className="hex-display" style={layoutStyle.hex}>{hex}</div>

                {/* Main Log */}
                <div className="tactical-log" style={layoutStyle.log}>
                    {logs.map(log => (
                        <div key={log.id} className={`log-entry ${log.type || ''}`}>
                            <span style={{ opacity: 0.4 }}>[{log.id}]</span> {log.msg}
                        </div>
                    ))}
                </div>

                {/* Satellite Logs - Same content, different positions */}
                <div className="tactical-log satellite" style={layoutStyle.satLog1}>
                    {logs.slice(0, 4).map(log => (
                        <div key={`sat1-${log.id}`} className={`log-entry ${log.type || ''}`}>
                            <span style={{ opacity: 0.4 }}>[{log.id}]</span> {log.msg}
                        </div>
                    ))}
                </div>

                <div className="tactical-log satellite" style={layoutStyle.satLog2}>
                    {logs.slice(0, 3).map(log => (
                        <div key={`sat2-${log.id}`} className={`log-entry ${log.type || ''}`}>
                            <span style={{ opacity: 0.4 }}>[{log.id}]</span> {log.msg}
                        </div>
                    ))}
                </div>

                {dataStreams.map(stream => (
                    <div key={stream.id} className="data-stream active" style={{ top: stream.top, left: stream.left }}>
                        {stream.text}
                    </div>
                ))}

                <div className="signal-bars" style={layoutStyle.signal}>
                    {[4, 7, 10, 13, 16].map((h, i) => (
                        <div key={i} className="signal-bar" style={{ height: `${h}px`, opacity: 0.4 + Math.random() * 0.4 }} />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default HudOverlay;
