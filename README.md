# Pokemon Card Database Website

## Overview
This is a responsive web application that displays Pokemon card data from a CSV file. Users can browse through the cards and filter them by various attributes.

## Features
- **Card Display**: View Pokemon cards in a responsive grid layout
- **Filtering**: Filter cards by:
  - Attribute (Grass, Fire, Water, etc.)
  - Expansion (SV10, etc.)
  - HP Range
  - Card Name
- **Detailed View**: Click on any card to see detailed information including:
  - Card image
  - Basic stats (HP, Type, Weakness, etc.)
  - Attacks and abilities
  - Pokemon information
  - Artist details

## How to Use
1. Start the web server by running: `python -m http.server 8000` in the project directory
2. Open your browser and navigate to: `http://localhost:8000`
3. Browse the cards or use the filters on the left sidebar to narrow down your search
4. Click on any card to view its detailed information

## Technical Details
- The website loads card data from the CSV file located in the `masterdb` folder
- The interface is built with HTML, CSS, and vanilla JavaScript
- The design is fully responsive and works on both desktop and mobile devices

## Data Source
The Pokemon card data is sourced from a CSV file containing detailed information about Pokemon cards including images, stats, and abilities.