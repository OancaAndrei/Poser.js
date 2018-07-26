App.directive('openFile', function($timeout, $compile, $parse) {
  return {
    restrict: 'A',
    scope: {
      openFile:'&openFile',
      validTypes: "@"
    },
    link: function($scope, $element, $attrs) {
      var callbackFunction = $scope.openFile();
      // Create hidden input
      var inputElement = angular.element('<input ng-show="false" ng-click="$event.stopPropagation();" data-string="{{validTypes}}" accept="{{validTypes}}" type="file"/>');
      $compile(inputElement)($scope);
      $element.append(inputElement);
      // Create callbacks
      var onClick = function(event) {
        $timeout(function() {
          inputElement.click();
        }, 0);
        return false;
      };
      var processFileOpened = function(event) {
        if (event != null) {
          event.stopPropagation();
          event.preventDefault();
        }
        var file;
        // Handle only new files
        if (event.type === 'change') {
          file = this.files[0];
        }
        // Do nothing if no file has been selected
        if (file === undefined) {
          return;
        }
        // Callback
        callbackFunction(file);
        // Resetting value field
        $element.find('input').attr('value', '');
        return false;
      };
      // Set binds
      $element.bind('click', onClick);
      inputElement.bind('change', processFileOpened);
      // Unset binds on destroy
      $scope.$on('$destroy', function() {
        $element.unbind('click');
        inputElement.unbind('change');
      });
    }
  };
});
