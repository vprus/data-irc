
function histogram()
{
    var margin = {top: 20, right: 30, bottom: 30, left: 30};
    var width = 540;
    var height = 500;
    var valuer = function(d) { return d; }

    width = width - margin.left - margin.right;
    height = height - margin.top - margin.bottom;

    function my(selection)
    {
        selection.each(function(values) {

            var formatCount = d3.format(",.0f");
          
            var x = d3.scale.linear()
                .domain([0, d3.max(values, valuer)])
                .range([0, my.width()]);

            var data = d3.layout.histogram()
                .bins(x.ticks(20))
                .value(valuer)
            (values);

            var y = d3.scale
                .sqrt()
                .domain([0, d3.max(data, function(d) { return d.y; })])
                .range([0, height]);

            var svg = d3.select(this)
                .attr("width", my.width() + margin.left + margin.right)
                .attr("height", my.height() + margin.top + margin.bottom);

            // Don't have time to implement nice animation. Just remove whatever
            // is shown now and draw again.
            svg.select("g").remove();

            svg = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

            var bars = svg.selectAll(".bar").data(data);

            var bar = bars.enter().append("g")
                .attr("class", "bar")
                .attr("transform", function(d) { return "translate(" + x(d.x) + "," + (height - y(d.y)) + ")"; });
			
	    bar.append("rect")
	        .attr("x", 1)
	        .attr("width", x(data[0].dx) - 1)
	        .attr("height", function(d) { return y(d.y); })

            bar.append("text")
                .attr("x", x(data[0].dx)/2)
                .attr("y", 6)
                .attr("dy", "-.75em")
                .attr("text-anchor", "middle")
                .text(function(d) { return formatCount(d.y); })
            ;

            var xAxis = d3.svg.axis()
                .scale(x)
                .orient("bottom");

            svg.append("g")
                .attr("class", "x axis")
                .attr("transform", "translate(0," + height + ")")
                .call(xAxis);

        });
    }

    my.width = function(value) {
        if (!arguments.length) return width;
        width = value;
        return my;
    };

    my.height = function(value ) {
        if (!arguments.length) return height;
        height = value;
        return my;
    };

    my.value = function(v) {
        if (!arguments.length) return valuer;
        valuer = v;
        return my;
    };

    return my;
}
