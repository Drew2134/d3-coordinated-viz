window.onload = (event) => {
    setMap();
    setInset();
};

function setMap() {
    var width = window.innerWidth * 0.50,
        height = 900;

    var mapDiv = d3.select("body")
        .append("div")
        .attr("width", width)
        .attr("height", height)
        .attr("class", "mapDiv")

    var map = d3.select("body")
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("class", "map");

    var prj = d3.geoAlbers()
        .center([0, 38.90])
        .rotate([77.0369, 0])
        .parallels([35, 40])
        .scale(225000)
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

        var usStates = topojson.feature(statesData, statesData.objects.states);
        var dcTracts = topojson.feature(tractsData, tractsData.objects.tracts).features;

        var states = map.append("path")
            .datum(usStates)
            .attr("class", "states")
            .attr("d", path);

        var tracts = map.selectAll(".tracts")
            .data(dcTracts)
            .enter()
            .append("path")
            .attr("class", function(d) {
                return d.properties.NAME;
            })
            .attr("d", path);
    }
}

function setInset() {
    console.log("Inset Map");
}

function setChart() {
    var chartWidth = window.innerWidth * 0.425,
        chartHeight = 460;

    var chart = d3.select("body")
        .append("svg")
        .attr("width", chartWidth)
        .attr("height", chartHeight)
        .attr("class", "chart");
}