function reshape(data){

  var final = []

  data.forEach(function(x) {
    final.push({ focal: x.focal,
                 target: x.target,
                 path: x.path,
                 weight: x.weight,
                 origin: get_coordinates.get(x.target),
                 destination: get_coordinates.get(x.focal),
                 meme: x.forest_meme,
                 change: x.forest_change,
                 difference: x.difference}) })

  return final

}

function trim(data, geoid){

}

function scatter(filtered){

}

function polar(binned){

  var height = 400
  var width = 400

  var inner = 100
  var outer = Math.min(width, height) / 2

  var x = d3.scaleBand()
    .domain(binned.map(d => d.bin))
    .range([0, 2 * Math.PI])
    .align(0)

  var y = d3.scaleRadial()
    .domain([0, d3.max(binned, d => d.change)])
    .range([inner, outer])

  var line = d3.lineRadial()
    .curve(d3.curveLinearClosed)
    .angle(d => x(d.bin))

  d3.selectAll(".plotted").remove()

  const svg = d3.selectAll("#plot")
      .append("svg")
      .attr("class", "plotted")
      .attr("viewBox", `${-width / 2} ${-height / 2} ${width} ${height}`)
      .style("width", "80%")
      .style("height", "auto")
      .style("font", "8px sans-serif");

  var xAxis = g => g
      .attr("text-anchor", "middle")
      .call(g => g.selectAll("g")
        .data(binned)
        .join("g")
          .attr("transform", d => `
            rotate(${((x(d.bin) + x.bandwidth() / 2) * 180 / Math.PI - 90)})
            translate(${inner},0)
          `)
          .call(g => g.append("line")
              .attr("x2", -5)
              .attr("stroke", "#000"))
          .call(g => g.append("text")
              .attr("transform", d => (x(d.bin) + x.bandwidth() / 2 + Math.PI / 2) % (2 * Math.PI) < Math.PI
                  ? "rotate(90)translate(0,16)"
                  : "rotate(-90)translate(0,-9)")
              .text(d => d.bin)))

  var yAxis = g => g
      .attr("text-anchor", "middle")
      .call(g => g.append("text")
        .attr("y", d => -y(y.ticks(5).pop()))
        .attr("dy", "-1em")
      //  .text("VISITS")
      )
      .call(g => g.selectAll("g")
        .data(y.ticks(5).slice(1))
        .join("g")
          .attr("fill", "none")
          .call(g => g.append("circle")
            .attr("stroke", "#000")
            .attr("stroke-opacity", 0.5)
            .attr("r", y))
          .call(g => g.append("text")
            .attr("y", d => -y(d))
            .attr("dy", "0.35em")
            .attr("stroke", "#fff")
            .attr("stroke-width", 5)
            .text(y.tickFormat(10, "f"))
          .clone(true)
            .attr("fill", "#000")
            .attr("stroke", "none")))

  svg.append("path")
     .attr("fill", "none")
     .attr("stroke", '#66E8D3')
     .attr("stroke-width", 10)
     .attr("stroke-opacity", 1)
     .attr("d", line
     .radius(d => y(d.change))
        (binned));

  svg.append("path")
     .attr("fill", "none")
     .attr("stroke", '#8C0172')
     .attr("stroke-width", 10)
     .attr("stroke-opacity", 0.5)
     .attr("d", line
     .radius(d => y(d.meme))
        (binned));

  svg.append("g")
        .call(xAxis);

  svg.append("g")
        .call(yAxis);

  return svg.node();

}

function bearings(filtered){

  var bearings = filtered.map(function(d) {

    let head = d.origin
    let tail = d.destination

    let φ1 = head[0]
    let λ1 = head[1]
    let φ2 = tail[0]
    let λ2 = tail[1]

    const y = Math.sin(λ2-λ1) * Math.cos(φ2);
    const x = Math.cos(φ1)*Math.sin(φ2) -
              Math.sin(φ1)*Math.cos(φ2)*Math.cos(λ2-λ1);
    const θ = Math.atan2(y, x);
    const bearing = (θ*180/Math.PI + 360) % 360;

    // return Math.round(bearing)
    return bearing

  })

  return bearings

}

function bins(bearings, filtered){

  var bins = d3.bin().thresholds(40)(bearings);

  var m = new Map(d3.zip(bearings, filtered.map(function(d){ return d.meme })))
  var c = new Map(d3.zip(bearings, filtered.map(function(d){ return d.change })))

  var binned = bins.map(function(d){
    return {
      'bin': d3.mean([d.x0, d.x1]),
      'meme': d3.sum(d.map(function(x){ return m.get(x) * 10 })),
      'change': d3.sum(d.map(function(x){ return c.get(x) * 10 }))

      }
    })

  return binned

}
