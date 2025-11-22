// Make paper classes global
paper.install(window);

window.onload = () => {
    // Setup the view
    paper.setup('canvas');

    const initialSize = 100;
    const map = new Rectangle(new Point(0, 0), initialSize);
    const center = map.center;

    // Visual width of the snake
    const width = 1;

    // Movement speed (units per second)
    const INITIAL_SPEED = 30;

    // Snake length management
    let desiredLength = 30; // initial length
    let speed = INITIAL_SPEED;
    const SPEED_ACCEL = 10; // +1 unit per second

    const ROT_BASE = 180; // deg/s starting turn rate
    const ROT_MAX = 360;  // deg/s after ~1s hold
    let holdDir = 0;      // -1 left, 1 right, 0 none
    let holdTime = 0;     // seconds holding current dir
    const movingVector = new Point(speed, 0);
    let maxSegmentLength = 2;
    let paused = false;

    const path = new Path({
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
        const margin = appleRadius + 1;
        const x = margin + Math.random() * (initialSize - 2 * margin);
        const y = margin + Math.random() * (initialSize - 2 * margin);
        apple = new Path.Circle({
            center: new Point(x, y),
            radius: appleRadius,
            fillColor: '#00C853',
            strokeWidth: 0.25
        });
    };

    const reset = () => {
        desiredLength = 30;
        speed = INITIAL_SPEED;
        path.removeSegments();
        // Initialize a straight tail so the snake starts with desired length
        const dir = movingVector.normalize(1);
        // const tail = center.subtract(dir.multiply(desiredLength));
        // path.add(tail);
        path.add(center);
        spawnApple();
    };

    reset();

    view.onFrame = (event) => {
        if (paused) return;
        control(event);

        // Smooth acceleration: increase speed by 1 per second
        speed += SPEED_ACCEL * event.delta;
        movingVector.length = speed;

        const lastSegment = path.lastSegment;
        const newPoint = lastSegment.point.add(movingVector.multiply(event.delta));
        
        // Self-collision: ignore the most recent few curves near the head
        const hit = path.hitTest(newPoint, {
            stroke: true,
            tolerance: Math.max(width * 0.6, 0.5)
        });

        if (hit && hit.location && hit.location.curve && hit.location.curve.index < path.curves.length - 3) {
            reset();
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
                apple.remove();
                apple = null;
                spawnApple();
            }
        }

        path.smooth({ type: 'continuous' });

        if (!map.contains(path.lastSegment.point)) {
            reset();
        }
    };

    const control = (event) => {
        const left = Key.isDown("left");
        const right = Key.isDown("right");
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

        path.fullySelected = Key.isDown("z");
    };

    // Keyboard controls: P = pause/resume, R = reset
    window.addEventListener('keydown', (e) => {
        const k = e.key && e.key.toLowerCase();
        if (k === 'p') {
            paused = !paused;
        } else if (k === 'r') {
            reset();
        }
    });

    // Handle resizing
    view.onResize = (event) => {
        view.zoom = view.viewSize.width / initialSize;
        view.center = center;
    };

    // Trigger initial resize to set zoom and center correctly
    view.emit('resize');
};