angular.module('ntt.TreeDnD')
    .directive(
    'treeDndNode', ['$TreeDnDViewport', '$timeout', function ($TreeDnDViewport, $timeout) {
        return {
            restrict: 'A',
            replace:  true,
            link:     fnLink
        };
        function fnLink(scope, element, attrs) {
            element.data('$scope', scope);

            scope.$node_class = '';

            if (scope.$class.node) {
                element.addClass(scope.$class.node);
                scope.$node_class = scope.$class.node;
            }
            var enabledDnD = typeof scope.dragEnabled === 'boolean' || typeof scope.dropEnabled === 'boolean',
                keyNode    = attrs.treeDndNode,
                first      = true,
                childsElem;
			//removeIf(nodebug) 
            console.log('Created Node');
			//endRemoveIf(nodebug)
            $TreeDnDViewport.add(scope, element);

            if (enabledDnD) {
                scope.$type = 'TreeDnDNode';

                scope.getData = function () {
                    return scope[keyNode];
                };
            }

            scope.$element            = element;
            scope[keyNode].__inited__ = true;

            scope.getElementChilds = function () {
                return angular.element(element[0].querySelector('[tree-dnd-nodes]'));
            };

            scope.setScope(scope, scope[keyNode]);

            scope.getScopeNode = function () {
                return scope;
            };

            var objprops = [],
                objexpr,
                i, keyO  = Object.keys(scope[keyNode]),
                lenO     = keyO.length,
                hashKey  = scope[keyNode].__hashKey__,
                skipAttr = [
                    '__visible__',
                    '__level__',
                    '__index__',
                    '__index_real__',

                    '__parent__',
                    '__parent_real__',
                    '__dept__',
                    '__icon__',
                    '__icon_class__'
                ],
                keepAttr = [
                    '__expanded__'
                ],
                lenKeep  = keepAttr.length;

            // skip __visible__
            for (i = 0; i < lenO + lenKeep; i++) {
                if (i < lenO) {
                    if (skipAttr.indexOf(keyO[i]) === -1) {
                        objprops.push(keyNode + '.' + keyO[i]);
                    }
                } else {
                    if (keyO.indexOf(keepAttr[i - lenO]) === -1) {
                        objprops.push(keyNode + '.' + keepAttr[i - lenO]);
                    }
                }
            }

            objexpr = '[' + objprops.join(',') + ']';

            scope.$watch(objexpr, fnWatchNode, true);

            scope.$on('$destroy', function () {
                scope.deleteScope(scope, scope[keyNode]);
            });

            function fnWatchNode(newVal, oldVal, scope) {

				//removeIf(nodebug) 
                console.time('Node_Changed');
				//endRemoveIf(nodebug)
                var nodeOf = scope[keyNode],
                    _icon;

                if (first) {
                    _icon                 = nodeOf.__icon__;
                    nodeOf.__icon_class__ = scope.$class.icon[_icon];
                } else {

                    var parentReal = nodeOf.__parent_real__,
                        parentNode = scope.tree_nodes[parentReal] || null,
                        _childs    = nodeOf.__children__,
                        _len       = _childs.length,
                        _i;

                    if (!nodeOf.__inited__) {
                        nodeOf.__inited__ = true;
                        if (nodeOf.__selected__) {
                          delete nodeOf.__selected__;
                          // delete the old node if it is already in the selection
                          var selected = scope.tree.get_selected_nodes();

                          for (var i = 0; i < selected.length; i++) {
                            if (selected[i][scope.primary_key] === nodeOf[scope.primary_key]) {
                              selected.splice(i, 1);
                              break;
                            }
                          }

                          scope.tree.select_node(nodeOf);
                        }
                    }

                    if (nodeOf.__hashKey__ !== hashKey) {
                        // clear scope in $globals
                        scope.deleteScope(scope, nodeOf);

                        // add new scope into $globals
                        scope.setScope(scope, nodeOf);
                        hashKey = nodeOf.__hashKey__;
                    }

                    if (parentNode && (!parentNode.__expanded__ || !parentNode.__visible__)) {
                        element.addClass(scope.$class.hidden);
                        nodeOf.__visible__ = false;
                    } else {
                        element.removeClass(scope.$class.hidden);
                        nodeOf.__visible__ = true;
                    }

                    if (_len === 0) {
                        _icon = -1;
                        nodeOf.__expanded__ = false;
                    } else {
                        if (nodeOf.__expanded__) {
                            _icon = 1;
                        } else {
                            _icon = 0;
                        }
                    }

                    nodeOf.__icon__       = _icon;
                    nodeOf.__icon_class__ = scope.$class.icon[_icon];

                    if (!scope.isTable) {
                        for (_i = 0; _i < _len; _i++) {
                            scope.for_all_descendants(_childs[_i], scope.hiddenChild, nodeOf, true);
                        }
                    } else {
                        if (!childsElem) {
                            childsElem = scope.getElementChilds();
                        }

                        if (nodeOf.__expanded__) {
                            childsElem.removeClass(scope.$class.hidden);
                        } else {
                            childsElem.addClass(scope.$class.hidden);
                        }
                    }

                }

				//removeIf(nodebug) 
                console.timeEnd('Node_Changed');
				//endRemoveIf(nodebug) 
                first      = false;

            }
        }
    }]
);