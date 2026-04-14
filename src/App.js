import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Play, Plus, Trash2, Brain, RotateCcw, Moon, Sun } from 'lucide-react';
import './App.css';

// Process Class
class Process {
  constructor(pid, arrivalTime, burstTime, priority) {
    this.pid = pid;
    this.arrivalTime = arrivalTime;
    this.burstTime = burstTime;
    this.priority = priority;
    this.remainingTime = burstTime;
    this.completionTime = 0;
    this.waitingTime = 0;
    this.turnaroundTime = 0;
    this.responseTime = -1;
  }
}

// Scheduling Algorithms
const schedulingAlgorithms = {
  fcfs: (processes) => {
    const sorted = [...processes].sort((a, b) => a.arrivalTime - b.arrivalTime);
    let currentTime = 0;
    const gantt = [];
    
    sorted.forEach(p => {
      if (currentTime < p.arrivalTime) currentTime = p.arrivalTime;
      
      gantt.push({ pid: p.pid, start: currentTime, duration: p.burstTime });
      
      p.responseTime = currentTime - p.arrivalTime;
      currentTime += p.burstTime;
      p.completionTime = currentTime;
      p.turnaroundTime = p.completionTime - p.arrivalTime;
      p.waitingTime = p.turnaroundTime - p.burstTime;
    });
    
    return { processes: sorted, gantt };
  },
  
  sjf: (processes) => {
    const ready = [];
    const completed = [];
    let currentTime = 0;
    const gantt = [];
    const remaining = [...processes];
    
    while (completed.length < processes.length) {
      const arrived = remaining.filter(p => p.arrivalTime <= currentTime);
      arrived.forEach(p => {
        if (!ready.includes(p)) ready.push(p);
      });
      remaining.splice(0, remaining.length, ...remaining.filter(p => p.arrivalTime > currentTime));
      
      if (ready.length === 0) {
        currentTime++;
        continue;
      }
      
      ready.sort((a, b) => a.burstTime - b.burstTime);
      const p = ready.shift();
      
      gantt.push({ pid: p.pid, start: currentTime, duration: p.burstTime });
      
      p.responseTime = currentTime - p.arrivalTime;
      currentTime += p.burstTime;
      p.completionTime = currentTime;
      p.turnaroundTime = p.completionTime - p.arrivalTime;
      p.waitingTime = p.turnaroundTime - p.burstTime;
      
      completed.push(p);
    }
    
    return { processes: completed, gantt };
  },
  
  priority: (processes) => {
    const ready = [];
    const completed = [];
    let currentTime = 0;
    const gantt = [];
    const remaining = [...processes];
    
    while (completed.length < processes.length) {
      const arrived = remaining.filter(p => p.arrivalTime <= currentTime);
      arrived.forEach(p => {
        if (!ready.includes(p)) ready.push(p);
      });
      remaining.splice(0, remaining.length, ...remaining.filter(p => p.arrivalTime > currentTime));
      
      if (ready.length === 0) {
        currentTime++;
        continue;
      }
      
      ready.sort((a, b) => a.priority - b.priority);
      const p = ready.shift();
      
      gantt.push({ pid: p.pid, start: currentTime, duration: p.burstTime });
      
      p.responseTime = currentTime - p.arrivalTime;
      currentTime += p.burstTime;
      p.completionTime = currentTime;
      p.turnaroundTime = p.completionTime - p.arrivalTime;
      p.waitingTime = p.turnaroundTime - p.burstTime;
      
      completed.push(p);
    }
    
    return { processes: completed, gantt };
  },
  
  roundRobin: (processes, quantum = 2) => {
    const ready = [];
    const completed = [];
    let currentTime = 0;
    const gantt = [];
    const remaining = processes.map(p => ({ ...p, remainingTime: p.burstTime, firstRun: true }));
    
    remaining.sort((a, b) => a.arrivalTime - b.arrivalTime);
    ready.push(remaining.shift());
    
    while (completed.length < processes.length) {
      if (ready.length === 0) {
        if (remaining.length > 0) {
          ready.push(remaining.shift());
          currentTime = ready[0].arrivalTime;
        }
        continue;
      }
      
      const p = ready.shift();
      
      if (p.firstRun) {
        p.responseTime = currentTime - p.arrivalTime;
        p.firstRun = false;
      }
      
      const execTime = Math.min(quantum, p.remainingTime);
      gantt.push({ pid: p.pid, start: currentTime, duration: execTime });
      
      currentTime += execTime;
      p.remainingTime -= execTime;
      
      const newArrivals = remaining.filter(r => r.arrivalTime <= currentTime);
      newArrivals.forEach(r => ready.push(r));
      remaining.splice(0, remaining.length, ...remaining.filter(r => r.arrivalTime > currentTime));
      
      if (p.remainingTime > 0) {
        ready.push(p);
      } else {
        p.completionTime = currentTime;
        p.turnaroundTime = p.completionTime - p.arrivalTime;
        p.waitingTime = p.turnaroundTime - p.burstTime;
        completed.push(p);
      }
    }
    
    return { processes: completed, gantt };
  }
};

// ML Recommendation
const recommendAlgorithm = (processes) => {
  const avgBurst = processes.reduce((sum, p) => sum + p.burstTime, 0) / processes.length;
  const burstVariance = processes.reduce((sum, p) => sum + Math.pow(p.burstTime - avgBurst, 2), 0) / processes.length;
  const hasPriority = processes.some(p => p.priority !== 0);
  
  if (burstVariance < 5 && !hasPriority) return 'fcfs';
  if (burstVariance > 20) return 'sjf';
  if (hasPriority) return 'priority';
  return 'roundRobin';
};

const CPUSchedulerSimulator = () => {
  const [processes, setProcesses] = useState([
    new Process('P1', 0, 5, 2),
    new Process('P2', 1, 3, 1),
    new Process('P3', 2, 8, 3)
  ]);
  const [newProcess, setNewProcess] = useState({ pid: '', arrival: '', burst: '', priority: '' });
  const [selectedAlgorithm, setSelectedAlgorithm] = useState('fcfs');
  const [results, setResults] = useState(null);
  const [quantum, setQuantum] = useState(2);
  const [recommendation, setRecommendation] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(true); // default to dark in new design

  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.remove('light-mode');
    } else {
      document.body.classList.add('light-mode');
    }
  }, [isDarkMode]);

  const addProcess = () => {
    if (newProcess.pid && newProcess.arrival !== '' && newProcess.burst !== '') {
      const p = new Process(
        newProcess.pid,
        parseInt(newProcess.arrival),
        parseInt(newProcess.burst),
        parseInt(newProcess.priority) || 0
      );
      setProcesses([...processes, p]);
      setNewProcess({ pid: '', arrival: '', burst: '', priority: '' });
    }
  };

  const removeProcess = (pid) => {
    setProcesses(processes.filter(p => p.pid !== pid));
  };

  const simulate = () => {
    const processCopies = processes.map(p => new Process(p.pid, p.arrivalTime, p.burstTime, p.priority));
    const result = selectedAlgorithm === 'roundRobin' 
      ? schedulingAlgorithms[selectedAlgorithm](processCopies, quantum)
      : schedulingAlgorithms[selectedAlgorithm](processCopies);
    
    const avgWaiting = result.processes.reduce((sum, p) => sum + p.waitingTime, 0) / result.processes.length;
    const avgTurnaround = result.processes.reduce((sum, p) => sum + p.turnaroundTime, 0) / result.processes.length;
    
    setResults({ ...result, avgWaiting, avgTurnaround });
  };

  const getRecommendation = () => {
    const rec = recommendAlgorithm(processes);
    const names = {
      fcfs: 'FCFS (First Come First Serve)',
      sjf: 'SJF (Shortest Job First)',
      priority: 'Priority Scheduling',
      roundRobin: 'Round Robin'
    };
    setRecommendation(`Intelligence Engine: ${names[rec]}`);
  };

  const reset = () => {
    setResults(null);
    setRecommendation('');
  };

  const chartColors = {
    text: isDarkMode ? '#8b949e' : '#586069',
    grid: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
    tooltipBg: isDarkMode ? 'rgba(22, 27, 34, 0.9)' : 'rgba(255, 255, 255, 0.9)',
    tooltipBorder: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
  };

  // Vivid colors for gantt chart segments
  const colors = ['#f85149', '#58a6ff', '#3fb950', '#a371f7', '#d29922', '#ff7b72', '#2f81f7', '#2ea043'];

  return (
    <div className="app-wrapper">
      <div className="bg-orb orb-1"></div>
      <div className="bg-orb orb-2"></div>

      <div className="app-container">
        <div className="header-row">
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="theme-btn"
          >
            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
            <span>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
          </button>
        </div>

        <div className="title-container">
          <h1 className="main-title">CPU Scheduler Simulator</h1>
          <p className="subtitle">Simulate, Analyze, and Optimize CPU Scheduling Algorithms</p>
        </div>

        <div className="dashboard-grid">
          {/* Process Management Panel */}
          <div className="glass-panel">
            <h2 className="panel-title">Process Hub</h2>
            
            <div className="input-group">
              <input
                type="text"
                placeholder="PID e.g. P1"
                className="custom-input"
                value={newProcess.pid}
                onChange={(e) => setNewProcess({...newProcess, pid: e.target.value})}
              />
              <input
                type="number"
                placeholder="Arrival"
                className="custom-input"
                value={newProcess.arrival}
                onChange={(e) => setNewProcess({...newProcess, arrival: e.target.value})}
              />
              <input
                type="number"
                placeholder="Burst"
                className="custom-input"
                value={newProcess.burst}
                onChange={(e) => setNewProcess({...newProcess, burst: e.target.value})}
              />
              <input
                type="number"
                placeholder="Priority"
                className="custom-input"
                value={newProcess.priority}
                onChange={(e) => setNewProcess({...newProcess, priority: e.target.value})}
              />
            </div>
            
            <button
              onClick={addProcess}
              className="btn-primary"
            >
              <Plus size={18} /> Add Process
            </button>

            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>PID</th>
                    <th>Arrival</th>
                    <th>Burst</th>
                    <th>Priority</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {processes.map((p, idx) => (
                    <tr key={idx}>
                      <td style={{ color: 'var(--glow-primary)', fontWeight: '600' }}>{p.pid}</td>
                      <td>{p.arrivalTime}</td>
                      <td>{p.burstTime}</td>
                      <td>{p.priority}</td>
                      <td>
                        <button
                          onClick={() => removeProcess(p.pid)}
                          className="delete-btn"
                          title="Remove Process"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {processes.length === 0 && (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', opacity: 0.5, padding: '2rem' }}>
                        No processes added.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Algorithm Configuration Panel */}
          <div className="glass-panel">
            <h2 className="panel-title">Algorithm Configuration</h2>
            
            <div className="form-group">
              <label className="form-label">Algorithm Strategy:</label>
              <select
                className="custom-select"
                value={selectedAlgorithm}
                onChange={(e) => setSelectedAlgorithm(e.target.value)}
              >
                <option value="fcfs">First Come First Serve (FCFS)</option>
                <option value="sjf">Shortest Job First (SJF)</option>
                <option value="priority">Priority Scheduling</option>
                <option value="roundRobin">Round Robin (RR)</option>
              </select>
            </div>

            {selectedAlgorithm === 'roundRobin' && (
              <div className="form-group">
                <label className="form-label">Time Quantum (ms):</label>
                <input
                  type="number"
                  className="custom-input"
                  value={quantum}
                  onChange={(e) => setQuantum(parseInt(e.target.value))}
                  min="1"
                />
              </div>
            )}

            <button
              onClick={getRecommendation}
              className="btn-secondary"
            >
              <Brain size={18} /> Get AI Recommendation
            </button>

            {recommendation && (
              <div className="rec-banner">
                {recommendation}
              </div>
            )}

            <div style={{ marginTop: 'auto', paddingTop: '1rem' }}>
              <button
                onClick={simulate}
                disabled={processes.length === 0}
                className="btn-success"
              >
                <Play size={18} /> Execute Simulation
              </button>

              <button
                onClick={reset}
                className="btn-danger"
              >
                <RotateCcw size={18} /> Reset Results
              </button>
            </div>
          </div>
        </div>

        {/* Dynamic Results Area */}
        {results && (
          <div className="glass-panel results-panel">
            <h2 className="panel-title mb-4">Simulation Insights</h2>
            
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-value">{results.avgWaiting.toFixed(2)}</div>
                <div className="stat-label">Avg. Waiting Time</div>
              </div>
              <div className="stat-card success">
                <div className="stat-value">{results.avgTurnaround.toFixed(2)}</div>
                <div className="stat-label">Avg. Turnaround Time</div>
              </div>
            </div>

            <h3 className="gantt-title">Execution Timeline (Gantt Chart)</h3>
            <div className="gantt-container">
              {results.gantt.map((g, idx) => {
                const processIndex = processes.findIndex(p => p.pid === g.pid);
                const color = colors[processIndex % colors.length] || colors[0];
                const width = Math.max(60, g.duration * 30); // Dynamic width multiplier
                
                return (
                  <div key={idx} className="gantt-block-wrapper">
                    <div
                      className="gantt-block"
                      style={{
                        minWidth: `${width}px`,
                        background: `linear-gradient(135deg, ${color}cc 0%, ${color} 100%)`,
                        border: `1px solid ${color}`
                      }}
                    >
                      {g.pid}
                    </div>
                    <div className="gantt-time">{g.start}</div>
                  </div>
                );
              })}
              {/* End time marker */}
              {results.gantt.length > 0 && (
                <div className="gantt-block-wrapper">
                  <div style={{ height: '60px', minWidth: '20px' }}></div>
                  <div className="gantt-time">
                    {results.gantt[results.gantt.length - 1].start + results.gantt[results.gantt.length - 1].duration}
                  </div>
                </div>
              )}
            </div>

            <h3 className="chart-title">Process Details Matrix</h3>
            <div className="table-container" style={{ marginBottom: '2rem' }}>
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>PID</th>
                    <th>Arrival</th>
                    <th>Burst</th>
                    <th>Completion</th>
                    <th>Waiting</th>
                    <th>Turnaround</th>
                  </tr>
                </thead>
                <tbody>
                  {results.processes.map((p, idx) => (
                    <tr key={idx}>
                      <td style={{ color: 'var(--glow-primary)', fontWeight: '600' }}>{p.pid}</td>
                      <td>{p.arrivalTime}</td>
                      <td>{p.burstTime}</td>
                      <td style={{ color: 'var(--glow-success)' }}>{p.completionTime}</td>
                      <td style={{ color: 'var(--glow-secondary)' }}>{p.waitingTime}</td>
                      <td style={{ color: 'var(--glow-primary)' }}>{p.turnaroundTime}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <h3 className="chart-title">Analytic Comparison Chart</h3>
            <div className="chart-wrapper">
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={results.processes} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                  <XAxis dataKey="pid" stroke={chartColors.text} tick={{ fill: chartColors.text }} />
                  <YAxis stroke={chartColors.text} tick={{ fill: chartColors.text }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: chartColors.tooltipBg,
                      border: `1px solid ${chartColors.tooltipBorder}`,
                      borderRadius: '12px',
                      color: isDarkMode ? '#c9d1d9' : '#24292e',
                      boxShadow: '0 8px 30px rgba(0,0,0,0.2)'
                    }}
                  />
                  <Legend wrapperStyle={{ paddingTop: '20px', color: chartColors.text }} />
                  <Bar dataKey="waitingTime" fill="var(--glow-primary)" name="Waiting Time" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="turnaroundTime" fill="var(--glow-success)" name="Turnaround Time" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

          </div>
        )}
      </div>
    </div>
  );
};

export default CPUSchedulerSimulator;
