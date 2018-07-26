App.service('framesHolder', function() {
  this.frames = [];
  this.gestureFrames = [];
  this.keypointNames = ["nose", "leftEye", "rightEye", "leftEar", "rightEar", "leftShoulder", "rightShoulder", "leftElbow", "rightElbow", "leftWrist", "rightWrist", "leftHip", "rightHip", "leftKnee", "rightKnee", "leftAnkle", "rightAnkle"];
  this.enabledKeypoints = [true, true, true, false, false, true, true, false, false, false, false, false, false, false, false, false, false];

  this.getKeypointNames = function() {
    return this.keypointNames;
  }
  this.setKeypointStatus = function(position, status) {
    if (position >= 0 && position < 17) this.enabledKeypoints[position] = status;
  }
  this.isKeypointEnabled = function(position) {
    return this.enabledKeypoints[position];
  }
  this.getEnabledKeypoints = function() {
    return this.enabledKeypoints;
  }
  this.setEnabledKeypoints = function(array) {
    this.enabledKeypoints = array;
  }

  this.addFrame = function(frame, position) {
    if (position) {
      this.frames.splice(position, 0, frame);
    } else {
      this.frames.push(frame);
    }
  }
  this.setFrame = function(frame, position) {
    this.frames[position].copy(frame);
  }
  this.getFrame = function(position) {
    return this.frames[position];
  }
  this.deleteFrame = function(position) {
    this.frames.splice(position, 1);
  }
  this.getFrames = function() {
    return this.frames;
  }
  this.getFramesLenght = function() {
    return this.frames.length;
  }
  this.dropFrames = function() {
    this.frames = [];
  }

  this.getGestureFrames = function() {
    return this.gestureFrames;
  }
  this.saveGestureFrames = function(frames) {
    this.gestureFrames = frames;
  }
});
