angular
.module('resourceApp', ['treeControl'])
.controller('resourceCtrl', resourceCtrl);

function resourceCtrl($scope, $http, $timeout) 
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
        let ids = expand_ids ? expand_ids : locals_read('/category/res/expand');

        $http.get('/category/expand', {params:{'expand_ids':ids}}).then((res)=>{
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
            var id = locals_read('/category/res/sel');
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


    $scope.toggle = (node, expanded) => {
        /* 更新展开的节点列表 */
        var ids = $scope.listExpand.map(node => { return node.id; });
        refresh(ids);
        locals_write('/category/res/expand', ids);        
    }

    $scope.select = select;
    function select(node, sel)
    {
        resource_get();
        locals_write('/category/res/sel', sel ? node.id : undefined);
    }

    /* -------------------------- Resources Realte ------------------------- */
    var cfg_resource_max = 22;

    $scope.list_document = null;
    $scope.list_file = null;

    function get_documents()
    {
        var str = $scope.resource.str;
        var categoryid = $scope.nodeSelected ? $scope.nodeSelected.id : 0;
        var params = {'str':str, 'link':$scope.resource.link, 'page':$scope.resource.page, 'size':cfg_resource_max};

        $http
        .get('/category/document/'+categoryid, {'params': params})
        .then((res)=>{
            if (errorCheck(res)) return ;

            var ret = res.data.message;
            /* 提取文章标题 
             * 1. 去除开头的#和换行符(\n)
             * 2. 查找下一个换行符前的字符串
             */
            for (var i = 0; i < ret.list.length; i++) {
                var title = '';

                var content = ret.list[i].content;
                var str = content.replace(/^[\\n#\ \t]*/, '');
                if (/[^\n]+/.test(str))
                {
                    title = str.match(/[^\n]+/)[0];
                }
                else
                {
                    title = str.substr(0, 100);
                }                
                ret.list[i]['title'] = title;
            }
        
            $scope.list_document = ret.list;
            $scope.resource.page = ret.page;
        })
    }

    function get_files()
    {
        var str = $scope.resource_search;
        var categoryid = $scope.nodeSelected ? $scope.nodeSelected.id : 0;        
        var params = {'str':str, 'link':$scope.resource.link, 'page':$scope.resource.page, 'size':cfg_resource_max};

        $http
        .get('/category/file/'+categoryid, {'params': params})
        .then((res)=>{
            if (errorCheck(res)) return ;

            var ret = res.data.message;        
            $scope.list_file = ret.list;
            $scope.resource.page = ret.page;
        })
    }

    // 根据选项卡显示资源
    $scope.resource_get = resource_get;
    function resource_get()
    {
        ('file' == tab_display) ? get_files() : get_documents();
    }

    $scope.resource_link = () => 
    {
        $scope.resource.page = 1;

        $scope.resource.link = $scope.nodeSelected ? !$scope.resource.link : false;
        locals_write('/category/res/relate', $scope.resource.link);
    }

    $scope.resource_link_document = (rid) =>
    {
        var categoryid = $scope.nodeSelected ? $scope.nodeSelected.id : 0;
        var link = $scope.resource.link;
        var params = {'id': rid, 'link':link};
        $http
        .post('/category/document/'+categoryid, params)
        .then((res)=>{
            if (errorCheck(res)) return ;
 
            resource_get();
        });
    }

    $scope.resource_link_file = (rid) =>
    {
        var categoryid = $scope.nodeSelected ? $scope.nodeSelected.id : 0;
        var link = $scope.resource.link;
        var params = {'id': rid, 'link':link};
        $http
        .post('/category/file/'+categoryid, params)
        .then((res)=>{
            if (errorCheck(res)) return ;
 
            resource_get();
        });
    }

    /* ------------------------- Tab --------------------------------------- */

    // 恢复tab选中
    var tab_display = locals_read('/category/res/tab');
    $('#resourceTab li:'+(('file' == tab_display) ? 'last-child' : 'first-child')+' a').tab('show');
    // 恢复关联状态
    let link = locals_read('/category/res/relate');
    $scope.resource = resource = {'str':'', 'page':1, 'link':!(!link || (link == 'false'))};
    $scope.$watch('resource', resource_get, true);

    $('a[data-toggle="tab"]').on('shown.bs.tab', function (e) {        
        $scope.resource.page = 1;

        tab_display = $(e.target).attr('href').substr(1);
        locals_write('/category/res/tab', tab_display);
        resource_get( tab_display );
    })
}