angular
.module('editApp', [])
.controller('editCtrl', editCtrl);

function editCtrl($scope, $http) 
{
    var emptyChip = {'id':0, 'name':'', 'width':''},
        emptyModule = {'id':0, 'name':'', 'fullname':''},
        emptyRegister = {'id':0, 'name':'', 'fullname':'', 'address':'', 'desc':''},
        emptyBitgroup = {'id':0, 'name':'', 'fullname':'', 'bitlist':'', 'valuelist':'', 'rw':'', 'desc':''};

    $scope.chip     = null;
    $scope.module   = null;
    $scope.register = null;
    $scope.bitgroup = null;
    $scope.chiplist     = [];
    $scope.modulelist   = [];
    $scope.registerlist = [];
    $scope.bitgrouplist = [];


    /* 位组 -----------------------------------------------------------------*/

    $scope.bitgroup_reset = bitgroup_reset;

    function bitgroup_reset() 
    {
        $scope.bitgroup = angular.copy(emptyBitgroup);
        $(".bitsContainer>.badge-success").removeClass('badge-success').addClass('badge-warning');
    }

    $scope.bitgroup_edit = (create) => {
        var i, regid, id, name, rw;

        regid = $scope.register.id;
        if (!regid)
            return toastr.warning('请选择位组属于的寄存器！');

        var bitlist   = $scope.bitgroup.bitlist;
        var valuelist = $scope.bitgroup.valuelist; 
        if (create) {
            name = $scope.bitgroup.name;
            rw   = $scope.bitgroup.rw;
            if (!name || !rw || !/^(\d+,)*\d+$/.test(bitlist) || !/^(.,)*.$/.test(valuelist)) 
                return toastr.warning('请输入有效的位组参数！');
        } else {
            id = $scope.bitgroup.id;
            if (!id) return toastr.warning('请选择要编辑的位组！');
        }       

        var arr1 = bitlist.split(',');
        var arr2 = valuelist.split(',');
        if (arr1.length!=arr2.length) return toastr.warning('位组的位序号和值数量不一样，请确认！');
        // 检查位组序号的有效性
        var chipWidth = parseInt($scope.chip.width);            
        for (i=0; (i<arr1.length) && (parseInt(arr1[i])<chipWidth); i++) ;
        if (i<arr1.length) return toastr.warning('位组的序号应小于芯片位宽度， 请输入有效位组序号！');
        // 复位之可以为0/1/x

        $http.post('/chip/bitgroup/'+regid, $scope.bitgroup).then((res)=>{
            if (errorCheck(res)) return ; 

            bitgroup_list_get(name);     
            toastr.success(res.data.message);       
        });
    }

    $scope.bitgroup_delete = () => {
        if (!/^\d+$/.test($scope.bitgroup.id)) 
            return toastr.warning('请选择要删除的寄存器！');

        $http.delete('/chip/bitgroup/'+$scope.bitgroup.id).then((res)=>{
            if (errorCheck(res)) return ; 

            locals_write(local_path_get('bitgroup'), '');
            $scope.bitgroup = angular.copy(emptyBitgroup);
            bitgroup_list_get();   
            toastr.success(res.data.message);         
        });
    }

    $scope.bitgroup_select = bitgroup_select;

    function bitgroup_select(bitgroup)
    {
        $scope.bitgroup = angular.copy(bitgroup);
        locals_write(local_path_get('bitgroup'), bitgroup.id);

        $(".bitsContainer>.badge-success").removeClass('badge-success').addClass('badge-warning');
        window.setTimeout(()=>{
            var idx = $scope.bitgrouplist.indexOf(bitgroup);
            $(".bitsContainer>span:eq("+idx+")").removeClass('badge-warning').addClass('badge-success');
        }, 0);
    }

    function bitgroup_list_get(select_name) 
    {
        $http.get('/chip/bitgroup/register/'+$scope.register.id).then((res)=>{
            if (errorCheck(res)) return ;

            $scope.bitgrouplist = res.data.message;;      
            element_select('bitgroup', select_name);               
        })
    }


    /* 寄存器 ---------------------------------------------------------------*/

    $scope.register_reset = register_reset;

    function register_reset() 
    {
        bitgroup_reset();

        $scope.bitgrouplist = [];
        $scope.register = angular.copy(emptyRegister);
        $(".registerContainer>.badge-success").removeClass('badge-success').addClass('badge-secondary'); 
    }

    $scope.register_edit = (create)=>{
        var moduleid, id, name, address;

        moduleid = $scope.module.id;
        if (!moduleid)
            return toastr.warning('请选择寄存器属于的模块！');

        if (create) {
            name = $scope.register.name;
            address = $scope.register.address;
            if (!name || !/0[xX]{1}[0-9a-fA-F]+/.test(address)) 
                return toastr.warning('请输入有效的寄存器名称以及地址！');
            $scope.register['id'] = 0;
        } else {
            id = $scope.register.id;
            if (!id) 
                return toastr.warning('请选择要编辑的寄存器！');
        }        

        $http.post('/chip/register/'+moduleid, $scope.register).then((res)=>{
            if (errorCheck(res)) return ; 
            
            register_list_get(name);   
            toastr.success(res.data.message);         
        });
    }

    $scope.register_delete = ()=>{
        if (!/^\d+$/.test($scope.register.id)) 
            return toastr.warning('请选择要删除的寄存器！');

        $http.delete('/chip/register/'+$scope.register.id).then((res)=>{
            if (errorCheck(res)) return ; 
            
            locals_write(local_path_get('register'), '');
            $scope.register = angular.copy(emptyRegister);  
            register_list_get();   
            toastr.success(res.data.message);         
        });
    }

    $scope.register_select = register_select;

    function register_select(register)
    {
        $scope.register = angular.copy(register);
        locals_write(local_path_get('register'), register.id);
        
        $(".registerContainer>.badge-success").removeClass('badge-success').addClass('badge-secondary');
        window.setTimeout(()=>{
            var idx = $scope.registerlist.indexOf(register);
            $(".registerContainer>span:eq("+idx+")").removeClass('badge-secondary').addClass('badge-success');
        }, 0);

        bitgroup_list_get();
    }

    function register_list_get(select_name) 
    {
        $http.get('/chip/register/module/'+$scope.module.id).then((res)=>{
            if (errorCheck(res)) return ;

            $scope.registerlist = res.data.message;
            element_select('register', select_name);        
        })
    }


    /* 模块 -----------------------------------------------------------------*/
    
    function module_reset() 
    {
        register_reset();
        $scope.registerlist = [];
        $scope.module = angular.copy(emptyModule);  
        $(".moduleContainer>.badge-success").removeClass('badge-success').addClass('badge-secondary');        
    }

    $scope.module_edit = (create) => {
        var chipid, id, name;

        chipid = $scope.chip.id;
        if (!chipid)
            return toastr.warning('请选择模块属于的芯片！');

        if (create)  {
            var name = $scope.module.name;
            if (!name) 
                return toastr.warning('请输入有效的模块名称！');

            $scope.module['id'] = 0;  // 清除ID信息，服务端才能进行添加
        } else {
            var id = $scope.module.id;
            if (!id) 
                return toastr.warning('请选择需要编辑的模块！');
        }
        
        $http.post('/chip/module/'+chipid, $scope.module).then((res)=>{
            if (errorCheck(res)) return ; 

            module_list_get(name);
            toastr.success(res.data.message);
        });
    }

    $scope.module_delete = () => {
        if (!/^\d+$/.test($scope.module.id)) 
            return toastr.warning('请选择要删除的模块！');

        $http.delete('/chip/module/'+$scope.module.id).then((res)=>{
            if (errorCheck(res)) return ; 

            locals_write(local_path_get('module'), '');
            $scope.module = angular.copy(emptyModule);   
            module_list_get();    
            toastr.success(res.data.message);        
        });
    }

    $scope.module_select = module_select;

    function module_select(module)
    {
        $scope.module = angular.copy(module);
        locals_write(local_path_get('module'), module.id);
        
        $(".moduleContainer>.badge-success").removeClass('badge-success').addClass('badge-secondary');
        window.setTimeout(()=>{
            var idx = $scope.modulelist.indexOf(module);
            $(".moduleContainer>span:eq("+idx+")").removeClass('badge-secondary').addClass('badge-success');
        }, 0);

        register_list_get();
    }

    function module_list_get(select_name)
    {
        $http.get('/chip/module/chip/'+$scope.chip.id).then((res)=>{
            if (errorCheck(res)) return ;

            $scope.modulelist = res.data.message;    
            element_select('module', select_name);    
        })
    }


    /* 芯片 -----------------------------------------------------------------*/
    
    function chip_reset() 
    {
        module_reset();
        $scope.modulelist   = [];
        $scope.chip = angular.copy(emptyChip);   
        $(".chipContainer>.badge-success").removeClass('badge-success').addClass('badge-dark');
    }

    $scope.chip_edit = (create)=>{
        var id, name;

        if (create) {
            name  = $scope.chip.name;
            if (!name || !/^\d+$/.test($scope.chip.width)) 
                return toastr.warning('请输入有效的芯片参数！');
        } else {
            id = $scope.chip.id;
            if (!id) 
                return toastr.warning('请选择需要编辑的芯片！');
        }

        $http.post('/chip/chip/'+id, $scope.chip).then((res)=>{
            if (errorCheck(res)) return ; 
            
            chip_list_get(name);    
            toastr.success(res.data.message);        
        });
    }

    $scope.chip_delete = () => {
        if (!/^\d+$/.test($scope.chip.id)) 
            return toastr.warning('请选择要删除的芯片！');

        $http.delete('/chip/chip/'+$scope.chip.id).then((res)=>{
            if (errorCheck(res)) return ; 
            
            locals_write(local_path_get('chip'), '');
            $scope.chip = angular.copy(emptyChip); 
            chip_list_get();
            toastr.success(res.data.message);
        });
    }

    $scope.chip_select = chip_select;
    /* 选择某个芯片。
     * 需要进行的工作有：
     * 1. 更新数据：选中的芯片
     * 2. 更新显示：选中的芯片
     * 3. 更新模块列表
     */
    function chip_select(chip)
    {
        $scope.chip = angular.copy(chip);
        locals_write(local_path_get('chip'), chip.id);
        
        $(".chipContainer>.badge-success").removeClass('badge-success').addClass('badge-dark');
        window.setTimeout(()=>{
            var idx = $scope.chiplist.indexOf(chip);
            $(".chipContainer>span:eq("+idx+")").removeClass('badge-dark').addClass('badge-success');
        }, 0);
        
        module_list_get();
    }

    /* 获取芯片列表
     * 1. 获取并更新芯片列表数据
     * 2. 默认选择第1个芯片
     * 
     * 说明： 允许预先选择某个芯片，应用于：新增芯片后选中
     */
    function chip_list_get(select_name) {
        $http.get('/chip/chip').then((res)=>{
            if (errorCheck(res)) return ;

            $scope.chiplist = res.data.message;  
            element_select('chip', select_name);
        })
    }
    chip_list_get();


    /* 公共 -----------------------------------------------------------------*/

    function local_path_get(type)
    {
        switch (type) {
            case 'chip':     return '/chip/edit';
            case 'module':   return '/chip/edit/'+$scope.chip.id;
            case 'register': return '/chip/edit/'+$scope.chip.id+'/'+$scope.module.id;
            case 'bitgroup': return '/chip/edit/'+$scope.chip.id+'/'+$scope.module.id+'/'+$scope.register.id;
        } 
    }

    /* 元素的默认选择。选择规则描述如下：
     * 1. 如果元素列表为空，则清除所有已选参数（包括子参数）
     * 2. 如果指定了选择参数，则选择该参数
     * 3. 如果存储了上一次的选择，则选择该参数
     * 4. 选择列表中的第1个参数
     * 
     * 说明
     * 1. 元素包括：芯片/ 模块/ 寄存器
     * 
     * 返回参数：元素选择的类型
     */
    function element_select(type, select_name)
    {
        var ret;

        function check_reset() 
        {            
            switch (type) {
                case 'chip':
                    if ($scope.chiplist.length == 0) {
                        chip_reset();
                        return 1;
                    }                        
                    break;
                case 'module':
                    if ($scope.modulelist.length == 0) {
                        module_reset();
                        return 1;
                    }                        
                    break;
                case 'register':
                    if ($scope.registerlist.length == 0) {
                        register_reset();
                        return 1;
                    }                        
                    break;
                case 'bitgroup':
                    if ($scope.bitgrouplist.length == 0) {
                        bitgroup_reset();
                        return 1;
                    }                        
                    break;
                default: return -1;
            }
            return 0;
        }

        // (1)
        ret = check_reset();
        if (ret)
            return ret;

        function select_element(element) {
            switch (type) {
                case 'chip':     chip_select(element);     break;
                case 'module':   module_select(element);   break;
                case 'register': register_select(element); break;
                case 'bitgroup': bitgroup_select(element); break;
            }  
        }

        function select_by_name_or_id(name, id)
        {
            var list, i;

            switch (type) {
                case 'chip':     list = $scope.chiplist;     break;
                case 'module':   list = $scope.modulelist;   break;
                case 'register': list = $scope.registerlist; break;
                case 'bitgroup': list = $scope.bitgrouplist; break;
                default: return -1;
            }

            if (name)
                for (i = 0; (i < list.length) && (list[i].name !== name); i++) ;
            else if (id)
                for (i = 0; (i < list.length) && (list[i].id != id); i++) ;
            // 是否有查找结果
            if (i < list.length) {
                select_element(list[i]);
                return 1;
            }                
            return 0;
        }

        ret = select_by_name_or_id(select_name, 0);
        if (ret) { // (2)
            return (ret > 0) ? 2 : ret;
        } else {            
            var lpath = local_path_get(type);
            var previous_select_id = locals_read(lpath);
            ret = select_by_name_or_id('', previous_select_id);
            if (ret) { // (3)
                return (ret > 0) ? 3 : ret;
            }
        }

        // (4)
        switch (type) {
            case 'chip':     select_element($scope.chiplist[0]);     break;
            case 'module':   select_element($scope.modulelist[0]);   break;
            case 'register': select_element($scope.registerlist[0]); break;
            case 'bitgroup': select_element($scope.bitgrouplist[0]); break;
        }
        return 4;
    }
}