angular
.module('indexApp', ['treeControl'])
.controller('indexCtrl', indexCtrl);

function indexCtrl($scope, $http) 
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
        let ids = expand_ids ? expand_ids : locals_read('/category/index/expand');

        $http.get('/category/expand/res', {params:{'expand_ids':ids}}).then((res)=>{
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

            /* 替换资源前的图标（等待tree初始化完成） */
            window.setTimeout(()=>{
                $('.type-doc')
                .parent(".tree-label").siblings('.tree-leaf-head')
                .css({'background': 'url(category/view/images/doc.png) no-repeat'});

                $('.type-doc').each((i, e)=>{
                    let id = $(e).attr('data-id');

                    let title = $(e).html();
                    $(e).html("<a href='/document/display/"+id+"' target='_blank'>"+title+"</a>")
                });

                $('.type-file').each((i, e)=>{
                    let type = $(e).attr('data-ext');

                    let obj = $(e).parent(".tree-label").siblings('.tree-leaf-head');
                    let icon = 'file';
                    switch (type) {
                        case 'pdf': icon = 'pdf'; break;
                        case 'zip': icon = 'compress'; break;
                    }

                    $(obj).css({'background': 'url(category/view/images/'+icon+'.png) no-repeat'});
                    let title = $(e).html();
                    let path  = $(e).attr('data-path');
                    $(e).html("<a href='"+path+"' target='_blank'>"+title+"</a>")
                });
            }, 200);
        });
    }
    refresh();

    $scope.toggle = (node, expanded) => {
        /* 更新展开的节点列表 */
        let ids = [];

        $scope.listExpand.map(e => {
            if (e.id != node.id) 
                ids.push(e.id);
        });
        if (expanded) ids.push(node.id);

        refresh(ids);
        locals_write('/category/index/expand', ids);        
    }
}