angular.module('ntt.TreeDnD')
    .factory(
    '$TreeDnDControl', function () {
        var _target, 
            _parent, 
            _children,
            i, 
            len;

        function fnSetCollapse(node) {
            node.__expanded__ = false;
        }

        function fnSetExpand(node) {
            node.__expanded__ = true;
        }

        function fnSetDeselect(node) {
            node.__selected__ = false;
        }

        function _$init(scope) {
              var n, tree = {
                anchor_node:                     null,
                selected_nodes:                    [],
                for_all_descendants:               scope.for_all_descendants,
                select_anchor_node:                       function (node) {
                  if (!node) {
                    return null;
                  }
                  if (node) {
                    tree.deselect_all();
                    tree.select_node(node);
                    tree.anchor_node = node;
                    tree.expand_all_parents(node);
                  }
                  return node;
                },
                select_node: function(node) {
                  if (!node || tree.is_selected(node)) {
                    return null;
                  }
                  node.__selected__ = true;
                  tree.selected_nodes.push(node);
                  return node;
                },
                is_selected: function (node) {
                  return node.__selected__ === true;
                },
                add_select_node:                       function (node) {
                  if (!node) {
                    return null;
                  }
                  // don't select node if already selected
                  if (tree.is_selected(node)) {
                    tree.deselect_node(node);
                    return null;
                  }
                  // select node before continuing
                  // and deselect any descendants
                  tree.select_node(node);
                  tree.deselect_descendants(node);

                  // clean up the new selection
                  tree.process_selection();
                  return node;
                },
                range_select_node:                       function (node) {
                  if (!node) {
                    return null; 
                  } else if (!tree.anchor_node) {
                    // just select the node if the anchor node isn't set
                    return tree.select_anchor_node(node);
                  }

                  // reset selection
                  angular.forEach(tree.selected_nodes, fnSetDeselect);
                  tree.selected_nodes = [];

                  // put the selected node back in the list
                  tree.select_node(tree.anchor_node);

                  // Add all nodes leading to the selected node
                  while (node && node !== tree.anchor_node) {
                    tree.select_node(node);
                    if (node.__index_real__ < tree.anchor_node.__index_real__) {
                      node = tree.get_next_node(node);
                    } else {
                      node = tree.get_prev_node(node);
                    }
                  }

                  // clean up the new selection
                  tree.process_selection();
                  return tree.selected_nodes;
                },
                deselect_node:                     function (node, preserve_anchor) {
                  _target = null;
                  if (node === tree.anchor_node && !preserve_anchor) {
                    _target = tree.anchor_node;
                    tree.anchor_node = null;
                  }
                  var selected = tree.is_selected(node),
                      selectedIndex = tree.selected_nodes.indexOf(node);
                  if (selected) {
                    fnSetDeselect(node);
                    tree.selected_nodes.splice(selectedIndex, 1);
                    _target = node
                  }
                  return _target;
                },
                deselect_descendants: function(node) {
                  node = node || tree.anchor_node;
                  if (node) {
                    _children = tree.get_children(node);
                    if (_children.length > 0) {
                      _children.forEach(function(child) {
                        tree.deselect_descendants(child);
                        tree.deselect_node(child, true);
                      });
                    }
                  }
                },
                deselect_all:                     function () {
                  if (tree.anchor_node) {
                    tree.anchor_node = null;
                  }
                  if (tree.selected_nodes) {
                    tree.selected_nodes.forEach(fnSetDeselect);
                    tree.selected_nodes = [];
                  }
                },
                // clean up the currently selected nodes and make sure a parent 
                // node is not selected if it's child is already selected.
                // if all children of a node are selected, then deselect them 
                // and select the node itself.
                process_selection:                function(nodes) {
                  nodes = nodes || tree.selected_nodes;
                  nodes.sort(function(a, b) {
                    return a.__index_real__ - b.__index_real__;
                  });
                  nodes.forEach(cleanSelected);
                  
                  function cleanSelected(node) {
                    var children = tree.get_children(node),
                        selected_child_ct = 0,
                        selected_descendant_ct  = 0;
                        
                    // Do I even have kids?
                    if (children.length) {
                      
                      // Guess so! let's see if any of them are selected
                      for (var i = 0; i < children.length; i++) {
                        // First of all, do I have any selected grandkids? 
                        // I've gotta make some calls!
                        selected_descendant_ct += cleanSelected(children[i]);
                        
                        // Let's keep count of my selected kids
                        if (tree.is_selected(children[i])) {
                          ++selected_child_ct;
                        }
                      }
                      
                      // If all of my kids are selected, 
                      // I might as well select myself instead
                      if (selected_child_ct === children.length) {
                        tree.select_node(node);
                        tree.deselect_descendants(node);
                        
                      // If only some of my kids or grandkids are selected, 
                      // I shouldn't be because I don't want to include them twice
                      } else if (selected_child_ct || selected_descendant_ct) {
                        tree.deselect_node(node, true);
                      }
                    }

                    // Mom called! She asked how many selected children I have.
                    // Good thing I kept count!
                    return selected_descendant_ct + selected_child_ct;
                  }
                },
                get_parent:                        function (node) {
                  if (node && node.__parent_real__ !== null) {
                    return scope.tree_nodes[node.__parent_real__];
                  }
                  return null;
                },
                for_all_ancestors:                 function (child, fn) {
                  _parent = tree.get_parent(child);
                  if (_parent) {
                    if (fn(_parent)) {
                      return false;
                    }

                    return tree.for_all_ancestors(_parent, fn);
                  }
                  return true;
                },
                expand_all_parents:                function (child) {
                  return tree.for_all_ancestors(
                      child, fnSetExpand
                  );
                },
                reload_data:                       function () {
                  return scope.reload_data();
                },
                ungroup_node: function(node) {
                  // get node
                  node = node || tree.anchor_node;

                  // if its a valid group with children
                  if (node && node.__children__.length > 0) {
                    var _parent = tree.get_parent(node),// get parent
                        _index = node.__index__,        // get index
                        _children = node.__children__;  // get children

                    // deselect all nodes
                    tree.deselect_all();

                    // remove the parent node
                    tree.remove_node(node);

                    // add children starting at node index
                    tree.add_nodes(_parent, _children, _index, true);
                    tree.reload_data();
                  }
                },
                group_selected_nodes:              function () {
                  if (tree.selected_nodes.length) {
                    // create new parent
                    var new_parent = {nodeId: 'Group', groupId: 'NewGroup', __children__: []},
                    // get selected nodes
                        _nodes = tree.selected_nodes,
                        _index = _nodes[0].__index__,
                        _parent = tree.get_parent(_nodes[0]);

                    // add selected to new group
                    new_parent.__children__ = _nodes;

                    // remove selected from tree
                    tree.remove_nodes(_nodes, true);

                    // add the new group to tree at the selected index
                    tree.add_node(_parent, new_parent, _index || 0, false);

                    new_parent.__expanded__ = false;
                    tree.select_anchor_node(new_parent);
                    tree.reload_data();
                    return new_parent;
                  } else  {
                    return null;
                  }
                },
                add_node:                          function (parent, new_node, index, add_to_selection) {
                  if (typeof index !== 'number') {
                    if (parent) {
                      parent.__children__.push(new_node);
                      parent.__expanded__ = true;
                    } else {
                      scope.treeData.push(new_node);
                    }
                  } else {
                    if (parent) {
                      parent.__children__.splice(index, 0, new_node);
                      parent.__expanded__ = true;
                    } else {
                      scope.treeData.splice(index, 0, new_node);
                    }
                  }
                  if (add_to_selection) {
                    tree.select_node(new_node);
                  }
                  return new_node;
                },
                add_nodes: function(parent, nodes, start_index, add_to_selection) {
                  nodes.forEach(function(node, i) {
                      tree.add_node(parent, node, start_index + i, add_to_selection);
                  });
                },
                add_node_root:                     function (new_node) {
                  tree.add_node(null, new_node);
                  return new_node;
                },
                expand_all:                        function () {
                  len = scope.treeData.length;
                  for (i = 0; i < len; i++) {
                    tree.for_all_descendants(
                        scope.treeData[i], fnSetExpand
                    );
                  }
                },
                collapse_all:                      function () {
                  len = scope.treeData.length;
                  for (i = 0; i < len; i++) {
                    tree.for_all_descendants(
                        scope.treeData[i], fnSetCollapse
                    );
                  }
                },
                remove_node:                       function (node) {
                  node = node || tree.anchor_node;
                  if (node) {

                    if (node.__parent_real__ !== null) {
                      _parent = tree.get_parent(node).__children__;
                    } else {
                      _parent = scope.treeData;
                    }
                    
                    if (tree.anchor_node === node) {
                      tree.anchor_node = null;
                    }

                    _parent.splice(node.__index__, 1);
                    
                  }
                },
                remove_nodes:                       function (nodes, delayReload) {
                  nodes = nodes || tree.selected_nodes;

                  // remove by last item first to avoid index confusion
                  nodes = nodes.slice().sort(function(a, b) {
                    return b.__index_real__ - a.__index_real__;
                  })
                  if (nodes) {
                    angular.forEach(nodes, tree.remove_node);
                  }
                  if (!delayReload) {
                    tree.reload_data();
                  }
                  return nodes;
                },
                expand_node:                        function (node) {
                  node = node || tree.anchor_node;
                  if (node) {
                    node.__expanded__ = true;
                    return node;
                  }
                },
                collapse_node:                      function (node) {
                  node = node || tree.anchor_node;
                  if (node) {
                    node.__expanded__ = false;
                    return node;
                  }
                },
                get_anchor_node:                    function () {
                  return tree.anchor_node;
                },
                get_selected_nodes:                 function () {
                  return tree.selected_nodes;
                },
                get_first_node:                     function () {
                  len = scope.treeData.length;
                  if (len > 0) {
                    return scope.treeData[0];
                  }
                  return null;
                },
                get_children:                       function (node) {
                  return node.__children__;
                },
                get_siblings:                       function (node) {
                  node = node || tree.anchor_node;
                  if (node) {
                    _parent = tree.get_parent(node);
                    if (_parent) {
                      _target = _parent.__children__;
                    } else {
                      _target = scope.treeData;
                    }
                    return _target;
                  }
                },
                get_next_sibling:                  function (node) {
                  node = node || tree.anchor_node;
                  if (node) {
                    _target = tree.get_siblings(node);
                    n = _target.length;
                    if (node.__index__ < n) {
                      return _target[node.__index__ + 1];
                    }
                  }
                },
                get_prev_sibling:                  function (node) {
                  node = node || tree.anchor_node;
                  _target = tree.get_siblings(node);
                  if (node.__index__ > 0) {
                    return _target[node.__index__ - 1];
                  }
                },
                get_first_child:                   function (node) {
                  node = node || tree.anchor_node;
                  if (node) {
                    _target = node.__children__;
                    if (_target && _target.length > 0) {
                      return node.__children__[0];
                    }
                  }
                  return null;
                },
                get_closest_ancestor_next_sibling: function (node) {
                  node = node || tree.anchor_node;
                  _target = tree.get_next_sibling(node);
                  if (_target) {
                    return _target;
                  }

                  _parent = tree.get_parent(node);
                  if (_parent) {
                    return tree.get_closest_ancestor_next_sibling(_parent);
                  }

                  return null;
                },
                get_next_node:                     function (node) {
                  node = node || tree.anchor_node;

                  if (node) {
                    _target = tree.get_first_child(node);
                    if (_target) {
                      return _target;
                    } else {
                      return tree.get_closest_ancestor_next_sibling(node);
                    }
                  }
                },
                get_prev_node:                     function (node) {
                  node = node || tree.anchor_node;

                  if (node) {
                    _target = tree.get_prev_sibling(node);
                    if (_target) {
                      return tree.get_last_descendant(_target);
                    }

                    _parent = tree.get_parent(node);
                    return _parent;
                  }
                },
                get_last_descendant:               scope.getLastDescendant,
                select_parent_node:                function (node) {
                  node = node || tree.anchor_node;

                  if (node) {
                    _parent = tree.get_parent(node);
                    if (_parent) {
                      return tree.select_node(_parent);
                    }
                  }
                },
                select_first_node:                 function () {
                  return tree.select_node(tree.get_first_node());
                },
                select_next_sibling:               function (node) {
                  node = node || tree.anchor_node;

                  if (node) {
                    _target = tree.get_next_sibling(node);
                    if (_target) {
                      return tree.select_node(_target);
                    }
                  }
                },
                select_prev_sibling:               function (node) {
                  node = node || tree.anchor_node;

                  if (node) {
                    _target = tree.get_prev_sibling(node);
                    if (_target) {
                      return tree.select_node(_target);
                    }
                  }
                },
                select_next_node:                  function (node) {
                  node = node || tree.anchor_node;

                  if (node) {
                    _target = tree.get_next_node(node);
                    if (_target) {
                      return tree.select_node(_target);
                    }
                  }
                },
                select_prev_node:                  function (node) {
                  node = node || tree.anchor_node;

                  if (node) {
                    _target = tree.get_prev_node(node);
                    if (_target) {
                      return tree.select_node(_target);
                    }
                  }
                }
              }
              angular.extend(scope.tree, tree);
              return scope.tree;
            }
        return _$init;
    }
);