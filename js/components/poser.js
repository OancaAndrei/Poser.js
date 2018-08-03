App.component('poser', {
  templateUrl: 'views/poser.html',
  controller: ['$scope', 'framesHolder', PoserController]
});

function PoserController($scope, framesHolder) {
  var ctrl = this;
  this.liveFeed = true;
  this.capturedPose = new Pose();
  this.keypointNames = framesHolder.getKeypointNames();
  this.currentFrame = 0;
  this.enabledKeypoints = framesHolder.getEnabledKeypoints();

  // Build gesture
  var weights = [];
  for (var i = 0; i < 17; i++) {
    weights[i] = this.enabledKeypoints[i] ? 1 : 0;
  }
  this.gesture = new Gesture(weights);
  var gestureFrames = framesHolder.getGestureFrames();
  for (var i = 0; i < gestureFrames.length; i++) {
    var frame = framesHolder.getFrame(gestureFrames[i]);
    this.gesture.addFrame(frame);
  }

  this.saveGesture = function() {
    var data = this.gesture.export();
    // To json
    var json = JSON.stringify(data);
    // Encode
    var filename = "Gesture - " + new Date() + ".json";
    var dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(json);
    // Download
    var link = document.getElementById('export');
    link.href = dataUri;
    link.download = filename;
    link.click();
  }

  this.toggleLiveFeed = function() {
    ctrl.liveFeed = !ctrl.liveFeed;
  }

  this.getFramesLenght = function() {
    return framesHolder.getFramesLenght();
  }

  this.updateView = function() {
    var pose;
    if (ctrl.liveFeed) {
      pose = ctrl.capturedPose;
    } else {
      var length = framesHolder.getFramesLenght();
      if (ctrl.currentFrame >= length) ctrl.currentFrame = length - 1;
      if (ctrl.currentFrame < 0) ctrl.currentFrame = 0;

      if (length <= 0) return;
      pose = framesHolder.getFrames()[ctrl.currentFrame];
    }

    // Calculate best match from gesture
    var best = ctrl.gesture.closestMatch(pose);

    // Update viewport
    if (ctrl.viewport) {
      ctrl.viewport.setEnabledKeypoints(ctrl.enabledKeypoints);
      // Update input pose
      ctrl.viewport.setActiveLayer(0);
      ctrl.viewport.setPose(pose);
      // Update best match pose
      if (best.position !== -1) {
        ctrl.viewport.setActiveLayer(1);
        ctrl.viewport.setPose(ctrl.gesture.getFrame(best.position));
      }
    }
  }

  this.onPoseUpdate = function(pose) {
    ctrl.capturedPose.copy(pose);
    if (ctrl.liveFeed) ctrl.updateView();
  }

  $scope.$on("KeyDown", function(event, data) {
    if (data.keyCode === 37) {
      // Left key
      ctrl.currentFrame--;
      ctrl.updateView();
    } else if (data.keyCode === 39) {
      // Right key
      ctrl.currentFrame++;
      ctrl.updateView();
    }
  });

  this.$onInit = function() {
    // Start viewport
    ctrl.viewport = new Viewport("viewport");
    ctrl.viewport.addLayer('red');
    ctrl.viewport.setEnabledKeypoints(ctrl.enabledKeypoints);
    ctrl.viewport.update();
    // Set initial frame
    ctrl.updateView();
    // Init Tracker
    ctrl.Tracker = new Tracker(ctrl.onPoseUpdate);
    // Init PoseNet
    loadPosenet(ctrl.Tracker);
  };

  this.$onDestroy = function() {
    // Stop viewport
    ctrl.viewport.stop();
    // Stop Tracker
    ctrl.Tracker.stop();
    // Save keypoints status
    framesHolder.setEnabledKeypoints(ctrl.enabledKeypoints);
  };

}
