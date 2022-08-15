(function(){

    var eduAttrs = ["noHighSchool", "someHighSchool", "highSchoolGraduate", "someCollege", "associates", "bachelors", "graduate"];
    var expressed = eduAttrs[0];
    
    window.onload = (event) => {
        setMap();
    };

    function setMap() {
        var width = window.innerWidth * 0.48,
            height = window.innerHeight * 0.80,
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
            .scale(225000)
            .translate([width / 2, height / 2]);

        var path = d3.geoPath()
            .projection(prj);

        var promises = [];
        promises.push(d3.csv("data/education_attainment.csv")); //load education tabular data
        promises.push(d3.json("data/states_main.topojson")); //load background states shapes
        promises.push(d3.json("data/tracts_main.topojson")); //load foreground tracts shapes
        promises.push(d3.json("data/states_inset.topojson")); //load inset states shapes
        promises.push(d3.json("data/tracts_inset.topojson")); //load inset tracts shapes
        Promise.all(promises).then(callback);

        function callback(data, csvData, usStates, dcTracts, lowStates, lowTracts) {

            csvData = data[0];
            statesData = data[1];
            tractsData = data[2];
            coreStatesData = data[3];
            coreTractsData = data[4];

            var usStates = topojson.feature(statesData, statesData.objects.states_final);
            var tracts = topojson.feature(tractsData, tractsData.objects.tracts_final).features;
            var lowStates = topojson.feature(coreStatesData, coreStatesData.objects.states);
            var lowTracts = topojson.feature(coreTractsData, coreTractsData.objects.tracts).features;
            
            var states = map.append("path")
                .datum(usStates)
                .attr("class", "states")
                .attr("d", path);

            var colorScale = setColorScale(csvData);

            dcTracts = joinData(tracts, csvData);

            setEnumerationUnits(dcTracts, map, path, colorScale);

            setInset(lowStates, lowTracts);

            setChart(csvData, colorScale);

            createDropdown(csvData);
        }
    }

    function setColorScale(data){
        var colorClasses = [
            "#edf8e9",
            "#bae4b3",
            "#74c476",
            "#31a354",
            "#006d2c"
        ];

        var colorScale = d3.scaleQuantile()
            .range(colorClasses);

        var domainArray = [];
        for (var i=0; i < data.length; i++){
            var val = parseFloat(data[i][expressed]);
            domainArray.push(val);
        };

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

                if (tractsKey == csvKey){
                    eduAttrs.forEach(function(attr){
                        var val = parseFloat(csvRegion[attr]);
                        tractsProps[attr] = val;
                    });
                };
            };
        };
        return dcTracts;
    }

    function setEnumerationUnits(dcTracts, map, path, colorScale){
        var tracts = map.selectAll(".tracts")
            .data(dcTracts)
            .enter()
            .append("path")
            .attr("class", function(d) {
                var className = d.properties.NAME.replace(".", "-")
                return "tracts_" + className;
            })
            .attr("d", path)
            .style("fill", function(d){
                return colorScale(d.properties[expressed])
            })
            .on("mouseover", (d) => {
                highlight(d.target.__data__.properties);
            });
        
        var desc = tracts.append("desc")
            .text('{"stroke": "#000", "stroke-width": "0px"}');
    }

    function setInset(usStates, dcTracts) {
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
            .scale(7000)
            .translate([width / 2, height / 2]);
        
        var path = d3.geoPath()
            .projection(prj)

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

    function setChart(csvData, colorScale) {
        var width = window.innerWidth * 0.48,
            height = window.innerHeight * 0.80,
            viewBox = "0 0 " + width + " " + height;

        var chartDiv = d3.select("body")
            .append("div")
            .attr("width", width)
            .attr("height", height)
            .classed("chartDiv", true);

        data = [];
        for(var i = 0; i < csvData.length; i++){
            datum = {};
            datum.name = csvData[i].tract_number;
            datum.value = csvData[i][expressed];
            data.push(datum);
        }
        
        var bubble = BubbleChart(data, {
                        name: d => "",
                        title: d => "Census Tract: " + d.name + "\nCount: " + d.value,
                        value: d => d.value,
                        fill: d => colorScale(d.value),
                        width: 800
                    });
        $(".chartDiv").append(bubble);
    }

    function createDropdown(csvData){
        var dropdown = d3.select("body")
            .append("select")
            .attr("class", "dropdown")
            .on("change", function(){
                changeAttribute(this.value, csvData)
            });
        
        var titleOption = dropdown.append("option")
            .attr("class", "titleOption")
            .attr("disabled", "true")
            .text("Select Education Level");
        
        var attrOptions = dropdown.selectAll("attrOptions")
            .data(eduAttrs)
            .enter()
            .append("option")
            .attr("value", function(d){ return d })
            .text(function(d){
                if(d == "noHighSchool"){
                    return "No High School";
                } else if(d == "someHighSchool"){
                    return "Some High School";
                } else if(d == "highSchoolGraduate"){
                    return "High School Graduate";
                } else if(d == "someCollege"){
                    return "Some College";
                } else if(d == "associates"){
                    return "Associates Degree";
                } else if(d == "bachelors"){
                    return "Bachelors Degree";
                } else if(d == "graduate"){
                    return "Graduate Degree";
                }
            });
    }

    function changeAttribute(attribute, csvData){
        expressed = attribute;

        var colorScale = setColorScale(csvData);

        var tracts = d3.selectAll(".tracts")
            .style("fill", function(d){
                return colorScale(d.properties[expressed])
            });

        d3.select(".chartDiv").remove();
        setChart(csvData, colorScale);
    }

    function highlight(props){
        var className = ".tracts_" + props.NAME.replace(".", "-")
        var selected = d3.selectAll(className)
            .style("stroke", "cyan")
            .style("stroke-width", "2.5");
    }

    // Copyright 2021 Observable, Inc.
    // Released under the ISC license.
    // https://observablehq.com/@d3/bubble-chart
    function BubbleChart(data, {
        name = ([x]) => x, // alias for label
        label = name, // given d in data, returns text to display on the bubble
        value = ([, y]) => y, // given d in data, returns a quantitative size
        group, // given d in data, returns a categorical value for color
        title, // given d in data, returns text to show on hover
        link, // given a node d, its link (if any)
        linkTarget = "_blank", // the target attribute for links, if any
        width = 640, // outer width, in pixels
        height = width, // outer height, in pixels
        padding = 3, // padding between circles
        margin = 1, // default margins
        marginTop = margin, // top margin, in pixels
        marginRight = margin, // right margin, in pixels
        marginBottom = margin, // bottom margin, in pixels
        marginLeft = margin, // left margin, in pixels
        groups, // array of group names (the domain of the color scale)
        colors = d3.schemeTableau10, // an array of colors (for groups)
        fill = "#ccc", // a static fill color, if no group channel is specified
        fillOpacity = 1, // the fill opacity of the bubbles
        stroke, // a static stroke around the bubbles
        strokeWidth, // the stroke width around the bubbles, if any
        strokeOpacity, // the stroke opacity around the bubbles, if any
    } = {}) {
        // Compute the values.
        const D = d3.map(data, d => d);
        const V = d3.map(data, value);
        const G = group == null ? null : d3.map(data, group);
        const I = d3.range(V.length).filter(i => V[i] > 0);
    
        // Unique the groups.
        if (G && groups === undefined) groups = I.map(i => G[i]);
        groups = G && new d3.InternSet(groups);
    
        // Construct scales.
        const color = G && d3.scaleOrdinal(groups, colors);
    
        // Compute labels and titles.
        const L = label == null ? null : d3.map(data, label);
        const T = title === undefined ? L : title == null ? null : d3.map(data, title);
    
        // Compute layout: create a 1-deep hierarchy, and pack it.
        const root = d3.pack()
            .size([width - marginLeft - marginRight, height - marginTop - marginBottom])
            .padding(padding)
        (d3.hierarchy({children: I})
            .sum(i => V[i]));
    
        const svg = d3.create("svg")
            .attr("width", width)
            .attr("height", height)
            .attr("viewBox", [-marginLeft, -marginTop, width, height])
            .attr("style", "max-width: 100%; height: auto; height: intrinsic;")
            .attr("fill", "currentColor")
            .attr("font-size", 10)
            .attr("font-family", "sans-serif")
            .attr("text-anchor", "middle")
            .attr("class", "bubbleChart");
    
        const leaf = svg.selectAll("a")
        .data(root.leaves())
        .join("a")
            .attr("xlink:href", link == null ? null : (d, i) => link(D[d.data], i, data))
            .attr("target", link == null ? null : linkTarget)
            .attr("transform", d => `translate(${d.x},${d.y})`);
    
        leaf.append("circle")
            .attr("stroke", stroke)
            .attr("stroke-width", strokeWidth)
            .attr("stroke-opacity", strokeOpacity)
            .attr("fill", G ? d => color(G[d.data]) : fill == null ? "none" : fill)
            .attr("fill-opacity", fillOpacity)
            .attr("r", d => d.r)
            .attr("class", data.name);
    
        if (T) leaf.append("title")
            .text(d => T[d.data]);
    
        if (L) {
        // A unique identifier for clip paths (to avoid conflicts).
        const uid = `O-${Math.random().toString(16).slice(2)}`;
    
        leaf.append("clipPath")
            .attr("id", d => `${uid}-clip-${d.data}`)
            .append("circle")
            .attr("r", d => d.r);
    
        leaf.append("text")
            .attr("clip-path", d => `url(${new URL(`#${uid}-clip-${d.data}`, location)})`)
            .selectAll("tspan")
            .data(d => `${L[d.data]}`.split(/\n/g))
            .join("tspan")
            .attr("x", 0)
            .attr("y", (d, i, D) => `${i - D.length / 2 + 0.85}em`)
            .attr("fill-opacity", (d, i, D) => i === D.length - 1 ? 0.7 : null)
            .text(d => d);
        }
    
        return Object.assign(svg.node(), {scales: {color}});
    }
})();