
// Class the manages the view. Created with the initial graph,
// creates histograms and graph view, updates everything when
// filters or force configuration is changed.
function View(graph)
{
    this.graph = graph;

    // Factory function, called with a graph and must return function
    // that takes D3 force layout as parameter and configures it.
    this.forceConfigurationFactory = globalForceConfiguration
    
    // The number of most chatty people to filter out.
    this.topFilter = 0;

    this.setForceConfigurationFactory = function(forceConfigurationFactory) {
        this.forceConfigurationFactory = forceConfigurationFactory;
        this.update();
    }

    this.setTopFilter = function(topFilter) {
        this.topFilter = topFilter;
        this.update();
    }
    
    this.update = function() {

        // Update this.filteredGraph and data in histograms and
        // charts topFilter changes or we have no data yet.
        if (!this.filteredGraph || this.activeTopFilter != this.topFilter) {

            this.filteredGraph = filterData(this.graph, this.topFilter);
            this.activeTopFilter = this.topFilter;
        
            var h = histogram().value(function(d) { return d.count; });
            h.width(350);
            d3.select("#user-histogram svg").datum(this.filteredGraph.nodes).call(h);	
            h.width(730);
            d3.select("#pairs-histogram svg").datum(this.filteredGraph.pairs).call(h);

            var svg = d3.select("#graph svg");
                   
            this.force = createForceGraph(svg, this.filteredGraph, 1170, 600);
            this.activeForceConfiguration = null;
        }

        // If force configuration changed, start simulation with the new one.
        if (!this.activeForceConfiguration != this.forceConfigurationFactory) {

            if (this.activeForce)
                this.activeForce.stop();
            var forceConfigurator = this.forceConfigurationFactory(this.filteredGraph);        
            forceConfigurator(this.force);
            this.force.start();
            this.activeForce = this.force;
        }                
    }
}

function rank(entities, ranker)
{
    // Clone the array, but not elements, so that we can sort it.
    var work = entities.slice(0);

    work.sort(function(a, b) {
        return ranker(b) - ranker(a);
    });
    work.forEach(function(d, i) {
        d.rank = i;
    });
}

// Computes message counts per each person and per
// each pair of people.
function prepareData(graph)
{
    graph.nodes.forEach(function(n, i) { 
        n.count = 0; 
        n.topRecipient = null;
        n.topRecipientCount = 0;
    });
    pairs = {}

    graph.links.forEach(function (l) {
        var source = graph.nodes[l.source];
        var target = graph.nodes[l.target];

        // Update the message count for sender.
        source.count = (source.count || 0) + l.count;

        // Update top recipient
        if (l.count > source.topRecipientCount) {
            source.topRecipientCount = l.count;
            source.topRecipient = target.name;
        }

        // Update the pairwise interaction count.
        var key = [source.name, target.name];
        key.sort();
        pairs[key] = (pairs[key] || 0) + l.count;
    });

    rank(graph.nodes, function(d) { return d.count; });

    graph.pairs = [];
    for (key in pairs) {
        var parts = key.split(',');
        graph.pairs.push({first: parts[0], second: parts[1], count: pairs[key]});
    }

    rank(graph.pairs, function(d) { return d.count; });
}

// Creates new graph where topFilter most chatty people are
// removed.
function filterData(graph, topFilter)
{
    var result = {};

    var nodes = [];
    var nodesMap = {};
    var pairs = [];
    var links = [];
    var newIndex = [];

    graph.nodes.forEach(function(d) {
        if (d.rank >= topFilter) {
            newIndex.push(nodes.length);
            nodes.push(d);
            nodesMap[d.name] = 1;
        } else {
            newIndex.push(-1);
        }
    });
    result.nodes = nodes;
     
    graph.pairs.forEach(function(d) {
        if (nodesMap[d.first] == 1 && nodesMap[d.second] == 1)
            pairs.push(d);
    });
    result.pairs = pairs;

    graph.links.forEach(function(d) {
        var ns = newIndex[d.source];
        var nt = newIndex[d.target];
        if (ns != -1 && nt != -1)
            links.push({source: ns, target: nt, count: d.count});
    });
    result.links = links;

    return result;
}

// Makes force between each two people be proportional to
// the number of messages between them.
function globalForceConfiguration(graph)
{
    var top = d3.max(graph.links, function(d) { return d.count; });

    function call(force)
    {
        force.linkStrength(function(l) {
            return Math.pow(l.count/top, 4);
        }).charge(-120);
    }
    
    return call;
}

// Arranges for each person to be close to the top other person
// he communicates with
function localForceConfiguration(graph)
{
    function call(force)
    {
        force.linkStrength(function(l) {
            if (l.source.topRecipient == l.target.name)
                return 1;
            else
                return 0;
        })
            .charge(-120);
    }

    return call;
}


d3.json("irc.json", function(error, graph) {

    $(".data-loading").hide();
    $(".data-ready").show();

    prepareData(graph);
    var view = new View(graph);
    view.update();

    $("#tabs a[href='#global']").click(function (e) {
        e.preventDefault();
        view.setForceConfigurationFactory(globalForceConfiguration);
        $(this).tab("show");
    });

    $("#tabs a[href='#local']").click(function (e) {
        e.preventDefault();
        view.setForceConfigurationFactory(localForceConfiguration);
        $(this).tab("show");
    });

    $("#tabs a[href='#showAll']").click(function(e) {
        e.preventDefault();
        view.setTopFilter(0);
        $(this).parent().parent().find("li").removeClass("active");
        $(this).parent().addClass("active");
    });
    $("#tabs a[href='#excludeTop10']").click(function(e) {
        e.preventDefault();
        view.setTopFilter(10);
        $(this).parent().parent().find("li").removeClass("active");
        $(this).parent().addClass("active");
    });
    $("#tabs a[href='#excludeTop20']").click(function(e) {
        e.preventDefault();
        view.setTopFilter(20);
        $(this).parent().parent().find("li").removeClass("active");
        $(this).parent().addClass("active");
    });
});

