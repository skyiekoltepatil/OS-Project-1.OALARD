import express from 'express';
import cors from 'cors';
import si from 'systeminformation';

const app = express();
const PORT = 3001;

app.use(cors());

// Fetch basic system load and memory
app.get('/api/system', async (req, res) => {
  try {
    const load = await si.currentLoad();
    const mem = await si.mem();
    
    res.json({
      cpu: load.currentLoad,
      memory: {
        total: mem.total,
        used: mem.active,
        free: mem.available
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Fetch active processes
app.get('/api/processes', async (req, res) => {
  try {
    const processes = await si.processes();
    
    // Sort processes by CPU usage (descending) and return top 20
    const topProcesses = processes.list
      .sort((a, b) => b.cpu - a.cpu)
      .slice(0, 20)
      .map(p => ({
        id: p.pid,
        name: p.name,
        cpu: p.cpu,
        memory: p.mem,
        state: p.state
      }));
      
    res.json(topProcesses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`System Monitor Server running on http://localhost:${PORT}`);
});
