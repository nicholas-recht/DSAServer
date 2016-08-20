/**
 * Created by Nicholas on 6/18/2016.
 */
angular.module("app").controller("fileController", ["$scope", "$http", "$listener", "$mdToast",
    function ($scope, $http, $listener, $mdToast) {

        function displayToastMessage(msg) {
            $mdToast.show(
              $mdToast.simple()
                .textContent(msg)
                .position('top left')
                .hideDelay(3000)
            );
        }

        function downloadFile(file) {
            var a = document.createElement("a");
            a.target = "_blank";
            a.href = "/file/downloadFile?id=" + file.id;

            var evObj = document.createEvent('Events');
            evObj.initEvent("click", true, false);
            a.dispatchEvent(evObj);
        }

        function deleteFile(file) {
            $http.post("/file/deleteFile", { id: file.id }).then(
                function(response) {
                    // let anyone know who's listening that the file has been deleted
                    $listener.notify("deleteFile", file);
                },
                function(response) {
                    displayToastMessage("Unable to delete the selected file: " + response.data.errors);
                });
        }

        function renameFile(file) {
            file.edit = true;
            file.newName = file.name;
        }

        function updateFileName(file, success, failure) {
            $http.post("/file/renameFile", { id: file.id, name: file.name }).then(
                function(response) {
                    if (success)
                        success();
                },
                function(response) {
                    if (failure)
                        failure("Unable to rename the file: " + response.data.errors);
                });
        }

        function beginFileEdit (file) {
            file.editing = true;
        }

        function endFileEdit (file) {
            if (file.editing) {
                if (file.newName) {
                    file.name = file.newName;
                    updateFileName(file, function () {
                        file.edit = false;
                        file.editing = false;
                    }, displayToastMessage);
                } else {
                    file.edit = false;
                    file.editing = false;
                }
            }
        }

        // $scope methods
        $scope.fileContextMenu = {
            downloadFile: downloadFile,
            deleteFile: deleteFile,
            renameFile: renameFile
        };
        $scope.beginFileEdit = beginFileEdit;
        $scope.endFileEdit = endFileEdit;
        $scope.getDisplaySize = getDisplaySize;
    }]);
    