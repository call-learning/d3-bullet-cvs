import { axisBottom as d3AxisBottom } from 'd3-axis';
import { scaleLinear as d3ScaleLinear, scaleQuantize as d3ScaleQuantize } from 'd3-scale';
import { select as d3Select } from 'd3-selection';
import { timerFlush as d3TimerFlush } from 'd3-timer';
import 'd3-transition';
import { schemeSet1 as d3SchemeSet1, schemeSet2 as d3SchemeSet2 } from 'd3-scale-chromatic';

/**
 * Make a data structure to hold several bullet charts in one row, so to have a global
 * progress bar
 * @return {bulCVS}
 */
export default function () {
  let maxresults = function (d) {return d.maxresults;};
  let results = function (d) {return d.results;};
  let rlabels = function (d) {return d.rlabels;};
  let data = {};
  let width = 960;
  let height = 100;
  let innerWidth = function () { return width - margins.left - margins.right; };
  let innerHeight = function () { return height - margins.top - margins.bottom; };
  let margins = { top: 10, right: 5, bottom: 20, left: 5 };
  let graphMarginH = 5;

  // For each small multiple…
  function bulCVS (svgitem) {

    let g = svgitem
      .attr('width', width)
      .attr('height', height)
      .selectAll('g') // Map data to an inner g in the svgitem
      .data(data)
      .enter()
      .append('g')
      .attr('class', 'bullet-cvs');

    let graphWidth = innerWidth() / g.size() - graphMarginH * 2;

    g.each(function (d, i) {
      let cmaxresults = maxresults(d);
      let cresults = results(d);
      let crlabels = rlabels(d);
      let currentg = d3Select(this);
      let extentX;
      let extentY;

      let wrap = currentg.select('g.wrap');
      if (wrap.empty()) wrap = currentg.append('g').attr('class', 'wrap');

      extentX = graphWidth;
      extentY = innerHeight();

      // Compute the new x-scale.
      const domainMaxRange = Math.max(Math.max.apply(null, cmaxresults), Math.max.apply(null, cresults));
      const scaleX = d3ScaleLinear()
        .domain([0, domainMaxRange])
        .range([0, extentX]);

      let resultsColorScheme = d3SchemeSet1;
      let maxResultColorScheme = d3SchemeSet1;

      // Derive width-scales from the x-scales.
      let mstwidth = bulCVSWidth(scaleX); // End width

      let baseStrokeWidth = 2;
      let baseArrowSize = 10;
      let barHeight = function (index, factor) { return (extentY / (index/4 + 1))/factor; };
      let markHeight = function (index) { return extentY; };
      let middlePosition = function (currentHeight, totalHeight) { return totalHeight / 2 - currentHeight / 2; };

      // Draw the track background for max result markers
      wrap
        .selectAll('rect.maxresults')
        .data(cmaxresults)
        .enter()
        .append('rect')
        .attr('class', 'maxresults')
        .attr('width', mstwidth)
        .style('fill', (_d, index) => maxResultColorScheme[index])
        .style('fill-opacity', '0.3')
        .attr('height', extentY)
        .attr('x', 0)
        .attr('y', 0);

      // Draw the result rects
      wrap
        .selectAll('rect.result')
        .data(cresults)
        .enter()
        .append('rect')
        .attr('class', 'result')
        .attr('width', mstwidth)
        .style('fill', (_d, index) => resultsColorScheme[index])
        .attr('height', function (_d, index) {return barHeight(index, 2);})
        .attr('x', 0)
        .attr('y', function (_d, index) { return middlePosition(barHeight(index,2), extentY);});
      // Update the maxresultmarker marker lines.

      // Draw the markers
      wrap
        .selectAll('line.marker')
        .data(cresults)
        .enter().append('polygon')
        .attr('class', 'marker')
        .style('stroke', (_d, index) => resultsColorScheme[index])
        .style('stroke-width', (_d, index) => baseStrokeWidth * (index + 1))
        .attr('points', function (d, index) {
            const size = baseArrowSize / (index + 1);
            return pointerMaker(size, baseArrowSize, scaleX(d), innerHeight());
          }
        )

      const axis = wrap.append('g').attr('class', 'axis');
      axis.attr('transform', `translate(0,${extentY})`).call(d3AxisBottom(scaleX));

      // Graph Marker

      wrap
        .selectAll('line.limits')
        .data([0, graphWidth])
        .enter()
        .append('line')
        .attr('class', 'limits')
        .style('stroke', '#000')
        .style('stroke-width', graphMarginH)
        .attr('x1', scaleX)
        .attr('x2', scaleX)
        .attr('y1', function (_d, index) {return (extentY / 2 - markHeight(index) / 2);})
        .attr('y2', function (_d, index) {return (extentY / 2 + markHeight(index) / 2);});

      // Finally translate the graph so it appear next to the other

      currentg.attr('transform', 'translate(' + (margins.left + graphWidth * i + graphMarginH * i) + ',' + margins.top + ')');
    });
    d3TimerFlush();
  }

  // maxresults (previous, goal)
  bulCVS.maxresults = function (_) {
    if (!arguments.length) return maxresults;
    maxresults = _;
    return this;
  };

  // results (actual, forecast)
  bulCVS.results = function (_) {
    if (!arguments.length) return results;
    results = _;
    return this;
  };

  bulCVS.width = function (_) {
    if (!arguments.length) return width;
    width = +_;
    return this;
  };

  bulCVS.height = function (_) {
    if (!arguments.length) return height;
    height = +_;
    return this;
  };

  bulCVS.margins = function (_) {
    if (!arguments.length) return margins;
    margins = _;
    return this;
  };

  bulCVS.data = function (_) {
    if (!arguments.length) return data;
    data = _;
    return this;
  };

  bulCVS.tickFormat = function (_) {
    if (!arguments.length) return xAxis.tickFormat();
    xAxis.tickFormat(_);
    return this;
  };

  return bulCVS;
}

function bulCVSWidth (x) {
  const x0 = x(0);
  return function (d) {
    return Math.abs(x(d) - x0);
  };
}

/**
 * Create a triangle oriented toward the bottom, point toward x,y
 * @param base
 * @param height
 * @param x
 * @param y
 */
function pointerMaker (base, height, x, y) {
  return `${x - base / 2} ${y - height}, ${x + base / 2} ${y - height}, ${x} ${y}`;
}
