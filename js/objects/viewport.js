function Viewport(containerId) {
  this.width = window.innerWidth;
  this.height = window.innerHeight;
  this.ratio = this.width / (this.height + 0.0);
  this.zoom = 400.0;
  this.offsetWidth = this.width / 2;
  this.offsetHeight = this.height / 2;
  this.activeLayer = 0;
  this.layers = [];

  this.stage = new Konva.Stage({
    container: containerId,
    width: window.innerWidth,
    height: window.innerHeight
  });

  this.addLayer('black');

  var that = this;
  // Register window resize event
  window.addEventListener('resize', this.onWindowResizeCallback = function(e) {
    that.onWindowResize(e);
  }, false);
  // Register middle click for drag
  this.dragView = false;
  this.dragStart = undefined;
  $('#' + containerId).mousedown(function(event) {
    event.preventDefault();
    if(event.which == 2) {
      that.dragView = true;
      that.dragStart = [event.clientX, event.clientY];
    }
  });
  $('#' + containerId).mouseup(function(event) {
    event.preventDefault();
    if(event.which == 2) {
      that.dragView = false;
      that.dragStart = undefined;
    }
  });
  $('#' + containerId).mousemove(function(event) {
    if (that.dragView) {
      that.offsetWidth = that.offsetWidth - (that.dragStart[0] - event.clientX);
      that.offsetHeight = that.offsetHeight - (that.dragStart[1] - event.clientY);
      that.dragStart = [event.clientX, event.clientY];
      that.updateLayers();
    }
  });
}

Viewport.prototype.update = function () {
  for (var i = 0; i < this.layers.length; i++) {
    this.layers[i].layer.draw();
  }

  // Request next frame
  var game = this;
  this.animationFrameId = requestAnimationFrame(function() { game.update(); });
};

Viewport.prototype.stop = function () {
  window.removeEventListener('resize', this.onWindowResizeCallback);
  cancelAnimationFrame(this.animationFrameId);
}

Viewport.prototype.setActiveLayer = function(layer) {
  this.activeLayer = layer;
}

Viewport.prototype.addLayer = function(color) {
  var Layer = {
    layerId: this.layers.length
  }
  Layer.pose = new Pose();
  Layer.layer = new Konva.Layer();
  this.stage.add(Layer.layer);
  this.layers.push(Layer);

  var that = this;

  // Create lines
  var anchors = [
    5, 6,
    5, 7,
    6, 8,
    7, 9,
    8, 10,
    11, 13,
    12, 14,
    13, 15,
    14, 16
  ];
  Layer.lines = [];
  for (var i = 0; i < anchors.length / 2; i++) {
    Layer.lines[i] = new Konva.Line({
      dash: [10, 10, 0, 10],
      strokeWidth: 3,
      stroke: 'white',
      lineCap: 'round',
      id: 'bezierLine',
      opacity: 0.0,
      points: [0, 0, 0, 0]
    });
    Layer.lines[i].anchorPoints = [anchors[2 * i], anchors[2 * i + 1]];
    Layer.layer.add(Layer.lines[i]);
  }

  // Create points
  Layer.dots = [];
  for (var i = 0; i < 17; i++) {
    var group = new Konva.Group({
      x: that.width / 2,
      y: that.height / 2,
      draggable: true
    });
    var dot = new Konva.Circle({
      x: 0,
      y: 0,
      radius: 5,
      fill: color,
      stroke: 'white',
      strokeWidth: 2,
      opacity: 0
    });
    var tag = new Konva.Text({
      x: -25,
      y: -20,
      text: '' + i,
      fontSize: 15,
      fontFamily: 'Arial',
      fill: 'white',
      width: 20,
      align: 'right',
      opacity: 0
    });
    group.add(dot);
    group.add(tag);
    group.color = color;

    group.keypointId = i + 0;
    Layer.layer.add(group);
    Layer.dots.push(group);

    group.on('dragstart', function() {
    });
    group.on('dragend', function() {
      var screen = vec2.fromValues(this.position().x, this.position().y);
      var position = that.screenToPosition(screen);
      Layer.pose.setKeypoint(position, this.keypointId);
      that.updateLines(Layer);
    });
  }
}

Viewport.prototype.getActiveLayer = function() {
  return this.layers[this.activeLayer];
}

Viewport.prototype.setPose = function(pose, enabledKeypoints) {
  var layer = this.getActiveLayer();
  layer.pose.copy(pose);
  this.updatePoints(layer);
  this.updateLines(layer);
}

Viewport.prototype.getPose = function() {
  var layer = this.getActiveLayer();
  return layer.pose;
}

Viewport.prototype.setEnabledKeypoints = function(enabledKeypoints) {
  this.enabledKeypoints = enabledKeypoints;
  this.updateLayers();
}

Viewport.prototype.setKeypointsColor = function(color) {
  for (var i = 0; i < 17; i++) {
    this.setKeypointColor(color, i);
  }
  this.updatePoints(this.getActiveLayer());
  this.updateLines(this.getActiveLayer());
}

Viewport.prototype.setKeypointColor = function(color, position) {
  var layer = this.getActiveLayer();
  layer.dots[position].color = color;
}

Viewport.prototype.updatePoints = function(layer) {
  var keypoints = layer.pose.keypoints;
  for (var i = 0; i < 17; i++) {
    var screen = this.positionToScreen(keypoints[i]);
    layer.dots[i].position({x: screen[0], y: screen[1]});

    var children = layer.dots[i].getChildren();
    children[0].setFill(layer.dots[i].color);

    if (!this.enabledKeypoints[i]) {
      children[0].opacity(0);
      children[1].opacity(0);
      layer.dots[i].position({x: 0, y: 0});
    } else {
      children[0].opacity(layer.pose.scores[i]);
      children[1].opacity(layer.pose.scores[i]);
    }
  }
}

Viewport.prototype.updateLines = function(layer) {
  var keypoints = layer.pose.keypoints;
  for (var i = 0; i < layer.lines.length; i++) {
    var line = layer.lines[i];
    var screen1 = this.positionToScreen(keypoints[line.anchorPoints[0]]);
    var screen2 = this.positionToScreen(keypoints[line.anchorPoints[1]]);
    line.points([screen1[0], screen1[1], screen2[0], screen2[1]]);

    if (!this.enabledKeypoints[line.anchorPoints[0]] || !this.enabledKeypoints[line.anchorPoints[1]]) {
      line.opacity(0);
    } else {
      var lowestScore = layer.pose.scores[line.anchorPoints[0]] < layer.pose.scores[line.anchorPoints[1]] ? layer.pose.scores[line.anchorPoints[0]] : layer.pose.scores[line.anchorPoints[1]];
      line.opacity(lowestScore);
    }
  }
}

Viewport.prototype.updateLayers = function() {
  for (var i = 0; i < this.layers.length; i++) {
    this.updatePoints(this.layers[i]);
    this.updateLines(this.layers[i]);
  }
}

Viewport.prototype.positionToScreen = function(position) {
  return vec2.fromValues(position[0] * this.zoom + this.offsetWidth, position[1] * this.zoom + this.offsetHeight);
}

Viewport.prototype.screenToPosition = function(screen) {
  return vec2.fromValues((screen[0] - this.offsetWidth) / this.zoom, (screen[1] - this.offsetHeight) / this.zoom);
}

Viewport.prototype.onWindowResize = function() {
  this.stage.setWidth(window.innerWidth);
  this.stage.setHeight(window.innerHeight);
  this.width = window.innerWidth;
  this.height = window.innerHeight;
  this.ratio = this.width / (this.height + 0.0);
  this.updateLayers();
}
