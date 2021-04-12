angular
.module('appApp', ['treeControl'])
.controller('appCtrl', appCtrl)

function appCtrl($scope, $http) 
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

    function refresh(expand_ids) {
        let ids = expand_ids ? expand_ids : locals_read('/category/edit/expand');

        $http.get('/category/expand/node', {params:{'expand_ids':ids}}).then((res)=>{
            if (errorCheck(res)) return ;

            let ret = res.data.message;
            var {dir, list} = treeTravel(ret, 0, $scope.expand);
            $scope.treeRoot = $scope.treeView = ret;       
            $scope.listRoot = $scope.listView = list;

            // 恢复展开节点
            if (ids && ids.length) {
                let expand = [];
                $scope.listView.map((x)=>{ 
                    if (ids.indexOf(x.id)!=-1) 
                        expand.push(x); 
                });
                $scope.listExpand = expand;
            }

            // 恢复选中节点
            var id = locals_read('/category/edit/sel');
            for (i = 0; i < $scope.listView.length; i++) 
            {
                if (id != $scope.listView[i]['id']) continue;
                // 找到选中的节点
                $scope.nodeSelected = $scope.listView[i];
                select($scope.listView[i], true);
                break;
            }
        });
    }
    refresh();

    $scope.select = select;
    function select(node, sel)
    {
        $scope.selBakcup = node;
        $scope.sel = jQuery.extend(true, {}, sel ? node : undefined);
        locals_write('/category/edit/sel', $scope.sel['id']);
    }

    $scope.order_update = (type) => 
    {
        if ($scope.sel['order'] == null) 
            $scope.sel['order'] = 0;
        else 
            switch (type) {
            case 0 : // reset
                $scope.sel['order'] = ($scope.selBakcup['order'] == null) ? 0 : $scope.selBakcup['order']; 
                break;            
            case 1 : 
                if ($scope.sel['order'] > 0) $scope.sel['order']--; 
                break;
            case 2 : 
                $scope.sel['order']++; 
                break;
            }
    }

    $scope.toggle = (node, expanded) => {
        /* 更新展开的节点列表 */
        var ids = $scope.listExpand.map(node => { return node.id; });
        refresh(ids);
        locals_write('/category/edit/expand', ids);        
    }

    $scope.edit = ()=>{
        if (!$scope.sel || !$scope.sel['id']) 
            return toastr.warning('请先选择要编辑的节点，并输入有效的目录名称！');

        $http
        .put('/category/edit/'+$scope.sel['id'], $scope.sel)
        .then((res)=>
        {
            if (errorCheck(res)) return ;

            toastr.success('success');
            /* 如果修改了父级目录，则修改后的父级目录也应该展开 */
            let ids = locals_read('/category/edit/expand');
            if (ids.indexOf($scope.sel['father']) == -1)
            {
                if (typeof(ids) == 'object') ids.push($scope.sel['father'])
                else ids = [ $scope.sel['father'] ];

                locals_write('/category/edit/expand', ids);
            }

            refresh();
        });
    }

    $scope.add = () =>
    {
        var name = $scope.sub_name.replace(/^\s+|\s+$/g,'');
        if (!name) { return toastr.warning('请输入有效的目录名称！'); }

        var father_id = $scope.sel ? $scope.sel['id'] : 0;
        console.log('ee', father_id);
        $http
        .post('/category/edit', {'father': father_id, 'name': name})
        .then((res)=>{
            if (errorCheck(res)) return ;
            toastr.success('success');

            let ret = res.data.message;            
            /* 添加成功后，选中新增节点 */
            locals_write('/category/edit/sel', ret.id);            

            /* 添加成功后，将当前添加子目录的节点展开（如果已经展开，则忽略） */
            let ids = locals_read('/category/edit/expand');
            if (typeof(ids) == 'object') 
            {
                if (ids.indexOf(ret.id) == -1)
                ids.push(father_id);
            } else
                ids = [ father_id ];
            locals_write('/category/edit/expand', ids);

            $scope.sub_name = '';
            refresh();
        });
    }

    $scope.delete = () => 
    {
        var cid = $scope.sel['id'];

        $http
        .delete('/category/edit/'+cid)
        .then((res)=>{
            if (errorCheck(res)) return ;

            locals_write('/category/edit/sel', undefined);
            refresh();
        });
    }
}