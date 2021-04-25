angular
.module('appApp', [])
.controller('appCtrl', appCtrl);

function appCtrl($scope, $http) 
{
    let res = locals_read("/fund/filter");
    if (!res)
    {
        $scope.filter = {
            "request":'company',
            "company":{}, "fund":{}, "statistic":{}, "value":{}
        };
        $(".nav-link[name='company']").addClass('active');
        $("#nav-company").tab('show');
    } else {
        let name = res['request'];

        $scope.filter = res;
        $(".nav-link[name='"+name+"']").addClass('active');
        $("#nav-"+name).tab('show');
    }


    function filter_display(newValue)
    {
        function item_display(index, title, meta)
        {
            let data = newValue[ index];

            let str = '';
            for (i = 0; i < meta.length; i++)
            {
                let mmin = meta[i]['min'], mmax = meta[i]['max'];

                if (data[ mmin ] && data[ mmax ])
                    str += "<div>"+meta[i]['title']+"[ <span>"+data[ mmin ]+'</span> , <span>'+data[ mmax ]+"</span> ]</div>";
                else if (data[ mmin ] || data[ mmax ])
                    str += "<div>"+meta[i]['title']+"( <span>"+(data[ mmin ] ? data[ mmin ] : data[ mmax ])+"</span> )</div>";
            }

            if (str)
                $(".filter-result").append("<div class='res-title'>"+title+"</div><div class='res-item'>"+str+"</div></div>");
        }

        $(".filter-result").html('');

        const company_meta = [
            {'title':'创建年限（年）', 'min':'create_year_min', 'max':'create_year_max'},
            {'title':'基金总额（亿元）', 'min':'money_min', 'max':'money_max'},
            {'title':'基金总数（个）', 'min':'fund_min', 'max':'fund_max'},
            {'title':'经理人数（人）', 'min':'manager_min', 'max':'manager_max'},
        ];
        item_display('company', 'Company', company_meta);

        const fund_meta = [
            {'title':'创建年限（年）', 'min':'create_year_min', 'max':'create_year_max'},
            {'title':'资产规模（亿元）', 'min':'money_min', 'max':'money_max'},
        ];
        item_display('fund', 'Fund', fund_meta);

        const statistic_meta = [
            {'title':'近1周（%）', 'min':'week1_min', 'max':'week1_max'},
            {'title':'近1月（%）', 'min':'month1_min', 'max':'month1_max'},
            {'title':'近3月（%）', 'min':'month3_min', 'max':'month3_max'},
            {'title':'近6月（%）', 'min':'month6_min', 'max':'month6_max'},
            {'title':'近1年（%）', 'min':'year1_min', 'max':'year1_max'},
            {'title':'近2年（%）', 'min':'year2_min', 'max':'year2_max'},
            {'title':'近3年（%）', 'min':'year3_min', 'max':'year3_max'},
            {'title':'成立来（%）', 'min':'from_start_min', 'max':'from_start_max'},
        ];
        item_display('statistic', 'Statistic', statistic_meta);
    
        const value_meta = [
            {'title':'增长率小于（%）', 'min':'inc_min', 'max':'none'},
            {'title':'次数范围', 'min':'inc_min_count_min', 'max':'inc_min_count_max'},
            {'title':'增长率大于（%）', 'min':'inc_max', 'max':'none'},
            {'title':'次数范围', 'min':'inc_max_count_min', 'max':'inc_max_count_max'},
        ];
        item_display('value', 'Value', value_meta);
    }
    filter_display($scope.filter);
    $scope.$watch("filter", filter_display, true)


    $scope.filter_clear = () =>
    {
        $scope.filter = {
            "request":'company',
            "company":{}, "fund":{}, "statistic":{}, "value":{}
        };
    }


    $scope.filter_apply = filter_apply;
    function filter_apply()
    {
        $http
        .post("/fund/filter/apply", $scope.filter)
        .then((res) => {
            if (errorCheck(res)) return ;

            locals_write("/fund/filter", $scope.filter);
            
            let ret = res.data.message;
            $scope.result_list = ret;

            $(".detail").html("结果数量："+ret.length);
        })
    }

    $scope.detail = (code) =>
    {
        let type = $scope.filter['request'];

        $http
        .get("/fund/info/"+code+"?type="+type)
        .then((res) => {
            if (errorCheck(res)) return ;

            let ret = res.data.message;

            $(".detail").html('');
            for (x in ret)
            {
                let skip = ['createdAt', 'updatedAt'];

                if (skip.indexOf(x) == -1)
                    $(".detail").append('<div><span>'+x+'</span>'+ret[x]+'</div>');
            }
        })
    }

    $scope.detail_title = (info) => 
    {
        let type = $scope.filter['request'];

        switch (type)
        {
            case 'company': return info['name'];
            case 'fund': return info['fullname'];
        }
    }

    var urls;
    
    /* 获取配置的地址 */
    $http
    .get('/fund/config')
    .then((res) => {
        if (errorCheck(res)) return ;

        urls = res.data.message;
    })

    $scope.detail_url = (code) =>
    {
        let type = $scope.filter['request'];

        switch (type)
        {
            case 'company': return urls['company_info'].replace(/\*/, code);
            case 'fund': return urls['fund_info'].replace(/\*/, code);
        }
    }

    $('a[data-toggle="tab"]').on('show.bs.tab', (event) => {
        let name = $(event.target).attr('name');
        $scope.filter['request'] = name;
    })
}