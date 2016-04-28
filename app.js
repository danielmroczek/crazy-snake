/**
 * Created by mroczek on 28-04-2016.
 */
// Adapted from the following Processing example:
// http://processing.org/learning/topics/follow3.html

// // The amount of points in the path:
var points = 10;

// The distance between the points:
var length = 10;

var path = new Path({
  strokeColor: '#E4141B',
  strokeWidth: 5,
  strokeCap: 'round'
});

var start = view.center / [10, 1];

for (var i = 0; i < points; i++)
  path.add(start + new Point(i * length, 0));

function onMouseMove(event) {
  path.firstSegment.point = event.point;
  for (var i = 0; i < points - 1; i++) {
    var segment = path.segments[i];
    var nextSegment = segment.next;
    var vector = segment.point - nextSegment.point;
    vector.length = length;
    nextSegment.point = segment.point - vector;
  }
  path.smooth({ type: 'continuous' });
}

function onMouseDown(event) {
  path.fullySelected = true;
  path.strokeColor = '#e08285';
}

function onMouseUp(event) {
  path.fullySelected = false;
  path.strokeColor = '#e4141b';
}
var initialSize = 100;

view.setViewSize(initialSize, initialSize);

var point = new Path.Circle({
  center: view.center,
  radius: 1,
  strokeColor: '#E4141B',
  strokeWidth: 1,
  strokeCap: 'round'
});

view.onResize = function(event) {
  // Whenever the view is resized, move the path to its center:
  //path.position = view.center;
  view.setZoom(view.getViewSize().getWidth() / initialSize);
  view.setCenter([50, 50]);
};