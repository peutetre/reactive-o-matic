function timeSeriesChart(opts) {
    var defaults = { width: 800, height: 400, margin : {top: 20, right: 30, bottom: 20, left: 20}},
        conf = extend(defaults, opts),
        margin = conf.margin,
        width = conf.width,
        height = conf.height,
        xValue = function(d) { return d[0]},
        yValue = function(d) { return d[1]},

        xScale = d3.time.scale(),
        yScale = d3.scale.linear(),
        xAxis = d3.svg.axis().scale(xScale).orient("bottom").tickSize(3, 0),
        yAxis = d3.svg.axis().scale(yScale).orient("right").ticks(5).tickSize(3, 0),
        line = d3.svg.line().x(X).y(Y).interpolate("basis");

    function extend(a, b){
        for(var key in b)
            if(b.hasOwnProperty(key))
                a[key] = b[key];
        return a;
    }

    function chart(selection) {
        selection.each(function(data) {

            // Convert data to standard representation greedily;
            // this is needed for nondeterministic accessors.
            data = data.map(function(d, i) {
                return [xValue.call(data, d, i), yValue.call(data, d, i)];
            });

            // Update the x-scale.
            xScale
                .domain(d3.extent(data, function(d) {
                    return d[0];
                }))
                .range([0, width - margin.left - margin.right]);

            // Update the y-scale.
            yScale
                .domain([0, d3.max(data, function(d) {
                    return d[1];
                })])
                .range([height - margin.top - margin.bottom, 0]);

            // Select the svg element, if it exists.
            var svg = d3.select(this).selectAll("svg").data([data]);

            // Otherwise, create the skeletal chart.
            var gEnter = svg.enter().append("svg").append("g");

            if(conf.title) gEnter.append("text").attr('class','title').text(conf.title);
            gEnter.append("path").attr("class", "line");
            gEnter.append("g").attr("class", "x axis");
            gEnter.append("g").attr("class", "y axis").attr("transform", "translate(0,0)");

            // Update the outer dimensions.
            svg .attr("width", width)
                .attr("height", height);

            // Update the inner dimensions.
            var g = svg.select("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

            // Update the line path.
            g.select(".line")
                .transition()
                .ease("linear")
                .duration(500)
                .attr("d", line);

            // Update the x-axis.
            g.select(".x.axis")
                .attr("transform", "translate(0," + yScale.range()[0] + ")")
                .transition()
                .ease("linear")
                .duration(500)
                .call(xAxis);

            // Update the y-axis.
            g.select(".y.axis")
                .attr("transform", "translate("+xScale.range()[1]+",0)")
                .transition()
                .ease("linear")
                .duration(500)
                .call(yAxis);
        });
    }

    // The x-accessor for the path generator; xScale âˆ˜ xValue.
    function X(d) {
        return xScale(d[0]);
    }

    // The x-accessor for the path generator; yScale âˆ˜ yValue.
    function Y(d) {
        return yScale(d[1]);
    }

    chart.margin = function(_) {
        if (!arguments.length) return margin;
        margin = _;
        return chart;
    };

    chart.width = function(_) {
        if (!arguments.length) return width;
        width = _;
        return chart;
    };

    chart.height = function(_) {
        if (!arguments.length) return height;
        height = _;
        return chart;
    };

    chart.x = function(_) {
        if (!arguments.length) return xValue;
        xValue = _;
        return chart;
    };

    chart.y = function(_) {
        if (!arguments.length) return yValue;
        yValue = _;
        return chart;
    };

    return chart;
}