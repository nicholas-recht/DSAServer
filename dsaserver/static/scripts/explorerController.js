/**
 * Created by Nicholas on 5/31/2016.
 */
angular.module("app").controller("explorerController", ["$scope", "$http", "$mdToast", "$listener", "$cookies",
    function ($scope, $http, $mdToast, $listener, $cookies) {

         //
         // Display
         //
        function displayToastMessage(msg) {
            $mdToast.show(
              $mdToast.simple()
                .textContent(msg)
                .position('top left')
                .hideDelay(3000)
            );
        }

        function getTotalSize() {
           $http.get("/data/getTotalSpace").then(
                function(response) {
                    $scope.totalSize = response.data.space;
                },
                function(response) {
                    displayToastMessage("Unable to retrieve total storage space: " + response.data.errors);
                });
       }

       function getAvailableSize() {
           $http.get("/data/getSpaceAvailable").then(
                function(response) {
                    $scope.availableSize = response.data.space;
                },
                function(response) {
                    displayToastMessage("Unable to retrieve available storage space: " + response.data.errors);
                });
       }

        var orderOptions = [
            { display: "Name", value: "name" },
            { display: "Size", value: "size" },
            { display: "Upload Date", value: "upload_date" }];

        //
        // Files
        //
        function getFiles() {
            $http.get("/file/getFileList").then(
                function(response) {
                    $scope.files = response.data;
                },
                function(response) {
                    displayToastMessage("Unable to retrieve files from the server: " + response.data.errors);
                });
        }

        function uploadFile(file) {
            if (file) {
                $scope.loading = true;

                var formData = new FormData();
                formData.append("file", file);
                formData.append("folder_id", $scope.selectedFolder.id);

                $http.post("/file/uploadFile", formData).then(
                    function (response) {
                        $scope.files.push(response.data);

                        getAvailableSize();
                    },
                    function (response) {
                        displayToastMessage("Unable to upload the selected file: " + response.data.errors);
                    }).finally(function () {
                    $scope.loading = false;
                });
            }
        }

        function deleteFile(file) {
            var index = $scope.files.indexOf(file);
            if (index !== -1)
                $scope.files.splice(index, 1);

            getAvailableSize();
        }

        function moveFile(file, folder) {
            $http.post("/file/moveFile", { id: file.id, folder_id: folder.id }).then(
                function(response) {
                    var index = $scope.files.indexOf(file);
                    if (index !== -1)
                        $scope.files.splice(index, 1);
                },
                function(response) {
                    displayToastMessage("Unable to move the selected file: " + response.data.errors);
                });
        }

        // listen for when there is a file deleted
        $listener.register("deleteFile", function (file) {
           deleteFile(file);
        });

        //
        // Folders
        //
        function addToFolderMap(folder) {
            $scope.folderMap[folder.id] = folder;

            for (var prop in folder.children)
                if (folder.children.hasOwnProperty(prop))
                    addToFolderMap(folder.children[prop]);
        }

        function getRoot() {
            $http.get("/folder/getFolderHierarchy").then(
                function(response) {
                    var root = response.data;
                    // build the map
                    addToFolderMap(root);

                    selectFolder(root)
                },
                function(response) {
                    displayToastMessage("Unable to retrieve the folder hierarchy: " + response.data.errors);
                });
        }

        function selectFolder(folder) {
            $scope.files = [];
            $scope.directoryList = [];

            // build the directoryList tree
            var tmp = folder;
            $scope.directoryList.unshift(tmp);
            while (tmp.id != 1) {
                tmp = $scope.folderMap[tmp.parent_id];
                $scope.directoryList.unshift(tmp);
            }

            $scope.selectedFolder = folder;

            $scope.folders = [];
            for (var prop in folder.children)
                if (folder.children.hasOwnProperty(prop))
                    $scope.folders.push(folder.children[prop]);

            $scope.loading = true;

            var url = "";
            if (!$scope.lost)
                url = "/folder/getFilesInFolder";
            else
                url = "/folder/getLostFilesInFolder";

            $http.get(url + "?id=" + folder.id).then(
                function(response) {
                    $scope.files = response.data
                },
                function(response) {
                    displayToastMessage("Unable to retrieve files from the server: " + response.data.errors);
                }).finally(function () {
                    $scope.loading = false;
                });
        }

        function newFolder() {
            var folder = { name: "New Folder " + $scope.folders.length, parent_id: $scope.selectedFolder.id, id: -1 };

            $http.post("/folder/newFolder", { name: folder.name, parent_id: folder.parent_id }).then(
                function(response) {
                    folder.id = response.data.id;

                    $scope.folderMap[folder.id] = folder;
                    $scope.folderMap[folder.parent_id].children[folder.name] = folder;
                    $scope.folders.push(folder);
                },
                function(response) {
                    displayToastMessage("Unable to create the new folder: " + response.data.errors);
                });

        }

        function deleteFolder(folder) {
            var index = $scope.folders.indexOf(folder);
            if (index !== -1)
                $scope.folders.splice(index, 1);

            // delete from it's parent
            delete $scope.folderMap[folder.parent_id].children[folder.name];

            getAvailableSize();
        }

        function moveFolder(folder, parent) {
            $http.post("/folder/moveFolder", { id: folder.id, parent_id: parent.id }).then(
                function(response) {
                    // remove folder from the list of folders
                    var index = $scope.folders.indexOf(folder);
                    if (index !== -1)
                        $scope.folders.splice(index, 1);
                    // remove it from it's parents children
                    var oldParent = $scope.folderMap[folder.parent_id];
                    oldParent.children[folder.name] = null;
                    // add it to it's new parent's children
                    parent.children[folder.name] = folder;
                    // update the parent_id
                    folder.parent_id = parent.id;
                },
                function(response) {
                    displayToastMessage("Unable to delete the selected folder: " + response.data.errors);
                });
        }

        // listen for when there is a file deleted
        $listener.register("deleteFolder", function (folder) {
           deleteFolder(folder);
        });

        //
        // drag and drop
        //
        function beginDrag(obj) {
            $scope.drag = obj;
        }
        function dropFolder(drag, drop) {
            // check if the dragged object is a folder or file
            if ($scope.files.indexOf(drag) !== -1) {
                moveFile(drag, drop)
            }
            else if ($scope.folders.indexOf(drag) !== -1) {
                moveFolder(drag, drop)
            }
        }

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

        // lost files or not lost files?
        $scope.$watch("lost", function (newVal, oldVal) {
            if (newVal !== oldVal)
                selectFolder($scope.selectedFolder);
        });

        $scope.files = [];
        $scope.directoryList = [];
        $scope.folderMap = [];
        $scope.folders = [];
        $scope.orderOptions = orderOptions;
        $scope.orderBy = $scope.orderOptions[0].value;
        $scope.reverse = false;
        $scope.uploadFile = uploadFile;
        $scope.getDisplaySize = getDisplaySize;
        $scope.loading = false;
        $scope.totalSize = 0;
        $scope.availableSize = 0;
        $scope.selectedFolder = null;
        $scope.selectFolder = selectFolder;
        $scope.addFolder = newFolder;
        $scope.beginDrag = beginDrag;
        $scope.dropFolder = dropFolder;
        $scope.drag = null;
        $scope.lost = false;
        getAvailableSize();
        getTotalSize();
        getRoot();
        initCookies();
}]);