var App = angular.module('App', ['ui.router']);

App.config(function($stateProvider) {
  var captureState = {
    name: 'capture',
    url: '/capture',
    component: 'capture'
  }

  var editorState = {
    name: 'editor',
    url: '/editor',
    component: 'editor'
  }

  var poserState = {
    name: 'poser',
    url: '/poser',
    component: 'poser'
  }

  $stateProvider.state(captureState);
  $stateProvider.state(editorState);
  $stateProvider.state(poserState);
});

App.run(function($rootScope) {
  $rootScope.onKeyDown = function(e) {
    if (e.keyCode === 116 && e.ctrlKey) return; // Enable Ctrl + F5
    e.preventDefault();
    console.log(e.keyCode, e.shiftKey, e.ctrlKey, e);
    $rootScope.$broadcast("KeyDown", e);
  };
});
