source = "https://raw.githubusercontent.com/asrenninger/gravity/main/data/predictions_20_tracts.csv"
geoid = "42101000500"

d3.selectAll("input[type='radio']").on("change", function(){

    var supply =  this.value
    var source = "https://raw.githubusercontent.com/asrenninger/gravity/main/data/predictions_" + supply + "_tracts.csv"

    console.log(this.value)
    $('#supply').text(supply);

    d3.csv(source,
           function(d) { d.forest_meme = +d.forest_meme;
                         d.forest_change = +d.forest_change;
                         d.difference = +d.difference * 10;
                         d.path = String(d.focal) + "-" + String(d.target);
                         return d}).then(function(data){ final = reshape(data) })

});

Promise.all([
  d3.json('https://raw.githubusercontent.com/asrenninger/gravity/main/data/tracts.json'),
  d3.json('https://raw.githubusercontent.com/asrenninger/networks/master/data/processed/background.geojson'),
  d3.csv(source,
         function(d) { d.forest_meme = +d.forest_meme;
                       d.forest_change = +d.forest_change;
                       d.difference = +d.difference * 10;
                       d.path = String(d.focal) + "-" + String(d.target);
                       return d})
]).then(([blocks, background, data]) =>  {

  console.log(blocks)
  console.log(background)

  get_coordinates = new Map(blocks.objects.tracts.geometries.map(function(d) {
    return [d.properties.GEOID, [d.properties.X, d.properties.Y]]
  }))

  final = reshape(data)
  tempo = final.filter(function(d) { return d.focal == geoid })

  headings = bearings(tempo)
  binnings = bins(headings, tempo)
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
       .data(topojson.feature(blocks, blocks.objects.tracts).features)
       .join("path")
        .attr("class", "blockfills")
        .attr("fill", "transparent")
        .attr("d", path);

    svg.append("path")
        .datum(topojson.mesh(blocks, blocks.objects.tracts, (a, b) => a !== b))
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
                       .domain([20, 40, 80, 160, 320, 640, 1280, 2560])
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
            .range([1, 10]);

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
      binnings = bins(headings, tempo)
      polar(binnings)

    });

    legend({color: d3.scaleThreshold()
                     .domain([20, 40, 80, 160, 320, 640, 1280, 2560])
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
