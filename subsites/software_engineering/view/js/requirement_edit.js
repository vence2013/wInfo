angular
.module('app', [])
.controller('appCtrl', appCtrl);

function appCtrl($scope, $http) 
{
    /* 获取所有项目节点 */
    $scope.project_lst = [];
    $scope.project_sel = {'id':0, 'name':'请选择任一项目'};
    function get_projects()
    {
        $http
        .get('/software_engineering/requirement_category/project')
        .then((res) => {
            if (errorCheck(res)) return ;

            let ret = res.data.message;
            $scope.project_lst = ret;

            var id = locals_read('/software_engineering/requirement_edit/project_sel');
            project_change(id);
        });
    }
    get_projects();

    $scope.category_list = [];
    $scope.category_sel = {'id':0, 'title':'请选择任一目录'};
    $scope.project_change = project_change;
    
    function project_change(id_prj)
    {
        /* 从项目列表中查找选中的项目 */
        for (i = 0; i < $scope.project_lst.length; i++)
        {
            if ($scope.project_lst[i]['id'] != id_prj) continue;
            $scope.project_sel = $scope.project_lst[i];
            locals_write('/software_engineering/requirement_edit/project_sel', $scope.project_sel['id']);
            break;
        }

        /* 获取项目目录 */
        $http
        .get('/software_engineering/requirement_category/category/'+id_prj)
        .then((res) => {
            if (errorCheck(res)) return ;

            let ret = res.data.message;
            for (let i = 0; i < ret.length; i++)
            {
                let str = ' + '.repeat(ret[i]['depth']) + ret[i]['name'];
                ret[i]['title'] = str;
            }
            $scope.category_list = ret;

            var id = locals_read('/software_engineering/requirement_edit/category_sel');
            category_change(id);
        });
    }

    function category_title(id_cat)
    {
        let idx = 0;

        /* 从目录列表中查找选中的目录 */
        for (let i = 0; i < $scope.category_list.length; i++)
        {
            if ($scope.category_list[i]['id'] != id_cat) continue;

            idx = i;
            break;
        }

        /* 构建目录显示内容（向上查找第1个层级减少的名称） */
        let title = $scope.category_list[idx]['name'];
        let last_depth = $scope.category_list[idx]['depth'];
        for (let i = idx; i >= 0; i--)
        {
            if ($scope.category_list[i]['depth'] >= last_depth) continue;

            title = $scope.category_list[i]['name'] + ' / ' + title;            
            last_depth = $scope.category_list[i]['depth'];
        }

        return [idx, title];
    }

    $scope.category_change = category_change;
    function category_change(id_cat)
    {
        let [idx, title] = category_title(id_cat);

        $scope.category_sel = $scope.category_list[idx];
        locals_write('/software_engineering/requirement_edit/category_sel', $scope.category_sel['id']);
        $scope.category_sel = {'id':id_cat, 'title':title};
    }

    $scope.importance_list = [
        {'id':1, 'name':'关键需求（Key）'},
        {'id':2, 'name':'常规需求（Regular）'},
        {'id':3, 'name':'可忽略需求（Insignificant）'},
    ];
    let id = locals_read('/software_engineering/requirement_edit/importance_sel');
    let sel = id ? (parseInt(id) - 1) : 1;
    $scope.importance_sel = $scope.importance_list[ sel ];
    $scope.importance_change = importance_change;
    function importance_change(id_imp)
    {
        let imp = parseInt(id_imp) - 1;
        $scope.importance_sel = $scope.importance_list[imp];
        locals_write('/software_engineering/requirement_edit/importance_sel', id_imp);
    }


    /* 需求处理 -----------------------------------------------------------------*/

    $scope.req = {'id':'', 'title':'', 'desc':'', 'comment':''};

    $scope.window_switch = window_switch;
    var wnd_current = undefined;
    function window_switch(wnd)
    {
        if ((wnd_current == 'desc') || (wnd_current == 'comment'))
            $scope.req[ wnd_current ] = $("#contentWnd").html();

        wnd_current = wnd;
        if ((wnd == 'desc') || (wnd == 'comment'))
            $("#contentWnd").css("height", '580px').trumbowyg().trumbowyg('html', $scope.req[ wnd ]);
        else 
        {
            $('#contentWnd').trumbowyg('destroy');
            $('#contentWnd').empty();
        }            
    }
    window_switch('desc');

    $scope.edit = () =>
    {
        /* 更新当前串口的值（desc, comment） */
        $scope.req[ wnd_current ] = $("#contentWnd").html();

        /* 检查基础信息 */
        if (!$scope.category_sel['id'] || !$scope.importance_sel['id'])
            return toastr.warning('请选择有效的产品和分类！');
        /* 检查需求信息 */
        if (!$scope.req['id'] || !$scope.req['title'])
            return toastr.warning('请输入有效的需求信息（编号，标题）！');

        let obj = Object.assign({}, $scope.req);
        obj['category'] = $scope.category_sel['id'];
        obj['importance']     = $scope.importance_sel['id'];
        $http
        .post('/software_engineering/requirement', obj)
        .then((res)=>{
            if (errorCheck(res)) return ;
            toastr.success('success');

            let ret = res.data.message;
            if ((wnd_current == 'desc') || (wnd_current == 'comment'))
                $('#contentWnd').trumbowyg('empty');
            $scope.req = {'id':'', 'title':'', 'desc':'', 'comment':''};

            req_refresh();
        });
    }

    $scope.search_cat = (id_cat) =>
    {
        let [idx, title] = category_title(id_cat);
        $scope.cat_title = title;

        $scope.search['category'] = id_cat;
    }

    $scope.search = {'category':0, 'ids':'', 'str':''};
    $scope.cat_title = '';
    function req_refresh()
    {
        $http
        .get('/software_engineering/requirement', {params:$scope.search})
        .then((res) => {
            if (errorCheck(res)) return ;

            let ret = res.data.message;
            $scope.req_search = ret;
        });
    }
    $scope.$watch('search',req_refresh, true);

    $scope.edit_request = (id) => 
    {
        let edit_obj;

        /* 搜索详细信息 */
        for (let i = 0; i < $scope.req_search.length; i++)
        {
            if ($scope.req_search[i]['id'] != id) continue;

            edit_obj = Object.assign($scope.req_search[i]);
            break;
        }

        category_change(edit_obj['seRequirementCategoryId']);
        importance_change(edit_obj['importance']);
        $scope.req = edit_obj;
        if ((wnd_current == 'desc') || (wnd_current == 'comment'))
            $("#contentWnd").css("height", '580px').trumbowyg().trumbowyg('html', $scope.req[ wnd_current ]);
    }

    $scope.delete = () =>
    {
        let id = $scope.req['id'];

        $http
        .delete('/software_engineering/requirement/'+id)
        .then((res) => {
            if (errorCheck(res)) return ;

            if ((wnd_current == 'desc') || (wnd_current == 'comment'))
                $('#contentWnd').trumbowyg('empty');
            $scope.req = {'id':'', 'title':'', 'desc':'', 'comment':''};

            req_refresh();
        });
    }
}