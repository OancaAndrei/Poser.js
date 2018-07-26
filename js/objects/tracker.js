function Tracker(updateCallback) {
  this.updateCallback = updateCallback;
  this.algorithm = 'single-pose';
  this.imageScaleFactor = 0.5;
  this.outputStride = 16;
  this.maxPoseDetections = 5;
  this.minPartConfidence = 0.1;
  this.nmsRadius = 30;
  this.flipHorizontal = false;
  this.pose = new Pose(600, 500);
};

Tracker.prototype.detectPoseInRealTime = function() {
  var tracker = this;
  async function poseDetectionFrame() {
    var poses = [];
    switch (tracker.algorithm) {
      case 'single-pose':
      const pose = await tracker.net.estimateSinglePose(tracker.video, tracker.imageScaleFactor, tracker.flipHorizontal, tracker.outputStride);
      poses.push(pose);
      break;
      case 'multi-pose':
      poses = await tracker.net.estimateMultiplePoses(tracker.video, tracker.imageScaleFactor, tracker.flipHorizontal, tracker.outputStride, tracker.maxPoseDetections, tracker.minPartConfidence, tracker.nmsRadius);
      break;
    }

    // Update pose
    tracker.pose.setFromPose(poses[0], 600.0, 500.0);
    // Update callback
    tracker.updateCallback(tracker.pose);

    if (tracker.mediaStream !== undefined) {
      requestAnimationFrame(poseDetectionFrame);
    }
  }

  poseDetectionFrame();
}

Tracker.prototype.start = function(net) {
  this.net = net;
  var tracker = this;
  navigator.mediaDevices.getUserMedia({ audio: false, video: {width: 600, height: 500} })
  .then(function(mediaStream) {
    tracker.mediaStream = mediaStream;
    tracker.video = document.getElementById("video");
    tracker.video.srcObject = mediaStream;
    tracker.video.onloadedmetadata = function(e) {
      tracker.video.play();

      tracker.initialized = true;

      tracker.detectPoseInRealTime();
    };
  })
  .catch(function(err) {
    console.log(err.name + ": " + err.message);
    tracker.initialized = false;
    tracker.mediaStream = undefined;
  });
}

Tracker.prototype.stop = function() {
  if (this.mediaStream !== undefined) {
    this.mediaStream.getTracks()[0].stop();
    this.mediaStream = undefined;
    this.initialized = false;
  }
}

async function loadPosenet(tracker) {
  const net = await posenet.load(0.5);
  tracker.start(net);
}
