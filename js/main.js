window.onload = function() {
    var w = 900, h = 500;

    var container = d3.select("body")
        .append("svg")
        .attr("width", w)
        .attr("height", h)
        .attr("class", "container")
        .style("background-color", "rgba(0,0,0,0.2)")
    
    var innerRect = d3.append("rect")
        .datum(400)
        .attr("width", 800)
        .attr("height", 400)
        .attr("class", "innerRect")
        .attr("x", 50)
        .attr("y", 50)
        .style("fill", "#FFFFFF");
    
    console.log(innerRect);
};