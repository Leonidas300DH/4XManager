import React, { useEffect, useRef, useState } from 'react';
import './LandingPage.css';
import HudOverlay from './HudOverlay';

interface LandingPageProps {
    onNewGame: () => void;
    onContinue: () => void;
    onLoadGame: () => void;
    onSettings: () => void;
    onQuit: () => void;
    hasSave: boolean;
}

const LandingPage: React.FC<LandingPageProps> = ({
    onNewGame,
    onContinue,
    onLoadGame,
    onSettings,
    onQuit,
    hasSave
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const commsFeedRef = useRef<HTMLDivElement>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [clock, setClock] = useState('00:00:00');
    const [coords, setCoords] = useState({ x: -2847.15, y: 1204.84 });
    const [bearing, setBearing] = useState(47);
    const [signalWidth, setSignalWidth] = useState(80);
    const [contacts, setContacts] = useState({ friendly: 0, hostile: 0 });

    // ══════════════════════════════════════════════════════════════
    // CLOCK & DATA UPDATES
    // ══════════════════════════════════════════════════════════════
    useEffect(() => {
        const timer = setInterval(() => {
            setClock(new Date().toTimeString().slice(0, 8));
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        const timer = setInterval(() => {
            setCoords(prev => ({
                x: prev.x + (Math.random() - 0.5) * 0.05,
                y: prev.y + (Math.random() - 0.5) * 0.05
            }));
            setBearing(prev => {
                let next = prev + (Math.random() - 0.5) * 2;
                if (next < 0) next += 360;
                if (next > 360) next -= 360;
                return next;
            });
            setSignalWidth(70 + Math.random() * 20);
        }, 2000);
        return () => clearInterval(timer);
    }, []);

    // ══════════════════════════════════════════════════════════════
    // MUSIC - Using ref to control HTML audio element
    // ══════════════════════════════════════════════════════════════
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = 0.2; // 20% volume
            // Attempt to play on mount (autoPlay should handle this, but as backup)
            audioRef.current.play().catch(() => {
                // Autoplay blocked - add click listener as fallback
                const tryPlay = () => {
                    audioRef.current?.play();
                    document.removeEventListener('click', tryPlay);
                };
                document.addEventListener('click', tryPlay);
            });
        }
        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
            }
        };
    }, []);

    // ══════════════════════════════════════════════════════════════
    // RADAR LOGIC
    // ══════════════════════════════════════════════════════════════
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let width: number, height: number;
        let scanAngle = 0;
        let animationFrameId: number;

        class Ship {
            type: 'capital' | 'cruiser' | 'fighter';
            team: 'friendly' | 'hostile';
            x: number;
            y: number;
            angle: number;
            leader: Ship | null;
            offset: { x: number; y: number } | null;
            detected: number;
            size: number;
            speed: number;
            name?: string;
            straightRunTimer: number; // Timer for straight-line phases

            constructor(type: 'capital' | 'cruiser' | 'fighter', team: 'friendly' | 'hostile', x: number, y: number, leader: Ship | null = null, offset: { x: number; y: number } | null = null) {
                this.type = type;
                this.team = team;
                this.x = x;
                this.y = y;
                this.angle = team === 'friendly' ? 0.5 + Math.random() * 0.5 : 2.5 + Math.random() * 0.5;
                this.leader = leader;
                this.offset = offset;
                this.detected = 0;
                this.straightRunTimer = Math.random() * 180; // Random initial phase (0-3 sec at 60fps)

                if (type === 'capital') {
                    this.size = 18;
                    this.speed = 0.0165;
                    this.name = team === 'friendly' ? 'ISS VANGUARD' : 'HSS NEMESIS';
                } else if (type === 'cruiser') {
                    this.size = 10;
                    this.speed = 0.0275;
                } else {
                    this.size = 3;
                    this.speed = 0.25;
                }
            }

            update(allShips: Ship[]) {
                const cx = width / 2;
                const cy = height / 2;
                const maxR = Math.min(width, height) * 0.35;

                if (this.leader && this.offset) {
                    // Squadron member - follow leader with offset
                    const tx = this.leader.x + this.offset.x;
                    const ty = this.leader.y + this.offset.y;
                    this.x += (tx - this.x) * 0.08;
                    this.y += (ty - this.y) * 0.08;
                    this.angle = this.leader.angle;
                } else {
                    // Independent ship - dogfight behavior with straight-run phases

                    // Update straight run timer - big ships have longer straight phases
                    this.straightRunTimer--;
                    const isStraightRun = this.straightRunTimer > 0;
                    const straightDuration = this.type === 'fighter' ? 120 : (this.type === 'capital' ? 300 : 240);
                    const maneuverDuration = this.type === 'fighter' ? 120 : (this.type === 'capital' ? 60 : 80);
                    if (this.straightRunTimer <= -maneuverDuration) {
                        // Start new straight run phase
                        this.straightRunTimer = straightDuration + Math.random() * 60;
                    }

                    if (!isStraightRun) {
                        // Maneuvering phase - find and engage enemies
                        let nearestEnemy: Ship | null = null;
                        let nearestDist = Infinity;
                        allShips.forEach(other => {
                            if (other.team !== this.team && !other.leader) {
                                const dx = other.x - this.x;
                                const dy = other.y - this.y;
                                const d = Math.sqrt(dx * dx + dy * dy);
                                if (d < nearestDist && d < 150) {
                                    nearestDist = d;
                                    nearestEnemy = other;
                                }
                            }
                        });

                        // Smooth random wandering - less for big ships
                        const wanderRate = this.type === 'fighter' ? 0.015 : (this.type === 'capital' ? 0.002 : 0.005);
                        this.angle += (Math.random() - 0.5) * wanderRate;

                        // Engage enemy if nearby
                        if (nearestEnemy) {
                            const enemy = nearestEnemy as Ship;
                            const angleToEnemy = Math.atan2(enemy.y - this.y, enemy.x - this.x);
                            let angleDiff = angleToEnemy - this.angle;
                            while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
                            while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

                            // Fighters aggressive, capitals extremely slow (inertia), cruisers slow
                            const aggression = this.type === 'fighter' ? 0.03 : (this.type === 'capital' ? 0.001 : 0.004);
                            this.angle += angleDiff * aggression;

                            if (nearestDist < 60) {
                                this.angle += (Math.random() - 0.5) * 0.06;
                            }
                        }
                    }
                    // Straight-run: minimal turning, just edge avoidance

                    const dx = this.x - cx;
                    const dy = this.y - cy;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    // Edge avoidance always active
                    if (dist > maxR * 0.75) {
                        const angleToCenter = Math.atan2(cy - this.y, cx - this.x);
                        const edgeFactor = (dist - maxR * 0.75) / (maxR * 0.25);
                        const turnStrength = Math.min(edgeFactor * 0.08, 0.15);

                        let angleDiff = angleToCenter - this.angle;
                        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
                        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
                        this.angle += angleDiff * turnStrength;
                    }

                    // Apply movement with speed variation
                    const speedVariation = 0.9 + Math.random() * 0.2;
                    this.x += Math.cos(this.angle) * this.speed * speedVariation;
                    this.y += Math.sin(this.angle) * this.speed * speedVariation;

                    // Hard boundary
                    if (dist > maxR) {
                        this.x = cx + dx * (maxR / dist) * 0.98;
                        this.y = cy + dy * (maxR / dist) * 0.98;
                    }
                }
                this.detected = Math.max(0, this.detected - 0.008);
            }

            draw(context: CanvasRenderingContext2D) {
                const col = this.team === 'friendly' ? '#0df' : '#f34';
                const alpha = 0.85 + this.detected * 0.15; // Minimum 85% visibility

                context.save();
                context.translate(this.x, this.y);
                context.rotate(this.angle);
                context.globalAlpha = alpha;

                context.beginPath();
                if (this.type === 'capital') {
                    context.moveTo(18, 0);
                    context.lineTo(-12, 10);
                    context.lineTo(-6, 0);
                    context.lineTo(-12, -10);
                } else if (this.type === 'cruiser') {
                    context.moveTo(10, 0);
                    context.lineTo(-6, 5);
                    context.lineTo(-3, 0);
                    context.lineTo(-6, -5);
                } else {
                    context.moveTo(4, 0);
                    context.lineTo(-2, 2);
                    context.lineTo(-2, -2);
                }
                context.closePath();
                context.fillStyle = col;
                context.globalAlpha = alpha * 0.3;
                context.fill();
                context.globalAlpha = alpha;
                context.strokeStyle = col;
                context.lineWidth = 1;
                context.stroke();
                context.restore();

                if (this.name && this.detected > 0.3) {
                    context.globalAlpha = this.detected * 0.6;
                    context.font = '8px IBM Plex Mono';
                    context.fillStyle = col;
                    context.fillText(this.name, this.x + this.size + 8, this.y + 3);
                    context.globalAlpha = 1;
                }
            }
        }

        const ships: Ship[] = [];

        const initRadar = () => {
            const rect = canvas.parentElement?.getBoundingClientRect();
            width = rect?.width || window.innerWidth;
            height = rect?.height || window.innerHeight;

            // Ensure minimum dimensions
            if (width < 100) width = window.innerWidth * 0.7;
            if (height < 100) height = window.innerHeight * 0.6;

            canvas.width = width;
            canvas.height = height;

            const cx = width / 2;
            const cy = height / 2;
            const r = Math.min(width, height) * 0.25;

            ships.length = 0;

            // FRIENDLY FLEET (Blue): 1 capital + 5 cruisers
            const vanguard = new Ship('capital', 'friendly', cx - r * 0.6, cy + r * 0.3);
            ships.push(vanguard);

            // 5 Cruisers
            ships.push(new Ship('cruiser', 'friendly', cx - r * 0.8, cy));
            ships.push(new Ship('cruiser', 'friendly', cx - r * 0.7, cy + r * 0.5));
            ships.push(new Ship('cruiser', 'friendly', cx - r * 0.9, cy + r * 0.2));
            ships.push(new Ship('cruiser', 'friendly', cx - r * 0.5, cy + r * 0.6));
            ships.push(new Ship('cruiser', 'friendly', cx - r * 0.4, cy + r * 0.1));

            // Fighter Squadrons (groups of 3: 1 leader + 2 wingmen)
            const wingOffsets = [
                { x: -12, y: -8 },
                { x: -12, y: 8 },
            ];
            const friendlySquadronLeaders = [
                { x: cx - r * 0.4, y: cy + r * 0.2 },
                { x: cx - r * 0.6, y: cy + r * 0.5 },
                { x: cx - r * 0.3, y: cy + r * 0.4 },
                { x: cx - r * 0.7, y: cy + r * 0.3 },
            ];
            friendlySquadronLeaders.forEach(pos => {
                const leader = new Ship('fighter', 'friendly', pos.x, pos.y);
                ships.push(leader);
                wingOffsets.forEach(off => {
                    ships.push(new Ship('fighter', 'friendly', pos.x + off.x, pos.y + off.y, leader, off));
                });
            });

            // HOSTILE FLEET (Red): 2 capitals + 3 cruisers
            const nemesis = new Ship('capital', 'hostile', cx + r * 0.6, cy - r * 0.3);
            const destroyer = new Ship('capital', 'hostile', cx + r * 0.4, cy - r * 0.6);
            ships.push(nemesis);
            ships.push(destroyer);

            // 3 Cruisers
            ships.push(new Ship('cruiser', 'hostile', cx + r * 0.8, cy - r * 0.1));
            ships.push(new Ship('cruiser', 'hostile', cx + r * 0.7, cy - r * 0.5));
            ships.push(new Ship('cruiser', 'hostile', cx + r * 0.5, cy - r * 0.4));

            // Hostile Fighter Squadrons (groups of 3)
            const hostileSquadronLeaders = [
                { x: cx + r * 0.4, y: cy - r * 0.2 },
                { x: cx + r * 0.6, y: cy - r * 0.5 },
                { x: cx + r * 0.3, y: cy - r * 0.4 },
                { x: cx + r * 0.7, y: cy - r * 0.3 },
                { x: cx + r * 0.5, y: cy - r * 0.6 },
                { x: cx + r * 0.2, y: cy - r * 0.3 },
            ];
            hostileSquadronLeaders.forEach(pos => {
                const leader = new Ship('fighter', 'hostile', pos.x, pos.y);
                ships.push(leader);
                wingOffsets.forEach(off => {
                    ships.push(new Ship('fighter', 'hostile', pos.x + off.x, pos.y + off.y, leader, off));
                });
            });
        };

        const drawGrid = () => {
            const cx = width / 2;
            const cy = height / 2;
            const maxR = Math.min(width, height) * 0.42;

            ctx.strokeStyle = '#1a3040';
            ctx.lineWidth = 1;

            for (let x = 0; x < width; x += 60) {
                ctx.beginPath();
                ctx.moveTo(x, 0);
                ctx.lineTo(x, height);
                ctx.stroke();
            }
            for (let y = 0; y < height; y += 60) {
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(width, y);
                ctx.stroke();
            }

            ctx.strokeStyle = '#2a5070';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(cx, cy, maxR, 0, Math.PI * 2);
            ctx.stroke();

            ctx.strokeStyle = '#1a3550';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(cx, cy, maxR * 0.66, 0, Math.PI * 2);
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(cx, cy, maxR * 0.33, 0, Math.PI * 2);
            ctx.stroke();
        };


        const drawSweep = () => {
            const cx = width / 2;
            const cy = height / 2;
            const maxR = Math.min(width, height) * 0.42;

            scanAngle += 0.003;

            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.arc(cx, cy, maxR, scanAngle, scanAngle + 0.4);
            ctx.closePath();

            const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxR);
            grad.addColorStop(0, 'rgba(0, 180, 255, 0.15)');
            grad.addColorStop(1, 'rgba(0, 180, 255, 0)');
            ctx.fillStyle = grad;
            ctx.fill();

            ships.forEach(ship => {
                const dx = ship.x - cx;
                const dy = ship.y - cy;
                let a = Math.atan2(dy, dx);
                if (a < 0) a += Math.PI * 2;
                let sa = scanAngle % (Math.PI * 2);
                if (sa < 0) sa += Math.PI * 2;
                if (Math.abs(a - sa) < 0.4 || Math.abs(a - sa) > Math.PI * 2 - 0.4) {
                    ship.detected = 1;
                }
            });
        };

        let interferenceLevel = 0;
        let nextInterferenceTime = Date.now() + 3000;

        const drawInterference = () => {
            if (Date.now() > nextInterferenceTime) {
                interferenceLevel = 0.15 + Math.random() * 0.2;
                nextInterferenceTime = Date.now() + 5000 + Math.random() * 10000;
            }

            if (interferenceLevel > 0) {
                interferenceLevel *= 0.96;
                const numLines = Math.floor(interferenceLevel * 6);
                for (let i = 0; i < numLines; i++) {
                    const y = Math.random() * height;
                    ctx.fillStyle = `rgba(0, 200, 255, ${interferenceLevel * 0.3})`;
                    ctx.fillRect(0, y, width, 1);
                }
                ctx.fillStyle = '#0cf';
                for (let i = 0; i < interferenceLevel * 20; i++) {
                    ctx.globalAlpha = interferenceLevel * Math.random() * 0.2;
                    ctx.fillRect(Math.random() * width, Math.random() * height, 1, 1);
                }
                ctx.globalAlpha = 1;
            }

            if (Math.random() < 0.3) {
                ctx.fillStyle = '#0cf';
                ctx.globalAlpha = 0.03;
                ctx.fillRect(Math.random() * width, Math.random() * height, 1, 1);
                ctx.globalAlpha = 1;
            }
        };

        // Load video background (muted, looping)
        const bgVideo = document.createElement('video');
        bgVideo.src = '/radar-bg.mp4';
        bgVideo.muted = true;
        bgVideo.loop = true;
        bgVideo.playsInline = true;
        let videoReady = false;
        bgVideo.oncanplay = () => {
            videoReady = true;
            bgVideo.playbackRate = 0.5; // 50% speed
            bgVideo.play().catch(() => { });
        };
        bgVideo.load();

        const animate = () => {
            // Draw video frame as background
            if (videoReady && bgVideo.readyState >= 2) {
                ctx.drawImage(bgVideo, 0, 0, width, height);
                // Add semi-transparent dark overlay
                ctx.fillStyle = 'rgba(0, 4, 5, 0.2)';
                ctx.fillRect(0, 0, width, height);
            } else {
                ctx.fillStyle = '#000405';
                ctx.fillRect(0, 0, width, height);
            }

            drawGrid();
            drawSweep();

            ships.forEach(ship => {
                ship.update(ships);
                ship.draw(ctx);
            });

            drawInterference();

            animationFrameId = requestAnimationFrame(animate);
        };

        // Update contacts only occasionally, not every frame
        const updateContacts = () => {
            const friendly = ships.filter(s => s.team === 'friendly').length;
            const hostile = ships.filter(s => s.team === 'hostile').length;
            setContacts({ friendly, hostile });
        };

        // Small delay to ensure layout is complete on iOS
        setTimeout(() => {
            initRadar();
            updateContacts();
            animate();
        }, 100);

        window.addEventListener('resize', initRadar);
        return () => {
            window.removeEventListener('resize', initRadar);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    // ══════════════════════════════════════════════════════════════
    // COMMS FEED
    // ══════════════════════════════════════════════════════════════
    useEffect(() => {
        const script = [
            { delay: 0, sender: 'SYSTEM', text: '━━ CHANNEL OPEN ━━', type: 'system' },
            { delay: 700, sender: 'VANGUARD CIC', text: 'All stations, report status.', type: 'system' },
            { delay: 1700, sender: 'TACTICAL', text: 'Sensors online. Scanning.', type: '' },
            { delay: 2700, sender: 'WEAPONS', text: 'All batteries ready.', type: '' },
            { delay: 3700, sender: 'ALPHA LEAD', text: 'Alpha Squadron in formation.', type: '' },
            { delay: 4800, sender: 'SENSORS', text: 'Contact! Multiple signatures bearing 047.', type: 'priority' },
            { delay: 6000, sender: 'TACTICAL', text: 'Hostile fleet confirmed. Designating Sierra.', type: 'priority' },
            { delay: 7200, sender: 'VANGUARD CIC', text: 'Set Condition One.', type: 'alert' },
            { delay: 8500, sender: 'TACTICAL', text: 'Enemy capital identified: HSS NEMESIS.', type: 'priority' },
            { delay: 9800, sender: 'ALPHA LEAD', text: 'Bandits launching! Count nine.', type: 'alert' },
            { delay: 11000, sender: 'VANGUARD ACTUAL', text: 'All units, weapons free.', type: 'alert' },
        ];

        const chatter = [
            { sender: 'ALPHA-2', text: 'Engaging bandit, bearing 090.', type: '' },
            { sender: 'ALPHA-3', text: 'Fox two away.', type: '' },
            { sender: 'TACTICAL', text: 'Tracking inbound ordnance.', type: 'priority' },
            { sender: 'ALPHA LEAD', text: 'Alpha flight, stay tight.', type: '' },
            { sender: 'WEAPONS', text: 'Main battery, firing.', type: '' },
            { sender: 'ALPHA-4', text: 'Splash one!', type: '' },
            { sender: 'SENSORS', text: 'Enemy cruiser maneuvering.', type: '' },
            { sender: 'DAMAGE CTRL', text: 'Hit starboard section. Contained.', type: 'priority' },
            { sender: 'IRON DUKE', text: 'Engaging Ravager.', type: '' },
            { sender: 'ALPHA-2', text: 'Two on my six!', type: 'priority' },
            { sender: 'ALPHA LEAD', text: 'I see them. Engaging.', type: '' },
            { sender: 'TACTICAL', text: 'Enemy firing solution on Vanguard.', type: 'alert' },
            { sender: 'HELM', text: 'Evasive maneuvers.', type: '' },
            { sender: 'WEAPONS', text: 'Point defense active.', type: '' },
            { sender: 'RESOLUTE', text: 'Moving to intercept.', type: '' },
            { sender: 'ALPHA-3', text: 'Good hit on Desolator.', type: '' },
            { sender: 'SENSORS', text: 'Sierra-1 shields failing.', type: 'priority' },
            { sender: 'VANGUARD CIC', text: 'Focus fire on Nemesis.', type: 'priority' },
            { sender: 'ALPHA-5', text: 'Copy. Attack run.', type: '' },
            { sender: 'DAMAGE CTRL', text: 'Hull breach deck 4. Sealing.', type: 'alert' },
            { sender: 'TACTICAL', text: 'Nemesis turning to engage.', type: 'priority' },
            { sender: 'ALPHA LEAD', text: 'Watch your crossfire.', type: '' },
            { sender: 'WEAPONS', text: 'Torpedoes loaded.', type: '' },
            { sender: 'SENSORS', text: 'Enemy fighter down.', type: '' },
            { sender: 'ALPHA-2', text: 'Clear. Returning to formation.', type: '' },
            { sender: 'TACTICAL', text: 'Ravager taking heavy damage.', type: 'priority' },
            { sender: 'IRON DUKE', text: 'Confirmed hits.', type: '' },
            { sender: 'VANGUARD ACTUAL', text: 'Maintain pressure.', type: 'alert' },
        ];

        const addComm = (sender: string, text: string, type = '') => {
            if (!commsFeedRef.current) return;
            const msg = document.createElement('div');
            msg.className = 'comm-msg ' + type;
            const timeStr = new Date().toTimeString().slice(0, 8);
            msg.innerHTML = `<span class="time">[${timeStr}]</span> <span class="sender">${sender}:</span><span class="text">${text}</span>`;
            commsFeedRef.current.appendChild(msg);
            commsFeedRef.current.scrollTop = commsFeedRef.current.scrollHeight;

            while (commsFeedRef.current.children.length > 30) {
                commsFeedRef.current.removeChild(commsFeedRef.current.firstChild!);
            }
        };

        let active = true;
        let scriptIndex = 0;
        const playScript = () => {
            if (!active) return;
            if (scriptIndex < script.length) {
                const item = script[scriptIndex];
                setTimeout(() => {
                    addComm(item.sender, item.text, item.type);
                    scriptIndex++;
                    playScript();
                }, item.delay);
            } else {
                startChatter();
            }
        };

        let chatterIndex = 0;
        const startChatter = () => {
            if (!active) return;
            const msg = chatter[chatterIndex % chatter.length];
            addComm(msg.sender, msg.text, msg.type);
            chatterIndex++;
            // 30% faster with random delay between 400-900ms
            const baseDelay = 400 + Math.random() * 500;
            setTimeout(startChatter, baseDelay);
        };

        playScript();
        return () => { active = false; };
    }, []);

    return (
        <div className="landing-page">
            <div className="scanlines"></div>

            <div className="landing-layout">
                {/* HEADER */}
                <header className="landing-header">
                    <h1>SPACE EMPIRES 4X</h1>
                    <div className="header-time">{clock}</div>
                </header>

                {/* LEFT - MENU + COMMS */}
                <aside className="panel-left">
                    <div className="panel-header">COMMAND MENU</div>
                    <div className="menu-section">
                        <button className="menu-btn" onClick={onNewGame}>NEW GAME</button>
                        <button
                            className="menu-btn"
                            disabled={!hasSave}
                            onClick={onContinue}
                        >
                            CONTINUE
                        </button>
                        <button className="menu-btn" onClick={onLoadGame}>LOAD GAME</button>
                        <button className="menu-btn" onClick={onSettings}>SETTINGS</button>
                        <button className="menu-btn danger" onClick={onQuit}>QUIT</button>
                    </div>
                    <div className="comms-section">
                        <div className="panel-header">
                            <span>TACTICAL CHANNEL</span>
                            <span className="live-indicator">● LIVE</span>
                        </div>
                        <div className="comms-feed" ref={commsFeedRef}></div>
                    </div>
                </aside>

                {/* CENTER - RADAR */}
                <main className="panel-center">
                    <HudOverlay enabled={true}>
                        <canvas className="radar-canvas" ref={canvasRef}></canvas>
                    </HudOverlay>

                    <div className="data-overlay">
                        <div className="data-block">
                            <div className="data-label">SECTOR</div>
                            <div className="data-value">ORION-7</div>
                        </div>
                        <div className="data-block">
                            <div className="data-label">GRID</div>
                            <div className="data-value small">{coords.x.toFixed(2)}, {coords.y.toFixed(2)}</div>
                        </div>
                        <div className="data-block">
                            <div className="data-label">SIGNAL</div>
                            <div className="data-bar"><div className="data-bar-fill" style={{ width: `${signalWidth}%` }}></div></div>
                        </div>
                    </div>

                    <div className="data-overlay-bottom">
                        <div className="data-block">
                            <div className="data-label">CONTACTS</div>
                            <div className="data-value">
                                <span style={{ color: '#0df' }}>{contacts.friendly}</span> / <span style={{ color: '#f34' }}>{contacts.hostile}</span>
                            </div>
                        </div>
                        <div className="data-block">
                            <div className="data-label">RANGE</div>
                            <div className="data-value small">12,000 KM</div>
                        </div>
                        <div className="data-block">
                            <div className="data-label">BEARING</div>
                            <div className="data-value small">{Math.floor(bearing)}°</div>
                        </div>
                    </div>

                    <div className="interference"></div>
                </main>

                {/* FOOTER */}
                <footer className="landing-footer">
                    <span>TERMINAL: ADMIRAL-01</span>
                    <span>SECTOR ORION-7</span>
                </footer>
            </div>
            {/* Background Music - autoPlay attempts to play on load */}
            <audio
                ref={audioRef}
                src="/landing-music.mp3"
                loop
                autoPlay
                style={{ display: 'none' }}
            />
        </div>
    );
};

export default LandingPage;
