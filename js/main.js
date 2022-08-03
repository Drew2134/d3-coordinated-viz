window.onload = setMap();

function setMap() {
    var width = 960, height = 460;

    var map = d3.select("body")
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    var prj = d3.geoAlbers()
        .center([0, 38.9072])
        .rotate([77.0369, 0])
        .parallels([35, 40])
        .scale(2000)
        .translate([width / 2, height / 2]);

    var path = d3.geoPath()
        .projection(prj);

    var promises = [];
    promises.push(d3.csv("data/education_attainment.csv")); //load education tabular data
    promises.push(d3.json("data/states.topojson")); //load background states shapes
    promises.push(d3.json("data/tracts.topojson")); //load foreground tracts shapes
    Promise.all(promises).then(callback);

    function callback(data) {

		csvData = data[0];
		statesData = data[1];
		tractsData = data[2];

        var usStates = topojson.feature(statesData, statesData.objects.states)

        var states = map.append("path")
            .datum(usStates)
            .attr("class", "states")
            .attr("d", path);
    }
}