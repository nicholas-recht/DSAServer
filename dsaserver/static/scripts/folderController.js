/**
 * Created by Nicholas on 6/18/2016.
 */
angular.module("app").controller("folderController", ["$scope", "$http", "$listener", "$mdToast",
    function ($scope, $http, $listener, $mdToast) {
        function displayToastMessage(msg) {
            $mdToast.show(
              $mdToast.simple()
                .textContent(msg)
                .position('top left')
                .hideDelay(3000)
            );
        }

        function deleteFolder(folder) {
            $http.post("/folder/deleteFolder", { id: folder.id }).then(
                function(response) {
                    // let anyone listening know that this has been deleted
                    $listener.notify("deleteFolder", folder);
                },
                function(response) {
                    displayToastMessage("Unable to delete the selected folder: " + response.data.errors);
                });
        }

        function renameFolder(folder) {
            folder.edit = true;
            folder.newName = folder.name;
        }

        function updateFolderName(folder, success, failure) {
            $http.post("/folder/renameFolder", { id: folder.id, name: folder.name }).then(
                function(response) {
                    if (success)
                        success();
                },
                function(response) {
                    if (failure)
                        failure("Unable to rename the folder: " + response.data.errors);
                });
        }

        function beginFolderEdit (folder) {
            folder.editing = true;
        }

        function endFolderEdit (folder) {
            if (folder.editing) {
                if (folder.newName) {
                    folder.name = folder.newName;
                    updateFolderName(folder, function () {
                        folder.edit = false;
                        folder.editing = false;
                    }, displayToastMessage);
                } else {
                    folder.edit = false;
                    folder.editing = false;
                }
            }
        }

        // scope methods
        $scope.folderContextMenu = {
            deleteFolder: deleteFolder,
            renameFolder: renameFolder
        };
        $scope.beginFolderEdit = beginFolderEdit;
        $scope.endFolderEdit = endFolderEdit;

    }]);