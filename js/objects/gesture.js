function Gesture(weights) {
  this.frames = [];
  if (Array.isArray(weights)) this.weights = weights;
  else {
    var size = 17;
    this.weights = [];
    while(size--) this.weights[size] = 1;
  }
  this.closestMatch = function(pose) {
    var best = Number.MAX_VALUE;
    var position = -1;
    for (var i = 0; i < this.frames.length; i++) {
      var distance = this.frames[i].distance(pose, this.weights);
      if (distance < best) {
        best = distance;
        position = i;
      }
    }
    return {position: position, distance: best};
  }
  this.addFrame = function(frame) {
    this.frames.push(new Pose().copy(frame));
  }
  this.replaceFrame = function(frame, position) {
    this.frames.splice(position, 1, new Pose().copy(frame));
  }
  this.getFrame = function(position) {
    return this.frames[position];
  }
  this.removeFrame = function(position) {
    return this.frames.splice(position, 1);
  }
  this.setWeights = function(weights) {
    this.weights = weights;
  }
}
