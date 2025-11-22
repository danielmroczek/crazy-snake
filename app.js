// Make paper classes global
paper.install(window);

window.onload = () => {
    // Setup the view
    paper.setup('canvas');

    const initialSize = 100;
    const map = new Rectangle(new Point(0, 0), initialSize);
    const center = map.center;

    // The amount of points in the path:
    const points = 3;

    // The distance between the points:
    const movingSpeed = 15;

    const rotationSpeed = 180;
    const movingVector = new Point(movingSpeed, 0);
    const maxSegmentLength = 1;

    const path = new Path({
        strokeColor: '#E4141B',
        strokeWidth: 1,
        strokeCap: 'round',
        // fullySelected: true
    });

    const reset = () => {
        path.removeSegments(1);
        path.add(center);
    };

    reset();

    view.onFrame = (event) => {
        // Each frame, change the fill color of the path slightly by
        // adding 1 to its hue:
        // path.strokeColor.hue += 1;

        control(event);

        const lastSegment = path.lastSegment;
        const newPoint = lastSegment.point.add(movingVector.multiply(event.delta));
        
        const hit = project.hitTest(newPoint);
        if (hit) {
            console.dir(hit);
        }

        if (lastSegment.curve && lastSegment.curve.length < maxSegmentLength) {
            lastSegment.point = newPoint;
            // path.simplify();
        } else {
            path.add(newPoint);
        }

        path.smooth({ type: 'continuous' });

        // path.simplify(1);
        // || path.getIntersections().length > 0
        if (!map.contains(path.lastSegment.point)) {
            reset();
        }
    };

    const control = (event) => {
        const rotation = rotationSpeed * event.delta;
        if (Key.isDown("left")) {
            movingVector.angle -= rotation;
        }

        if (Key.isDown("right")) {
            movingVector.angle += rotation;
        }
    };

    // Handle resizing
    view.onResize = (event) => {
        view.zoom = view.viewSize.width / initialSize;
        view.center = center;
    };

    // Trigger initial resize to set zoom and center correctly
    view.emit('resize');
};