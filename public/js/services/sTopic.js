angular
    .module('citizenos')
    .service('sTopic', ['$http', '$q', '$log', function ($http, $q, $log) {
        var Topic = this;

        Topic.STATUSES = {
            inProgress: 'inProgress', // Being worked on
            voting: 'voting', // Is being voted which means the Topic is locked and cannot be edited.
            followUp: 'followUp', // Done editing Topic and executing on the follow up plan.
            closed: 'closed' // Final status - Topic is completed and no editing/reopening/voting can occur.
        };

        Topic.CATEGORIES = {
            business: 'business', // Business and industry
            transport: 'transport', // Public transport and road safety
            taxes: 'taxes', // Taxes and budgeting
            agriculture: 'agriculture', // Agriculture
            environment: 'environment', // Environment, animal protection
            culture: 'culture', // Culture, media and sports
            health: 'health', // Health care and social care
            work: 'work', // Work and employment
            education: 'education', // Education
            politics: 'politics', // Politics and public administration
            communities: 'communities', // Communities and urban development
            defense: 'defense', //  Defense and security
            integration: 'integration', // Integration and human rights
            varia: 'varia' // Varia
        };

        Topic.listUnauth = function (statuses, categories, offset, limit) {
            return function () {
                var path = '/api/topics';

                var deferredAbort = $q.defer();

                var promise = $http.get(path, {
                    params: {
                        statuses: statuses,
                        categories: categories,
                        offset: offset,
                        limit: limit
                    },
                    timeout: deferredAbort.promise
                });

                // Abort the request
                promise.abort = function () {
                    deferredAbort.resolve();
                };

                // Cleanup
                promise.finally(
                    function () {
                        promise.abort = angular.noop;
                        deferredAbort = promise = null;
                    }
                );

                return promise;
            }();
        };
    }]);