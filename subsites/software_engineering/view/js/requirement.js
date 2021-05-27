angular
.module('app', [])
.controller('appCtrl', appCtrl);


/* cola初始化 */
var height = $(window).height() - 70; // header 
var width  = $(window).width() - 30;

var color = d3.scale.category20();
var cola  = cola.d3adaptor(d3)
    .linkDistance(60)
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
    var outer = d3.select(".view_container").append("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("pointer-events", "all");

    outer.append('rect')
        .attr('class', 'background')
        .attr('width', "100%")
        .attr('height', "100%")
        .call(d3.behavior.zoom().on("zoom", redraw));

    var vis = outer.append('g');
    function redraw() {
        vis.attr("transform", "translate(" + d3.event.translate + ")" + " scale(" + d3.event.scale + ")");
    }
    
    var edgesLayer  = vis.append("g");
    var nodesLayer  = vis.append("g");
    var modelgraph, viewgraph = { nodes: [], links: [], groups:[]};

    function click(node) {
        console.log('cc');
        update();
    }

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

        var group = nodesLayer
            .selectAll(".group")
            .data(viewgraph.groups)
        group.enter().append("rect")
            .attr("rx", 8).attr("ry", 8)
            .attr("class", "group")
            .style("fill", function (d, i) { return color(i); });

        var node = nodesLayer.selectAll(".node")
            .data(viewgraph.nodes, function (d) { return d.viewgraphid; });

            
        var enter = node.enter().append("g")
            .on("touchmove", function () {
                d3.event.preventDefault()
            })
            .call(cola.drag);

        var pad = 20;
        enter.append("circle")
            .attr("r", 5)
            .attr("class", "node")
            .text(function (d) { return d.label; });
            //.attr("width", function (d) { return d.width - 2 * pad; })
            //.attr("height", function (d) { return d.height - 2 * pad; })

/*
        enter.append("circle")
            .attr("r", 5)
            .on("click", function (d) { click(d) })
            .on("touchend", function (d) { click(d) });
*/
        node.style("fill", function (d) { return d.colour; })
            .append("title")
            .text(function (d) { return d.label; });

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
            x['viewgraphid'] = idx; 
            x['width'] = x['height'] = 20; 
            return x;
        });
        viewgraph['groups'] = modelgraph['groups'].map((x, idx) => { return x; });
        update();
    });
}
