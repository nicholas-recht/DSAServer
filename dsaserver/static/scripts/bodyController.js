/**
 * Created by Nicholas on 6/12/2016.
 */
angular.module("app").controller("bodyController", ["$scope", "$http", "$listener",
    function ($scope, $http, $listener) {
        
        function searchBar(searchVal) {
            if (searchVal) {
                $scope.bodyView = '../static/views/search.html';

                $listener.notify("search", searchVal);
            }
            else {
                $scope.bodyView = '../static/views/explorer.html'
            }
        }
        
        // init
        $scope.searchBar = searchBar;
        $scope.bodyView = '../static/views/explorer.html';
        
    }]);
    