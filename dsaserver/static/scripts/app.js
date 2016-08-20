/**
 * Created by Nicholas on 5/31/2016.
 */
function getDisplaySize(size) {
    if (size / 1000 >= 1) {
        size = size / 1000;
        if (size / 1000 >= 1) {
            size = size / 1000;
            if (size / 1000 >= 1) {
                size = size / 1000;
                return size.toFixed(2) + " GB";
            }
            else
                return size.toFixed(2) + " MB";
        }
        else
            return size.toFixed(2) + " KB";
    }
    else
        return size + " B";
}

angular.module('app', ['ngMaterial', 'ngContextMenu', 'ngCookies'])
.config(function ($mdThemingProvider) {
    $mdThemingProvider.theme('default')
        .primaryPalette('purple')
        .accentPalette('pink')
        .dark();
    $mdThemingProvider.theme('dark')
        .dark();
})
.service('$listener', function () {
    var _callbacks = {};
    var _values = {};

    var $listener = {
        register: function(event, callback) {
            if (_callbacks[event] === undefined)
                _callbacks[event] = [];
            _callbacks[event].push(callback);
            // return the current value of the event
            return _values[event];
        },
        notify: function (event, param) {
            if (_callbacks[event] !== undefined) {
                _callbacks[event].forEach(function (func) {
                    func(param);
                });
            }
            _values[event] = param;
        }
    };

    return $listener;
})
.directive('fileInput', function ($parse) {
    return {
        restrict: "EA",
        template: "<input type='file' />",
        replace: true,
        link: function (scope, element, attrs) {

            var modelGet = $parse(attrs.fileInput);
            var modelSet = modelGet.assign;
            var onChange = $parse(attrs.onChange);

            var updateModel = function () {
                scope.$apply(function () {
                    modelSet(scope, element[0].files[0]);
                    onChange(scope);

                    element[0].value = '';
                });
            };

            element.bind('change', updateModel);
        }
    };
})
.directive('dragIt', function ($parse) {
    return {
        restrict: "EA",
        link: function (scope, element, attrs) {
            var dragIt = $parse(attrs.dragIt);

            element.attr("draggable", true);
            element.on("drag", function ($event) {
                $event.dataTransfer.setData("text", 1);
                dragIt(scope);
            });
        }
    };
})
.directive('dropIt', function ($parse) {
    return {
        restrict: "EA",
        link: function (scope, element, attrs) {
            var dropIt = $parse(attrs.dropIt);

            element.on("dragover", function ($event) {
                $event.preventDefault();
            });
            element.on("drop", function () {
                dropIt(scope);
            });
        }
    };
});
