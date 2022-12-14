(function(){

    //pseudo-global variable for the current selected attribute
    var eduAttrs = ["noHighSchool", "someHighSchool", "highSchoolGraduate", "someCollege", "associates", "bachelors", "graduate"];
    var expressed = eduAttrs[0];
    
    //run map setup after the window is finished loading
    window.onload = (event) => {
        setMap();
    };

    //main map set up function
    function setMap() {

        //set the size of the map view box
        var width = window.innerWidth * 0.48,
            height = window.innerHeight * 0.80,
            viewBox = "0 0 " + width + " " + height;

        //create map div element
        var mapDiv = d3.select("body")
            .append("div")
            .attr("width", width)
            .attr("height", height)
            .classed("mapDiv", true)

        //create map svg
        var map = d3.select(".mapDiv")
            .append("svg")
            .attr("preserveAspectRatio", "xMinYMin meet")
            .attr("viewBox", viewBox)
            .classed("map", true);

        //set map projection to geoAlbers center on the center of D.C.
        var prj = d3.geoAlbers()
            .center([0, 38.90])
            .rotate([77.038, 0])
            .parallels([35, 38])
            .scale(225000)
            .translate([width / 2, height / 2]);

        var path = d3.geoPath()
            .projection(prj);

        //use promises to load all of the topojson files needed
        var promises = [];
        promises.push(d3.csv("data/education_attainment.csv")); //load education tabular data
        promises.push(d3.json("data/states_main.topojson")); //load background states shapes
        promises.push(d3.json("data/tracts_main.topojson")); //load foreground tracts shapes
        promises.push(d3.json("data/states_inset.topojson")); //load inset states shapes
        promises.push(d3.json("data/tracts_inset.topojson")); //load inset tracts shapes
        Promise.all(promises).then(callback);

        function callback(data, csvData, usStates, dcTracts, lowStates, lowTracts) {

            //pull the loaded data from the array of promises
            csvData = data[0];
            statesData = data[1];
            tractsData = data[2];
            coreStatesData = data[3];
            coreTractsData = data[4];

            //assign the features from each data source to variables
            var usStates = topojson.feature(statesData, statesData.objects.states_final);
            var tracts = topojson.feature(tractsData, tractsData.objects.tracts_final).features;
            var lowStates = topojson.feature(coreStatesData, coreStatesData.objects.states);
            var lowTracts = topojson.feature(coreTractsData, coreTractsData.objects.tracts).features;
            
            //generate the paths for the state outlines
            var states = map.append("path")
                .datum(usStates)
                .attr("class", "states")
                .attr("d", path);

            //assign the color scale function to a variable for setting the enumeration units and bubble chart
            var colorScale = setColorScale(csvData);

            //assign the joined csv and tract topojson data to a common variable
            dcTracts = joinData(tracts, csvData);

            //call enumeration generator function
            setEnumerationUnits(dcTracts, map, path, colorScale);

            //inset map generator function
            setInset(lowStates, lowTracts);

            //call cahrt generator function
            setChart(csvData, colorScale);

            //call dropdown generator function
            createDropdown(csvData);
        }
    }

    //use d3 scale qunatile to create a color scale for choropleth mapping
    function setColorScale(data){
        //range of colors to use as mapping scale
        var colorClasses = [
            "#edf8fb",
            "#b2e2e2",
            "#66c2a4",
            "#2ca25f",
            "#006d2c"
        ];

        var colorScale = d3.scaleQuantile()
            .range(colorClasses);

        var domainArray = [];
        for (var i=0; i < data.length; i++){
            var val = parseFloat(data[i][expressed]);
            domainArray.push(val);
        };

        //pass array of all expressed values to the domain of the color scale
        colorScale.domain(domainArray);

        return colorScale;
    }

    //join the csv data to the census tracts
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

    //create a choropleth map
    function setEnumerationUnits(dcTracts, map, path, colorScale){
        //draws the census tracts
        var tracts = map.selectAll(".tracts")
            .data(dcTracts)
            .enter()
            .append("path")
            .attr("class", (d) => {
                var className = d.properties.NAME.replace(".", "-")
                return "tracts_" + className;
            })
            .attr("d", path)
            .style("fill", function(d){
                //uses the color scale to return appropriate color
                return colorScale(d.properties[expressed])
            })
            .on("mouseover", (e) => {
                //pass current target to highlight function
                highlight(e.target.__data__.properties);
            })
            .on("mouseout", (e) => {
                //pass previous target to dehighlight function
                dehighlight(e.fromElement.__data__.properties)
            })
            .on("mousemove", (e) => {
                //listen for cursor move and pass to move label function
                moveLabel(e)
            });
        
        var desc = tracts.append("desc")
            .text('{"stroke": "#000", "stroke-width": "0.5px"}');
    }

    //create an inset map to show we are looking at D.C.
    function setInset(usStates, dcTracts) {
        //inset div size properties
        var width = 300,
            height = 300
            viewBox = "0 0 300 300";

        //create inset div container        
        var insetDiv = d3.select(".mapDiv")
            .append("div")
            .attr("width", width)
            .attr("height", height)
            .classed("insetDiv", true);
        
        //create an svg in the inset div container
        var inset = d3.select(".insetDiv")
            .append("svg")
            .attr("preserveAspectRatio", "xMinYMin meet")
            .attr("viewBox", viewBox)
            .classed("inset", true)
        
        //center on D.C. and zoom out
        var prj = d3.geoAlbers()
            .center([0, 38.90])
            .rotate([77.038, 0])
            .parallels([35, 38])
            .scale(7000)
            .translate([width / 2, height / 2]);
        
        var path = d3.geoPath()
            .projection(prj)

        //draw the state outlines
        var states = inset.append("path")
            .datum(usStates)
            .attr("class", "states")
            .attr("d", path)
            .style("fill", "#E6E6E6");

        //draw the tract outlines and color red to stand out
        var tracts = inset.selectAll(".tracts")
            .data(dcTracts)
            .enter()
            .append("path")
            .attr("class", (d) => {
                return d.properties.NAME;
            })
            .attr("d", path)
            .style("fill", "red"); 
    }

    //function to set up the bubble chart and display it on the page
    function setChart(csvData, colorScale) {
        //chart div size properties
        var width = window.innerWidth * 0.48,
            height = window.innerHeight * 0.80,
            viewBox = "0 0 " + width + " " + height;

        var chartDiv = d3.select("body")
            .append("div")
            .attr("width", width)
            .attr("height", height)
            .classed("chartDiv", true);

        //gather the data to pass to the bubble chart constructor
        //bubble chart only takes a name and a value as the data
        data = [];
        for(var i = 0; i < csvData.length; i++){
            datum = {};
            datum.name = csvData[i].tract_number;
            datum.value = csvData[i][expressed];
            data.push(datum);
        }
        
        //create the bubble chart
        var bubbleChart = BubbleChart(data, {
                        name: d => "bubble_" + d.name.replace(".", "-"),
                        label: d => "",
                        title: d => "Census Tract: " + d.name + "\nCount: " + d.value,
                        value: d => d.value,
                        fill: d => colorScale(d.value),
                        width: 800
                    });
        //append the bubble chart svg to the chart div
        $(".chartDiv").append(bubbleChart);
    }

    //create a new dropdown
    function createDropdown(csvData){
        //create dropdown element
        var dropdown = d3.select("body")
            .append("select")
            .attr("class", "dropdown")
            .on("change", function(){
                changeAttribute(this.value, csvData)
            });
        
        //default value of the dropdown list
        var titleOption = dropdown.append("option")
            .attr("class", "titleOption")
            .attr("disabled", "true")
            .text("Select Education Level");
        
        //create new list items from education attributes        
        var attrOptions = dropdown.selectAll("attrOptions")
            .data(eduAttrs)
            .enter()
            .append("option")
            .attr("value", (d) => {
                return d
            })
            .text((d) => {
                //return a formatted version of the field names as the dropdown items
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

    //change the expressed attribute value
    function changeAttribute(attribute, csvData){
        expressed = attribute;

        //get new color scale from selected variable
        var colorScale = setColorScale(csvData);

        //style the census tracts with the new color scale
        var tracts = d3.selectAll("[class^='tract']")
            .style("fill", function(d){
                return colorScale(d.properties[expressed])
            });

        //remove old chart from DOM and re-build with new color scale and values
        //bubble chart needs to be re-built for proper sizing and alignment
        d3.select(".chartDiv").remove();
        setChart(csvData, colorScale);
    }

    //highlight tracts and linked bubbles on tract mouseover
    function highlight(props){
        var className = ".tracts_" + props.NAME.replace(".", "-")
        var selectedTract = d3.selectAll(className)
            .style("stroke", "magenta")
            .style("stroke-width", "3.5");
            
        var bubbleName = ".bubble_" + props.NAME.replace(".", "-")
        var selectedBubble = d3.selectAll(bubbleName)
            .style("stroke", "magenta")
            .style("stroke-width", "3.5");
        
        setLabel(props);
    }

    //remove the highlighting on mouseout
    function dehighlight(props){
        //selects all previously hovered tracts and resets the style
        var className = ".tracts_" + props.NAME.replace(".", "-")
        var selectedTract = d3.selectAll(className)
            .style("stroke", "#000000")
            .style("stroke-width", "0");
        
        //selects all previously linked bubbles and resets the style
        var bubbleName = ".bubble_" + props.NAME.replace(".", "-")
        var selectedBubble = d3.selectAll(bubbleName)
            .style("stroke", "#000000")
            .style("stroke-width", "0");

        //removes the previously hovered tract popup from the DOM
        d3.select(".infolabel")
            .remove();
    }

    //sets a new popup template when hovered over tract
    function setLabel(props){
        //get the current expressed variable and format it for a label
        var label = ""
        if(expressed == "noHighSchool"){
            label = "No High School";
        } else if(expressed == "someHighSchool"){
            label = "Some High School";
        } else if(expressed == "highSchoolGraduate"){
            label = "High School Graduate";
        } else if(expressed == "someCollege"){
            label = "Some College";
        } else if(expressed == "associates"){
            label = "Associates Degree";
        } else if(expressed == "bachelors"){
            label = "Bachelors Degree";
        } else if(expressed == "graduate"){
            label = "Graduate Degree";
        }

        //get the tract name and count of people
        var labelAttr = "<h1>Census Tract: " + props.NAME + "</h1><h2>" + props[expressed] + " people</h2>"

        //create the popup
        var infolabel = d3.select("body")
            .append("div")
            .attr("class", "infolabel")
            .attr("id", props.NAMELSAD + "_label")
            .html(labelAttr);
    
        var regionName = infolabel.append("div")
            .attr("class", "labelname")
            .html(label);
    }

    //updates the x,y location of the popup to follow the cursor
    function moveLabel(d){
        var x = d.clientX + 20,
            y = d.clientY - 75;
    
        d3.select(".infolabel")
            .style("left", x + "px")
            .style("top", y + "px");
    };

    //needed separate set of event listeners on bubbles
    //the circles in the svg do not hold the data in the same manner as the tracts
    function highlightBubble(props){
        //pull tract number from tract name
        var tract_num = props.className.baseVal.slice(7)

        //select all bubbles with matching tract number and highlight magenta
        var selectedBubble = d3.selectAll(".bubble_" + tract_num)
            .style("stroke", "magenta")
            .style("stroke-width", "3.5");
        
        //select all linked tracts and highlight magenta
        var selectedTract = d3.selectAll(".tracts_" + tract_num)
            .style("stroke", "magenta")
            .style("stroke-width", "3.5");
        
        //create new properties object
        //get original tract name and current value
        var propsObj = {
            NAME: tract_num.replace("-", "."),
            VALUE: props.__data__.value
        }

        setLabelBubble(propsObj)
        
    }

    //remove highlighting from bubble hover
    function dehighlightBubble(props){
        //pull tract number from class name
        var tract_num = props.className.baseVal.slice(7)

        //select all bubbles with matching tract number from previous hover and reset style
        var selectedBubble = d3.selectAll(".bubble_" + tract_num)
            .style("stroke", "#000000")
            .style("stroke-width", "0");
            
        //select all previously linked tracts and reset style
        var selectedTract = d3.selectAll(".tracts_" + tract_num)
            .style("stroke", "#000000")
            .style("stroke-width", "0");

        d3.select(".infolabel")
            .remove();

    }

    //wanted popup to appear on the left of the object
    function moveLabelBubble(cursor){
        var x = cursor.clientX - 380,
            y = cursor.clientY - 75;
        
        d3.select(".infolabel")
            .style("left", x + "px")
            .style("top", y + "px");
    }

    //uses new properties object to create smae popup template
    function setLabelBubble(props){
        var label = ""
        if(expressed == "noHighSchool"){
            label = "No High School";
        } else if(expressed == "someHighSchool"){
            label = "Some High School";
        } else if(expressed == "highSchoolGraduate"){
            label = "High School Graduate";
        } else if(expressed == "someCollege"){
            label = "Some College";
        } else if(expressed == "associates"){
            label = "Associates Degree";
        } else if(expressed == "bachelors"){
            label = "Bachelors Degree";
        } else if(expressed == "graduate"){
            label = "Graduate Degree";
        }

        var labelAttr = "<h1>Census Tract: " + props.NAME + "</h1><h2>" + props.VALUE + " people</h2>"

        var infolabel = d3.select("body")
            .append("div")
            .attr("class", "infolabel")
            .attr("id", props.NAME + "_label")
            .html(labelAttr);
    
        var regionName = infolabel.append("div")
            .attr("class", "labelname")
            .html(label);
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
        const N = label == null ? null : d3.map(data, name);
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
            .attr("class", d => N[d.data])
            .on("mouseover", (e) => {
                highlightBubble(e.target);
            })
            .on("mouseout", (e) => {
                dehighlightBubble(e.fromElement)
            })
            .on("mousemove", (e) => {
                moveLabelBubble(e)
            });;
    
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