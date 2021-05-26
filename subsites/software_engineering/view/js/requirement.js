angular
.module('app', [])
.controller('appCtrl', appCtrl);


/* cola初始化 */
var height = $(window).height() - 70; // header 
var width  = $(window).width() - 30;

var cola  = cola.d3adaptor(d3)
    .linkDistance(20)
    .avoidOverlaps(true)
    .handleDisconnected(false)
    .size([width, height]);


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

            let id_prj = locals_read('/software_engineering/requirement/project_sel');
            project_change(id_prj);
        });
    }
    get_projects();

    $scope.project_change = project_change;
    function project_change(id_prj)
    {
        /* 从项目列表中查找选中的项目 */
        for (i = 0; i < $scope.project_lst.length; i++)
        {
            if ($scope.project_lst[i]['id'] != id_prj) continue;
            $scope.project_sel = $scope.project_lst[i];
            locals_write('/software_engineering/requirement/project_sel', $scope.project_sel['id']);
            break;
        }
    }

    /*************************************************************************
     *  Draw                                                                 *
     *************************************************************************/
    var color = d3.scaleOrdinal(d3.schemeCategory20);

    var svg = d3.select(".view_container").append("svg")
        .attr("width", width)
        .attr("height", height);
    
    let id_prj = locals_read('/software_engineering/requirement/project_sel');

    $http
    .get('/software_engineering/requirement/view/'+id_prj)
    .then((res) => {
        if (errorCheck(res)) return ;

        let graph = res.data.message;

        graph.nodes.forEach(function (v) { v.width = 60; v.height = 30;  })
        graph.groups.forEach(function (g) { g.padding = 0.01; });

        cola
            .nodes(graph.nodes)
            .links(graph.links)
            .groups(graph.groups)
            .start(100, 0, 50, 50);

        var group = svg.selectAll(".group")
            .data(graph.groups)
            .enter().append("rect")
            .attr("rx", 8).attr("ry", 8)
            .attr("class", "group")
            .style("fill", function (d, i) { return color(i); });

        var link = svg.selectAll(".link")
            .data(graph.links)
            .enter().append("line")
            .attr("class", "link");

        var pad = 2;
        var node = svg.selectAll(".node")
            .data(graph.nodes)
            .enter().append("rect")
            .attr("class", "node")
            .attr("width", function (d) { return d.width - 2 * pad; })
            .attr("height", function (d) { return d.height - 2 * pad; })
            .attr("rx", 5).attr("ry", 5)
            .style("fill", function (d) { return color(graph.groups.length); })
            .call(cola.drag)
            .on('mouseup', function (d) {
                d.fixed = 0;
                cola.alpha(1); // fire it off again to satify gridify
            });

            /*
        var label = svg.selectAll(".label")
            .data(graph.nodes)
            .enter().append("text")
            .attr("class", "label")
            .text(function (d) { return d.name; })
            .call(cola.drag);

        node.append("title")
            .text(function (d) { return d.name; });
*/
        cola.on("tick", function () {
            link.attr("x1", function (d) { return d.source.x; })
                .attr("y1", function (d) { return d.source.y; })
                .attr("x2", function (d) { return d.target.x; })
                .attr("y2", function (d) { return d.target.y; });

            node.attr("x", function (d) { return d.x - d.width / 2 + pad; })
                .attr("y", function (d) { return d.y - d.height / 2 + pad; });

            group.attr("x", function (d) { return d.bounds.x; })
                 .attr("y", function (d) { return d.bounds.y; })
                .attr("width", function (d) { return d.bounds.width(); })
                .attr("height", function (d) { return d.bounds.height(); });

            label.attr("x", function (d) { return d.x; })
                 .attr("y", function (d) {
                     var h = this.getBBox().height;
                     return d.y + h/4;
                 });
        });
    })
}
