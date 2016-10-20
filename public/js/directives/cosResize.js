(function () {
    'use strict';

    angular
        .module('citizenos')
        .directive('cosResize', ['$window', '$rootScope', function ($window, $rootScope) {
            return function (scope, element) {

                var w = angular.element($window);
                scope.getWindowDimensions = function () {
                    return {
                        'w': window.innerWidth
                    };
                };

                scope.$watch(scope.getWindowDimensions, function (newValue, oldValue) {
                    $rootScope.wWidth = newValue.w;
                    if ($rootScope.wWidth > 1024) {
                        scope.app.showNav = false; // TODO: Bad separation of concerns that does not make this directive reusable but will do for now.
                    }
                }, true);

                w.bind('resize', function () {
                    scope.$apply();
                });
            }
        }]);
})();
