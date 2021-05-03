source = "https://raw.githubusercontent.com/asrenninger/gravity/main/data/predictions_20.csv"
geoid = "421010005001"

d3.selectAll("input[type='radio']").on("change", function(){

    var supply = $("input[name='size']:checked").val();
    var source = "https://raw.githubusercontent.com/asrenninger/gravity/main/data/predictions_" + supply + ".csv"

    console.log(this.value)
    $('#supply').text(supply);

    d3.csv(source,
           function(d) { d.weight = +d.weight;
                         d.forest_meme = +d.forest_meme;
                         d.forest_change = +d.forest_change;
                         d.difference = Math.abs(+d.forest_change - +d.forest_meme) * 10;
                         d.path = String(d.focal) + "-" + String(d.target);
                         return d}).then(function(data){ final = reshape(data) })

});

//
// $(document).ready(function(){
//     $("input[type='radio']").click(function(){
//         var supply = $("input[name='size']:checked").val();
//         source = "https://raw.githubusercontent.com/asrenninger/gravity/main/data/predictions_" + supply + ".csv"
//         if(supply){
//           $('#supply').text(supply);
//             console.log(source);
//
//             d3.csv(source,
//                    function(d) { d.weight = +d.weight;
//                                  d.forest_meme = +d.forest_meme;
//                                  d.forest_change = +d.forest_change;
//                                  d.difference = Math.abs(+d.forest_change - +d.forest_meme);
//                                  d.path = String(d.focal) + "-" + String(d.target);
//                                  return d}).then(function(data){
//
//                                    final = []
//   data.forEach(function(x) {
//                 final.push({focal: x.focal,
//                                 target: x.target,
//                                 path: x.path,
//                                 weight: x.weight,
//                                 origin: get_coordinates.get(x.target),
//                                 destination: get_coordinates.get(x.focal),
//                                 difference: x.difference})
//   })
//
//                                  })
//
//         }
//     });
// });

Promise.all([
  d3.json('https://raw.githubusercontent.com/asrenninger/gravity/main/data/blocks.json'),
  d3.json('https://raw.githubusercontent.com/asrenninger/networks/master/data/processed/background.geojson'),
  d3.csv(source,
         function(d) { d.weight = +d.weight;
                       d.forest_meme = +d.forest_meme;
                       d.forest_change = +d.forest_change;
                       d.difference = Math.abs(+d.forest_change - +d.forest_meme) * 10;
                       d.path = String(d.focal) + "-" + String(d.target);
                       return d})
]).then(([blocks, background, data]) =>  {

  console.log(blocks)
  console.log(background)

  get_coordinates = new Map(blocks.objects.blocks.geometries.map(function(d) {
    return [d.properties.GEOID, [d.properties.X, d.properties.Y]]
  }))

  final = reshape(data)
  tempo = final.filter(function(d) { return d.focal == geoid })

  headings = bearings(tempo)
  binnings = bins(headings)
  polar(binnings)

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
    .on("click", function(event, d) {

      geoid = d.properties.GEOID;
      $('#block').text(geoid);
      svg.property('value', geoid);
      svg.dispatch('input');

      svg.selectAll("circle").remove()

      tempo = final.filter(function(d) { return d.focal == geoid })
      let color = d3.scaleThreshold()
                       .domain([2, 4, 8, 16, 32, 64, 128, 256])
                       .range(['#8C0172',
                               '#922D55',
                               '#964D3E',
                               '#9A6E28',
                               '#9B951B',
                               '#89BC48',
                               '#6BD48C',
                               '#66E8D3',
                               '#B2F2FD']);

      let size = d3.scaleSqrt()
            .domain(d3.extent(tempo.map(function(d) { return +d.difference; })))
            .range([2, 5]);

      svg.append("g")
         .selectAll("circle")
         .data(tempo)
         .join("circle")
            .attr("class", "points")
            .attr("transform", d => `translate(${projection(d.origin)})`)
            .attr("r", function(d) { return size(d.difference) })
            .attr('fill', function(d) { return color(d.difference) })
            .attr("stroke", "white")
            .attr("stroke-width", 1)
            .attr("opacity", 1)
         .append("title")
            .text(d => d.name);

      var distance = d3.format(".1f")(d3.mean(tempo.map(function(d) { return ((d3.geoDistance(d.origin, d.destination) * 6378100) / 1000) * 0.621371 })))
      var average = d3.format(".1f")(d3.mean(tempo.map(function(d) { return d.difference })))
      var total = d3.format(".0f")(d3.sum(tempo.map(function(d) { return d.difference })))

      $('#distance').text(distance);
      $('#average').text(average);
      $('#total').text(total);

      headings = bearings(tempo)
      binnings = bins(headings)
      polar(binnings)

    });

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
