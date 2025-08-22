# Sumanth19901.github.io
Here’s how we can split your **single-file HTML dashboard** into a structured project layout (frontend only). Each piece goes into its own file:

```
aqvh915_jobs_tracker/
│── frontend/
│   ├── index.html      # Main page structure
│   ├── style.css       # All styles (moved out of <style>)
│   ├── script.js       # All logic (moved out of <script>)
│   └── chart.js        # (optional) included via CDN or npm