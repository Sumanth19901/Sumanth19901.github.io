 # Sumanth19901.github.io
Here’s how we can split your **single-file HTML dashboard** into a structured project layout (frontend only). Each piece goes into its own file:

```
aqvh915_jobs_tracker/
│── frontend/
│   ├── index.html      # Main page structure
│   ├── style.css       # All styles (moved out of <style>)
│   ├── script.js       # All logic (moved out of <script>)
│   └── chart.js        # (optional) included via CDN or npm
# Quantum Jobs Dashboard

A simple web dashboard to view **IBM Quantum backends and monitor job statuses.
Built with HTML + CSS + JavaScript (no frameworks).

Features

📊 Backend Status
  Shows available IBM Quantum backends
  Displays queue depth & qubits
  Online/Offline indicator

📝 Job List
  View jobs with status, backend, shots, and submission time
  Sorting by columns (ID, backend, status, shots, submitted time)
  Filtering by backend, status, or job ID
  Quick search (press `/` to focus search bar)

🔄 Auto Refresh
  Refresh button
  Auto refresh every 30s
  Keyboard shortcut (`r`)

🌙 Dark/Light Theme
  Toggle theme button
  Saves preference in local storage

📈 Chart.js Visualization
  Bar chart showing job counts by status


