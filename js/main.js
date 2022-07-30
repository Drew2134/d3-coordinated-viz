window.onload = setMap();

function setMap() {
    var promises = [];
    promises.push(d3.csv("data/education_attainment.csv")); //load education tabular data
    promises.push(d3.json("data/states.topojson")); //load background states shapes
    promises.push(d3.json("data/tracts.toposjon")); //load foreground tracts shapes
    Promise.all(promises).then(callback);

    function callback(data) {
        csvData = data[0];
        states = data[1];
        tracts = data[2];
        console.log(csvData, states, tracts)
    }
}