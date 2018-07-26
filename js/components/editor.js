App.component('editor', {
  templateUrl: 'views/editor.html',
  controller: ['$scope', 'framesHolder', EditorController]
});

function EditorController($scope, framesHolder) {
  var ctrl = this;
  this.showHelp = false;
  this.keypointNames = framesHolder.getKeypointNames();
  this.currentFrame = 0;
  this.enabledKeypoints = framesHolder.getEnabledKeypoints();
  this.gestureFrames = framesHolder.getGestureFrames();

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
      if (ctrl.isFrameInGesture(ctrl.currentFrame)) {
        ctrl.viewport.setKeypointsColor('green');
      } else {
        ctrl.viewport.setKeypointsColor('black');
      }
    }
  }

  this.saveFrame = function() {
    if (framesHolder.getFramesLenght() === 0) return;
    // Get modified pose
    ctrl.viewport.setActiveLayer(0);
    var pose = ctrl.viewport.getPose();
    // Overwrite pose
    framesHolder.setFrame(pose, ctrl.currentFrame);
  }

  this.duplicateFrame = function() {
    if (framesHolder.getFramesLenght() === 0) {
      framesHolder.addFrame(new Pose());
    } else {
      var frame = framesHolder.getFrame(ctrl.currentFrame);
      framesHolder.addFrame(new Pose().copy(frame), ctrl.currentFrame);
    }
  }

  this.deleteFrame = function() {
    if (framesHolder.getFramesLenght() === 0) return;
    ctrl.removeCurrentFrameFromGesture()
    framesHolder.deleteFrame(ctrl.currentFrame);

    // Update gesture frames
    for (var i = 0; i < ctrl.gestureFrames.length; i++) {
      if (ctrl.gestureFrames[i] > ctrl.currentFrame) {
        ctrl.gestureFrames[i]--;
      }
    }

    var length = framesHolder.getFramesLenght();
    if (ctrl.currentFrame >= length) ctrl.currentFrame = length - 1;
    if (ctrl.currentFrame < 0) ctrl.currentFrame = 0;
  }

  this.addCurrentFrameToGesture = function() {
    if (framesHolder.getFramesLenght() === 0) return;
    if (!ctrl.isFrameInGesture(ctrl.currentFrame)) {
      // Empty list
      if (ctrl.gestureFrames.length === 0) {
        ctrl.gestureFrames.push(ctrl.currentFrame);
        return;
      }
      // Append
      if (ctrl.gestureFrames[ctrl.gestureFrames.length - 1] < ctrl.currentFrame) {
        ctrl.gestureFrames.push(ctrl.currentFrame);
        return;
      }
      // Ordered insert
      for (var i = 0; i < ctrl.gestureFrames.length; i++) {
        if (ctrl.gestureFrames[i] > ctrl.currentFrame) {
          ctrl.gestureFrames.splice(i, 0, ctrl.currentFrame);
          break;
        }
      }
    }
  }

  this.removeCurrentFrameFromGesture = function() {
    if (ctrl.isFrameInGesture(ctrl.currentFrame)) {
      var pos = ctrl.gestureFrames.indexOf(ctrl.currentFrame);
      ctrl.gestureFrames.splice(pos, 1);
    }
  }

  this.isFrameInGesture = function(position) {
    return ctrl.gestureFrames.indexOf(position) >= 0;
  }

  this.getNextFrameInGesture = function(position, inversed) {
    if (ctrl.gestureFrames.length === 0) return position;
    var frame = position;
    if (inversed) {
      // Get previous frame
      for (var i = 0; i < ctrl.gestureFrames.length; i++) {
        if (ctrl.gestureFrames[i] < position) {
          frame = ctrl.gestureFrames[i];
        } else break;
      }
    } else {
      // Get next frame
      for (var i = ctrl.gestureFrames.length - 1; i >= 0; i--) {
        if (ctrl.gestureFrames[i] > position) {
          frame = ctrl.gestureFrames[i];
        } else break;
      }
    }
    return frame;
  }

  this.saveFrames = function() {
    var frames = framesHolder.getFrames();
    var data = {};
    // Save currentFrame
    data.currentFrame = ctrl.currentFrame;
    // Get enabled keypoints
    data.enabledKeypoints = ctrl.enabledKeypoints;
    // Get frames
    data.frames = [];
    for (var i = 0; i < frames.length; i++) {
      data.frames.push(frames[i].export());
    }
    // Get gesture frames
    data.gestureFrames = ctrl.gestureFrames;
    // To json
    var json = JSON.stringify(data);
    // Encode
    var filename = "MotionCapture - " + new Date() + ".json";
    var dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(json);
    // Download
    var link = document.getElementById('export');
    link.href = dataUri;
    link.download = filename;
    link.click();
  }

  this.loadFrames = function(data) {
    if (data.enabledKeypoints !== undefined) {
      framesHolder.setEnabledKeypoints(data.enabledKeypoints);
      ctrl.enabledKeypoints = framesHolder.getEnabledKeypoints();
    }
    if (data.frames !== undefined) {
      framesHolder.dropFrames();
      for (var i = 0; i < data.frames.length; i++) {
        var pose = new Pose();
        pose.import(data.frames[i]);
        framesHolder.addFrame(pose);
      }
    }
    if (data.gestureFrames) {
      framesHolder.saveGestureFrames(data.gestureFrames);
      ctrl.gestureFrames = framesHolder.getGestureFrames();
    }
    if (data.currentFrame) {
      ctrl.currentFrame = data.currentFrame;
    }
    ctrl.updateView();
    $scope.$apply();
  }

  this.loadFile = function(file) {
    if(!window.FileReader) return;
    var reader = new FileReader();
    reader.onload = function(event) {
      if(event.target.readyState != 2) return;
      if(event.target.error) {
        console.log("Error reading file:", event.target.error);
        return;
      }
      var data = event.target.result;
      data = JSON.parse(data);
      ctrl.loadFrames(data);
    };
    reader.readAsText(file);
  }

  $scope.$on("KeyDown", function(event, data) {
    if (data.keyCode === 37) { // Left arrow
      if (data.shiftKey) {
        // Search previous frame in gesture
        ctrl.currentFrame = ctrl.getNextFrameInGesture(ctrl.currentFrame, true);
      } else {
        // Left key
        ctrl.currentFrame--;
      }
      ctrl.updateView();
    } else if (data.keyCode === 39) { // Right arrow
      if (data.shiftKey) {
        // Search next frame in gesture
        ctrl.currentFrame = ctrl.getNextFrameInGesture(ctrl.currentFrame);
      } else {
        // Right key
        ctrl.currentFrame++;
      }
      ctrl.updateView();
    } else if (data.keyCode === 83 && data.ctrlKey) { // Ctrl + S
      ctrl.saveFrame();
    } else if (data.keyCode === 77) { // M, Shitf + M
      if (data.shiftKey) {
        // Remove frame from gesture
        ctrl.removeCurrentFrameFromGesture();
      } else {
        // Add frame to gesture
        ctrl.addCurrentFrameToGesture();
      }
      // Update view
      ctrl.updateView();
    } else if (data.keyCode === 68) { // D, Shitf + D
      if (data.shiftKey) {
        // Delete frame
        ctrl.deleteFrame();
      } else {
        // Duplicate frame
        ctrl.duplicateFrame();
      }
      // Update view
      ctrl.updateView();
    } else if (data.keyCode === 72) {
      ctrl.showHelp = !ctrl.showHelp;
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
    // Save gesture frames
    framesHolder.saveGestureFrames(ctrl.gestureFrames);
  };

}
