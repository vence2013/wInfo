angular
.module('app', [])
.controller('appCtrl', appCtrl);


/* cola初始化 */
var height = $(window).height() - 70; // header 
var width  = $(window).width() - 30;

var color = d3.scale.category20();
var cola  = cola.d3adaptor(d3)
    .linkDistance(220)
    .avoidOverlaps(true)
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
    var outer = d3.select(".view_container").append("svg")
        .attr("width", width).attr("height", height)
        .attr("pointer-events", "all");

    outer.append('rect')
        .attr('class', 'background')
        .attr('width', "100%").attr('height', "100%")
        .call(d3.behavior.zoom().on("zoom", redraw));

    function redraw() {
        vis.attr("transform", "translate(" + d3.event.translate + ")" + " scale(" + d3.event.scale + ")");
    }
    
    var vis = outer.append('g');
    var groupsLayer = vis.append("g");
    var edgesLayer  = vis.append("g");
    var nodesLayer  = vis.append("g");
    var modelgraph, viewgraph = { nodes: [], links: [], groups:[]};

    function update() {
        cola.nodes(viewgraph.nodes)
            .links(viewgraph.links)
            .groups(viewgraph.groups)
            .start();

        var link = edgesLayer
            .selectAll(".link")
            .data(viewgraph.links);
        link.enter().append("line")
            .attr("class", "link")
            .style("stroke-width", 2);
        link.exit().remove();

        var group = groupsLayer
            .selectAll(".group")
            .data(viewgraph.groups)
        group.enter().append("rect")
            .attr("rx", 8).attr("ry", 8)
            .attr("class", "group")
            .style("fill", function (d, i) { return color(i); });

        var pad = 10;
        var node = nodesLayer.selectAll(".node")
            .data(viewgraph.nodes)
            .enter().append("rect")
            .attr("width", function (d) { return d.width - 2 * pad; })
            .attr("height", function (d) { return d.height - 2 * pad; })
            .attr("rx", 5).attr("ry", 5)
            .style("fill", function (d) { return color(viewgraph.groups.length); })
            .call(cola.drag);

        var label = nodesLayer.selectAll(".label")
            .data(viewgraph.nodes)
            .enter().append("text")
            .attr("class", "label")
            .text(function (d) { return d.label; })
            .on("mouseover", function () { console.log('display detail'); })
            .call(cola.drag);

        node.append("title")
            .text(function (d) { return d.name; });

        cola.on("tick", function () {
            link.attr("x1", function (d) { return d.source.x; })
                .attr("y1", function (d) { return d.source.y; })
                .attr("x2", function (d) { return d.target.x; })
                .attr("y2", function (d) { return d.target.y; });

            group
                .attr("x", function (d) { return d.bounds.x; })
                .attr("y", function (d) { return d.bounds.y; })
                .attr("width", function (d) { return d.bounds.width(); })
                .attr("height", function (d) { return d.bounds.height(); });

            label
                .attr("x", function (d) { return d.x; })
                .attr("y", function (d) {
                    var h = this.getBBox().height;
                    return d.y + 20;
                });

            node.attr("transform", function (d) { return "translate(" + d.x + "," + d.y + ")"; });
        });
    }


    let id_prj = locals_read('/software_engineering/requirement/project_sel');
    $http
    .get('/software_engineering/requirement/view/'+id_prj)
    .then((res) => {
        if (errorCheck(res)) return ;

        modelgraph = res.data.message;

        viewgraph['nodes'] = modelgraph['nodes'].map((x, idx) => {
            x['width'] = 20 + 16 * x.label.length; 
            x['height'] = 45; 
            return x;
        });
        viewgraph['groups'] = modelgraph['groups'];
        viewgraph['links']  = modelgraph['links'];
        update();
    });
}
