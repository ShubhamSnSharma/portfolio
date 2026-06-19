# Shubham Sharma — Premium Interactive Portfolio

<div align="center">

[![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/HTML)
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/CSS)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://internhuntt.vercel.app)

[![Lighthouse Performance](https://img.shields.io/badge/Performance-99%2F100-success?style=for-the-badge&logo=lighthouse&logoColor=white)](#)
[![Lighthouse Accessibility](https://img.shields.io/badge/Accessibility-100%2F100-success?style=for-the-badge&logo=lighthouse&logoColor=white)](#)

**🔗 Live Experience: [internhuntt.vercel.app](https://internhuntt.vercel.app)**

</div>

---

## 📖 Overview

A high-performance, narrative-driven personal portfolio designed to showcase projects in Data Science, Machine Learning, and Full-Stack Development. The architecture departs from traditional static layouts by utilizing scroll-driven interactions and dynamic Canvas API physics to create a unified, book-like digital story.

---

## 🎨 Creative Mechanics & Choreography

The landing experience is built as a unified cinematic sequence rather than independent pages:

*   **Chapter 0: The Prologue Loader:** Centered around an engraved/illuminated SVG scan line effect (*"The Journey Begins"*), bypassing name repetition and utilizing a faint radial amber/navy backdrop glow to ease the transition into Chapter I.
*   **Staggered Entry Layers:** Staged entry sequence that eases in flanking name columns and subtitles relative to the portrait using custom millisecond stagger offsets.
*   **Dynamic Portrait Focus:** Enhances initial visual hierarchy by applying a temporary `+5% brightness` and `+2.5% contrast` highlight onto the portrait during reveal, cooling smoothly back to default grading over `1000ms` at `T = 900ms`.
*   **Static Scroll Cue:** A clean, minimal `"Scroll"` indicator paired with a static gold bar replacing flashing animations, ensuring visual stability.

---

## ⚙️ Technical Architecture

This project is built from scratch using vanilla web technologies to maintain absolute control over the rendering pipeline and achieve maximum performance, completely avoiding framework overhead.

| Technology | Purpose | Key Implementation Details |
|---|---|---|
| **Semantic HTML5** | Structure | Standard layout hierarchy, ARIA roles, high image loading priority |
| **CSS3 & Grid** | Layout & Style | Flexbox/Grid systems, CSS Custom Properties, glassmorphism filters |
| **Vanilla JS (ES6+)** | Logic & Timings | Staged delays, coordinate trackers, DOM cleanup routines |
| **HTML5 Canvas** | Visualizations | Particle meshes, interactive physics, `requestAnimationFrame` drawing |
| **Lenis API** | Scroll Engine | Smooth inertia scrolling, scroll-timeline tracking, thread animation |

---

## 🚀 Core Features

*   **Performance Optimized (99/100):** Achieves near-perfect performance scores using WebP asset compression, deferred image decoding, and hardware-accelerated CSS transforms.
*   **Dynamic Data Visualizations:** Implements a mouse-reactive particle grid and an interactive topological path drawing mechanism tracked to scroll depth.
*   **Fluid Responsive Layout:** Flexible font scaling, layouts, and image sources adapt smoothly to all standard mobile, tablet, and desktop breakpoints.
*   **Accessibility First (100/100):** Strict semantic markup, logical tab indexing, clear keyboard focus outlines, and descriptive labels for screen readers.

---

## 📁 Featured Projects

### 1. InternHunt
*   **Category:** MERN Stack / API Development
*   *An internship discovery platform engineered to connect students with opportunities through automated resume parsing, semantic query matching, and intelligent skill extraction.*

### 2. Crime Against Women Analysis (India)
*   **Category:** Data Science / Statistical Analysis
*   *A comprehensive statistical data analysis project examining 1.67M+ national crime records (NCRB) to identify regional trends, conviction rates, and systemic judicial backlogs using Python and Pandas.*

### 3. Delhi Air Quality Forecasting
*   **Category:** Deep Learning / Time Series Forecasting
*   *A comparative study evaluating the efficacy of classical statistical models (SARIMA, Holt-Winters) against deep learning architectures (LSTM) for predicting daily PM2.5 levels over a 5-year dataset.*

---

## 🛠️ Local Development Setup

To run the portfolio locally without encountering CORS errors for local WebP and JS modules:

1.  **Clone the Repository:**
    ```bash
    git clone https://github.com/ShubhamSnSharma/portfolio.git
    ```
2.  **Navigate to Directory:**
    ```bash
    cd portfolio
    ```
3.  **Initialize Local Web Server:**
    *   *Python 3:*
        ```bash
        python3 -m http.server 8080
        ```
    *   *Node.js (http-server):*
        ```bash
        npx http-server -p 8080
        ```
4.  **Access the Site:** Open [http://localhost:8080](http://localhost:8080) in your browser.

---

## 📬 Contact & Connect

*   **GitHub:** [github.com/ShubhamSnSharma](https://github.com/ShubhamSnSharma)
*   **LinkedIn:** [linkedin.com/in/shubhamsnsharma](https://www.linkedin.com/in/shubhamsnsharma)
*   **Email:** [shubhamsnsharma@gmail.com](mailto:shubhamsnsharma@gmail.com)

---

## 📄 License

This project is protected under an **All Rights Reserved** license.

The source code, custom layout, design systems, assets, and custom animations may not be copied, modified, distributed, or reused for commercial or personal projects without explicit written permission from the author.
