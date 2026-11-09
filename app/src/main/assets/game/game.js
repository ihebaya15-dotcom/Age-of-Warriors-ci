// Age of Warriors - Hand-Drawn & Organic 2.5D Game Engine
// Creative Technical Direction: 100% Hand-Drawn Ink Style, Line Boil, Squash & Stretch, Organic Terrain

(function () {
    'use strict';

    // ==========================================
    // 1. HAND-DRAWN INK & LINE BOIL HELPERS
    // ==========================================
    let lineBoilSeed = 1;
    let lineBoilTimer = 0;

    // Smooth pseudo-noise based on coordinates and line boil seed
    function boilNoise(coordSeed, magnitude = 1.6) {
        const s = lineBoilSeed * 1.73 + coordSeed * 2.37;
        return (Math.sin(s) * 0.58 + Math.cos(s * 1.41) * 0.42) * magnitude;
    }

    // Hand-drawn line with organic subdivision and micro-displacement
    function drawHandDrawnLine(ctx, x1, y1, x2, y2, roughness = 1.6, segments = 5) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        const dist = Math.hypot(dx, dy);
        if (dist < 4) {
            ctx.lineTo(x2, y2);
            return;
        }

        const count = Math.max(3, Math.min(segments, Math.floor(dist / 12)));
        const perpX = -dy / dist;
        const perpY = dx / dist;

        let prevX = x1;
        let prevY = y1;

        for (let i = 1; i < count; i++) {
            const t = i / count;
            const seed = (x1 * 0.04 + y1 * 0.04 + i * 3.8);
            const disp = boilNoise(seed, roughness);
            const midX = x1 + dx * t + perpX * disp;
            const midY = y1 + dy * t + perpY * disp;

            ctx.quadraticCurveTo(prevX, prevY, (prevX + midX) * 0.5, (prevY + midY) * 0.5);
            prevX = midX;
            prevY = midY;
        }
        ctx.lineTo(x2, y2);
    }

    // Hand-drawn organic rounded rectangle / polygon
    function drawHandDrawnRoundRect(ctx, x, y, w, h, r = 4, roughness = 1.4) {
        ctx.beginPath();
        const p1 = { x: x + r, y: y };
        const p2 = { x: x + w - r, y: y };
        const p3 = { x: x + w, y: y + r };
        const p4 = { x: x + w, y: y + h - r };
        const p5 = { x: x + w - r, y: y + h };
        const p6 = { x: x + r, y: y + h };
        const p7 = { x: x, y: y + h - r };
        const p8 = { x: x, y: y + r };

        ctx.moveTo(p1.x, p1.y);
        drawHandDrawnLine(ctx, p1.x, p1.y, p2.x, p2.y, roughness);
        ctx.quadraticCurveTo(x + w, y, p3.x, p3.y);
        drawHandDrawnLine(ctx, p3.x, p3.y, p4.x, p4.y, roughness);
        ctx.quadraticCurveTo(x + w, y + h, p5.x, p5.y);
        drawHandDrawnLine(ctx, p5.x, p5.y, p6.x, p6.y, roughness);
        ctx.quadraticCurveTo(x, y + h, p7.x, p7.y);
        drawHandDrawnLine(ctx, p7.x, p7.y, p8.x, p8.y, roughness);
        ctx.quadraticCurveTo(x, y, p1.x, p1.y);
        ctx.closePath();
    }

    // Hand-drawn organic circle with breathing contour
    function drawHandDrawnCircle(ctx, cx, cy, r, roughness = 1.3, points = 10) {
        ctx.beginPath();
        for (let i = 0; i <= points; i++) {
            const theta = (i / points) * Math.PI * 2;
            const seed = (cx * 0.08 + cy * 0.08 + i * 2.5);
            const currentR = r + boilNoise(seed, roughness);
            const px = cx + Math.cos(theta) * currentR;
            const py = cy + Math.sin(theta) * currentR;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();
    }

    // Organic terrain road coordinate math (S-curve meander with clash bowl expansion)
    function getRoadTopY(x, baseLaneTop, width) {
        const midRatio = 1 - Math.abs((x / width) - 0.5) * 2; // peaks in middle
        const expansion = midRatio * 20; // road widens in battle center
        return baseLaneTop - expansion + Math.sin(x * 0.005 + 0.35) * 18 + Math.cos(x * 0.012) * 10;
    }

    function getRoadBottomY(x, baseLaneBottom, width) {
        const midRatio = 1 - Math.abs((x / width) - 0.5) * 2;
        const expansion = midRatio * 22;
        return baseLaneBottom + expansion + Math.sin(x * 0.006 + 2.3) * 20 + Math.cos(x * 0.010) * 12;
    }

    // ==========================================
    // 2. CONFIGURATION & ERAS DATA
    // ==========================================
    const ERAS = [
        {
            name: "Stone Age",
            arabicName: "العصر الحجري",
            weather: "leaves",
            weatherName: "🍃 Leaves",
            weatherNameAr: "أوراق الخريف 🍃",
            turfColor: "#9ba858",
            laneColor: "#c9a170",
            laneBorder: "#614324",
            evolveCost: 220,
            units: [
                {
                    id: 0,
                    name: "Clubman",
                    icon: "🪓",
                    type: "melee",
                    cost: 3,
                    hp: 85,
                    damage: 22,
                    speed: 75,
                    range: 52,
                    cooldown: 1.5,
                    bodyColor: "#d97706",
                    weaponType: "club"
                },
                {
                    id: 1,
                    name: "Rock Thrower",
                    icon: "🪨",
                    type: "ranged",
                    projectile: "rock",
                    cost: 5,
                    hp: 55,
                    damage: 18,
                    speed: 62,
                    range: 165,
                    cooldown: 2.1,
                    bodyColor: "#78716c",
                    weaponType: "sling"
                },
                {
                    id: 2,
                    name: "Dino Rider",
                    icon: "🦖",
                    type: "heavy",
                    cost: 10,
                    hp: 310,
                    damage: 42,
                    speed: 52,
                    range: 62,
                    cooldown: 5.0,
                    bodyColor: "#15803d",
                    weaponType: "dino"
                }
            ]
        },
        {
            name: "Bronze Age",
            arabicName: "العصر البرونزي",
            weather: "sand_drift",
            weatherName: "☀️ Sand Drift",
            weatherNameAr: "رياح صحراوية ☀️",
            turfColor: "#a39f50",
            laneColor: "#d4a96a",
            laneBorder: "#6b441f",
            evolveCost: 650,
            units: [
                {
                    id: 0,
                    name: "Spearman",
                    icon: "🗡️",
                    type: "melee",
                    cost: 4,
                    hp: 170,
                    damage: 44,
                    speed: 80,
                    range: 58,
                    cooldown: 1.8,
                    bodyColor: "#b45309",
                    weaponType: "spear"
                },
                {
                    id: 1,
                    name: "Archer",
                    icon: "🏹",
                    type: "ranged",
                    projectile: "arrow",
                    cost: 7,
                    hp: 105,
                    damage: 38,
                    speed: 68,
                    range: 195,
                    cooldown: 2.4,
                    bodyColor: "#0d9488",
                    weaponType: "bow"
                },
                {
                    id: 2,
                    name: "War Chariot",
                    icon: "🐎",
                    type: "heavy",
                    cost: 14,
                    hp: 560,
                    damage: 82,
                    speed: 64,
                    range: 68,
                    cooldown: 5.4,
                    bodyColor: "#b91c1c",
                    weaponType: "chariot"
                }
            ]
        },
        {
            name: "Iron Age",
            arabicName: "العصر الحديدي",
            weather: "snow",
            weatherName: "❄️ Snow",
            weatherNameAr: "ثلوج شتوية ❄️",
            turfColor: "#7b8a53",
            laneColor: "#b89a6c",
            laneBorder: "#523c23",
            evolveCost: 1600,
            units: [
                {
                    id: 0,
                    name: "Swordsman",
                    icon: "⚔️",
                    type: "melee",
                    cost: 5,
                    hp: 330,
                    damage: 82,
                    speed: 84,
                    range: 56,
                    cooldown: 2.0,
                    bodyColor: "#2563eb",
                    weaponType: "sword"
                },
                {
                    id: 1,
                    name: "Crossbowman",
                    icon: "🎯",
                    type: "ranged",
                    projectile: "bolt",
                    cost: 9,
                    hp: 210,
                    damage: 78,
                    speed: 72,
                    range: 220,
                    cooldown: 2.7,
                    bodyColor: "#7c3aed",
                    weaponType: "crossbow"
                },
                {
                    id: 2,
                    name: "Armored Knight",
                    icon: "🛡️",
                    type: "heavy",
                    cost: 18,
                    hp: 1050,
                    damage: 155,
                    speed: 62,
                    range: 72,
                    cooldown: 6.0,
                    bodyColor: "#475569",
                    weaponType: "knight"
                }
            ]
        },
        {
            name: "Modern War",
            arabicName: "العصر الحديث",
            weather: "rain",
            weatherName: "🌧️ Rain",
            weatherNameAr: "أمطار المعركة 🌧️",
            turfColor: "#8e9950",
            laneColor: "#c29b67",
            laneBorder: "#573d22",
            evolveCost: 4000,
            units: [
                {
                    id: 0,
                    name: "Rifleman",
                    icon: "🔫",
                    type: "melee",
                    projectile: "bullet",
                    cost: 6,
                    hp: 650,
                    damage: 150,
                    speed: 88,
                    range: 120,
                    cooldown: 2.1,
                    bodyColor: "#4d7c0f",
                    weaponType: "rifle"
                },
                {
                    id: 1,
                    name: "Bazooka",
                    icon: "🚀",
                    type: "ranged",
                    projectile: "rocket",
                    cost: 12,
                    hp: 460,
                    damage: 240,
                    speed: 70,
                    range: 240,
                    cooldown: 3.3,
                    bodyColor: "#ea580c",
                    weaponType: "bazooka"
                },
                {
                    id: 2,
                    name: "Battle Tank",
                    icon: "🚜",
                    type: "heavy",
                    projectile: "shell",
                    cost: 24,
                    hp: 2200,
                    damage: 390,
                    speed: 56,
                    range: 150,
                    cooldown: 7.2,
                    bodyColor: "#dfbd6c",
                    weaponType: "tank"
                }
            ]
        }
    ];

    // ==========================================
    // 2. FINITE STATE MACHINE (FSM) DEFINITION
    // ==========================================
    const UnitFSMState = {
        SPAWNING: 'SPAWNING',
        MOVING: 'MOVING',
        ATTACKING: 'ATTACKING',
        DYING: 'DYING'
    };

    // State compatibility constants
    const STATE_IDLE = UnitFSMState.MOVING;
    const STATE_WALK = UnitFSMState.MOVING;
    const STATE_ATTACK = UnitFSMState.ATTACKING;
    const STATE_DIE = UnitFSMState.DYING;

    function formatDamageText(dmg) {
        if (dmg >= 1000) {
            return (dmg / 1000).toFixed(dmg % 1000 === 0 ? 0 : 1) + 'k';
        }
        return Math.round(dmg).toString();
    }

    // ==========================================
    // 3. PERSISTENCE & STATE MANAGER
    // ==========================================
    class GameStateManager {
        constructor() {
            this.coins = 50;
            this.gems = 10;
            this.currentEra = 0;
            this.highestEraReached = 0;
            this.totalEnemiesDefeated = 0;
            this.totalBattlesPlayed = 0;
            this.foodRateLevel = 1;
            this.foodCapLevel = 1;
            this.baseHpLevel = 1;
            this.dungeonKeys = 3;
            this.totalVictories = 0;
            this.soundEnabled = true;
            this.musicEnabled = true;
            this.musicVolume = 0.65;
            this.hapticEnabled = true;
            this.gameSpeed = 1.0;
            this.loadState();
            this.highestEraReached = Math.max(this.highestEraReached || 0, this.currentEra);
        }

        loadState() {
            try {
                if (window.AndroidBridge && typeof window.AndroidBridge.getGameState === 'function') {
                    const raw = window.AndroidBridge.getGameState();
                    if (raw) Object.assign(this, JSON.parse(raw));
                } else {
                    const local = localStorage.getItem('age_warriors_save');
                    if (local) Object.assign(this, JSON.parse(local));
                }
                this.highestEraReached = Math.max(this.highestEraReached || 0, this.currentEra);
            } catch (e) {
                console.error("Error loading state:", e);
            }
        }

        saveState() {
            try {
                this.highestEraReached = Math.max(this.highestEraReached || 0, this.currentEra);
                const payload = JSON.stringify({
                    coins: this.coins,
                    gems: this.gems,
                    currentEra: this.currentEra,
                    highestEraReached: this.highestEraReached,
                    totalEnemiesDefeated: this.totalEnemiesDefeated,
                    totalBattlesPlayed: this.totalBattlesPlayed,
                    foodRateLevel: this.foodRateLevel,
                    foodCapLevel: this.foodCapLevel,
                    baseHpLevel: this.baseHpLevel,
                    dungeonKeys: this.dungeonKeys,
                    totalVictories: this.totalVictories,
                    soundEnabled: this.soundEnabled,
                    musicEnabled: this.musicEnabled,
                    musicVolume: this.musicVolume,
                    hapticEnabled: this.hapticEnabled,
                    gameSpeed: this.gameSpeed
                });
                if (window.AndroidBridge && typeof window.AndroidBridge.saveGameState === 'function') {
                    window.AndroidBridge.saveGameState(payload);
                } else {
                    localStorage.setItem('age_warriors_save', payload);
                }
            } catch (e) {
                console.error("Error saving state:", e);
            }
        }

        getFoodRate() {
            return 1.2 + (this.foodRateLevel - 1) * 0.45;
        }

        getMaxFood() {
            return 20 + (this.foodCapLevel - 1) * 8;
        }

        getBaseMaxHp() {
            const eraBonus = this.currentEra * 650;
            return 500 + (this.baseHpLevel - 1) * 200 + eraBonus;
        }

        getUpgradeCost(type) {
            const lvl = type === 'rate' ? this.foodRateLevel : (type === 'cap' ? this.foodCapLevel : this.baseHpLevel);
            return Math.floor(25 * Math.pow(1.5, lvl - 1));
        }

        haptic(ms = 35) {
            if (!this.hapticEnabled) return;
            if (window.AndroidBridge && typeof window.AndroidBridge.performHaptic === 'function') {
                window.AndroidBridge.performHaptic(ms);
            }
        }
    }

    // ==========================================
    // 4. ENTITIES WITH SQUASH & STRETCH AND HAND-DRAWN OUTLINES
    // ==========================================
    class Unit2D {
        constructor(config, isEnemy, spawnX, spawnY) {
            this.config = config;
            this.isEnemy = isEnemy;
            this.x = spawnX;
            this.y = spawnY;
            this.targetY = spawnY;
            this.facingDir = isEnemy ? -1 : 1;

            // Finite State Machine (FSM)
            this.fsmState = UnitFSMState.SPAWNING;
            this.state = UnitFSMState.SPAWNING;
            this.currentTarget = null;

            this.hp = config.hp;
            this.maxHp = config.hp;
            this.damage = config.damage;
            this.speed = config.speed;
            this.range = config.range;
            this.cooldown = 0;
            this.attackInterval = config.cooldown;
            this.walkCycle = Math.random() * Math.PI * 2;
            this.attackTimer = 0;
            this.dead = false;
            this.deathTimer = 0;
            this.maxDeathDuration = 0.55; // Complete shrink & fade-out visual animation
            this.deathFloatY = 0;
            this.blinkTimer = 1.5 + Math.random() * 3.0;
            this.width = config.type === 'heavy' ? 52 : 28;
            this.height = config.type === 'heavy' ? 44 : 36;
            this.spawnProgress = 0; // 0 to 1 over 0.45s for smooth emergence from cave portal
            this.hasPuffedSpawnDust = false;
        }

        // FSM State Transition Method
        changeState(nextState, context = {}) {
            if (this.fsmState === UnitFSMState.DYING) return; // Dying is terminal
            if (this.fsmState === nextState) return;

            const prevState = this.fsmState;
            this.onExitState(prevState);
            this.fsmState = nextState;
            this.state = nextState;

            // Guarantee full opacity when moving or attacking
            if (nextState !== UnitFSMState.SPAWNING) {
                this.spawnProgress = 1.0;
            }

            this.onEnterState(nextState, context);
        }

        onExitState(state) {
            if (state === UnitFSMState.ATTACKING) {
                this.currentTarget = null;
            }
        }

        onEnterState(state, context = {}) {
            if (state === UnitFSMState.ATTACKING) {
                // Immediate target acquisition and facing
                if (context.target) {
                    this.currentTarget = context.target;
                    this.facingDir = (context.target.x >= this.x) ? 1 : -1;
                } else if (context.targetBase) {
                    const mouthX = context.targetBase.x + context.targetBase.width * 0.5;
                    this.facingDir = (mouthX >= this.x) ? 1 : -1;
                }

                // Fluid simultaneous attack:
                // If cooldown is ready on entering attack range, trigger first simultaneous strike with zero latency!
                if (this.cooldown <= 0) {
                    this.executeAttack(context.target, context.targetBase, context.enemies);
                    this.cooldown = this.attackInterval;
                    this.attackTimer = 0.32;
                }
            } else if (state === UnitFSMState.MOVING) {
                this.currentTarget = null;
            } else if (state === UnitFSMState.DYING) {
                this.dead = true;
                this.deathTimer = 0;
                this.deathFloatY = 0;
                // Visual feedback: burst defeat puffy particles and spark dust on death
                game.spawnPuffyExplosion(this.x, this.y, 0.5);
                game.spawnParticles(this.x, this.y - 14, 6, this.isEnemy ? "#ef4444" : "#3b82f6");
            }
        }

        // Class-Based Combat Priorities (الأولويات العسكرية المقسمة)
        getClosestTarget(enemies) {
            const aliveEnemies = enemies.filter(e => !e.dead);
            if (aliveEnemies.length === 0) return null;

            const myType = this.config.type; // 'ranged', 'melee', or 'heavy'
            let prio1 = [];
            let prio2 = [];

            if (myType === 'ranged') {
                // Ranged Units: Priority 1 = Enemy Ranged, Priority 2 = Enemy Melee/Heavy
                prio1 = aliveEnemies.filter(e => e.config.type === 'ranged');
                prio2 = aliveEnemies.filter(e => e.config.type !== 'ranged');
            } else {
                // Melee & Heavy Units: Priority 1 = Enemy Melee/Heavy, Priority 2 = Enemy Ranged
                prio1 = aliveEnemies.filter(e => e.config.type !== 'ranged');
                prio2 = aliveEnemies.filter(e => e.config.type === 'ranged');
            }

            // Pick closest candidate by absolute X distance Math.abs(e.x - this.x)
            const candidates = prio1.length > 0 ? prio1 : prio2;
            let bestTarget = null;
            let bestDist = Infinity;

            for (const enemy of candidates) {
                const dist = Math.abs(enemy.x - this.x);
                if (dist < bestDist) {
                    bestDist = dist;
                    bestTarget = enemy;
                }
            }

            return bestTarget;
        }

        update(dt, allies, enemies, targetBase, laneTop, laneBottom) {
            if (this.fsmState === UnitFSMState.DYING || this.dead) {
                this.deathTimer += dt;
                this.deathFloatY -= 14 * dt; // subtle upward float as it shrinks and fades
                return;
            }

            // 1. Spawning Lifecycle (progresses unconditionally until fully opaque)
            if (this.spawnProgress < 1.0) {
                this.spawnProgress += dt / 0.35;
                if (this.spawnProgress >= 0.65 && !this.hasPuffedSpawnDust) {
                    this.hasPuffedSpawnDust = true;
                    game.spawnParticles(this.x, this.y, 4, "#d4b996");
                }
                if (this.spawnProgress >= 1.0) {
                    this.spawnProgress = 1.0;
                    if (this.fsmState === UnitFSMState.SPAWNING) {
                        this.changeState(UnitFSMState.MOVING);
                    }
                }
            }

            this.cooldown = Math.max(0, this.cooldown - dt);
            this.blinkTimer -= dt;
            if (this.blinkTimer <= 0) {
                this.blinkTimer = 2.0 + Math.random() * 4.0;
            }

            // 2. Target Acquisition & Distance Calculations
            const target = this.getClosestTarget(enemies);
            const targetDistX = target ? Math.abs(target.x - this.x) : Infinity;
            const targetDistY = target ? Math.abs(target.y - this.y) : 0;
            
            const isMelee = !this.config.projectile;
            const effectiveRange = this.range + (isMelee ? 22 : 0);
            const inRangeOfTarget = target && (targetDistX <= effectiveRange) && (targetDistY <= 65);

            const mouthX = targetBase.x + targetBase.width * 0.5;
            const mouthY = targetBase.y + targetBase.height * 0.62;
            
            let baseDistX = Infinity;
            if (!this.isEnemy) {
                baseDistX = (targetBase.x + 8) - this.x;
            } else {
                baseDistX = this.x - (targetBase.x + targetBase.width - 8);
            }
            const inRangeOfBase = !target && (baseDistX <= this.range + 14);

            // 3. FSM STATE TRANSITIONS: Transitions between 'Moving' and 'Attacking' once in range
            if (inRangeOfTarget || inRangeOfBase) {
                if (this.fsmState !== UnitFSMState.ATTACKING) {
                    this.changeState(UnitFSMState.ATTACKING, {
                        target,
                        targetBase: inRangeOfBase ? targetBase : null,
                        enemies
                    });
                }
            } else {
                if (this.fsmState === UnitFSMState.ATTACKING) {
                    this.changeState(UnitFSMState.MOVING);
                }
            }

            // 4. FSM STATE BEHAVIORS
            if (this.fsmState === UnitFSMState.ATTACKING) {
                // Face active combat target
                if (target) {
                    this.facingDir = (target.x >= this.x) ? 1 : -1;
                } else {
                    this.facingDir = (mouthX >= this.x) ? 1 : -1;
                }

                // Simultaneous Attack Execution:
                // Every unit in ATTACKING state strikes concurrently whenever its individual cooldown is ready!
                if (this.cooldown <= 0) {
                    this.executeAttack(target, inRangeOfBase ? targetBase : null, enemies);
                    this.cooldown = this.attackInterval;
                    this.attackTimer = 0.32;
                }
            } else if (this.fsmState === UnitFSMState.MOVING || this.fsmState === UnitFSMState.SPAWNING) {
                // Moving behavior
                const destX = target ? target.x : mouthX;
                const moveDir = destX > this.x ? 1 : -1;
                this.facingDir = moveDir;

                this.x += moveDir * this.speed * dt;
                this.walkCycle += dt * 8.8;

                // Clamp to prevent walking inside the enemy base rock wall
                if (!this.isEnemy && this.x >= targetBase.x - 8) {
                    this.x = targetBase.x - 8;
                } else if (this.isEnemy && this.x <= targetBase.x + targetBase.width + 8) {
                    this.x = targetBase.x + targetBase.width + 8;
                }

                // Don't walk past enemy frontline clash
                if (target && isMelee) {
                    if (!this.isEnemy && this.x > target.x - 14) {
                        this.x = target.x - 14;
                    } else if (this.isEnemy && this.x < target.x + 14) {
                        this.x = target.x + 14;
                    }
                }

                // Steer vertically towards target's Y if pursuing an enemy
                if (target) {
                    this.targetY = target.y;
                }
            }

            // 5. Environmental Steering & Flocking with Allies
            for (const ally of allies) {
                if (ally === this || ally.dead) continue;
                const adx = Math.abs(ally.x - this.x);
                const ady = Math.abs(ally.y - this.y);
                if (adx < (this.width + 10) && ady < 28) {
                    const pushY = (this.y >= ally.y ? 1 : -1) * 36 * dt;
                    this.targetY += pushY;
                }
            }

            // BASE FUNNELING SYSTEM (When advancing towards enemy base)
            if (!target) {
                const screenW = window.innerWidth || 800;
                const goalY = mouthY;
                if (!this.isEnemy) {
                    if (this.x > screenW * 0.45) {
                        const funnelFactor = Math.min(1.0, (this.x - screenW * 0.45) / (screenW * 0.35));
                        const spread = Math.sin(this.walkCycle * 3.2) * 16;
                        this.targetY += (goalY + spread - this.targetY) * funnelFactor * 0.08 * (dt * 60);
                    }
                } else {
                    if (this.x < screenW * 0.55) {
                        const funnelFactor = Math.min(1.0, (screenW * 0.55 - this.x) / (screenW * 0.35));
                        const spread = Math.sin(this.walkCycle * 3.2) * 16;
                        this.targetY += (goalY + spread - this.targetY) * funnelFactor * 0.08 * (dt * 60);
                    }
                }
            }

            // Smooth steering inside organic road boundaries
            const currentTop = getRoadTopY(this.x, laneTop, window.innerWidth);
            const currentBottom = getRoadBottomY(this.x, laneBottom, window.innerWidth);
            this.targetY = Math.max(currentTop + 16, Math.min(currentBottom - 16, this.targetY));
            this.y += (this.targetY - this.y) * 4.8 * dt;

            if (this.attackTimer > 0) {
                this.attackTimer -= dt;
            }
        }

        executeAttack(targetUnit, targetBase, enemies) {
            const isRanged = !!this.config.projectile;
            const targetX = targetUnit ? targetUnit.x : (targetBase ? targetBase.x + targetBase.width * 0.5 : this.x);
            const targetY = targetUnit ? targetUnit.y : (targetBase ? targetBase.y + targetBase.height * 0.62 : this.y);

            if (isRanged) {
                game.spawnProjectile(
                    this.x + (this.facingDir * 16),
                    this.y - 18,
                    targetX,
                    targetY,
                    this.config.projectile,
                    this.damage,
                    this.isEnemy
                );
                if (this.config.projectile === 'bullet' || this.config.projectile === 'rocket' || this.config.projectile === 'shell') {
                    window.soundManager.playGunshot();
                } else {
                    window.soundManager.playRangedAttack();
                }
            } else {
                // Simultaneous Melee Cleave: Strike all nearby enemies in front simultaneously
                const strikeDist = this.range + 24;
                const hitEnemies = [];

                if (enemies && enemies.length > 0) {
                    for (const enemy of enemies) {
                        if (enemy.dead) continue;
                        const dx = (enemy.x - this.x) * this.facingDir;
                        const dy = Math.abs(enemy.y - this.y);
                        // Forward strike box
                        if (dx >= -12 && dx <= strikeDist && dy <= 48) {
                            hitEnemies.push(enemy);
                        }
                    }
                }

                if (hitEnemies.length === 0 && targetUnit && !targetUnit.dead) {
                    hitEnemies.push(targetUnit);
                }

                // All hit enemies take simultaneous damage
                for (const enemy of hitEnemies) {
                    enemy.takeDamage(this.damage);
                    game.spawnParticles(enemy.x, enemy.y, 3, "#fbbf24");
                }

                if (targetBase) {
                    const baseDist = Math.abs((targetBase.x + targetBase.width * 0.5) - this.x);
                    if (baseDist <= strikeDist + targetBase.width * 0.5) {
                        targetBase.takeDamage(this.damage);
                        game.spawnParticles(this.x + this.facingDir * 20, this.y, 4, "#fbbf24");
                    }
                }

                window.soundManager.playMeleeHit();
            }
        }

        takeDamage(dmg) {
            this.hp -= dmg;
            const formatted = formatDamageText(dmg);
            game.spawnDamageNumber(this.x, this.y - this.height - 6, formatted, this.isEnemy ? "#ffffff" : "#ef4444");

            if (this.hp <= 0 && !this.dead) {
                this.dead = true;
                this.changeState(UnitFSMState.DYING);
                game.spawnPuffyExplosion(this.x, this.y, 0.45);

                if (this.isEnemy) {
                    const bounty = Math.max(3, Math.floor(this.config.cost * 3.8));
                    game.addBattleGold(bounty);
                    game.spawnDamageNumber(this.x, this.y - this.height - 24, `+${bounty}🪙`, "#facc15");
                    game.onEnemyDefeated();
                }
            }
        }

        draw(ctx) {
            ctx.save();
            ctx.translate(this.x, this.y);

            let currentAlpha = 1.0;
            // Only apply emergence fade if actively in SPAWNING state
            if (this.fsmState === UnitFSMState.SPAWNING && this.spawnProgress < 1.0) {
                currentAlpha = Math.max(0.25, Math.min(1.0, this.spawnProgress));
            }

            let scaleX = 1.0;
            let scaleY = 1.0;
            let tilt = 0;

            if (this.dead || this.fsmState === UnitFSMState.DYING) {
                const deathProgress = Math.min(1.0, this.deathTimer / this.maxDeathDuration);

                // 1. Non-linear smooth fade-out curve (quadratic ease-out)
                const fadeAlpha = Math.max(0, 1.0 - Math.pow(deathProgress, 1.4));
                currentAlpha = fadeAlpha;

                // 2. Shrink animation curve: initial pop on defeat, then smoothly shrinking down to zero
                let shrinkFactor = 1.0;
                if (deathProgress < 0.15) {
                    shrinkFactor = 1.0 + Math.sin((deathProgress / 0.15) * Math.PI) * 0.14; // satisfying impact pop
                } else {
                    const shrinkProgress = (deathProgress - 0.15) / 0.85;
                    shrinkFactor = Math.max(0.001, 1.0 - Math.pow(shrinkProgress, 1.3));
                }

                scaleX *= shrinkFactor;
                scaleY *= shrinkFactor;
                tilt += deathProgress * 0.22 * this.facingDir;

                // Subtle float translation as the defeated unit dissipates
                ctx.translate(0, this.deathFloatY);
            }
            ctx.globalAlpha = currentAlpha;

            // Dynamic 360 Flip based on facing direction
            ctx.scale(this.facingDir, 1);

            // SQUASH & STRETCH PHYSICAL TRANSFORMATION
            if (this.fsmState === UnitFSMState.MOVING || this.fsmState === UnitFSMState.SPAWNING) {
                const walkPhase = Math.sin(this.walkCycle);
                // Foot contact: Squash (wide & short). Mid air: Stretch (tall & slender).
                scaleY = 1.0 - Math.abs(walkPhase) * 0.14 + (walkPhase > 0 ? 0.05 : -0.03);
                scaleX = 1.0 / Math.sqrt(scaleY); // preserve cartoon mass
                tilt = walkPhase * 0.09 + 0.04;
            } else if (this.fsmState === UnitFSMState.ATTACKING) {
                if (this.attackTimer > 0.16) {
                    // Anticipation wind-up: crouch down & lean back
                    scaleY = 0.84;
                    scaleX = 1.16;
                    tilt = -0.16;
                } else if (this.attackTimer > 0.0) {
                    // Strike release: stretch forward with massive energy!
                    scaleY = 1.22;
                    scaleX = 0.85;
                    tilt = 0.22;
                }
            }

            // Organic cartoon ground shadow with line boil (shrinks and fades as unit dies)
            const shadowAlpha = (this.dead || this.fsmState === UnitFSMState.DYING)
                ? Math.max(0, 0.24 * (1.0 - this.deathTimer / this.maxDeathDuration))
                : 0.24;
            ctx.fillStyle = `rgba(0, 0, 0, ${shadowAlpha})`;
            ctx.beginPath();
            ctx.ellipse(0, 0, Math.max(0, this.width * 0.65 * scaleX), Math.max(0, 7 * scaleY), 0, 0, Math.PI * 2);
            ctx.fill();

            // Apply squash & stretch and cartoon tilt
            ctx.scale(scaleX, scaleY);
            ctx.rotate(tilt);

            // Ink stroke configuration
            ctx.lineJoin = "round";
            ctx.lineCap = "round";
            ctx.lineWidth = 2.8;
            ctx.strokeStyle = "#111827"; // Hand-drawn deep ink

            const bounce = (this.fsmState === UnitFSMState.MOVING || this.fsmState === UnitFSMState.SPAWNING) ? Math.sin(this.walkCycle) * 3 : 0;
            const swing = (this.attackTimer > 0) ? Math.sin(this.attackTimer * 12) * 14 : 0;
            const bodyY = -20 + bounce;

            // DRAW FLAT HAND-DRAWN STYLE WITH ORGANIC CONTOURS
            if (this.config.type === 'heavy' && this.config.weaponType === 'tank') {
                // TANK WITH SQUASH & RECOIL
                const tankColor = this.isEnemy ? "#dc2626" : this.config.bodyColor;

                // Treads
                ctx.fillStyle = "#262626";
                drawHandDrawnRoundRect(ctx, -24, -12, 48, 14, 6, 1.3);
                ctx.fill();
                ctx.stroke();

                // Wheels
                [-15, -5, 5, 15].forEach((wx) => {
                    ctx.fillStyle = "#dfbd6c";
                    drawHandDrawnCircle(ctx, wx, -5, 4.5, 0.9);
                    ctx.fill();
                    ctx.stroke();
                    ctx.fillStyle = "#111827";
                    drawHandDrawnCircle(ctx, wx, -5, 1.5, 0.6);
                    ctx.fill();
                });

                // Tank Hull
                ctx.fillStyle = tankColor;
                drawHandDrawnRoundRect(ctx, -22, -26, 44, 16, 4, 1.4);
                ctx.fill();
                ctx.stroke();

                // Turret Dome
                ctx.fillStyle = tankColor;
                ctx.beginPath();
                ctx.arc(-2, -26, 11, Math.PI, Math.PI * 2);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();

                // Cannon with hand-drawn stroke & recoil
                ctx.fillStyle = "#1e293b";
                drawHandDrawnRoundRect(ctx, 8 - (swing > 0 ? 4 : 0), -30, 22, 6, 2, 1.2);
                ctx.fill();
                ctx.stroke();

                if (this.attackTimer > 0.18) {
                    ctx.fillStyle = "#facc15";
                    drawHandDrawnCircle(ctx, 32, -27, 8, 1.5);
                    ctx.fill();
                }
            } else if (this.config.weaponType === 'dino') {
                // DINO RIDER
                const dinoColor = this.isEnemy ? "#b91c1c" : "#15803d";
                ctx.fillStyle = dinoColor;
                drawHandDrawnCircle(ctx, 0, bodyY + 4, 16, 1.8);
                ctx.fill();
                ctx.stroke();

                drawHandDrawnCircle(ctx, 14, bodyY - 4, 9, 1.5);
                ctx.fill();
                ctx.stroke();

                // Cute eye
                ctx.fillStyle = "#ffffff";
                ctx.beginPath();
                ctx.arc(16, bodyY - 6, 3, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = "#000000";
                ctx.fillRect(16, bodyY - 7, 2, 3);

                // Rider Peach Head
                ctx.fillStyle = "#ffbe98";
                drawHandDrawnCircle(ctx, 0, bodyY - 14, 7.5, 1.2);
                ctx.fill();
                ctx.stroke();
                ctx.fillStyle = "#000000";
                ctx.fillRect(2, bodyY - 16, 2, 4);
            } else if (this.config.weaponType === 'chariot' || this.config.weaponType === 'knight') {
                // CHARIOT / MOUNTED KNIGHT
                const mountColor = this.isEnemy ? "#7f1d1d" : "#78350f";
                ctx.fillStyle = mountColor;
                drawHandDrawnRoundRect(ctx, -16, bodyY + 2, 32, 14, 6, 1.6);
                ctx.fill();
                ctx.stroke();

                drawHandDrawnCircle(ctx, 14, bodyY - 4, 8, 1.4);
                ctx.fill();
                ctx.stroke();

                ctx.fillStyle = this.isEnemy ? "#991b1b" : this.config.bodyColor;
                drawHandDrawnRoundRect(ctx, -6, bodyY - 14, 12, 14, 3, 1.3);
                ctx.fill();
                ctx.stroke();

                ctx.fillStyle = "#ffbe98";
                drawHandDrawnCircle(ctx, 0, bodyY - 18, 7, 1.2);
                ctx.fill();
                ctx.stroke();

                ctx.fillStyle = "#94a3b8";
                drawHandDrawnRoundRect(ctx, 6, bodyY - 12 + swing * 0.4, 24, 4, 2, 1.3);
                ctx.fill();
                ctx.stroke();
            } else {
                // HUMANOID WARRIOR (Soldier / Clubman / Spearman / Swordsman / Archer / Rifleman / Bazooka)
                const bodyColor = this.isEnemy ? "#b91c1c" : this.config.bodyColor;
                const legOffset = (this.fsmState === UnitFSMState.MOVING || this.fsmState === UnitFSMState.SPAWNING) ? Math.sin(this.walkCycle) * 6 : 0;

                // Hand-Drawn Legs
                ctx.fillStyle = "#1f2937";
                drawHandDrawnRoundRect(ctx, -7 - legOffset, -6, 5, 8, 2, 1.2);
                ctx.fill();
                ctx.stroke();
                drawHandDrawnRoundRect(ctx, 2 + legOffset, -6, 5, 8, 2, 1.2);
                ctx.fill();
                ctx.stroke();

                // Hand-Drawn Body / Torso
                ctx.fillStyle = bodyColor;
                drawHandDrawnRoundRect(ctx, -8, bodyY - 2, 16, 16, 4, 1.5);
                ctx.fill();
                ctx.stroke();

                // Hand-Drawn Peach Head (Wobbly organic roundness)
                ctx.fillStyle = "#ffbe98";
                drawHandDrawnCircle(ctx, 0, bodyY - 10, 8.5, 1.3);
                ctx.fill();
                ctx.stroke();

                // Cute pill eyes with organic blink
                ctx.fillStyle = "#111827";
                if (this.blinkTimer < 0.15) {
                    // Blinking (- -)
                    ctx.fillRect(1, bodyY - 10, 3, 1.5);
                    ctx.fillRect(5, bodyY - 10, 3, 1.5);
                } else {
                    // Open vertical pill eyes (| |)
                    ctx.fillRect(2, bodyY - 12, 2, 4);
                    ctx.fillRect(5, bodyY - 12, 2, 4);
                }

                // Helmet / Hat
                if (this.config.weaponType === 'rifle' || this.config.weaponType === 'bazooka') {
                    ctx.fillStyle = this.isEnemy ? "#7f1d1d" : "#3f6212";
                    ctx.beginPath();
                    ctx.arc(0, bodyY - 12, 9.2, Math.PI * 0.9, Math.PI * 2.1);
                    ctx.closePath();
                    ctx.fill();
                    ctx.stroke();
                } else if (this.config.weaponType === 'sword' || this.config.weaponType === 'knight') {
                    ctx.fillStyle = "#64748b";
                    ctx.beginPath();
                    ctx.arc(0, bodyY - 12, 9.2, Math.PI * 0.85, Math.PI * 2.15);
                    ctx.closePath();
                    ctx.fill();
                    ctx.stroke();
                }

                // Weapons with hand-drawn ink contours
                ctx.save();
                ctx.translate(6, bodyY);
                ctx.rotate(swing * 0.05);

                if (this.config.weaponType === 'rifle') {
                    ctx.fillStyle = "#1e293b";
                    drawHandDrawnRoundRect(ctx, 0, -6, 16, 5, 2, 1.3);
                    ctx.fill();
                    ctx.stroke();
                    ctx.fillStyle = "#78350f";
                    ctx.fillRect(-4, -5, 5, 4);
                    ctx.stroke();
                } else if (this.config.weaponType === 'bazooka') {
                    ctx.fillStyle = "#334155";
                    drawHandDrawnRoundRect(ctx, -4, -10, 24, 7, 3, 1.4);
                    ctx.fill();
                    ctx.stroke();
                } else if (this.config.weaponType === 'bow' || this.config.weaponType === 'crossbow') {
                    ctx.strokeStyle = "#78350f";
                    ctx.lineWidth = 3;
                    ctx.beginPath();
                    ctx.arc(4, 0, 10, -Math.PI * 0.4, Math.PI * 0.4);
                    ctx.stroke();
                } else {
                    ctx.fillStyle = (this.config.weaponType === 'club') ? "#78350f" : "#e2e8f0";
                    drawHandDrawnRoundRect(ctx, 2, -14, 5, 18, 2, 1.3);
                    ctx.fill();
                    ctx.stroke();
                    ctx.fillStyle = "#d97706";
                    ctx.fillRect(0, 0, 9, 3);
                    ctx.stroke();
                }
                ctx.restore();
            }

            // Health Bar
            if (!this.dead && this.hp < this.maxHp) {
                const barW = this.width;
                const barH = 5;
                const barY = -this.height - 10;
                ctx.fillStyle = "#000000";
                drawHandDrawnRoundRect(ctx, -barW * 0.5 - 1, barY - 1, barW + 2, barH + 2, 2, 0.8);
                ctx.fill();
                ctx.fillStyle = this.isEnemy ? "#ef4444" : "#22c55e";
                const fillRatio = Math.max(0, this.hp / this.maxHp);
                ctx.fillRect(-barW * 0.5, barY, barW * fillRatio, barH);
            }

            ctx.restore();
        }
    }

    // ==========================================
    // 5. CARTOON PUFFY EXPLOSION & CRATERS
    // ==========================================
    class CartoonPuffyExplosion {
        constructor(x, y, scale = 1.0) {
            this.x = x;
            this.y = y;
            this.scale = scale;
            this.life = 1.4;
            this.maxLife = 1.4;
            this.puffs = [];

            const puffCount = 14;
            for (let i = 0; i < puffCount; i++) {
                const angle = Math.random() * Math.PI * 2;
                const radius = Math.random() * 32 * scale;
                this.puffs.push({
                    ox: Math.cos(angle) * radius * 1.5,
                    oy: -28 * scale + Math.sin(angle) * radius * 0.8,
                    baseSize: (18 + Math.random() * 18) * scale,
                    color: i % 3 === 0 ? "#ffffff" : (i % 3 === 1 ? "#e2e8f0" : "#cbd5e1"),
                    floatVy: -12 - Math.random() * 20
                });
            }

            for (let i = 0; i < 6; i++) {
                this.puffs.push({
                    ox: (Math.random() - 0.5) * 16 * scale,
                    oy: -Math.random() * 24 * scale,
                    baseSize: (14 + Math.random() * 12) * scale,
                    color: "#f1f5f9",
                    floatVy: -8
                });
            }
        }

        update(dt) {
            this.life -= dt;
            for (const p of this.puffs) {
                p.oy += p.floatVy * dt;
            }
        }

        draw(ctx) {
            ctx.save();
            ctx.translate(this.x, this.y);

            const progress = 1 - (this.life / this.maxLife);
            const expandScale = progress < 0.25 ? (progress / 0.25) * 1.1 : 1.1 - (progress - 0.25) * 0.15;
            const alpha = Math.max(0, this.life / this.maxLife);
            ctx.globalAlpha = alpha;

            // Shockwave ring
            ctx.strokeStyle = "rgba(239, 68, 68, 0.4)";
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.ellipse(0, 0, (40 + progress * 70) * this.scale, (18 + progress * 30) * this.scale, 0, 0, Math.PI * 2);
            ctx.stroke();

            // Puffy cloud circles with hand-drawn organic outlines
            ctx.lineWidth = 2.6;
            ctx.strokeStyle = "#1e293b";
            ctx.lineJoin = "round";

            for (const p of this.puffs) {
                const currentSize = p.baseSize * expandScale;
                ctx.fillStyle = p.color;
                drawHandDrawnCircle(ctx, p.ox, p.oy, currentSize, 1.4);
                ctx.fill();
                ctx.stroke();
            }

            ctx.restore();
        }
    }

    class GroundCrater {
        constructor(x, y, radius = 32) {
            this.x = x;
            this.y = y;
            this.radius = radius;
            this.life = 12.0;
        }

        update(dt) {
            this.life -= dt;
        }

        draw(ctx) {
            ctx.save();
            ctx.translate(this.x, this.y);
            const alpha = Math.min(1, this.life / 2.0);
            ctx.globalAlpha = alpha * 0.65;

            ctx.fillStyle = "#8a6639";
            drawHandDrawnCircle(ctx, 0, 0, this.radius * 1.25, 2.0);
            ctx.fill();

            ctx.fillStyle = "#5c4021";
            drawHandDrawnCircle(ctx, 0, 0, this.radius, 1.6);
            ctx.fill();

            // Hand-drawn cracked earth lines
            ctx.strokeStyle = "#291807";
            ctx.lineWidth = 2.2;
            ctx.beginPath();
            drawHandDrawnLine(ctx, -this.radius * 0.9, 0, -this.radius * 1.3, -4, 1.8);
            drawHandDrawnLine(ctx, this.radius * 0.8, 2, this.radius * 1.2, 5, 1.8);
            ctx.stroke();

            ctx.restore();
        }
    }

    class FloatingDamageNumber {
        constructor(x, y, text, color) {
            this.x = x + (Math.random() - 0.5) * 16;
            this.y = y;
            this.text = text;
            this.color = color;
            this.life = 1.0;
            this.maxLife = 1.0;
            this.vy = -35 - Math.random() * 20;
            this.vx = (Math.random() - 0.5) * 18;
        }

        update(dt) {
            this.life -= dt;
            this.x += this.vx * dt;
            this.y += this.vy * dt;
            this.vy += 22 * dt;
        }

        draw(ctx) {
            ctx.save();
            const alpha = Math.max(0, this.life / this.maxLife);
            ctx.globalAlpha = alpha;

            ctx.font = "900 15px sans-serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";

            ctx.lineWidth = 3.8;
            ctx.strokeStyle = "#000000";
            ctx.strokeText(this.text, this.x, this.y);

            ctx.fillStyle = this.color;
            ctx.fillText(this.text, this.x, this.y);

            ctx.restore();
        }
    }

    class Projectile2D {
        constructor(x, y, tx, ty, type, damage, isEnemy) {
            this.type = type;
            this.damage = damage;
            this.isEnemy = isEnemy;
            this.dead = false;

            // Launch coordinates in 2.5D space:
            // Feet/ground level of the thrower:
            const originGroundY = y + 18;
            const z0 = 18; // Height above ground at release (shoulder/sling level)

            this.groundX = x;
            this.groundY = originGroundY;
            this.z = z0;

            this.targetX = tx;
            this.targetY = ty;

            const dx = tx - x;
            const dy = ty - originGroundY;
            this.totalDist = Math.hypot(dx, dy) || 1;

            // Physical trajectory properties calibrated per projectile type:
            if (type === 'rock') {
                // Rock Thrower: Heavy stone launched in an authentic, prominent parabolic arc
                this.speed = 310;
                this.gravity = 860;
                this.spinSpeed = (dx >= 0 ? 1 : -1) * 8.5; // Natural aerodynamic tumbling
            } else if (type === 'arrow') {
                // Archer: Graceful medieval ballistic arrow trajectory
                this.speed = 390;
                this.gravity = 720;
                this.spinSpeed = 0;
            } else if (type === 'bolt') {
                // Crossbowman: High-velocity crossbow bolt with flatter punchy arc
                this.speed = 460;
                this.gravity = 580;
                this.spinSpeed = 0;
            } else if (type === 'shell') {
                // Tank: Heavy artillery shell with high lobbing curve
                this.speed = 470;
                this.gravity = 920;
                this.spinSpeed = (dx >= 0 ? 1 : -1) * 5.0;
            } else if (type === 'rocket') {
                // Bazooka: Self-propelled rocket
                this.speed = 500;
                this.gravity = 220;
                this.spinSpeed = 0;
            } else {
                // Bullet: High-velocity flat trajectory
                this.speed = 620;
                this.gravity = 80;
                this.spinSpeed = 0;
            }

            // Total flight duration: T = totalDist / speed
            this.totalTime = Math.max(0.12, this.totalDist / this.speed);

            // Kinematic Equation for exact parabolic landing:
            // z(T) = z0 + vz0 * T - 0.5 * g * T^2 = 0
            // => vz0 = 0.5 * g * T - (z0 / T)
            this.vz = (0.5 * this.gravity * this.totalTime) - (this.z / this.totalTime);

            // Ensure a prominent upward lob for short-range rock throws
            if (this.type === 'rock') {
                this.vz = Math.max(120, this.vz);
            }

            // Horizontal velocity vector components
            this.vx = (dx / this.totalDist) * this.speed;
            this.vy = (dy / this.totalDist) * this.speed;

            this.elapsed = 0;
            this.rotation = 0;
            this.flightAngle = Math.atan2(this.vy - this.vz, this.vx);

            // Visual screen coordinates (2.5D Projection: screen Y = ground Y - z)
            this.x = this.groundX;
            this.y = this.groundY - this.z;

            // Parabolic Trajectory Trail Breadcrumbs
            this.trail = [];
            this.trailTimer = 0;
        }

        update(dt) {
            this.elapsed += dt;

            // 1. Step-by-step numerical integration of parabolic physics in the game loop:
            // Gravitational deceleration on vertical velocity: dvz/dt = -g
            this.vz -= this.gravity * dt;
            // Height above ground: dz/dt = vz
            this.z += this.vz * dt;

            // Horizontal ground translation: dx/dt = vx, dy/dt = vy
            this.groundX += this.vx * dt;
            this.groundY += this.vy * dt;

            // Apparent 2.5D screen position:
            this.x = this.groundX;
            this.y = this.groundY - Math.max(0, this.z);

            // 2. Flight tangent angle: instantaneous velocity derivative vector (vx, vy - vz)
            this.flightAngle = Math.atan2(this.vy - this.vz, this.vx);

            if (this.spinSpeed !== 0) {
                this.rotation += this.spinSpeed * dt;
            } else {
                this.rotation = this.flightAngle;
            }

            // 3. Trajectory trail records for smooth fading arc ribbon
            this.trailTimer += dt;
            if (this.trailTimer >= 0.02) {
                this.trailTimer = 0;
                this.trail.push({
                    x: this.x,
                    y: this.y,
                    groundX: this.groundX,
                    groundY: this.groundY,
                    z: this.z,
                    life: 0.32,
                    maxLife: 0.32
                });
            }

            for (let i = this.trail.length - 1; i >= 0; i--) {
                this.trail[i].life -= dt;
                if (this.trail[i].life <= 0) {
                    this.trail.splice(i, 1);
                }
            }

            // Smoke trail for propelled projectiles
            if (this.type === 'rocket' || this.type === 'shell') {
                game.spawnParticles(this.x, this.y, 1, "#f1f5f9");
            }

            // 4. Parabolic Impact: when projectile touches ground (z <= 0) or reaches target duration
            if (this.elapsed >= this.totalTime || (this.elapsed > 0.06 && this.z <= 0)) {
                this.impact();
            }
        }

        impact() {
            this.dead = true;
            const isHeavyExplosive = (this.type === 'rocket' || this.type === 'shell');
            const splashRadius = isHeavyExplosive ? 55 : (this.type === 'rock' ? 28 : 22);
            const targets = this.isEnemy ? game.playerUnits : game.enemyUnits;
            const targetBase = this.isEnemy ? game.playerBase : game.enemyBase;

            let hit = false;
            for (const unit of targets) {
                if (unit.dead) continue;
                const dist = Math.hypot(unit.x - this.targetX, unit.y - this.targetY);
                if (dist <= splashRadius) {
                    unit.takeDamage(this.damage);
                    hit = true;
                }
            }

            const baseDist = Math.hypot(targetBase.x - this.targetX, targetBase.y - this.targetY);
            if (baseDist <= splashRadius + 30) {
                targetBase.takeDamage(this.damage);
                hit = true;
            }

            if (isHeavyExplosive) {
                window.soundManager.playExplosion();
                game.spawnPuffyExplosion(this.targetX, this.targetY, 0.85);
                game.spawnCrater(this.targetX, this.targetY, 26);
                game.addScreenShake(6);
            } else if (this.type === 'rock') {
                // Rock impact: chunky dirt puff, stone scuff and dust particles
                game.spawnPuffyExplosion(this.targetX, this.targetY, 0.38);
                game.spawnCrater(this.targetX, this.targetY, 14);
                game.spawnParticles(this.targetX, this.targetY, 6, "#78716c");
                window.soundManager.playMeleeHit();
            } else {
                game.spawnParticles(this.targetX, this.targetY, 5, "#fde047");
            }
        }

        draw(ctx) {
            // 1. Ground Shadow (Spatial 2.5D depth showing projectile height above ground)
            if (this.z > 0 && !this.dead) {
                ctx.save();
                const shadowScale = Math.max(0.35, 1.0 - (this.z / 150));
                const shadowAlpha = 0.28 * shadowScale;
                ctx.fillStyle = `rgba(0, 0, 0, ${shadowAlpha})`;
                ctx.beginPath();
                const baseRadius = (this.type === 'rock' ? 5.5 : (this.type === 'shell' ? 8 : 4)) * shadowScale;
                ctx.ellipse(this.groundX, this.groundY, baseRadius * 1.6, baseRadius * 0.7, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }

            // 2. Parabolic Trajectory Arc Trail (Curved motion ribbon)
            if (this.trail.length > 1) {
                ctx.save();
                for (let i = 1; i < this.trail.length; i++) {
                    const p1 = this.trail[i - 1];
                    const p2 = this.trail[i];
                    const ratio = p2.life / p2.maxLife;
                    const alpha = ratio * (this.type === 'rock' ? 0.38 : 0.5);
                    ctx.strokeStyle = this.type === 'rock' ? `rgba(168, 162, 158, ${alpha})` :
                                      (this.type === 'arrow' ? `rgba(255, 255, 255, ${alpha})` :
                                      (this.type === 'bolt' ? `rgba(192, 132, 252, ${alpha})` : `rgba(251, 191, 36, ${alpha})`));
                    ctx.lineWidth = Math.max(0.8, ratio * (this.type === 'rock' ? 2.8 : 2.0));
                    ctx.beginPath();
                    ctx.moveTo(p1.x, p1.y);
                    ctx.lineTo(p2.x, p2.y);
                    ctx.stroke();
                }
                ctx.restore();
            }

            // 3. Projectile Body with Parabolic Tangent / Tumbling Rotation
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.rotation);
            ctx.strokeStyle = "#111827";
            ctx.lineWidth = 2.4;
            ctx.lineJoin = "round";
            ctx.lineCap = "round";

            if (this.type === 'rock') {
                // Rock Thrower Boulder with cartoon stone facets and tumbling ink outline
                ctx.fillStyle = "#78716c";
                drawHandDrawnCircle(ctx, 0, 0, 6, 1.3);
                ctx.fill();
                ctx.stroke();

                // Lighter stone facet highlight
                ctx.fillStyle = "#a8a29e";
                ctx.beginPath();
                ctx.arc(-2, -2, 2.5, 0, Math.PI * 2);
                ctx.fill();

                // Dark stone crack
                ctx.strokeStyle = "#44403c";
                ctx.lineWidth = 1.2;
                ctx.beginPath();
                ctx.moveTo(1, -2);
                ctx.lineTo(3, 2);
                ctx.stroke();
            } else if (this.type === 'arrow') {
                // Wooden shaft
                ctx.strokeStyle = "#78350f";
                ctx.lineWidth = 2.5;
                ctx.beginPath();
                ctx.moveTo(-10, 0);
                ctx.lineTo(8, 0);
                ctx.stroke();

                // Iron arrowhead
                ctx.fillStyle = "#94a3b8";
                ctx.strokeStyle = "#0f172a";
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.moveTo(10, 0);
                ctx.lineTo(5, -3);
                ctx.lineTo(6, 0);
                ctx.lineTo(5, 3);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();

                // Feathers / Fletching
                ctx.strokeStyle = "#ffffff";
                ctx.lineWidth = 1.8;
                ctx.beginPath();
                ctx.moveTo(-7, -2.5);
                ctx.lineTo(-10, 0);
                ctx.lineTo(-7, 2.5);
                ctx.stroke();
            } else if (this.type === 'bolt') {
                // Crossbow bolt
                ctx.strokeStyle = "#52525b";
                ctx.lineWidth = 3.0;
                ctx.beginPath();
                ctx.moveTo(-8, 0);
                ctx.lineTo(6, 0);
                ctx.stroke();

                // Steel point
                ctx.fillStyle = "#cbd5e1";
                ctx.strokeStyle = "#000000";
                ctx.lineWidth = 1.6;
                ctx.beginPath();
                ctx.moveTo(8, 0);
                ctx.lineTo(4, -3);
                ctx.lineTo(4, 3);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
            } else if (this.type === 'bullet') {
                ctx.fillStyle = "#facc15";
                drawHandDrawnRoundRect(ctx, -5, -2, 10, 4, 1.5, 0.8);
                ctx.fill();
                ctx.stroke();
            } else {
                // Shell or Rocket
                ctx.fillStyle = "#ea580c";
                drawHandDrawnRoundRect(ctx, -8, -4, 16, 8, 3, 1.4);
                ctx.fill();
                ctx.stroke();

                // Nose cone
                ctx.fillStyle = "#fbbf24";
                ctx.beginPath();
                ctx.moveTo(8, -4);
                ctx.lineTo(12, 0);
                ctx.lineTo(8, 4);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
            }

            ctx.restore();
        }
    }

    // ==========================================
    // 6. CARTOON BASE (Restored Original Cartoon Cave - Slightly Enlarged)
    // ==========================================
    class CartoonBase {
        constructor(team) {
            this.team = team;
            this.isPlayer = (team === 'player');
            this.hp = 500;
            this.maxHp = 500;

            // Dimensions: 2.5D cave design positioned directly on the screen edges for maximum battlefield length
            this.width = 106;
            this.height = 96;

            const laneTop = (window.innerHeight || 800) * 0.30;
            const laneBottom = (window.innerHeight || 800) * 0.70;
            const laneCenterY = (laneTop + laneBottom) * 0.5;
            this.y = laneCenterY - (this.height * 0.5);

            const screenW = window.innerWidth || 800;
            this.x = team === 'player' ? 0 : (screenW - this.width);
            this.hitShakeTimer = 0;
        }

        reset(maxHp) {
            this.hp = maxHp;
            this.maxHp = maxHp;
            this.hitShakeTimer = 0;
        }

        update(dt) {
            if (this.hitShakeTimer > 0) {
                this.hitShakeTimer -= dt;
            }
        }

        takeDamage(dmg) {
            this.hp = Math.max(0, this.hp - dmg);
            this.hitShakeTimer = 0.25;
            const formatted = formatDamageText(dmg);
            const numX = this.x + this.width * 0.5;
            game.spawnDamageNumber(numX, this.y - 35, `-${formatted}`, "#ef4444");
            game.spawnPuffyExplosion(numX, this.y + this.height * 0.55, 0.75);
            game.addScreenShake(5);

            if (this.hp <= 0) {
                game.onBaseDestroyed(this.team === 'player');
            }
        }

        draw(ctx) {
            if (!ctx) ctx = game.ctx;
            ctx.save();

            let shakeX = 0;
            let shakeY = 0;
            if (this.hitShakeTimer > 0) {
                shakeX = (Math.random() - 0.5) * 6 * (this.hitShakeTimer / 0.25);
                shakeY = (Math.random() - 0.5) * 4 * (this.hitShakeTimer / 0.25);
            }
            ctx.translate(this.x + shakeX, this.y + shakeY);

            const cx = this.width * 0.5;
            const cy = this.height * 0.62;

            // 1. Ground Shadow (Organic soft oval under cave base)
            ctx.fillStyle = "rgba(0, 0, 0, 0.32)";
            ctx.beginPath();
            ctx.ellipse(cx, this.height - 2, this.width * 0.52, 13, 0, 0, Math.PI * 2);
            ctx.fill();

            // 2. Road Apron (Semicircular dirt threshold extending outward into the road)
            ctx.fillStyle = "rgba(0, 0, 0, 0.12)";
            ctx.beginPath();
            const apronShift = this.team === 'player' ? 8 : -8;
            ctx.ellipse(cx + apronShift, this.height * 0.72, this.width * 0.48, 16, 0, 0, Math.PI * 2);
            ctx.fill();

            // 3. Main Rock Mound Formation (Stacked cartoon boulders with hand-drawn ink outlines)
            ctx.lineJoin = "round";
            ctx.lineCap = "round";
            ctx.strokeStyle = "#111827";
            ctx.lineWidth = 3.6;

            // Boulder A: Left flank boulder (Darker shadow stone)
            ctx.fillStyle = "#4b5563";
            drawHandDrawnRoundRect(ctx, 4, 26, this.width * 0.46, this.height * 0.66, 18, 1.4);
            ctx.fill();
            ctx.stroke();

            // Boulder B: Right flank boulder
            ctx.fillStyle = "#525e6f";
            drawHandDrawnRoundRect(ctx, this.width * 0.50, 24, this.width * 0.46, this.height * 0.68, 18, 1.4);
            ctx.fill();
            ctx.stroke();

            // Boulder C: Central Massive Dome (Main body of the cave)
            ctx.fillStyle = "#64748b";
            drawHandDrawnRoundRect(ctx, 10, 14, this.width - 20, this.height * 0.82, 28, 1.5);
            ctx.fill();
            ctx.stroke();

            // Boulder D: Top Crest Cap Stone (Lighter highlight)
            ctx.fillStyle = "#94a3b8";
            drawHandDrawnRoundRect(ctx, 22, 4, this.width - 44, 26, 12, 1.3);
            ctx.fill();
            ctx.stroke();

            // Rock Cracks & Shading Details
            ctx.strokeStyle = "#1e293b";
            ctx.lineWidth = 2.0;
            ctx.beginPath();
            drawHandDrawnLine(ctx, 22, 34, 34, 46, 1.2);
            drawHandDrawnLine(ctx, 34, 46, 30, 56, 1.0);
            drawHandDrawnLine(ctx, this.width - 26, 32, this.width - 38, 44, 1.2);
            ctx.stroke();

            // 4. Cave Portal Arch Frame (Heavy masonry lintel stones)
            ctx.fillStyle = "#334155";
            ctx.lineWidth = 3.4;
            ctx.strokeStyle = "#0f172a";
            drawHandDrawnRoundRect(ctx, cx - this.width * 0.24, cy - this.height * 0.32, this.width * 0.48, this.height * 0.64, 20, 1.4);
            ctx.fill();
            ctx.stroke();

            // 5. The Deep Dark Arched Cave Entrance (Black midnight portal)
            const mw = this.width * 0.38;
            const mh = this.height * 0.52;
            ctx.fillStyle = "#090d16"; // Ultra-dark cavern cavity
            ctx.beginPath();
            ctx.moveTo(cx - mw * 0.5, cy + mh * 0.46);
            ctx.lineTo(cx - mw * 0.5, cy - mh * 0.12);
            ctx.quadraticCurveTo(cx - mw * 0.5, cy - mh * 0.56, cx, cy - mh * 0.56);
            ctx.quadraticCurveTo(cx + mw * 0.5, cy - mh * 0.56, cx + mw * 0.5, cy - mh * 0.12);
            ctx.lineTo(cx + mw * 0.5, cy + mh * 0.46);
            ctx.closePath();
            ctx.fill();
            ctx.lineWidth = 3.2;
            ctx.strokeStyle = "#000000";
            ctx.stroke();

            // Inner subtle depth gradient inside the portal
            const caveGrad = ctx.createRadialGradient(cx, cy - mh * 0.2, 2, cx, cy, mw * 0.65);
            caveGrad.addColorStop(0, "rgba(30, 41, 59, 0.45)");
            caveGrad.addColorStop(1, "rgba(9, 13, 22, 0.95)");
            ctx.fillStyle = caveGrad;
            ctx.fill();

            // 6. Lush Cartoon Grass / Moss Tufts on Crest
            ctx.fillStyle = "#16a34a";
            ctx.strokeStyle = "#14532d";
            ctx.lineWidth = 2.0;
            // Left moss patch
            drawHandDrawnRoundRect(ctx, 16, 12, 18, 9, 4, 1.0);
            ctx.fill();
            ctx.stroke();
            // Right moss patch
            drawHandDrawnRoundRect(ctx, this.width - 34, 14, 16, 8, 4, 1.0);
            ctx.fill();
            ctx.stroke();

            // 7. Team War Banner / Totem on Top of Cave
            ctx.strokeStyle = "#78350f"; // Wooden mast
            ctx.lineWidth = 3.0;
            ctx.beginPath();
            drawHandDrawnLine(ctx, cx, 8, cx, -18, 1.1);
            ctx.stroke();

            // Golden finial on mast
            ctx.fillStyle = "#facc15";
            ctx.strokeStyle = "#000000";
            ctx.lineWidth = 2.0;
            drawHandDrawnCircle(ctx, cx, -19, 3.5, 0.8);
            ctx.fill();
            ctx.stroke();

            // Team Pennant (Waving in the wind)
            ctx.fillStyle = this.team === 'player' ? "#3b82f6" : "#ef4444";
            ctx.strokeStyle = "#000000";
            ctx.lineWidth = 2.4;
            const flagDir = this.team === 'player' ? 1 : -1;
            ctx.beginPath();
            ctx.moveTo(cx, -18);
            ctx.lineTo(cx + flagDir * 24, -13);
            ctx.lineTo(cx, -7);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // 8. Integrated Floating Health Bar (Above Flag)
            const barW = this.width * 0.84;
            const barH = 10;
            const barX = (this.width - barW) * 0.5;
            const barY = -32;

            // Bar background container
            ctx.fillStyle = "#090d16";
            ctx.lineWidth = 2.6;
            ctx.strokeStyle = "#000000";
            drawHandDrawnRoundRect(ctx, barX - 1, barY - 1, barW + 2, barH + 2, 4, 0.8);
            ctx.fill();
            ctx.stroke();

            // Bar fill
            const hpRatio = Math.max(0, Math.min(1.0, this.hp / this.maxHp));
            const fillW = Math.max(0, (barW - 2) * hpRatio);
            if (fillW > 0) {
                ctx.fillStyle = this.team === 'player' ? "#3b82f6" : "#ef4444";
                ctx.beginPath();
                ctx.rect(barX + 1, barY + 1, fillW, barH - 2);
                ctx.fill();
            }

            // Health text
            ctx.font = "900 11px sans-serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.lineWidth = 2.8;
            ctx.strokeStyle = "#000000";
            const hpText = `${formatDamageText(this.hp)} / ${formatDamageText(this.maxHp)}`;
            ctx.strokeText(hpText, cx, barY + barH * 0.5);
            ctx.fillStyle = "#ffffff";
            ctx.fillText(hpText, cx, barY + barH * 0.5);

            ctx.restore();
        }
    }
    const BaseStructure2D = CartoonBase;

    // ==========================================
    // 7. ORGANIC ENVIRONMENTAL PROPS (Trees & Rocks)
    // ==========================================
    class CartoonTree {
        constructor(x, y, scale = 1.0) {
            this.x = x;
            this.y = y;
            this.scale = scale;
            this.angleWarp = (Math.random() - 0.5) * 0.18;
            this.trunkWidth = 5.5 + Math.random() * 2.5;
            this.branchJitter = Math.random() * 8;
        }

        draw(ctx) {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.angleWarp);
            ctx.scale(this.scale, this.scale);

            // Shadow
            ctx.fillStyle = "rgba(0, 0, 0, 0.22)";
            ctx.beginPath();
            ctx.ellipse(0, 0, 15, 6, 0, 0, Math.PI * 2);
            ctx.fill();

            // Hand-drawn trunk with organic branches & line boil
            ctx.fillStyle = "#caa180";
            ctx.strokeStyle = "#111827";
            ctx.lineWidth = 3;
            ctx.lineJoin = "round";

            ctx.beginPath();
            ctx.moveTo(-this.trunkWidth, 0);
            drawHandDrawnLine(ctx, -this.trunkWidth, 0, -4, -45, 1.8);
            drawHandDrawnLine(ctx, -4, -45, -18, -62 - this.branchJitter, 2.0);
            drawHandDrawnLine(ctx, -18, -62 - this.branchJitter, -14, -64 - this.branchJitter, 1.2);
            drawHandDrawnLine(ctx, -14, -64 - this.branchJitter, -3, -50, 1.8);
            drawHandDrawnLine(ctx, -3, -50, 2, -72 + this.branchJitter, 2.0);
            drawHandDrawnLine(ctx, 2, -72 + this.branchJitter, 6, -70 + this.branchJitter, 1.2);
            drawHandDrawnLine(ctx, 6, -70 + this.branchJitter, 2, -48, 1.8);
            drawHandDrawnLine(ctx, 2, -48, 16, -58, 2.0);
            drawHandDrawnLine(ctx, 16, -58, 18, -54, 1.2);
            drawHandDrawnLine(ctx, 18, -54, 4, -42, 1.8);
            drawHandDrawnLine(ctx, 4, -42, this.trunkWidth, 0, 1.8);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            ctx.restore();
        }
    }

    class CartoonRock {
        constructor(x, y, scale = 1.0) {
            this.x = x;
            this.y = y;
            this.scale = scale;
            this.width = 18 * scale;
            this.height = 12 * scale;
        }

        draw(ctx) {
            ctx.save();
            ctx.translate(this.x, this.y);

            ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
            ctx.beginPath();
            ctx.ellipse(0, 0, this.width, 5, 0, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = "#94a3b8";
            ctx.strokeStyle = "#111827";
            ctx.lineWidth = 2.8;
            ctx.lineJoin = "round";

            ctx.beginPath();
            ctx.moveTo(-this.width, 0);
            drawHandDrawnLine(ctx, -this.width, 0, -this.width * 0.7, -this.height, 1.8);
            drawHandDrawnLine(ctx, -this.width * 0.7, -this.height, this.width * 0.4, -this.height * 1.1, 1.6);
            drawHandDrawnLine(ctx, this.width * 0.4, -this.height * 1.1, this.width, -this.height * 0.4, 1.8);
            drawHandDrawnLine(ctx, this.width, -this.height * 0.4, this.width * 0.8, 0, 1.6);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            ctx.restore();
        }
    }

    // ==========================================
    // 7.5 WEATHER PARTICLE SYSTEM
    // ==========================================
    class WeatherParticle {
        constructor(system) {
            this.system = system;
            this.reset(true);
        }

        reset(initial = false) {
            const w = this.system.engine.width || 800;
            const h = this.system.engine.height || 600;

            this.x = initial ? Math.random() * (w + 100) - 50 : (Math.random() < 0.65 ? Math.random() * w : -30);
            this.y = initial ? Math.random() * h : (Math.random() < 0.35 ? -25 : Math.random() * h * 0.4);

            this.life = 0;
            this.size = 2 + Math.random() * 4;
            this.rotation = Math.random() * Math.PI * 2;
            this.rotSpeed = (Math.random() - 0.5) * 3.5;
            this.wobbleSpeed = 1.5 + Math.random() * 2.5;
            this.wobbleAmp = 20 + Math.random() * 35;
            this.wobbleOffset = Math.random() * Math.PI * 2;

            const type = this.system.currentType;
            if (type === 'leaves') {
                this.vx = 40 + Math.random() * 55;
                this.vy = 35 + Math.random() * 45;
                this.size = 4 + Math.random() * 5;
                const leafColors = ['#d97706', '#ea580c', '#eab308', '#b45309', '#65a30d', '#ca8a04'];
                this.color = leafColors[Math.floor(Math.random() * leafColors.length)];
                this.opacity = 0.75 + Math.random() * 0.25;
            } else if (type === 'sand_drift') {
                this.vx = 140 + Math.random() * 160;
                this.vy = 8 + Math.random() * 18;
                this.size = 1.8 + Math.random() * 3.2;
                const sandColors = ['#fde047', '#facc15', '#f59e0b', '#fbbf24', '#eab308'];
                this.color = sandColors[Math.floor(Math.random() * sandColors.length)];
                this.opacity = 0.45 + Math.random() * 0.45;
            } else if (type === 'snow') {
                this.vx = 15 + Math.random() * 30;
                this.vy = 32 + Math.random() * 48;
                this.size = 2.2 + Math.random() * 4.5;
                this.isStar = Math.random() > 0.65;
                this.color = Math.random() > 0.3 ? '#ffffff' : '#e0f2fe';
                this.opacity = 0.7 + Math.random() * 0.3;
            } else if (type === 'rain') {
                this.vx = 60 + Math.random() * 40;
                this.vy = 280 + Math.random() * 200;
                this.length = 12 + Math.random() * 16;
                this.size = 1.5 + Math.random() * 1.5;
                this.color = Math.random() > 0.4 ? '#93c5fd' : '#60a5fa';
                this.opacity = 0.55 + Math.random() * 0.35;
            } else {
                this.vx = 20;
                this.vy = 20;
                this.color = '#ffffff';
                this.opacity = 0.5;
            }
        }

        update(dt, gustX) {
            this.life += dt;
            const type = this.system.currentType;
            const w = this.system.engine.width || 800;
            const h = this.system.engine.height || 600;

            if (type === 'leaves') {
                const sway = Math.sin(this.life * this.wobbleSpeed + this.wobbleOffset) * this.wobbleAmp;
                this.x += (this.vx + gustX + sway * 0.5) * dt;
                this.y += this.vy * dt;
                this.rotation += this.rotSpeed * dt;
            } else if (type === 'sand_drift') {
                const wave = Math.sin(this.life * 4 + this.wobbleOffset) * 12;
                this.x += (this.vx + gustX * 1.4) * dt;
                this.y += (this.vy + wave) * dt;
            } else if (type === 'snow') {
                const sway = Math.sin(this.life * this.wobbleSpeed + this.wobbleOffset) * 16;
                this.x += (this.vx + gustX * 0.6 + sway) * dt;
                this.y += this.vy * dt;
                this.rotation += this.rotSpeed * 0.5 * dt;
            } else if (type === 'rain') {
                this.x += (this.vx + gustX * 0.8) * dt;
                this.y += this.vy * dt;

                // Ground splash when rain hits lane road area
                if (this.y >= this.system.engine.laneCenterY + (Math.random() - 0.5) * (this.system.engine.laneHeight || 120)) {
                    if (Math.random() < 0.22) {
                        this.system.spawnSplash(this.x, this.y);
                    }
                }
            }

            // Wrap around / respawn if out of viewport
            if (this.y > h + 30 || this.x > w + 60 || this.x < -60) {
                this.reset(false);
            }
        }

        draw(ctx) {
            const type = this.system.currentType;
            ctx.save();
            ctx.globalAlpha = this.opacity;

            if (type === 'leaves') {
                ctx.translate(this.x, this.y);
                ctx.rotate(this.rotation);
                ctx.fillStyle = this.color;
                ctx.beginPath();
                ctx.moveTo(0, -this.size * 1.6);
                ctx.quadraticCurveTo(this.size * 1.2, 0, 0, this.size * 1.6);
                ctx.quadraticCurveTo(-this.size * 1.2, 0, 0, -this.size * 1.6);
                ctx.fill();
                ctx.strokeStyle = "rgba(40, 20, 5, 0.45)";
                ctx.lineWidth = 1;
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(0, -this.size * 1.3);
                ctx.lineTo(0, this.size * 1.4);
                ctx.stroke();
            } else if (type === 'sand_drift') {
                ctx.fillStyle = this.color;
                ctx.beginPath();
                ctx.ellipse(this.x, this.y, this.size * 2.2, this.size * 0.8, 0.1, 0, Math.PI * 2);
                ctx.fill();
            } else if (type === 'snow') {
                ctx.fillStyle = this.color;
                if (this.isStar) {
                    ctx.translate(this.x, this.y);
                    ctx.rotate(this.rotation);
                    ctx.strokeStyle = this.color;
                    ctx.lineWidth = 1.4;
                    ctx.beginPath();
                    ctx.moveTo(-this.size, 0); ctx.lineTo(this.size, 0);
                    ctx.moveTo(0, -this.size); ctx.lineTo(0, this.size);
                    const diag = this.size * 0.7;
                    ctx.moveTo(-diag, -diag); ctx.lineTo(diag, diag);
                    ctx.moveTo(diag, -diag); ctx.lineTo(-diag, diag);
                    ctx.stroke();
                } else {
                    ctx.beginPath();
                    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                    ctx.fill();
                }
            } else if (type === 'rain') {
                ctx.strokeStyle = this.color;
                ctx.lineWidth = this.size;
                ctx.lineCap = "round";
                const angle = Math.atan2(this.vy, this.vx);
                const dx = Math.cos(angle) * this.length;
                const dy = Math.sin(angle) * this.length;
                ctx.beginPath();
                ctx.moveTo(this.x, this.y);
                ctx.lineTo(this.x - dx, this.y - dy);
                ctx.stroke();
            }

            ctx.restore();
        }
    }

    class WeatherSplash {
        constructor(x, y) {
            this.x = x;
            this.y = y;
            this.radius = 1.5;
            this.maxRadius = 7 + Math.random() * 5;
            this.life = 0.28;
            this.maxLife = 0.28;
            this.dead = false;
        }

        update(dt) {
            this.life -= dt;
            const progress = 1 - (this.life / this.maxLife);
            this.radius = 1.5 + progress * (this.maxRadius - 1.5);
            if (this.life <= 0) this.dead = true;
        }

        draw(ctx) {
            if (this.dead) return;
            ctx.save();
            const alpha = Math.max(0, this.life / this.maxLife) * 0.6;
            ctx.strokeStyle = `rgba(186, 230, 253, ${alpha})`;
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.ellipse(this.x, this.y, this.radius * 1.5, this.radius * 0.7, 0, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }
    }

    class WeatherSystem {
        constructor(engine) {
            this.engine = engine;
            this.particles = [];
            this.splashes = [];
            this.maxParticles = 55;
            this.currentEra = 0;
            this.currentType = 'leaves';
            this.time = 0;
            this.gustX = 0;

            for (let i = 0; i < this.maxParticles; i++) {
                this.particles.push(new WeatherParticle(this));
            }
        }

        setEra(eraIndex) {
            this.currentEra = eraIndex;
            const era = ERAS[eraIndex] || ERAS[0];
            this.currentType = era.weather || 'leaves';
            this.splashes = [];
            for (const p of this.particles) {
                p.reset(true);
            }
        }

        spawnSplash(x, y) {
            if (this.splashes.length < 18) {
                this.splashes.push(new WeatherSplash(x, y));
            }
        }

        update(dt) {
            this.time += dt;
            // Cyclical wind gust oscillation (~11 second period)
            this.gustX = Math.sin(this.time * 0.57) * 28 + Math.cos(this.time * 0.23) * 16;

            for (const p of this.particles) {
                p.update(dt, this.gustX);
            }

            for (let i = this.splashes.length - 1; i >= 0; i--) {
                const s = this.splashes[i];
                s.update(dt);
                if (s.dead) this.splashes.splice(i, 1);
            }
        }

        draw(ctx) {
            for (const s of this.splashes) {
                s.draw(ctx);
            }
            for (const p of this.particles) {
                p.draw(ctx);
            }
        }
    }

    // ==========================================
    // 8. MAIN ENGINE
    // ==========================================
    class GameEngine2D {
        constructor() {
            this.canvas = document.getElementById('game-canvas');
            this.ctx = this.canvas.getContext('2d', { alpha: false });
            this.stateManager = new GameStateManager();

            this.playerUnits = [];
            this.enemyUnits = [];
            this.projectiles = [];
            this.damageNumbers = [];
            this.particles = [];
            this.explosions = [];
            this.craters = [];
            this.trees = [];
            this.rocks = [];

            this.playerBase = null;
            this.enemyBase = null;

            this.food = 2;
            this.unitCooldowns = [0, 0, 0];
            this.enemySpawnTimer = 2.8;

            this.airStrikeCooldown = 0;
            this.airStrikeMaxCooldown = 22.0;

            this.lastTime = 0;
            this.isRunning = true;
            this.isPaused = false;
            this.inBattle = false;
            this.battleOver = false;
            this.battleCoinsEarned = 0;
            this.isDungeonMode = false;
            this.screenShake = 0;

            this.initDimensions();
            this.generateFieldDecorations();
            this.initBases();
            this.bindDOM();
            this.weatherSystem = new WeatherSystem(this);
            this.weatherSystem.setEra(this.stateManager.currentEra);
            window.soundManager.setEnabled(this.stateManager.soundEnabled);
            window.soundManager.setMusicEnabled(this.stateManager.musicEnabled);
            window.soundManager.setMusicVolume(this.stateManager.musicVolume);
            window.soundManager.setEra(this.stateManager.currentEra);
            this.updateSettingsUI();
            this.setBattleMode(false);
            this.updateStatsDisplay();
            this.startLoop();
            this.updateHUD();
        }

        initDimensions() {
            this.width = window.innerWidth;
            this.height = window.innerHeight;
            this.canvas.width = this.width;
            this.canvas.height = this.height;

            this.laneTop = this.height * 0.30;
            this.laneBottom = this.height * 0.70;
            this.laneHeight = this.laneBottom - this.laneTop;
            this.laneCenterY = (this.laneTop + this.laneBottom) * 0.5;

            window.addEventListener('resize', () => {
                this.width = window.innerWidth;
                this.height = window.innerHeight;
                this.canvas.width = this.width;
                this.canvas.height = this.height;
                this.laneTop = this.height * 0.30;
                this.laneBottom = this.height * 0.70;
                this.laneHeight = this.laneBottom - this.laneTop;
                this.laneCenterY = (this.laneTop + this.laneBottom) * 0.5;
                if (this.playerBase && this.enemyBase) {
                    this.playerBase.x = 0;
                    this.playerBase.y = this.laneCenterY - (this.playerBase.height * 0.5);
                    this.enemyBase.x = this.width - this.enemyBase.width;
                    this.enemyBase.y = this.laneCenterY - (this.enemyBase.height * 0.5);
                }
                this.generateFieldDecorations();
            });
        }

        generateFieldDecorations() {
            this.trees = [];
            this.rocks = [];

            // Upper Trees & Rocks
            const count = Math.floor(this.width / 95);
            for (let i = 0; i < count; i++) {
                const tx = (i + 0.5) * (this.width / count) + (Math.random() - 0.5) * 35;
                const ty = 80 + Math.random() * (this.laneTop - 110);
                this.trees.push(new CartoonTree(tx, ty, 0.85 + Math.random() * 0.35));
                if (i % 2 === 0) {
                    this.rocks.push(new CartoonRock(tx + 28, ty + 12, 0.8 + Math.random() * 0.4));
                }
            }
            // Lower Trees & Rocks
            for (let i = 0; i < Math.floor(count * 0.7); i++) {
                const tx = (i + 0.5) * (this.width / (count * 0.7)) + (Math.random() - 0.5) * 45;
                const ty = this.laneBottom + 25 + Math.random() * (this.height - this.laneBottom - 110);
                this.trees.push(new CartoonTree(tx, ty, 0.9 + Math.random() * 0.35));
                if (i % 2 === 1) {
                    this.rocks.push(new CartoonRock(tx - 32, ty + 14, 0.85 + Math.random() * 0.4));
                }
            }
        }

        initBases() {
            const playerBaseHp = this.stateManager.getBaseMaxHp();
            const enemyBaseHp = this.isDungeonMode ? playerBaseHp * 2.5 : playerBaseHp;

            this.playerBase = new CartoonBase('player');
            this.playerBase.reset(playerBaseHp);
            this.playerBase.x = 0;
            this.playerBase.y = this.laneCenterY - (this.playerBase.height * 0.5);

            this.enemyBase = new CartoonBase('enemy');
            this.enemyBase.reset(enemyBaseHp);
            this.enemyBase.x = this.width - this.enemyBase.width;
            this.enemyBase.y = this.laneCenterY - (this.enemyBase.height * 0.5);
        }

        resetBattle() {
            this.playerUnits = [];
            this.enemyUnits = [];
            this.projectiles = [];
            this.damageNumbers = [];
            this.particles = [];
            this.explosions = [];
            this.craters = [];
            this.food = 3;
            this.unitCooldowns = [0, 0, 0];
            this.enemySpawnTimer = 2.4;
            this.airStrikeCooldown = 0;
            this.battleOver = false;
            this.battleCoinsEarned = 0;
            this.togglePause(false);
            this.initBases();
            this.closeAllModals();
            this.updateStatsDisplay();
        }

        startBattle() {
            this.stateManager.totalBattlesPlayed = (this.stateManager.totalBattlesPlayed || 0) + 1;
            this.stateManager.saveState();
            this.setBattleMode(true);
            this.resetBattle();
            window.soundManager.playSpawn();
            this.stateManager.haptic(45);
        }

        returnToMenu() {
            this.closeAllModals();
            this.setBattleMode(false);
            this.playerUnits = [];
            this.enemyUnits = [];
            this.projectiles = [];
            this.damageNumbers = [];
            this.particles = [];
            this.explosions = [];
            this.craters = [];
            this.battleOver = false;
            this.initBases();
            this.togglePause(false);
            this.updateStatsDisplay();
            this.updateHUD();
        }

        setBattleMode(inBattle) {
            this.inBattle = inBattle;
            const menuOverlay = document.getElementById('main-menu-overlay');
            if (menuOverlay) menuOverlay.classList.toggle('hidden', inBattle);
            const bottomHud = document.getElementById('bottom-hud');
            if (bottomHud) bottomHud.style.display = inBattle ? 'flex' : 'none';
            const btnBomb = document.getElementById('btn-air-strike');
            if (btnBomb) btnBomb.style.display = inBattle ? 'flex' : 'none';
            const baseStatusBar = document.getElementById('base-status-bar');
            if (baseStatusBar) baseStatusBar.style.display = inBattle ? 'flex' : 'none';
        }

        onEnemyDefeated() {
            this.stateManager.totalEnemiesDefeated = (this.stateManager.totalEnemiesDefeated || 0) + 1;
            this.stateManager.saveState();
            this.updateStatsDisplay();
        }

        updateStatsDisplay() {
            const highestEraIdx = Math.max(0, Math.min(ERAS.length - 1, this.stateManager.highestEraReached || 0));
            const highestEra = ERAS[highestEraIdx];
            const eraIcons = ["🪓", "🗡️", "⚔️", "🚀"];
            const eraIcon = eraIcons[highestEraIdx] || "🏛️";
            const enemiesCount = this.stateManager.totalEnemiesDefeated || 0;
            const victoriesCount = this.stateManager.totalVictories || 0;
            const battlesCount = this.stateManager.totalBattlesPlayed || 0;

            // Main Menu Card
            const elEnemies = document.getElementById('stat-enemies-defeated');
            if (elEnemies) elEnemies.innerText = enemiesCount;
            const elEra = document.getElementById('stat-highest-era');
            if (elEra) elEra.innerText = highestEra.name;
            const elEraIcon = document.getElementById('stat-era-icon');
            if (elEraIcon) elEraIcon.innerText = eraIcon;
            const elVictories = document.getElementById('stat-victories');
            if (elVictories) elVictories.innerText = victoriesCount;
            const elBattles = document.getElementById('stat-battles');
            if (elBattles) elBattles.innerText = battlesCount;

            // Main Menu Header
            const currentEra = ERAS[this.stateManager.currentEra];
            const elMenuEra = document.getElementById('menu-era-name');
            if (elMenuEra) elMenuEra.innerText = currentEra.name;
            const elMenuSub = document.getElementById('menu-era-subtitle');
            if (elMenuSub) elMenuSub.innerText = `${currentEra.arabicName} • BATTLEFIELD`;

            // Popup Modal
            const elModalEnemies = document.getElementById('modal-stat-enemies-defeated');
            if (elModalEnemies) elModalEnemies.innerText = enemiesCount;
            const elModalEra = document.getElementById('modal-stat-highest-era');
            if (elModalEra) elModalEra.innerText = highestEra.name;
            const elModalEraIcon = document.getElementById('modal-stat-era-icon');
            if (elModalEraIcon) elModalEraIcon.innerText = eraIcon;
            const elModalVictories = document.getElementById('modal-stat-victories');
            if (elModalVictories) elModalVictories.innerText = victoriesCount;
            const elModalBattles = document.getElementById('modal-stat-battles');
            if (elModalBattles) elModalBattles.innerText = battlesCount;
        }

        addBattleGold(amount) {
            this.battleCoinsEarned += amount;
            this.stateManager.coins += amount;
            this.updateHUD();
            this.stateManager.saveState();
        }

        addScreenShake(intensity) {
            this.screenShake = Math.max(this.screenShake, intensity);
        }

        spawnProjectile(x, y, tx, ty, type, dmg, isEnemy) {
            this.projectiles.push(new Projectile2D(x, y, tx, ty, type, dmg, isEnemy));
        }

        spawnDamageNumber(x, y, text, color) {
            this.damageNumbers.push(new FloatingDamageNumber(x, y, text, color));
        }

        spawnParticles(x, y, count, color) {
            for (let i = 0; i < count; i++) {
                this.particles.push({
                    x, y,
                    vx: (Math.random() - 0.5) * 120,
                    vy: (Math.random() - 0.5) * 120,
                    color,
                    life: 0.35 + Math.random() * 0.25,
                    maxLife: 0.6
                });
            }
        }

        spawnPuffyExplosion(x, y, scale = 1.0) {
            this.explosions.push(new CartoonPuffyExplosion(x, y, scale));
        }

        spawnCrater(x, y, radius = 30) {
            this.craters.push(new GroundCrater(x, y, radius));
        }

        spawnPlayerUnit(index) {
            if (this.battleOver) return; // Keep spawning interactive during on-demand tactical pause
            const era = ERAS[this.stateManager.currentEra];
            const cfg = era.units[index];
            if (!cfg) return;

            if (this.food >= cfg.cost && this.unitCooldowns[index] <= 0) {
                this.food -= cfg.cost;
                this.unitCooldowns[index] = cfg.cooldown;

                // Emerge smoothly from inside the arched dark cave portal
                const spawnX = this.playerBase.x + this.playerBase.width * 0.48;
                const portalY = this.playerBase.y + this.playerBase.height * 0.62;
                const unit = new Unit2D(cfg, false, spawnX, portalY);
                // Assign a distinct lane formation row across the wide road (multi-rank army)
                const laneOffsets = [-55, -28, 0, 28, 55];
                const offset = laneOffsets[this.playerUnits.length % laneOffsets.length] + (Math.random() - 0.5) * 12;
                unit.targetY = this.laneCenterY + offset;
                this.playerUnits.push(unit);

                window.soundManager.playSpawn();
                this.stateManager.haptic(25);
            }
        }

        spawnEnemyUnit(config) {
            // Emerge smoothly from inside the enemy arched dark cave portal
            const spawnX = this.enemyBase.x + this.enemyBase.width * 0.52;
            const portalY = this.enemyBase.y + this.enemyBase.height * 0.62;
            const unit = new Unit2D(config, true, spawnX, portalY);
            const laneOffsets = [-55, -28, 0, 28, 55];
            const offset = laneOffsets[this.enemyUnits.length % laneOffsets.length] + (Math.random() - 0.5) * 12;
            unit.targetY = this.laneCenterY + offset;
            this.enemyUnits.push(unit);
        }

        triggerAirStrike() {
            if (this.airStrikeCooldown > 0 || this.battleOver || this.isPaused) return;

            this.airStrikeCooldown = this.airStrikeMaxCooldown;
            window.soundManager.playAirWhistle();
            this.stateManager.haptic(80);

            // Focus air strike on the battlefield conflict zone
            let targetX = this.width * 0.55;
            let targetY = this.laneCenterY;

            if (this.enemyUnits.length > 0) {
                const aliveEnemies = this.enemyUnits.filter(u => !u.dead);
                if (aliveEnemies.length > 0) {
                    const medianEnemy = aliveEnemies[Math.floor(aliveEnemies.length * 0.5)];
                    targetX = medianEnemy.x;
                    targetY = medianEnemy.y;
                }
            }

            // Confine air strike radius to the field to avoid direct fortress nuking
            const maxStrikeX = this.enemyBase ? (this.enemyBase.x - 35) : (this.width * 0.75);
            targetX = Math.min(maxStrikeX, Math.max(this.width * 0.25, targetX));

            setTimeout(() => {
                window.soundManager.playExplosion();
                this.spawnPuffyExplosion(targetX, targetY, 2.0);
                this.spawnCrater(targetX, targetY, 48);
                this.addScreenShake(12);
                this.stateManager.haptic(90);

                // Balanced tactical damage to enemies (gives enemies a fair chance instead of an instant wipe)
                for (const u of this.enemyUnits) {
                    if (u.dead) continue;
                    const d = Math.hypot(u.x - targetX, u.y - targetY);
                    if (d < 170) {
                        const falloff = Math.max(0.4, 1.0 - (d / 170) * 0.5);
                        const blastDmg = Math.floor((u.maxHp * 0.38 + 20) * falloff);
                        u.takeDamage(blastDmg);
                    }
                }

                // Bomb effect on the fortress is close to 0 (heavily fortified stone resists blast)
                const baseCenterX = this.enemyBase.x + this.enemyBase.width * 0.5;
                const baseCenterY = this.enemyBase.y + this.enemyBase.height * 0.5;
                if (Math.hypot(baseCenterX - targetX, baseCenterY - targetY) < 170) {
                    const fortressNearZeroDamage = 5; // Minimal chip damage (~1% of base HP)
                    this.enemyBase.takeDamage(fortressNearZeroDamage);
                }
            }, 650);
        }

        onBaseDestroyed(isPlayer) {
            if (this.battleOver) return;
            this.battleOver = true;
            this.addScreenShake(14);

            const victory = !isPlayer;
            const rewardCoins = victory ? (this.isDungeonMode ? 220 : 90) + this.stateManager.currentEra * 60 : 25;

            if (victory) {
                window.soundManager.playVictory();
                this.stateManager.totalVictories++;
                this.addBattleGold(rewardCoins);
                if (this.isDungeonMode) {
                    this.stateManager.gems += 6;
                    this.spawnDamageNumber(this.width * 0.5, this.laneCenterY, "+6 GEMS! 💎", "#38bdf8");
                }
            } else {
                window.soundManager.playDefeat();
                this.addBattleGold(rewardCoins);
            }

            this.stateManager.saveState();
            this.stateManager.haptic(75);

            setTimeout(() => {
                document.getElementById('gameover-title').innerText = victory ? "VICTORY!" : "DEFEAT";
                document.getElementById('gameover-title').className = "gameover-title " + (victory ? "victory" : "defeat");
                document.getElementById('gameover-subtitle').innerText = victory ? "Enemy stronghold conquered!" : "Your base was overrun!";
                document.getElementById('gameover-coins').innerText = rewardCoins;
                document.getElementById('double-amount').innerText = rewardCoins;
                document.getElementById('modal-gameover').classList.add('active');
            }, 700);
        }

        startLoop() {
            const step = (timestamp) => {
                if (!this.lastTime) this.lastTime = timestamp;
                let dt = (timestamp - this.lastTime) / 1000;
                dt = Math.min(dt, 0.1) * this.stateManager.gameSpeed;
                this.lastTime = timestamp;

                if (!this.isPaused && this.isRunning) {
                    this.update(dt);
                }
                this.render();

                requestAnimationFrame(step);
            };
            requestAnimationFrame(step);
        }

        update(dt) {
            // Update Line Boil Timer (~9 FPS traditional cell animation wobble)
            lineBoilTimer += dt;
            if (lineBoilTimer >= 0.11) {
                lineBoilTimer = 0;
                lineBoilSeed = (lineBoilSeed + 1) % 500;
            }

            // Update Ambient Era Weather Particles
            if (this.weatherSystem) {
                this.weatherSystem.update(dt);
            }

            if (!this.inBattle) {
                this.updateHUD();
                return;
            }

            // Food Regeneration
            const maxFood = this.stateManager.getMaxFood();
            this.food = Math.min(maxFood, this.food + this.stateManager.getFoodRate() * dt);

            // Unit Cooldowns
            for (let i = 0; i < 3; i++) {
                if (this.unitCooldowns[i] > 0) {
                    this.unitCooldowns[i] = Math.max(0, this.unitCooldowns[i] - dt);
                }
            }

            // Air Strike Cooldown
            if (this.airStrikeCooldown > 0) {
                this.airStrikeCooldown = Math.max(0, this.airStrikeCooldown - dt);
            }

            // Enemy Commander AI
            this.enemySpawnTimer -= dt;
            if (this.enemySpawnTimer <= 0 && !this.battleOver) {
                const era = ERAS[this.stateManager.currentEra];
                const rand = Math.random();
                let chosen = era.units[0];
                if (rand > 0.72) chosen = era.units[2];
                else if (rand > 0.40) chosen = era.units[1];

                this.spawnEnemyUnit(chosen);
                this.enemySpawnTimer = 3.2 + Math.random() * 2.2 - Math.min(1.4, this.stateManager.currentEra * 0.3);
            }

            // Update Base Hit Shakes & Torch Animations
            if (this.playerBase) this.playerBase.update(dt);
            if (this.enemyBase) this.enemyBase.update(dt);

            // Update Player Units
            for (let i = this.playerUnits.length - 1; i >= 0; i--) {
                const u = this.playerUnits[i];
                u.update(dt, this.playerUnits, this.enemyUnits, this.enemyBase, this.laneTop, this.laneBottom);
                if (u.dead && u.deathTimer >= (u.maxDeathDuration || 0.55)) {
                    this.playerUnits.splice(i, 1);
                }
            }

            // Update Enemy Units
            for (let i = this.enemyUnits.length - 1; i >= 0; i--) {
                const u = this.enemyUnits[i];
                u.update(dt, this.enemyUnits, this.playerUnits, this.playerBase, this.laneTop, this.laneBottom);
                if (u.dead && u.deathTimer >= (u.maxDeathDuration || 0.55)) {
                    this.enemyUnits.splice(i, 1);
                }
            }

            // Update Projectiles
            for (let i = this.projectiles.length - 1; i >= 0; i--) {
                const p = this.projectiles[i];
                p.update(dt);
                if (p.dead) this.projectiles.splice(i, 1);
            }

            // Update Explosions
            for (let i = this.explosions.length - 1; i >= 0; i--) {
                const ex = this.explosions[i];
                ex.update(dt);
                if (ex.life <= 0) this.explosions.splice(i, 1);
            }

            // Update Craters
            for (let i = this.craters.length - 1; i >= 0; i--) {
                const cr = this.craters[i];
                cr.update(dt);
                if (cr.life <= 0) this.craters.splice(i, 1);
            }

            // Update Floating Numbers
            for (let i = this.damageNumbers.length - 1; i >= 0; i--) {
                const num = this.damageNumbers[i];
                num.update(dt);
                if (num.life <= 0) this.damageNumbers.splice(i, 1);
            }

            // Update Particles
            for (let i = this.particles.length - 1; i >= 0; i--) {
                const pt = this.particles[i];
                pt.life -= dt;
                pt.x += pt.vx * dt;
                pt.y += pt.vy * dt;
                if (pt.life <= 0) this.particles.splice(i, 1);
            }

            // Screen Shake Decay
            if (this.screenShake > 0) {
                this.screenShake = Math.max(0, this.screenShake - dt * 25);
            }

            this.updateHUD();
        }

        // ==========================================
        // 9. HAND-DRAWN RENDER METHOD & ORGANIC TERRAIN
        // ==========================================
        render() {
            const ctx = this.ctx;
            const era = ERAS[this.stateManager.currentEra];

            ctx.save();

            // Screen Shake
            if (this.screenShake > 0) {
                const ox = (Math.random() - 0.5) * this.screenShake;
                const oy = (Math.random() - 0.5) * this.screenShake;
                ctx.translate(ox, oy);
            }

            // 1. Draw Organic Turf Grass Background
            ctx.fillStyle = era.turfColor;
            ctx.fillRect(0, 0, this.width, this.height);

            // Hand-drawn animated grass tufts \ | /
            ctx.strokeStyle = "rgba(0, 0, 0, 0.28)";
            ctx.lineWidth = 2.4;
            ctx.lineCap = "round";

            for (let x = 35; x < this.width; x += 85) {
                // Top lawn grass
                const gy1 = 115 + boilNoise(x * 0.1, 2.0);
                ctx.beginPath();
                drawHandDrawnLine(ctx, x - 6, gy1, x, gy1 + 8, 1.4);
                drawHandDrawnLine(ctx, x, gy1 + 8, x + 6, gy1, 1.4);
                drawHandDrawnLine(ctx, x, gy1 + 8, x, gy1 - 2, 1.2);
                ctx.stroke();

                // Bottom lawn grass
                const gy2 = this.height - 135 + boilNoise(x * 0.15, 2.0);
                ctx.beginPath();
                drawHandDrawnLine(ctx, x - 5, gy2, x + 1, gy2 + 9, 1.4);
                drawHandDrawnLine(ctx, x + 1, gy2 + 9, x + 7, gy2, 1.4);
                drawHandDrawnLine(ctx, x + 1, gy2 + 9, x + 1, gy2 - 3, 1.2);
                ctx.stroke();
            }

            // 2. DYNAMIC MEANDERING DIRT ROAD (Organic Boundaries)
            const step = 20;
            const topPoints = [];
            const botPoints = [];

            for (let x = 0; x <= this.width + step; x += step) {
                topPoints.push({ x, y: getRoadTopY(x, this.laneTop, this.width) });
                botPoints.push({ x, y: getRoadBottomY(x, this.laneBottom, this.width) });
            }

            // Build closed organic road polygon
            ctx.beginPath();
            ctx.moveTo(topPoints[0].x, topPoints[0].y);
            for (let i = 1; i < topPoints.length; i++) {
                drawHandDrawnLine(ctx, topPoints[i - 1].x, topPoints[i - 1].y, topPoints[i].x, topPoints[i].y, 1.8);
            }
            ctx.lineTo(this.width, botPoints[botPoints.length - 1].y);
            for (let i = botPoints.length - 1; i > 0; i--) {
                drawHandDrawnLine(ctx, botPoints[i].x, botPoints[i].y, botPoints[i - 1].x, botPoints[i - 1].y, 1.8);
            }
            ctx.closePath();

            // Fill organic road color
            ctx.fillStyle = era.laneColor;
            ctx.fill();

            // Stroke road with bold, wavy ink borders
            ctx.strokeStyle = era.laneBorder;
            ctx.lineWidth = 4.8;
            ctx.lineJoin = "round";

            // Stroke top boundary
            ctx.beginPath();
            ctx.moveTo(topPoints[0].x, topPoints[0].y);
            for (let i = 1; i < topPoints.length; i++) {
                drawHandDrawnLine(ctx, topPoints[i - 1].x, topPoints[i - 1].y, topPoints[i].x, topPoints[i].y, 1.8);
            }
            ctx.stroke();

            // Stroke bottom boundary
            ctx.beginPath();
            ctx.moveTo(botPoints[0].x, botPoints[0].y);
            for (let i = 1; i < botPoints.length; i++) {
                drawHandDrawnLine(ctx, botPoints[i - 1].x, botPoints[i - 1].y, botPoints[i].x, botPoints[i].y, 1.8);
            }
            ctx.stroke();

            // Hand-drawn road cart tracks / scratches
            ctx.strokeStyle = "rgba(0, 0, 0, 0.1)";
            ctx.lineWidth = 2.2;
            for (let yRatio = 0.35; yRatio <= 0.65; yRatio += 0.15) {
                ctx.beginPath();
                let prevY = this.laneTop + this.laneHeight * yRatio;
                ctx.moveTo(0, prevY);
                for (let x = 0; x <= this.width; x += 40) {
                    const topY = getRoadTopY(x, this.laneTop, this.width);
                    const botY = getRoadBottomY(x, this.laneBottom, this.width);
                    const ty = topY + (botY - topY) * yRatio;
                    drawHandDrawnLine(ctx, x - 40, prevY, x, ty, 1.5);
                    prevY = ty;
                }
                ctx.stroke();
            }

            // 3. Ground Blast Craters
            for (const crater of this.craters) {
                crater.draw(ctx);
            }

            // 4. Y-SORTING ALGORITHM (DEPTH SORTING)
            const depthList = [];

            // Add background & foreground trees
            for (const tree of this.trees) {
                depthList.push({ y: tree.y, draw: () => tree.draw(ctx) });
            }

            // Add decorative rocks
            for (const rock of this.rocks) {
                depthList.push({ y: rock.y, draw: () => rock.draw(ctx) });
            }

            // Add bases
            depthList.push({ y: this.playerBase.y, draw: () => this.playerBase.draw(ctx, this.stateManager.currentEra) });
            depthList.push({ y: this.enemyBase.y, draw: () => this.enemyBase.draw(ctx, this.stateManager.currentEra) });

            // Add player and enemy units
            for (const u of this.playerUnits) {
                depthList.push({ y: u.y, draw: () => u.draw(ctx) });
            }
            for (const u of this.enemyUnits) {
                depthList.push({ y: u.y, draw: () => u.draw(ctx) });
            }

            // Add projectiles
            for (const p of this.projectiles) {
                depthList.push({ y: p.groundY || p.y, draw: () => p.draw(ctx) });
            }

            // Add explosions
            for (const ex of this.explosions) {
                depthList.push({ y: ex.y + 10, draw: () => ex.draw(ctx) });
            }

            // Execute depth sort
            depthList.sort((a, b) => a.y - b.y);

            for (const item of depthList) {
                item.draw();
            }

            // 5. Particles overlay
            for (const pt of this.particles) {
                ctx.fillStyle = pt.color;
                drawHandDrawnCircle(ctx, pt.x, pt.y, 3, 0.8);
                ctx.fill();
            }

            // 6. Floating Cartoon Damage Numbers
            for (const num of this.damageNumbers) {
                num.draw(ctx);
            }

            // 6.5 Ambient Era Weather Particle Effects
            if (this.weatherSystem) {
                this.weatherSystem.draw(ctx);
            }

            // 7. Tactical Pause Overlay (Battlefield Analysis)
            if (this.isPaused && !this.battleOver) {
                // Subtle battlefield dark tint for analysis
                ctx.fillStyle = "rgba(15, 23, 42, 0.35)";
                ctx.fillRect(0, 0, this.width, this.height);

                // Tactical range rings for player units (cyan)
                ctx.lineWidth = 1.8;
                ctx.setLineDash([6, 6]);
                ctx.strokeStyle = "rgba(56, 189, 248, 0.45)";
                for (const u of this.playerUnits) {
                    if (u.dead) continue;
                    ctx.beginPath();
                    ctx.arc(u.x, u.y, u.range, 0, Math.PI * 2);
                    ctx.stroke();
                }

                // Tactical range rings for enemy units (red)
                ctx.strokeStyle = "rgba(239, 68, 68, 0.45)";
                for (const u of this.enemyUnits) {
                    if (u.dead) continue;
                    ctx.beginPath();
                    ctx.arc(u.x, u.y, u.range, 0, Math.PI * 2);
                    ctx.stroke();
                }

                // Predicted ballistic trajectory curves for active in-flight projectiles
                ctx.lineWidth = 1.6;
                ctx.setLineDash([4, 4]);
                for (const p of this.projectiles) {
                    if (p.dead) continue;
                    ctx.strokeStyle = p.isEnemy ? "rgba(248, 113, 113, 0.7)" : "rgba(56, 189, 248, 0.7)";
                    ctx.beginPath();
                    ctx.moveTo(p.x, p.y);
                    const apexY = Math.min(p.y, p.targetY) - Math.max(16, (p.z || 12) * 0.7);
                    const midX = (p.x + p.targetX) * 0.5;
                    ctx.quadraticCurveTo(midX, apexY, p.targetX, p.targetY);
                    ctx.stroke();

                    // Landing target reticle
                    ctx.beginPath();
                    ctx.arc(p.targetX, p.targetY, 5, 0, Math.PI * 2);
                    ctx.stroke();
                }
                ctx.setLineDash([]);
            }

            ctx.restore();
        }

        // ==========================================
        // 10. HUD & USER INTERACTION
        // ==========================================
        updateHUD() {
            const era = ERAS[this.stateManager.currentEra];
            document.getElementById('hud-era').innerText = era.name;
            const elWeather = document.getElementById('hud-weather');
            if (elWeather) {
                elWeather.innerText = era.weatherName || "🍃 Leaves";
            }
            document.getElementById('hud-coins').innerText = Math.floor(this.stateManager.coins);
            document.getElementById('hud-gems').innerText = this.stateManager.gems;

            if (this.playerBase && this.enemyBase) {
                document.getElementById('player-base-hp-text').innerText = formatDamageText(this.playerBase.hp);
                const pRatio = Math.max(0, (this.playerBase.hp / this.playerBase.maxHp) * 100);
                document.getElementById('player-base-hp-fill').style.width = `${pRatio}%`;

                document.getElementById('enemy-base-hp-text').innerText = formatDamageText(this.enemyBase.hp);
                const eRatio = Math.max(0, (this.enemyBase.hp / this.enemyBase.maxHp) * 100);
                document.getElementById('enemy-base-hp-fill').style.width = `${eRatio}%`;
            }

            const btnAirStrike = document.getElementById('btn-air-strike');
            const lblAirStrike = document.getElementById('airstrike-cd');
            if (btnAirStrike && lblAirStrike) {
                if (this.airStrikeCooldown <= 0) {
                    btnAirStrike.classList.add('ready');
                    btnAirStrike.classList.remove('cooling');
                    lblAirStrike.innerText = "READY";
                } else {
                    btnAirStrike.classList.remove('ready');
                    btnAirStrike.classList.add('cooling');
                    lblAirStrike.innerText = `${Math.ceil(this.airStrikeCooldown)}s`;
                }
            }

            const maxFood = this.stateManager.getMaxFood();
            document.getElementById('food-text').innerText = `${Math.floor(this.food)} / ${maxFood}`;
            const foodPct = Math.min(100, (this.food / maxFood) * 100);
            document.getElementById('food-fill').style.width = `${foodPct}%`;
            document.getElementById('food-rate').innerText = `+${this.stateManager.getFoodRate().toFixed(1)}/s`;

            for (let i = 0; i < 3; i++) {
                const u = era.units[i];
                const card = document.getElementById(`unit-card-${i}`);
                const costSpan = document.getElementById(`unit-cost-${i}`);
                const nameSpan = document.getElementById(`unit-name-${i}`);
                const iconDiv = document.getElementById(`unit-icon-${i}`);
                const cdOverlay = document.getElementById(`unit-cd-${i}`);

                if (card && u) {
                    nameSpan.innerText = u.name;
                    costSpan.innerText = u.cost;
                    iconDiv.innerText = u.icon;

                    const canAfford = this.food >= u.cost;
                    const onCooldown = this.unitCooldowns[i] > 0;

                    card.classList.toggle('can-afford', canAfford && !onCooldown);
                    card.classList.toggle('disabled', !canAfford || onCooldown);
                    card.classList.toggle('cooling', onCooldown);

                    if (onCooldown) {
                        cdOverlay.innerText = `${this.unitCooldowns[i].toFixed(1)}s`;
                    }
                }
            }

            document.getElementById('lbl-food-rate-lvl').innerText = `Food Generator (Lvl ${this.stateManager.foodRateLevel})`;
            document.getElementById('lbl-food-rate-desc').innerText = `Current: +${this.stateManager.getFoodRate().toFixed(1)}/s ➔ Next: +${(this.stateManager.getFoodRate() + 0.45).toFixed(1)}/s`;
            const costRate = this.stateManager.getUpgradeCost('rate');
            document.getElementById('cost-food-rate').innerText = costRate;
            document.getElementById('btn-upgrade-food-rate').classList.toggle('disabled', this.stateManager.coins < costRate);

            document.getElementById('lbl-food-cap-lvl').innerText = `Food Storage (Lvl ${this.stateManager.foodCapLevel})`;
            document.getElementById('lbl-food-cap-desc').innerText = `Current: ${this.stateManager.getMaxFood()} ➔ Next: ${this.stateManager.getMaxFood() + 8}`;
            const costCap = this.stateManager.getUpgradeCost('cap');
            document.getElementById('cost-food-cap').innerText = costCap;
            document.getElementById('btn-upgrade-food-cap').classList.toggle('disabled', this.stateManager.coins < costCap);

            document.getElementById('lbl-base-hp-lvl').innerText = `Base Fortification (Lvl ${this.stateManager.baseHpLevel})`;
            document.getElementById('lbl-base-hp-desc').innerText = `Current HP: ${this.stateManager.getBaseMaxHp()} ➔ Next: ${this.stateManager.getBaseMaxHp() + 200}`;
            const costHp = this.stateManager.getUpgradeCost('hp');
            document.getElementById('cost-base-hp').innerText = costHp;
            document.getElementById('btn-upgrade-base-hp').classList.toggle('disabled', this.stateManager.coins < costHp);

            if (this.stateManager.currentEra < ERAS.length - 1) {
                const nextEra = ERAS[this.stateManager.currentEra + 1];
                document.getElementById('evolve-next-title').innerText = `Next: ${nextEra.name} (${nextEra.arabicName})`;
                document.getElementById('cost-evolve').innerText = era.evolveCost;
                document.getElementById('btn-confirm-evolve').classList.toggle('disabled', this.stateManager.coins < era.evolveCost);
            } else {
                document.getElementById('evolve-next-title').innerText = "Maximum Era Achieved!";
                document.getElementById('cost-evolve').innerText = "MAX";
                document.getElementById('btn-confirm-evolve').classList.add('disabled');
            }

            document.getElementById('dungeon-keys-count').innerText = this.stateManager.dungeonKeys;
        }

        bindDOM() {
            for (let i = 0; i < 3; i++) {
                document.getElementById(`unit-card-${i}`).addEventListener('click', () => {
                    this.spawnPlayerUnit(i);
                });
            }

            const btnBomb = document.getElementById('btn-air-strike');
            if (btnBomb) {
                btnBomb.addEventListener('click', () => {
                    this.triggerAirStrike();
                });
            }

            const btnSpeed = document.getElementById('btn-speed');
            btnSpeed.addEventListener('click', () => {
                if (this.stateManager.gameSpeed === 1.0) this.stateManager.gameSpeed = 1.5;
                else if (this.stateManager.gameSpeed === 1.5) this.stateManager.gameSpeed = 2.0;
                else this.stateManager.gameSpeed = 1.0;
                btnSpeed.innerText = `${this.stateManager.gameSpeed}x`;
                this.stateManager.haptic(20);
            });

            const btnSound = document.getElementById('btn-sound');
            if (btnSound) {
                btnSound.addEventListener('click', () => {
                    const anyActive = this.stateManager.soundEnabled || this.stateManager.musicEnabled;
                    const newState = !anyActive;
                    this.stateManager.soundEnabled = newState;
                    this.stateManager.musicEnabled = newState;
                    window.soundManager.setEnabled(newState);
                    window.soundManager.setMusicEnabled(newState);
                    this.stateManager.saveState();
                    this.updateSettingsUI();
                    this.stateManager.haptic(20);
                });
            }

            const btnPause = document.getElementById('btn-pause');
            if (btnPause) {
                btnPause.addEventListener('click', () => {
                    this.togglePause();
                });
            }

            // Canvas Tap: On-Demand Tactical Pause (Brief battlefield analysis)
            let canvasTouchStartX = 0;
            let canvasTouchStartY = 0;
            let canvasTouchStartTime = 0;
            this.canvas.addEventListener('pointerdown', (e) => {
                canvasTouchStartX = e.clientX;
                canvasTouchStartY = e.clientY;
                canvasTouchStartTime = performance.now();
            });
            this.canvas.addEventListener('pointerup', (e) => {
                const dist = Math.hypot(e.clientX - canvasTouchStartX, e.clientY - canvasTouchStartY);
                const elapsed = performance.now() - canvasTouchStartTime;
                if (dist < 14 && elapsed < 500) {
                    this.togglePause();
                }
            });

            // Tap tactical banner to resume
            const pauseBanner = document.getElementById('tactical-pause-banner');
            if (pauseBanner) {
                pauseBanner.addEventListener('click', () => {
                    this.togglePause(false);
                });
            }

            document.getElementById('btn-open-upgrades').addEventListener('click', () => {
                document.getElementById('modal-upgrades').classList.add('active');
            });
            document.getElementById('close-upgrades').addEventListener('click', () => {
                document.getElementById('modal-upgrades').classList.remove('active');
            });

            document.getElementById('btn-upgrade-food-rate').addEventListener('click', () => {
                const cost = this.stateManager.getUpgradeCost('rate');
                if (this.stateManager.coins >= cost) {
                    this.stateManager.coins -= cost;
                    this.stateManager.foodRateLevel++;
                    window.soundManager.playCoin();
                    this.stateManager.saveState();
                    this.updateHUD();
                }
            });

            document.getElementById('btn-upgrade-food-cap').addEventListener('click', () => {
                const cost = this.stateManager.getUpgradeCost('cap');
                if (this.stateManager.coins >= cost) {
                    this.stateManager.coins -= cost;
                    this.stateManager.foodCapLevel++;
                    window.soundManager.playCoin();
                    this.stateManager.saveState();
                    this.updateHUD();
                }
            });

            document.getElementById('btn-upgrade-base-hp').addEventListener('click', () => {
                const cost = this.stateManager.getUpgradeCost('hp');
                if (this.stateManager.coins >= cost) {
                    this.stateManager.coins -= cost;
                    this.stateManager.baseHpLevel++;
                    this.playerBase.reset(this.stateManager.getBaseMaxHp());
                    window.soundManager.playCoin();
                    this.stateManager.saveState();
                    this.updateHUD();
                }
            });

            document.getElementById('btn-open-evolve').addEventListener('click', () => {
                document.getElementById('modal-evolve').classList.add('active');
            });
            document.getElementById('close-evolve').addEventListener('click', () => {
                document.getElementById('modal-evolve').classList.remove('active');
            });

            document.getElementById('btn-confirm-evolve').addEventListener('click', () => {
                if (this.stateManager.currentEra >= ERAS.length - 1) return;
                const cost = ERAS[this.stateManager.currentEra].evolveCost;
                if (this.stateManager.coins >= cost) {
                    this.stateManager.coins -= cost;
                    this.stateManager.currentEra++;
                    this.stateManager.highestEraReached = Math.max(this.stateManager.highestEraReached || 0, this.stateManager.currentEra);
                    window.soundManager.playEvolve();
                    this.stateManager.saveState();
                    if (this.inBattle) {
                        this.resetBattle();
                    } else {
                        this.initBases();
                    }
                    if (this.weatherSystem) {
                        this.weatherSystem.setEra(this.stateManager.currentEra);
                    }
                    window.soundManager.setEra(this.stateManager.currentEra);
                    this.updateSettingsUI();
                    this.updateStatsDisplay();
                    this.updateHUD();
                    this.stateManager.haptic(80);
                }
            });

            document.getElementById('btn-open-dungeon').addEventListener('click', () => {
                document.getElementById('modal-dungeon').classList.add('active');
            });
            document.getElementById('close-dungeon').addEventListener('click', () => {
                document.getElementById('modal-dungeon').classList.remove('active');
            });

            document.getElementById('btn-start-dungeon').addEventListener('click', () => {
                if (this.stateManager.dungeonKeys > 0) {
                    this.stateManager.dungeonKeys--;
                    this.isDungeonMode = true;
                    this.startBattle();
                    this.stateManager.saveState();
                    this.updateHUD();
                } else {
                    alert("Out of Dungeon Keys! Watch an ad to get +1 Key.");
                }
            });

            document.getElementById('btn-free-food').addEventListener('click', () => {
                if (window.AndroidBridge && typeof window.AndroidBridge.triggerRewardedAd === 'function') {
                    window.AndroidBridge.triggerRewardedAd('emergency_food');
                } else {
                    window.onRewardedAdSuccess('emergency_food');
                }
            });

            document.getElementById('btn-ad-key').addEventListener('click', () => {
                if (window.AndroidBridge && typeof window.AndroidBridge.triggerRewardedAd === 'function') {
                    window.AndroidBridge.triggerRewardedAd('dungeon_key');
                } else {
                    window.onRewardedAdSuccess('dungeon_key');
                }
            });

            document.getElementById('btn-double-gold').addEventListener('click', () => {
                if (window.AndroidBridge && typeof window.AndroidBridge.triggerRewardedAd === 'function') {
                    window.AndroidBridge.triggerRewardedAd('double_gold');
                } else {
                    window.onRewardedAdSuccess('double_gold');
                }
            });

            document.getElementById('btn-continue-battle').addEventListener('click', () => {
                this.isDungeonMode = false;
                this.startBattle();
            });

            // Start Battle CTA from Main Menu
            const btnStartBattle = document.getElementById('btn-start-battle');
            if (btnStartBattle) {
                btnStartBattle.addEventListener('click', () => {
                    this.startBattle();
                });
            }

            // Return to Main Menu from Game Over
            const btnMenuReturn = document.getElementById('btn-menu-return');
            if (btnMenuReturn) {
                btnMenuReturn.addEventListener('click', () => {
                    this.returnToMenu();
                });
            }

            // Top HUD Stats button & Modal Close
            const btnStats = document.getElementById('btn-stats');
            if (btnStats) {
                btnStats.addEventListener('click', () => {
                    this.updateStatsDisplay();
                    document.getElementById('modal-stats').classList.add('active');
                });
            }
            const closeStats = document.getElementById('close-stats');
            if (closeStats) {
                closeStats.addEventListener('click', () => {
                    document.getElementById('modal-stats').classList.remove('active');
                });
            }

            // Web Audio unlock on user first interaction
            const unlockAudio = () => {
                window.soundManager.init();
                window.removeEventListener('pointerdown', unlockAudio);
                window.removeEventListener('keydown', unlockAudio);
            };
            window.addEventListener('pointerdown', unlockAudio, { passive: true });
            window.addEventListener('keydown', unlockAudio, { passive: true });

            // Settings Modal Open & Close
            const btnSettings = document.getElementById('btn-settings');
            if (btnSettings) {
                btnSettings.addEventListener('click', () => {
                    this.updateSettingsUI();
                    document.getElementById('modal-settings').classList.add('active');
                    window.soundManager.init();
                    this.stateManager.haptic(20);
                });
            }
            const closeSettings = document.getElementById('close-settings');
            if (closeSettings) {
                closeSettings.addEventListener('click', () => {
                    document.getElementById('modal-settings').classList.remove('active');
                    this.stateManager.haptic(20);
                });
            }

            // Background Music Toggle Button inside Settings
            const btnToggleMusic = document.getElementById('btn-toggle-music');
            if (btnToggleMusic) {
                btnToggleMusic.addEventListener('click', () => {
                    this.stateManager.musicEnabled = !this.stateManager.musicEnabled;
                    window.soundManager.setMusicEnabled(this.stateManager.musicEnabled);
                    this.stateManager.saveState();
                    this.updateSettingsUI();
                    this.stateManager.haptic(30);
                });
            }

            // Music Volume Slider inside Settings
            const sliderMusicVolume = document.getElementById('slider-music-volume');
            if (sliderMusicVolume) {
                sliderMusicVolume.addEventListener('input', (e) => {
                    const vol = parseFloat(e.target.value) / 100.0;
                    this.stateManager.musicVolume = vol;
                    window.soundManager.setMusicVolume(vol);
                    const lblMusicVol = document.getElementById('music-volume-display');
                    if (lblMusicVol) lblMusicVol.innerText = `${Math.round(vol * 100)}%`;
                });
                sliderMusicVolume.addEventListener('change', () => {
                    this.stateManager.saveState();
                });
            }

            // Sound Effects Toggle Button inside Settings
            const btnToggleSfx = document.getElementById('btn-toggle-sfx');
            if (btnToggleSfx) {
                btnToggleSfx.addEventListener('click', () => {
                    this.stateManager.soundEnabled = !this.stateManager.soundEnabled;
                    window.soundManager.setEnabled(this.stateManager.soundEnabled);
                    this.stateManager.saveState();
                    this.updateSettingsUI();
                    this.stateManager.haptic(30);
                });
            }

            // Haptic Vibration Toggle Button inside Settings
            const btnToggleHaptic = document.getElementById('btn-toggle-haptic');
            if (btnToggleHaptic) {
                btnToggleHaptic.addEventListener('click', () => {
                    this.stateManager.hapticEnabled = !this.stateManager.hapticEnabled;
                    this.stateManager.saveState();
                    this.updateSettingsUI();
                    if (this.stateManager.hapticEnabled) this.stateManager.haptic(50);
                });
            }
        }

        updateSettingsUI() {
            const btnMusic = document.getElementById('btn-toggle-music');
            if (btnMusic) {
                btnMusic.innerText = this.stateManager.musicEnabled ? "ON" : "OFF";
                btnMusic.classList.toggle('active', this.stateManager.musicEnabled);
            }
            const sliderMusic = document.getElementById('slider-music-volume');
            const lblMusicVol = document.getElementById('music-volume-display');
            if (sliderMusic && lblMusicVol) {
                sliderMusic.value = Math.round(this.stateManager.musicVolume * 100);
                lblMusicVol.innerText = `${Math.round(this.stateManager.musicVolume * 100)}%`;
            }
            const btnSfx = document.getElementById('btn-toggle-sfx');
            if (btnSfx) {
                btnSfx.innerText = this.stateManager.soundEnabled ? "ON" : "OFF";
                btnSfx.classList.toggle('active', this.stateManager.soundEnabled);
            }
            const btnHaptic = document.getElementById('btn-toggle-haptic');
            if (btnHaptic) {
                btnHaptic.innerText = this.stateManager.hapticEnabled ? "ON" : "OFF";
                btnHaptic.classList.toggle('active', this.stateManager.hapticEnabled);
            }

            // Era theme descriptions for soundtrack
            const eraSoundtracks = [
                { title: "Soundtrack: Stone Age Drums", sub: "إيقاعات طبول حجرية وبدائية ملحمية 🪓", icon: "🪓" },
                { title: "Soundtrack: Desert Oud & Pharaonic March", sub: "مارش صحراوي فرعوني ونغمات عود شرقية 🐪", icon: "🏛️" },
                { title: "Soundtrack: Medieval Knights Fanfare", sub: "أناشيد الفرسان وطبول الحرب والأبواق الملكية ⚔️", icon: "🛡️" },
                { title: "Soundtrack: Driving Electro War Pulse", sub: "مارش إلكتروني حماسي بطاقة المعارك الحديثة 🔫", icon: "🚀" }
            ];
            const currentSoundtrack = eraSoundtracks[this.stateManager.currentEra] || eraSoundtracks[0];
            const elEraTitle = document.getElementById('settings-current-era-title');
            if (elEraTitle) elEraTitle.innerText = currentSoundtrack.title;
            const elEraSub = document.getElementById('settings-current-era-sub');
            if (elEraSub) elEraSub.innerText = currentSoundtrack.sub;
            const elEraIcon = document.getElementById('settings-current-era-icon');
            if (elEraIcon) elEraIcon.innerText = currentSoundtrack.icon;

            const btnSound = document.getElementById('btn-sound');
            if (btnSound) {
                const isAudioOn = this.stateManager.soundEnabled || this.stateManager.musicEnabled;
                btnSound.innerText = isAudioOn ? "🔊" : "🔇";
                btnSound.classList.toggle('active', isAudioOn);
            }
        }

        hasActiveModal() {
            return document.querySelector('.modal-backdrop.active') !== null;
        }

        togglePause(forcedState = null) {
            if (this.battleOver || (this.hasActiveModal() && forcedState === null)) return;
            this.isPaused = (forcedState !== null) ? forcedState : !this.isPaused;
            const btnPause = document.getElementById('btn-pause');
            if (btnPause) {
                btnPause.innerText = this.isPaused ? "▶️" : "⏸️";
                btnPause.classList.toggle('active', this.isPaused);
            }
            const pauseBanner = document.getElementById('tactical-pause-banner');
            if (pauseBanner) {
                pauseBanner.classList.toggle('hidden', !this.isPaused);
            }
            this.stateManager.haptic(25);
        }

        closeAllModals() {
            document.getElementById('modal-upgrades').classList.remove('active');
            document.getElementById('modal-evolve').classList.remove('active');
            document.getElementById('modal-dungeon').classList.remove('active');
            document.getElementById('modal-gameover').classList.remove('active');
            const modalStats = document.getElementById('modal-stats');
            if (modalStats) modalStats.classList.remove('active');
            const modalSettings = document.getElementById('modal-settings');
            if (modalSettings) modalSettings.classList.remove('active');
        }
    }

    let game = null;
    window.addEventListener('DOMContentLoaded', () => {
        game = new GameEngine2D();
        window.gameInstance = game;
    });

    window.onRewardedAdSuccess = function (placement) {
        if (!game) return;
        if (placement === 'double_gold') {
            const doubleAmount = game.battleCoinsEarned || 50;
            game.stateManager.coins += doubleAmount;
            game.spawnDamageNumber(game.width * 0.5, game.laneCenterY, `+${doubleAmount} 🪙 DOUBLED!`, "#fde047");
            window.soundManager.playCoin();
            document.getElementById('modal-gameover').classList.remove('active');
            game.resetBattle();
        } else if (placement === 'emergency_food') {
            game.food = Math.min(game.stateManager.getMaxFood() + 15, game.food + 25);
            game.spawnDamageNumber(game.width * 0.5, game.laneCenterY, "+25 FOOD! 🍖", "#f97316");
            window.soundManager.playCoin();
        } else if (placement === 'dungeon_key') {
            game.stateManager.dungeonKeys = Math.min(5, game.stateManager.dungeonKeys + 1);
            game.spawnDamageNumber(game.width * 0.5, game.laneCenterY, "+1 DUNGEON KEY! 🗝️", "#c084fc");
            window.soundManager.playCoin();
        }
        game.stateManager.saveState();
        game.updateHUD();
    };

})();
