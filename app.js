const STORAGE_KEY = 'curve-party-best';
const hudState = {
    state: 'intro',
    score: 0,
    apples: 0,
    elapsed: 0,
    best: 0,
    last: 0
};

let hudSubscriber = null;
let startHandler = null;

const emitHUD = () => {
    if (hudSubscriber) {
        hudSubscriber({ ...hudState });
    }
};

window.gameAPI = {
    register(hooks) {
        if (hooks && typeof hooks.update === 'function') {
            hudSubscriber = hooks.update;
            emitHUD();
        }
    },
    requestStart() {
        if (typeof startHandler === 'function') {
            startHandler();
        }
    }
};

window.retroGameUI = function retroGameUI() {
    return {
        state: hudState.state,
        score: hudState.score,
        apples: hudState.apples,
        elapsed: hudState.elapsed,
        best: hudState.best,
        last: hudState.last,
        init() {
            window.gameAPI.register({
                update: (payload) => {
                    this.state = payload.state;
                    this.score = payload.score;
                    this.apples = payload.apples;
                    this.elapsed = payload.elapsed;
                    this.best = payload.best;
                    this.last = payload.last;
                }
            });
        },
        handleKey(event) {
            if (event.code === 'Space') {
                event.preventDefault();
                window.gameAPI.requestStart();
            }
        }
    };
};

window.onload = () => {
    // Setup the view
    paper.setup('canvas');

    const initialSize = 100;
    const map = new paper.Rectangle(new paper.Point(0, 0), initialSize);
    const center = map.center;

    // Visual width of the snake
    const width = 1;

    // Movement speed (units per second)
    const INITIAL_SPEED = 30;

    // Snake length management
    let desiredLength = 30; // initial length
    let speed = INITIAL_SPEED;
    const SPEED_ACCEL = 5; 

    const ROT_BASE = 180; // deg/s starting turn rate
    const ROT_MAX = 360;  // deg/s after ~1s hold
    let holdDir = 0;      // -1 left, 1 right, 0 none
    let holdTime = 0;     // seconds holding current dir
    const movingVector = new paper.Point(speed, 0);
    let maxSegmentLength = 2;
    let paused = true;
    let roundActive = false;
    let applesEaten = 0;
    let elapsed = 0;

    const readBestFromStorage = () => {
        try {
            return Number(localStorage.getItem(STORAGE_KEY)) || 0;
        } catch (error) {
            return 0;
        }
    };

    const writeBestToStorage = (value) => {
        try {
            localStorage.setItem(STORAGE_KEY, value);
        } catch (error) {
            // Persistence can fail (e.g., private mode); ignore silently.
        }
    };

    const loadBest = readBestFromStorage();
    hudState.best = loadBest;
    emitHUD();

    const path = new paper.Path({
        strokeColor: '#D50000',
        strokeWidth: width,
        strokeCap: 'round',
        // fullySelected: true
    });

    // Apple (dot) state
    let apple = null;
    const appleRadius = 2;

    const spawnApple = () => {
        if (apple) apple.remove();
        const margin = Math.max(appleRadius + 1, 10); // keep dot at least 10 units from each edge
        const x = margin + Math.random() * (initialSize - 2 * margin);
        const y = margin + Math.random() * (initialSize - 2 * margin);
        apple = new paper.Path.Circle({
            center: new paper.Point(x, y),
            radius: appleRadius,
            fillColor: '#00C853',
            strokeWidth: 0.25
        });
    };

    const prepareArena = () => {
        desiredLength = 30;
        speed = INITIAL_SPEED;
        movingVector.length = speed;
        movingVector.angle = 0;
        holdDir = 0;
        holdTime = 0;
        path.removeSegments();
        path.add(center);
        spawnApple();
    };

    const resetStats = () => {
        applesEaten = 0;
        elapsed = 0;
        hudState.apples = 0;
        hudState.elapsed = 0;
        hudState.score = 0;
        emitHUD();
    };

    const setState = (next) => {
        hudState.state = next;
        paused = next !== 'playing';
        emitHUD();
    };

    const startRound = () => {
        if (hudState.state === 'playing') return;
        prepareArena();
        resetStats();
        paused = false;
        roundActive = true;
        setState('playing');
    };

    const finishRound = () => {
        if (!roundActive) return;
        roundActive = false;
        paused = true;
        hudState.last = hudState.score;
        if (hudState.last > hudState.best) {
            hudState.best = hudState.last;
            writeBestToStorage(hudState.best);
        }
        prepareArena();
        setState('gameover');
    };

    const returnToIntro = () => {
        roundActive = false;
        paused = true;
        prepareArena();
        resetStats();
        setState('intro');
    };

    const updateScore = (delta) => {
        elapsed += delta;
        hudState.elapsed = elapsed;
        hudState.score = applesEaten * 5 + Math.floor(elapsed);
        emitHUD();
    };

    prepareArena();
    resetStats();
    setState('intro');
    startHandler = startRound;

    paper.view.onFrame = (event) => {
        if (paused) return;
        control(event);

        // Smooth acceleration: increase speed by 1 per second
        speed += SPEED_ACCEL * event.delta;
        movingVector.length = speed;

        updateScore(event.delta);

        const lastSegment = path.lastSegment;
        const newPoint = lastSegment.point.add(movingVector.multiply(event.delta));

        // Self-collision: ignore the most recent few curves near the head
        const hit = path.hitTest(newPoint, {
            stroke: true,
            tolerance: Math.max(width * 0.6, 0.5)
        });

        if (hit && hit.location && hit.location.curve && hit.location.curve.index < path.curves.length - 3) {
            finishRound();
            return;
        }

        if (lastSegment.curve && lastSegment.curve.length < maxSegmentLength) {
            lastSegment.point = newPoint;
        } else {
            path.add(newPoint);
        }

        // Trim tail to maintain desired length
        let excess = path.length - desiredLength;
        while (excess > 0 && path.segments.length > 1) {
            const p0 = path.segments[0].point;
            const p1 = path.segments[1].point;
            const d = p1.subtract(p0);
            const segLen = d.length;
            if (segLen <= excess) {
                path.removeSegment(0);
                excess -= segLen;
            } else {
                // Move the first point along the segment to trim the leftover
                const newP0 = p1.subtract(d.normalize(segLen - excess));
                path.segments[0].point = newP0;
                excess = 0;
            }
        }

        // Apple collision: head vs apple center
        if (apple) {
            const head = path.lastSegment.point;
            if (head.getDistance(apple.position) <= appleRadius + width * 0.5) {
                desiredLength += 10; // grow by 10 units
                applesEaten += 1;
                hudState.apples = applesEaten;
                hudState.score = applesEaten * 5 + Math.floor(elapsed);
                apple.remove();
                apple = null;
                spawnApple();
                emitHUD();
            }
        }

        path.smooth({ type: 'continuous' });

        if (!map.contains(path.lastSegment.point)) {
            finishRound();
        }
    };

    const control = (event) => {
        const left = paper.Key.isDown("left");
        const right = paper.Key.isDown("right");
        const dir = left && !right ? -1 : right && !left ? 1 : 0;

        if (dir === 0) {
            holdDir = 0;
            holdTime = 0;
        } else {
            if (dir !== holdDir) {
                holdDir = dir;
                holdTime = 0; // reset to base on direction change
            } else {
                holdTime += event.delta;
            }

            const t = Math.min(holdTime / 1, 1); // 0..1 over 1 second
            const TurningSpeed = ROT_BASE + (ROT_MAX - ROT_BASE) * t; // deg/s
            movingVector.angle += dir * TurningSpeed * event.delta * speed / 30;    // apply
        }

        // movingVector.angle += dir * event.delta * speed * 10;

        path.fullySelected = paper.Key.isDown("z");
    };

    window.addEventListener('keydown', (e) => {
        const k = e.key && e.key.toLowerCase();
        if (k === 'p' && hudState.state === 'playing') {
            paused = !paused;
        } else if (k === 'r') {
            returnToIntro();
        }
    });

    // Handle resizing
    paper.view.onResize = (event) => {
        paper.view.zoom = paper.view.viewSize.width / initialSize;
        paper.view.center = center;
    };

    // Trigger initial resize to set zoom and center correctly
    paper.view.emit('resize');
};