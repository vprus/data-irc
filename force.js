
// Makes 'svg' element display a graph layout of specified width
// Creates and returns force layout, but does not start it.
function createForceGraph(svg, graph, width, height)
{
    svg.attr("width", width).attr("height", height);

    // For simplicity, just remove all existing content.
    svg.select("g").remove();
    svg = svg.append("g");

    svg = svg.append("g").attr("transform", "translate(" + 0 + "," + 0 + ")");

    var nodes = graph.nodes;
    var links = graph.links;

    var top = d3.max(links, function(d) { return d.count; });

    var force = d3.layout.force()
        .charge(-320)
        .size([width, height])
        .nodes(nodes)
        .links(links);

    var linkSelection = svg.selectAll(".link").data(links);

    linkSelection.enter().append("line")
        .attr("class", "link")
        .style("stroke-width", function(d) { return Math.sqrt(d.count/top)*4; });

    var nodeSelection = svg.selectAll(".node").data(nodes);

    nodeSelection.enter().append("circle")
        .attr("class", "node")
        .attr("r", 5)
        .call(force.drag);

    nodeSelection.append("title")
        .text(function(d) { return d.name; });

    force.on("tick", function() {
        linkSelection.attr("x1", function(d) { return d.source.x; })
            .attr("y1", function(d) { return d.source.y; })
            .attr("x2", function(d) { return d.target.x; })
            .attr("y2", function(d) { return d.target.y; });

        nodeSelection.attr("cx", function(d) { return d.x; })
            .attr("cy", function(d) { return d.y; });
    });

    return force;
}
