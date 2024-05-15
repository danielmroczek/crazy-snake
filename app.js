/**
 * Created by mroczek on 28-04-2016.
 */

var initialSize = 100;
var map = new Rectangle(new Point(0,0), initialSize);
var center = map.getCenter();

// // The amount of points in the path:
var points = 3;

// The distance between the points:
var movingSpeed = 15;

var rotationSpeed = 180;
var movingVector = new Point(movingSpeed, 0);
var maxSegmentLength = 1;

var path = new Path({
  strokeColor: '#E4141B',
  strokeWidth: 1,
  strokeCap: 'round',
  // fullySelected: true
});

reset();


function onFrame(event) {
  // Each frame, change the fill color of the path slightly by
  // adding 1 to its hue:
  //path.strokeColor.hue += 1;

  control(event);

  var lastSegment = path.lastSegment;
  var newPoint = lastSegment.point + movingVector.multiply(event.delta);
  var hit = project.hitTest(newPoint);
  if (hit) {
    console.dir(hit);
  }
  if (lastSegment.curve && lastSegment.curve.length < maxSegmentLength) {
    lastSegment.point = newPoint;
    //path.simplify();
  } else {
    path.add(newPoint);

  }

  path.smooth('continuous');




  //path.simplify(1);
  // || path.getIntersections().length > 0
  if (!map.contains(path.lastSegment.point) ) {
    reset();
  }
}

function control(event) {
  var rotation = rotationSpeed * event.delta;
  if (Key.isDown("left")) {
    movingVector.angle -= rotation;
  }

  if (Key.isDown("right")) {
    movingVector.angle += rotation;
  }

}

function reset() {
  path.removeSegments(1);
  path.add(center);
}

view.setViewSize(initialSize, initialSize);

view.onResize = function(event) {
  view.setZoom(view.getViewSize().getWidth() / initialSize);
  view.setCenter(center);
};