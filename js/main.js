(function(){

    var eduAttrs = ["total_population", "noHighSchool", "someHighSchool", "highSchoolGraduate", "someCollege", "associates", "bachelors", "graduate"];
    var pop = eduAttrs[0];
    var expressed = eduAttrs[1];
    
    window.onload = (event) => {
        setMap();
        setInset();
        setChart();
    };

    function setMap() {
        var width = window.innerWidth * 0.48,
            height = window.innerHeight * 0.85,
            viewBox = "0 0 " + width + " " + height;

        var mapDiv = d3.select("body")
            .append("div")
            .attr("width", width)
            .attr("height", height)
            .classed("mapDiv", true)

        var map = d3.select(".mapDiv")
            .append("svg")
            .attr("preserveAspectRatio", "xMinYMin meet")
            .attr("viewBox", viewBox)
            .classed("map", true);

        var prj = d3.geoAlbers()
            .center([0, 38.90])
            .rotate([77.038, 0])
            .parallels([35, 38])
            .scale(235000)
            .translate([width / 2, height / 2]);

        var path = d3.geoPath()
            .projection(prj);

        var promises = [];
        promises.push(d3.csv("data/education_attainment.csv")); //load education tabular data
        promises.push(d3.json("data/states_main.topojson")); //load background states shapes
        promises.push(d3.json("data/tracts_main.topojson")); //load foreground tracts shapes
        Promise.all(promises).then(callback);

        function callback(data, csvData, usStates, dcTracts) {

            csvData = data[0];
            statesData = data[1];
            tractsData = data[2];

            var usStates = topojson.feature(statesData, statesData.objects.states_final);
            var dcTracts = topojson.feature(tractsData, tractsData.objects.tracts_final).features;

            var states = map.append("path")
                .datum(usStates)
                .attr("class", "states")
                .attr("d", path);

            var colorScale = setColorScale(csvData);

            dcTracts = joinData(dcTracts, csvData);

            setEnumerationUnits(dcTracts, map, path, colorScale);
        }
    }

    function setColorScale(data){
        var colorClasses = [
            "#569E0F",
            "#4D8D0F",
            "#457D0E",
            "#3C6C0D",
            "#345C0C",
            "#2B4C0B",
            "#223C09"
        ];

        var colorScale = d3.scaleQuantile()
            .range(colorClasses);

        var domainArray = [];
        for (var i=0; i < data.length; i++){
            var val = parseFloat(data[i][expressed] / data[i][pop]);
            domainArray.push(val);
        };
        console.log(domainArray)
        colorScale.domain(domainArray);

        return colorScale;
    }

    function joinData(dcTracts, csvData){
        for (var i=0; i < csvData.length; i++){
            var csvRegion = csvData[i];
            var csvKey = csvRegion.tract_name;

            for (var j=0; j < dcTracts.length; j++){
                var tractsProps = dcTracts[j].properties;
                var tractsKey = tractsProps.NAMELSAD;

                if (tractsKey = csvKey){
                    eduAttrs.forEach(function(attr){
                        var val = parseFloat(csvRegion[attr]);
                        tractsProps[attr] = val;
                    });
                };
            };
        };
        console.log(dcTracts)
        return dcTracts;
    }

    function setEnumerationUnits(dcTracts, map, path, colorScale){
        var tracts = map.selectAll(".tracts")
            .data(dcTracts)
            .enter()
            .append("path")
            .attr("class", function(d) {
                return d.properties.NAME;
            })
            .attr("d", path)
            .style("fill", function(d){
                return colorScale(d.properties[expressed])
            });
    }

    function setInset() {
        var width = 300,
            height = 300
            viewBox = "0 0 300 300";
        
        var insetDiv = d3.select(".mapDiv")
            .append("div")
            .attr("width", width)
            .attr("height", height)
            .classed("insetDiv", true);
        
        var inset = d3.select(".insetDiv")
            .append("svg")
            .attr("preserveAspectRatio", "xMinYMin meet")
            .attr("viewBox", viewBox)
            .classed("inset", true)
        
        var prj = d3.geoAlbers()
            .center([0, 38.90])
            .rotate([77.038, 0])
            .parallels([35, 38])
            .scale(7500)
            .translate([width / 2, height / 2]);
        
        var path = d3.geoPath()
            .projection(prj)

        var promises = [];
        promises.push(d3.json("data/states_inset.topojson"));
        promises.push(d3.json("data/tracts_inset.topojson"));
        Promise.all(promises).then(callback);

        function callback(data) {

            statesData = data[0];
            tractsData = data[1];

            var usStates = topojson.feature(statesData, statesData.objects.states);
            var dcTracts = topojson.feature(tractsData, tractsData.objects.tracts).features;

            var states = inset.append("path")
                .datum(usStates)
                .attr("class", "states")
                .attr("d", path)
                .style("fill", "#E6E6E6");

            var tracts = inset.selectAll(".tracts")
                .data(dcTracts)
                .enter()
                .append("path")
                .attr("class", function(d) {
                    return d.properties.NAME;
                })
                .attr("d", path)
                .style("fill", "red"); 
        }
    }

    function setChart() {
        var width = window.innerWidth * 0.48,
            height = window.innerHeight * 0.85,
            viewBox = "0 0 " + width + " " + height;

        var chartDiv = d3.select("body")
            .append("div")
            .attr("width", width)
            .attr("height", height)
            .classed("chartDiv", true)

        var chart = d3.select(".chartDiv")
            .append("svg")
            .attr("preserveAspectRatio", "xMinYMin meet")
            .attr("viewBox", viewBox)
            .classed("chart", true);
    }
})();