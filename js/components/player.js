App.component('player', {
  templateUrl: 'views/player.html',
  controller: ['$scope', 'framesHolder', PlayerController]
});

function PlayerController($scope, framesHolder) {
  var ctrl = this;
  this.keypointNames = framesHolder.getKeypointNames();
  this.currentFrame = 0;
  this.enabledKeypoints = framesHolder.getEnabledKeypoints();

  this.getFramesLenght = function() {
    return framesHolder.getFramesLenght();
  }

  this.updateView = function() {
    var length = framesHolder.getFramesLenght();
    if (ctrl.currentFrame >= length) ctrl.currentFrame = length - 1;
    if (ctrl.currentFrame < 0) ctrl.currentFrame = 0;

    if (length <= 0) return;
    var pose = framesHolder.getFrames()[ctrl.currentFrame];
    // Update viewport
    if (ctrl.viewport) {
      ctrl.viewport.setEnabledKeypoints(ctrl.enabledKeypoints);
      ctrl.viewport.setPose(pose);
    }
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
    ctrl.viewport.setEnabledKeypoints(ctrl.enabledKeypoints);
    ctrl.viewport.update();
    // Set initial frame
    ctrl.updateView();
  };

  this.$onDestroy = function() {
    // Stop viewport
    ctrl.viewport.stop();
    // Save keypoints status
    framesHolder.setEnabledKeypoints(ctrl.enabledKeypoints);
  };

}
