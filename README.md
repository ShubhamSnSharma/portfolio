# Shubham Sharma | Portfolio

Live Website: [internhuntt.vercel.app](https://internhuntt.vercel.app/)

## Overview
A high-performance, narrative-driven personal portfolio designed to showcase projects in Data Science, Machine Learning, and Full-Stack Development. The architecture departs from traditional static layouts by utilizing scroll-driven interactions and dynamic Canvas API visualizations to create a cohesive user experience.

## Technical Architecture
The project was built using vanilla web technologies to maintain absolute control over the rendering pipeline and achieve maximum performance, avoiding the overhead of heavy frontend frameworks.

- **Structure:** Semantic HTML5
- **Styling:** CSS3 (Custom Variables, Flexbox/Grid layouts, backdrop-filter for glassmorphism)
- **Logic & Animation:** Vanilla JavaScript (ES6+)
- **Visualizations:** HTML5 Canvas API with `requestAnimationFrame` for physics-based rendering
- **Scroll Engine:** Lenis Smooth Scroll API

## Core Features
- **Performance Optimized:** Achieves 99/100 Lighthouse Performance scores through asset compression, deferred loading, and hardware-accelerated CSS transforms.
- **Dynamic Data Visualization:** Implements a mouse-reactive particle mesh and a scroll-tracked topological path drawing mechanism.
- **Responsive Design:** Fluid typography and layout scaling across all breakpoints and device orientations.
- **Accessibility (a11y):** Maintains a 100/100 Lighthouse Accessibility score through semantic markup, ARIA labels, and logical focus management.

## Featured Projects

### 1. InternHunt
**Category:** MERN Stack / API Development
An internship discovery platform engineered to connect students with opportunities through automated resume parsing and intelligent skill extraction.

### 2. Crime Against Women Analysis (India)
**Category:** Data Science / Statistical Analysis
A comprehensive data analysis project examining 1.67M+ NCRB crime records to identify regional trends, conviction rates, and systemic judicial backlogs using Python and Pandas.

### 3. Delhi Air Quality Forecasting
**Category:** Deep Learning / Time Series Forecasting
A comparative study evaluating the efficacy of classical statistical models (SARIMA, Holt-Winters) against deep learning architectures (LSTM) for predicting daily PM2.5 levels over a 5-year dataset.

## Local Development Setup

To run the portfolio locally without triggering cross-origin resource sharing (CORS) errors on local assets:

1. Clone the repository:
   ```bash
   git clone https://github.com/ShubhamSnSharma/portfolio.git
   ```
2. Navigate to the project directory:
   ```bash
   cd portfolio
   ```
3. Initialize a local web server (Python 3 example):
   ```bash
   python3 -m http.server 8080
   ```
4. Access the site via `http://localhost:8080` in your browser.

## Contact & Links
- **GitHub:** [github.com/ShubhamSnSharma](https://github.com/ShubhamSnSharma)
- **LinkedIn:** [linkedin.com/in/shubhamsnsharma](https://www.linkedin.com/in/shubhamsnsharma)
- **Email:** shubhamsnsharma@gmail.com
