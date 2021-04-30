$(document).ready(function(){
    $("input[type='radio']").click(function(){
        var supply = $("input[name='size']:checked").val();
        var source = "https://raw.githubusercontent.com/asrenninger/gravity/main/data/predictions_" + supply + ".csv"
        if(supply){
          $('#supply').text(supply);
            console.log(source);
        }
    });
});

// The svg
var svg = d3.select("svg"),
    width = +svg.attr("width"),
    height = +svg.attr("height");

// Load external data and boot
d3.json("https://raw.githubusercontent.com/asrenninger/networks/master/data/processed/background.geojson").then(function(data){

  projection = d3.geoMercator()
    .fitSize([width, height], data)

    // Draw the map
    svg.append("g")
        .selectAll("path")
        .data(data.features)
        .enter()
        .append("path")
          .attr("fill", "#000")
          .attr("d", d3.geoPath()
              .projection(projection)
          )
        .style("stroke", "none")
})
