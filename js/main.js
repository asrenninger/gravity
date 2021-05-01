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

Promise.all([
  d3.json('https://raw.githubusercontent.com/asrenninger/gravity/main/data/blocks.json'),
  d3.json('https://raw.githubusercontent.com/asrenninger/networks/master/data/processed/background.geojson')
]).then(([blocks, background]) =>  {
  console.log(blocks)
  console.log(background)

  var width = 800
  var height = 800

  // The svg
  var svg = d3.select("#base")
    .append("svg")
    .attr("width", width)
    .attr("height", height)


  projection = d3.geoMercator()
    .fitSize([width, height], background)

  path = d3.geoPath(projection)

    // Draw the map
    svg.append("g")
        .selectAll("path")
        .data(background.features)
        .enter()
        .append("path")
          .attr("fill", "#000")
          .attr("d", path)
        .style("stroke", "none")

    svg.append("g")
       .selectAll("path")
       .data(topojson.feature(blocks, blocks.objects.blocks).features)
       .join("path")
        .attr("class", "blockfills")
        .attr("fill", "transparent")
        .attr("d", path);

    svg.append("path")
        .datum(topojson.mesh(blocks, blocks.objects.blocks, (a, b) => a !== b))
        .attr("class", "blocklines")
        .attr("fill", "none")
        .attr("stroke", "#fff")
        .attr("stroke-width", 0.5)
        .attr("stroke-dasharray", 2)
        .attr("d", path);

const tooltip = svg.append("g");

  svg.selectAll(".blockfills")
    .on("touchmove mousemove", function(event, d) {
      tooltip.call(
        callout,
        `${d.properties.GEOID}`
      );
      tooltip.attr("transform", `translate(${d3.pointer(event, this)})`);
      d3.select(this)
        .attr("stroke", "#c7c7c7")
        .attr("stroke-width", 1)
        .attr("stroke-dasharray", 0)
        .raise();
    })
    .on("touchend mouseleave", function() {
      tooltip.call(callout, null);
      d3.select(this)
        .attr("stroke", "#fff")
        .attr("stroke-width", 0.25)
        .attr("stroke-dasharray", 2)
        .lower();
    })

    legend({color: d3.scaleThreshold()
                     .domain([2, 4, 8, 16, 32, 64, 128, 256])
                     .range(['#8C0172',
                             '#922D55',
                             '#964D3E',
                             '#9A6E28',
                             '#9B951B',
                             '#89BC48',
                             '#6BD48C',
                             '#66E8D3',
                             '#B2F2FD']),
            title: "New visits"})

});

  // d3.json("https://raw.githubusercontent.com/asrenninger/networks/master/data/processed/background.geojson").then(function(data){
  //
  //   var width = 800
  //   var height = 800
  //
  //   // The svg
  //   var svg = d3.select("#base")
  //     .append("svg")
  //     .attr("width", width)
  //     .attr("height", height)
  //
  //
  //   projection = d3.geoMercator()
  //     .fitSize([width, height], data)
  //
  //     // Draw the map
  //     svg.append("g")
  //         .selectAll("path")
  //         .data(data.features)
  //         .enter()
  //         .append("path")
  //           .attr("fill", "#000")
  //           .attr("d", d3.geoPath()
  //               .projection(projection)
  //           )
  //         .style("stroke", "none")
  // })


// // The svg
// var svg = d3.select("svg"),
//     width = +svg.attr("width"),
//     height = +svg.attr("height");
//
// // Load external data and boot
// d3.json("https://raw.githubusercontent.com/asrenninger/networks/master/data/processed/background.geojson").then(function(data){
//
//   projection = d3.geoMercator()
//     .fitSize([width, height], data)
//
//     // Draw the map
//     svg.append("g")
//         .selectAll("path")
//         .data(data.features)
//         .enter()
//         .append("path")
//           .attr("fill", "#000")
//           .attr("d", d3.geoPath()
//               .projection(projection)
//           )
//         .style("stroke", "none")
// })
