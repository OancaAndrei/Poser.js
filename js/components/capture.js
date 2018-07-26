App.component('capture', {
  templateUrl: 'views/capture.html',
  controller: ['$scope', 'framesHolder', CaptureController]
});

function CaptureController($scope, framesHolder) {
  var ctrl = this;
  this.keypointNames = framesHolder.getKeypointNames();
  this.recording = false;
  this.enabledKeypoints = framesHolder.getEnabledKeypoints();

  this.toggleRecording = function() {
    ctrl.recording = !ctrl.recording;
  }

  this.dropFrames = function() {
    framesHolder.dropFrames();
  }

  this.onPoseUpdate = function(pose) {
    // Update viewport
    if (ctrl.viewport) {
      ctrl.viewport.setEnabledKeypoints(ctrl.enabledKeypoints);
      ctrl.viewport.setPose(pose);
    }
    // Save pose if recording
    if (ctrl.recording) {
      framesHolder.addFrame(new Pose().copy(pose));
      $scope.$apply();
    }
  }

  this.getFramesLenght = function() {
    return framesHolder.getFramesLenght();
  }

  this.$onInit = function() {
    // Start viewport
    ctrl.viewport = new Viewport("viewport");
    ctrl.viewport.setEnabledKeypoints(ctrl.enabledKeypoints);
    ctrl.viewport.update();
    // Init Tracker
    ctrl.Tracker = new Tracker(ctrl.onPoseUpdate);
    // Init PoseNet
    loadPosenet(ctrl.Tracker);
  };

  this.$onDestroy = function() {
    // Stop Tracker
    ctrl.Tracker.stop();
    // Stop 3D View
    ctrl.viewport.stop();
    // Save keypoints status
    framesHolder.setEnabledKeypoints(ctrl.enabledKeypoints);
  };

}
