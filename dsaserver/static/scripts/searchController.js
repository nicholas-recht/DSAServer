/**
 * Created by Nicholas on 6/19/2016.
 */
angular.module("app").controller("searchController", ["$scope", "$http", "$listener", "$mdToast", "$cookies",
    function ($scope, $http, $listener, $mdToast, $cookies) {

        function displayToastMessage(msg) {
            $mdToast.show(
                $mdToast.simple()
                    .textContent(msg)
                    .position('top left')
                    .hideDelay(3000)
            );
        }

        var orderOptions = [
            { display: "Name", value: "name" },
            { display: "Size", value: "size" },
            { display: "Upload Date", value: "upload_date" }
        ];

        // search for files on the server
        function searchFiles(value, inContents) {
            $scope.loading = true;
            $http.get("/file/searchFiles?query=" + value + "&in_contents=" + inContents).then(
                function(response) {
                    $scope.files = response.data
                },
                function(response) {
                    displayToastMessage("Unable to retrieve files from the server: " + response.data.errors);
                }).finally(function () {
                    $scope.loading = false;
                });
        }

        // listen for changes to the inContents flag
        $scope.$watch("inContents", function (newVal, oldVal) {
            if (newVal !== oldVal)
                searchFiles($scope.query, $scope.inContents);
        });
        // listen for changes to the search criteria
        $scope.query = $listener.register("search", function (query) {
            $scope.query = query;
            searchFiles($scope.query, $scope.inContents);
        });
        if ($scope.query)
            searchFiles($scope.query, false);

        // cookie values
        function initCookies() {
            var orderBy = $cookies.get("orderBy");
            var reverse = $cookies.get("reverse");

            if (orderBy)
                $scope.orderBy = orderBy;
            if (reverse === "true")
                $scope.reverse = true;
        }
        $scope.$watch("orderBy", function (newVal, oldVal) {
            $cookies.put("orderBy", $scope.orderBy);
        });
        $scope.$watch("reverse", function (newVal, oldVal) {
            $cookies.put("reverse", $scope.reverse);
        });

        // init scope values
        $scope.inContents = false;
        $scope.orderOptions = orderOptions;
        initCookies();
    }]);