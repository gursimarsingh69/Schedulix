import psutil
import platform
import random
import time 

try:
    import pynvml
    pynvml.nvmlInit()
    HAS_GPU = True
    gpu_count = pynvml.nvmlDeviceGetCount()
    handles = [pynvml.nvmlDeviceGetHandleByIndex(i) for i in range(gpu_count)]
except Exception as e:
    print(f"NVML not available, falling back to mock GPU data. Reason: {e}")
    HAS_GPU = False

import subprocess

# Cache iGPU Name
_igpu_name = None
def get_igpu_name():
    global _igpu_name
    if _igpu_name is not None:
        return _igpu_name
    try:
        if platform.system() == "Windows":
            res = subprocess.run(["powershell", "-Command", "(Get-CimInstance Win32_VideoController).Name"], capture_output=True, text=True, timeout=3)
            if res.returncode == 0:
                for line in res.stdout.strip().split('\n'):
                    line = line.strip()
                    if line and "nvidia" not in line.lower():
                        _igpu_name = line
                        return _igpu_name
    except Exception:
        pass
    _igpu_name = "Integrated Graphics"
    return _igpu_name

def get_cpu_metrics():
    overall = psutil.cpu_percent(interval=None)
    per_core = psutil.cpu_percent(interval=None, percpu=True)
    
    try:
        ctx_switches = psutil.cpu_stats().ctx_switches
    except:
        ctx_switches = 0
        
    thread_count = 0
    try:
        for p in psutil.process_iter(['num_threads']):
            try:
                num = p.info.get('num_threads')
                if num:
                    thread_count += num
            except (psutil.NoSuchProcess, psutil.AccessDenied):
                pass
    except Exception:
        pass

    return {
        "overall": overall,
        "cores": per_core,
        "ctx_switches": ctx_switches,
        "thread_count": thread_count
    }

def get_gpu_metrics():
    if HAS_GPU:
        gpus = []
        for i, handle in enumerate(handles):
            try:
                util = pynvml.nvmlDeviceGetUtilizationRates(handle)
                gpu_util = util.gpu
            except Exception:
                gpu_util = 0
                
            try:
                mem = pynvml.nvmlDeviceGetMemoryInfo(handle)
                mem_used = mem.used / (1024 ** 2)
                mem_total = mem.total / (1024 ** 2)
            except Exception:
                mem_used = 0
                mem_total = 4096  # Mock total memory if it fails
                
            try:
                info = pynvml.nvmlDeviceGetName(handle)
                name = info.decode('utf-8') if isinstance(info, bytes) else info
            except Exception:
                name = f"GPU {i}"
            
            gpus.append({
                "id": i,
                "name": name,
                "utilization": gpu_util,
                "memory_used": mem_used,
                "memory_total": mem_total
            })
            
        gpus.append({
            "id": "igpu",
            "name": f"{get_igpu_name()} (Simulated stats)",
            "utilization": random.randint(5, 30),
            "memory_used": random.randint(500, 2000),
            "memory_total": 4096
        })
        return gpus
    else:
        # Mock GPU data
        return [
            {
                "id": "0",
                "name": "Simulated RTX 4090",
                "utilization": random.randint(10, 90),
                "memory_used": random.randint(2000, 16000),
                "memory_total": 24000
            }
        ]

import time

# State variable managed by FastAPI
CURRENT_WORKLOAD = "Balanced"

# Keep state of when each lane is free to avoid trace overlapping
_lane_cursors = {f"Core {i}": 0 for i in range(8)}
_lane_cursors["GPU 0"] = 0
_lane_cursors["iGPU"] = 0

def generate_simulated_tasks():
    now_ms = int(time.time() * 1000)
    tasks = []
    
    # Profile parameters
    if CURRENT_WORKLOAD == "Video Rendering":
        prob_gpu = 0.95
        prob_cpu_dispatch = 0.8  # Core 0, 1
        prob_cpu_idle = 0.1      # Core 2-7
        dur_gpu = (300, 1500)
        dur_cpu = (50, 400)
    elif CURRENT_WORKLOAD == "Gaming":
        prob_gpu = 0.85
        prob_cpu_dispatch = 0.85
        prob_cpu_idle = 0.75
        dur_gpu = (10, 100)      # High refresh rate kernels
        dur_cpu = (10, 80)
    elif CURRENT_WORKLOAD == "Web Browsing":
        prob_gpu = 0.05
        prob_cpu_dispatch = 0.6
        prob_cpu_idle = 0.4
        dur_gpu = (10, 50)
        dur_cpu = (10, 60)
    else: # Balanced
        prob_gpu = 0.3
        prob_cpu_dispatch = 0.4
        prob_cpu_idle = 0.4
        dur_gpu = (50, 400)
        dur_cpu = (20, 150)
        
    for lane, last_end in _lane_cursors.items():
        if "GPU" in lane:
            chance = prob_gpu
            d_range = dur_gpu
        elif lane in ["Core 0", "Core 1"]:
            chance = prob_cpu_dispatch
            d_range = dur_cpu
        else:
            chance = prob_cpu_idle
            d_range = dur_cpu
            
        if now_ms >= last_end - 100 and random.random() < chance:
            effective_start = last_end if last_end > now_ms - 2000 else now_ms - random.randint(0, 500)
            
            gap = random.randint(5, 30) if CURRENT_WORKLOAD == "Gaming" else random.randint(10, 80)
            effective_start += gap
            
            duration = random.randint(d_range[0], d_range[1])
            rtype = "cpu" if "Core" in lane else "gpu"
            
            tasks.append({
                "id": f"{lane.replace(' ', '')}_{random.randint(10000, 99999)}",
                "resource": lane,
                "start": effective_start,
                "duration": duration,
                "type": rtype
            })
            _lane_cursors[lane] = effective_start + duration
            
    return tasks

def analyze_bottlenecks(cpu_data, gpu_data):
    cpu_util = cpu_data["overall"]
    gpu_util = max([g["utilization"] for g in gpu_data]) if gpu_data else 0
    
    bottleneck = "None"
    alert = "System operating optimally."
    severity = "low"
    
    if gpu_util > 90 and cpu_util < 50:
        bottleneck = "GPU"
        alert = "Severe GPU Bottleneck. CPU is waiting on graphics compute."
        severity = "high"
    elif cpu_util > 85 and gpu_util < 50:
        bottleneck = "CPU"
        alert = "CPU Bottleneck. GPU is underutilized while waiting for logic."
        severity = "high"
    elif cpu_util > 80 and gpu_util > 80:
        bottleneck = "Both"
        alert = "Maximum System Saturation. Hardware is fully utilized."
        severity = "medium"
        
    idle_cores = [i for i, usage in enumerate(cpu_data["cores"]) if usage < 5]
            
    return {
        "bottleneck": bottleneck,
        "alert": alert,
        "severity": severity,
        "idle_cores": idle_cores
    }

def get_system_metrics():
    # Initial call to cpu_percent might return 0.0, it sets the baseline.
    cpu_stats = get_cpu_metrics()
    gpu_stats = get_gpu_metrics()
    
    return {
        "platform": platform.platform(),
        "cpu": cpu_stats,
        "gpu": gpu_stats,
        "tasks": generate_simulated_tasks(),
        "analysis": analyze_bottlenecks(cpu_stats, gpu_stats)
    }
