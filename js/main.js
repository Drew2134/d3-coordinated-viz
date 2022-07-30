window.onload = setMap();

function setMap() {
    var width = 960, height = 460;

    var map = d3.select("body")
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    var prj = d3.geo.albers()
        .center([-8, 46.2])
        .rotate([-10, 0])
        .parallels([43, 62])
        .scale(1000)
        .translate([width / 2, height / 2]);

    var path = d3.geo.path()
        .projection(prj);

    var promises = [];
    promises.push(d3.csv("data/education_attainment.csv")); //load education tabular data
    promises.push(d3.json("data/states.topojson")); //load background states shapes
    promises.push(d3.json("data/tracts.topojson")); //load foreground tracts shapes
    Promise.all(promises).then(callback);

    function callback(data) {
        var states = map.append("path")
            .datum(toposon.feature(
                data[1], data[1].objects
            ))
            
        console.log(csvData, states, tracts)
    }
}