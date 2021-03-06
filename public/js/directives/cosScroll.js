'use strict'

angular
    .module('citizenos')
    .directive('cosScroll', ['$timeout',
        function($timeout) {
            return {
                scope: {
                    onScroll: '='
                },
                link: function (scope, elem, attrs) {
                    var definedAction = function () {
                        if (scope.onScroll) {
                            return scope.onScroll();
                        }
                    }
                    var scrollFunc = _.debounce(definedAction, 100);
                    elem.on('scroll', function (e) {
                        if ((elem[0].scrollTop + elem[0].offsetHeight) >= elem[0].scrollHeight) {
                            scrollFunc();
                        }
                    });
                }
            }
        }
    ]);