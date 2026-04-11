import { useEffect, useRef } from 'react';
import * as d3 from 'd3';

export default function Timeline({ cpuData, gpuData, tasks }) {
  const containerRef = useRef(null);
  const tasksRef = useRef([]);

  useEffect(() => {
    if (!tasks || !containerRef.current) return;
    
    const currentTasks = tasksRef.current;
    
    tasks.forEach(t => {
      if (!currentTasks.find(ct => ct.id === t.id)) {
        currentTasks.push(t);
      }
    });
    
    if (currentTasks.length > 150) {
      currentTasks.splice(0, currentTasks.length - 150);
    }
    
    const width = containerRef.current.clientWidth;
    const height = 240;
    const margin = { top: 20, right: 20, bottom: 20, left: 60 };

    let svg = d3.select(containerRef.current).select("svg");
    if (svg.empty()) {
      svg = d3.select(containerRef.current)
        .append("svg")
        .attr("width", width)
        .attr("height", height);
        
      const g = svg.append("g").attr("class", "chart-group")
        .attr("transform", `translate(${margin.left},${margin.top})`);
        
      g.append("g").attr("class", "x-axis")
        .attr("transform", `translate(0,${height - margin.top - margin.bottom})`);
      g.append("g").attr("class", "y-axis");
    }

    const now = Date.now();
    const timeWindow = 5000; // 5 seconds window

    const x = d3.scaleLinear()
      .domain([now - timeWindow, now])
      .range([0, width - margin.left - margin.right]);

    const yDomain = ["Core 0", "Core 1", "Core 2", "Core 3", "Core 4", "Core 5", "Core 6", "Core 7", "GPU 0", "iGPU"];
    const y = d3.scaleBand()
      .domain(yDomain)
      .range([0, height - margin.top - margin.bottom])
      .padding(0.4);

    const xAxis = d3.axisBottom(x).tickFormat(d => d3.timeFormat("%M:%S.%L")(new Date(d))).ticks(5);
    const yAxis = d3.axisLeft(y);

    svg.select(".x-axis").call(xAxis).selectAll("text").style("fill", "var(--text-muted)");
    svg.select(".y-axis").call(yAxis).selectAll("text").style("fill", "var(--text-muted)");
    svg.selectAll(".domain, .tick line").style("stroke", "var(--border-subtle)");

    const chart = svg.select(".chart-group");
    const bars = chart.selectAll(".task-bar").data(currentTasks, d => d.id);

    const getColor = (type) => type === "cpu" ? "#4ab5f8" : "#b373e6";

    bars.style("filter", "none")
        .style("opacity", 0.9)
        .attr("fill", d => getColor(d.type))
        .attr("y", d => (y(d.resource) || height + 20))
        .attr("height", Math.max(y.bandwidth(), 2));

    bars.enter()
      .append("rect")
      .attr("class", "task-bar")
      .attr("rx", 3)
      .attr("ry", 3)
      .attr("y", d => (y(d.resource) || height + 20))
      .attr("height", Math.max(y.bandwidth(), 2))
      .attr("fill", d => getColor(d.type))
      .style("filter", "none") 
      .style("opacity", 0.9) 
      .merge(bars)
      .transition()
      .duration(300)
      .ease(d3.easeLinear)
      .attr("x", d => Math.max(0, x(d.start)))
      .attr("width", d => Math.max(4, x(d.start + d.duration) - x(d.start)));

    bars.exit().remove();

  }, [tasks, cpuData, gpuData]); 

  return (
    <div style={{ position: 'relative' }}>
      <div style={{ display: 'flex', gap: '2rem', marginBottom: '0.5rem', fontSize: '0.8rem', justifyContent: 'flex-end', paddingRight: '1rem', color: 'var(--text-muted)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ width: '12px', height: '12px', backgroundColor: '#4ab5f8', borderRadius: '3px' }}></div> CPU Trace
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ width: '12px', height: '12px', backgroundColor: '#b373e6', borderRadius: '3px' }}></div> GPU Trace
        </div>
      </div>
      <div 
        ref={containerRef} 
        style={{ 
          width: '100%', 
          height: '240px', 
          backgroundColor: 'rgba(0,0,0,0.15)', 
          borderRadius: '8px', 
          border: '1px solid var(--border-subtle)',
          overflow: 'hidden'
        }} 
      />
    </div>
  );
}
