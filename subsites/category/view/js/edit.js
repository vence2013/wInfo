angular
.module('appApp', [])
.controller('appCtrl', appCtrl)

function appCtrl($scope) 
{
    /* Angular Tree Control */
    $scope.treeView = [];
    $scope.listExpand = [];
    $scope.treeOptions = {dirSelectable: true};
    $scope.treeRoot = [];
    $scope.listRoot = [];
    $scope.listView = [];
    $scope.predicate = "";
    $scope.comparator = false;
}