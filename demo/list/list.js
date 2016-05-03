(function () {
    'use strict';
    app.controller(
        'ListController', [
            '$scope', '$TreeDnDConvert', 'DataDemo', function ($scope, $TreeDnDConvert, DataDemo) {
                var tree;
                $scope.tree_data = {};
                $scope.my_tree = tree = {};

    $scope.callbacks = {
      accept: function(info, move, isChanged) {
        if (move.parent) {
          if (!move.parent.groupId) {
            return false;
          } else {
            var parent = move.parent;

            // Make sure none of the ancestors are selected
            // This would cause a cyclic structure
            while (parent) {
              if (parent.__selected__) {
                return false;
              } else {
                parent = $scope.my_tree.get_parent(parent);
              }
            }
          }
        }
        $scope.moveEvent = move;
        return true;
      }
    };
    
    $scope.getIcon = function(node) {
      var prefix = "fa fa-fw ";
      if (node.groupId) {
        return prefix + "fa-folder";
      } else {
        return prefix + "fa-file-o";
      }
    }
    $scope.data = [  
           {  
              "nodeId":"erb80J14sLvjN/Q7",
              "elementId":"f2432f97c402d3da47058338"
           },
           {  
              "nodeId":"8fNd2N8vcVaWojUQ",
              "elementId":"16a4f5d8ef6fa20233d3b607"
           },
           {  
              "nodeId":"oPAErxbt3uv77nKn",
              "elementId":"80653a86808baea0835358b4"
           },
           {  
              "nodeId":"FXcWeKS00yDQAZcu",
              "elementId":"edcfbd6b3d12a4e3911bf9d1"
           },
           {  
              "nodeId":"4KqYnQzz7m1rH5kb",
              "elementId":"759ba6ac6787fdca890d2c8b"
           },
           {  
              "nodeId":"fYtQ8etz6nojcfHu",
              "groupId":"fYtQ8etz6nojcfHu",
              "groupName":"components",
              "groups":[  
                 {  
                    "nodeId":"TNUcD2ujMkDlZ9jJ",
                    "elementId":"94e41d3619ff0699c73975ed"
                 },
                 {  
                    "nodeId":"TvnTiQbixnQCvApi",
                    "elementId":"7bba32a813b382eef224e623"
                 }
              ]
           }
        ];
    $scope.tree_data = $TreeDnDConvert.tree2tree($scope.data, 'groups');
  }]);
})();
