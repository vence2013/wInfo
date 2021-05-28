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

        if ($scope.category_list.length == 0) return ; 

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
    var wnd_current = undefined;
    function window_switch(pre, cur)
    {
        /* 存储当前内容 */
        if ((pre == 'desc') || (pre == 'comment'))
        {
            $scope.req[ pre ] = $('#'+pre).html();
            $('#'+pre).trumbowyg('destroy');
            $('#'+pre).empty();
        }

        wnd_current = cur;
        if ((cur == 'desc') || (cur == 'comment'))
            $('#'+cur).css("height", '580px').trumbowyg().trumbowyg('html', $scope.req[ cur ]);
        else 
        {
            if (cur == 'src')
                sources_display();
        }            
    }
    window_switch(null, 'desc');

    $('a[data-toggle="tab"]').on('shown.bs.tab', function (event) {
        let pre = $(event.relatedTarget).attr('href').substr(1);
        let cur = $(event.target).attr('href').substr(1);

        $(".tab-pane").removeClass('show active');
        $('#'+cur).addClass('show active');
        window_switch(pre, cur);
    })


    $scope.edit = () =>
    {
        let cat_id = locals_read('/software_engineering/requirement_edit/category_sel');

        /* 更新当前串口的值（desc, comment） */
        if ((wnd_current == 'desc') || (wnd_current == 'comment'))
            $scope.req[ wnd_current ] = $('#'+wnd_current).html();

        /* 检查基础信息（新增节点是要求选择目录，编辑时不更改目录） */
        if (!cat_id || !$scope.importance_sel['id'])
            return toastr.warning('请选择有效的产品和分类！');
        /* 检查需求信息 */
        if (!$scope.req['id'] || !$scope.req['title'])
            return toastr.warning('请输入有效的需求信息（编号，标题）！');

        let obj = Object.assign({}, $scope.req);
        obj['category'] = cat_id;
        obj['importance'] = $scope.importance_sel['id'];

        $http
        .post('/software_engineering/requirement', obj)
        .then((res)=>{
            if (errorCheck(res)) return ;
            toastr.success('success');

            let ret = res.data.message;
            $scope.req = {'id':'', 'title':'', 'desc':'', 'comment':''};

            req_refresh();
            window_switch(null, wnd_current);
        });
    }

    $scope.search_cat = (id_cat) =>
    {
        let [idx, title] = category_title(id_cat);
        $scope.cat_title = title;

        $scope.search['category'] = id_cat;
    }

    $scope.search = {'category':0, 'ids':'', 'str':'', 'page':60};
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

        category_change(edit_obj['category_id']);
        importance_change(edit_obj['importance']);
        $scope.req = edit_obj;
        window_switch(null, wnd_current);
    }

    $scope.delete = () =>
    {
        let id = $scope.req['id'];

        $http
        .delete('/software_engineering/requirement/'+id)
        .then((res) => {
            if (errorCheck(res)) return ;

            $scope.req = {'id':'', 'title':'', 'desc':'', 'comment':''};

            req_refresh();
            window_switch(null, wnd_current);
        });
    }

    function sources_display()
    {
        let str = $scope.req['sources'] ? $scope.req['sources'].trim() : '';
        let ids = str ? str.replace(/\s+/g, ' ').split(' ') : [];

        $http
        .get('/software_engineering/requirement/ids', {params:ids})
        .then((res)=>{
            if (errorCheck(res)) return ;

            let ret = res.data.message;
            $scope.src_list = ret;
        });
    }

    $scope.unlink = (id) => 
    {
        let str = $scope.req['sources'] ? $scope.req['sources'].trim() : '';
        let ids = str ? str.replace(/\s+/g, ' ').split(' ') : [];
        let idx = ids.indexOf(id);
        ids.splice(idx, 1);
        $scope.req['sources'] = ' '+ids.join(' ')+' ';
        sources_display(ids);
    }

    /* 将所有搜索结果的需求添加到关联中 */
    $scope.sources_add = () =>
    {
        let res = [];
        for (let i = 0; i < $scope.req_search.length; i++)
            res.push($scope.req_search[i]['category_id']+'/'+$scope.req_search[i]['id']);
        
        let org_list = $scope.req['sources'] ? 
            $scope.req['sources'].replace(/\s+/g, ' ').split(' ') : [];
        
        let ids = org_list.concat(res);
        $scope.req['sources'] = ' '+ids.join(' ')+' ';

        if (wnd_current == 'src')
            sources_display(ids);
    }
}