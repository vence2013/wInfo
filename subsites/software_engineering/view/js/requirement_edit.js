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

    $scope.category_change = category_change;
    function category_change(id_cat)
    {
        let idx = 0;
        /* 从目录列表中查找选中的目录 */
        for (let i = 0; i < $scope.category_list.length; i++)
        {
            if ($scope.category_list[i]['id'] != id_cat) continue;

            idx = i;
            $scope.category_sel = $scope.category_list[i];
            locals_write('/software_engineering/requirement_edit/category_sel', $scope.category_sel['id']);
            break;
        }

        /* 构建目录显示内容（向上查找第1个层级减少的名称） */
        let title = $scope.category_sel['name'];
        let last_depth = $scope.category_sel['depth'];
        for (let i = idx; i >= 0; i--)
        {
            if ($scope.category_list[i]['depth'] < last_depth)
                title = $scope.category_list[i]['name'] + ' / ' + title;
            
            last_depth = $scope.category_list[i]['depth'];
        }

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
    $scope.importance_change = (id_imp) =>
    {
        let imp = parseInt(id_imp) - 1;
        $scope.importance_sel = $scope.importance_list[imp];
        locals_write('/software_engineering/requirement_edit/importance_sel', id_imp);
    }


    /* 需求处理 -----------------------------------------------------------------*/

    $scope.req = {'id':'', 'ver':1, 'title':'', 'desc':'', 'comment':''};

    $scope.edit = () =>
    {
        /* 检查基础信息 */
        if (!$scope.category_sel['id'] || !$scope.importance_sel['id'])
            return toastr.warning('请选择有效的产品和分类！');
        /* 检查需求信息 */
        if (!$scope.req['id'] || !$scope.req['ver'] || !$scope.req['title'])
            return toastr.warning('请输入有效的需求信息（编号，版本，标题）！');

            let obj = Object.assign({}, $scope.req);
            //obj['desc'] = $('#desc').trumbowyg('html');
            //obj['comment']  = $('#comment').trumbowyg('html');
            obj['category'] = $scope.category_sel['id'];
            obj['rate']     = $scope.importance_sel['id'];
            $http
            .post('/software_engineering/requirement', obj)
            .then((res)=>{
                if (errorCheck(res)) return ;
                toastr.success('success');
    
                let ret = res.data.message;            
                $scope.req = {'id':'', 'ver':1, 'title':'', 'desc':'', 'comment':''};
            });
    }
}