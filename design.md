---
name: Daylú Dulce
description: A warm, approachable point-of-sale interface for a Mexican paletería, using pastel Mexican pink with creamy neutrals and restrained fruit accents.
colors:
  primary: "#B94361"
  primary-soft: "#F4C7D2"
  secondary: "#FFF5F6"
  background: "#FFF9F3"
  surface: "#FFFFFF"
  text: "#34252A"
  muted: "#78666C"
  border: "#F0DDE1"
  accent-lime: "#A5B86B"
  accent-guava: "#E990A8"
typography:
  heading:
    fontFamily: "Nunito Sans, system-ui, sans-serif"
    fontSize: 1.5rem
    fontWeight: 700
  body:
    fontFamily: "Nunito Sans, system-ui, sans-serif"
    fontSize: 0.9375rem
    fontWeight: 400
  label:
    fontFamily: "Nunito Sans, system-ui, sans-serif"
    fontSize: 0.8125rem
    fontWeight: 600
rounded:
  sm: 8px
  md: 14px
  lg: 20px
spacing:
  sm: 8px
  md: 16px
  lg: 24px
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "#FFFFFF"
    rounded: "{rounded.md}"
    padding: 12px
  navigation-active:
    backgroundColor: "{colors.primary-soft}"
    textColor: "{colors.primary}"
---

## Overview

The visual language adapts the supplied School Teacher Dashboard's clear sidebar, compact navigation, summary cards, and single-page section switching to Daylú Dulce. Replace all school concepts with paletería operations. The mood is friendly, fresh, and practical for a small neighborhood business: Mexican pastel pink balanced with warm cream, readable dark text, and small lime/guava accents. Avoid a dark institutional sidebar and avoid using decoration that competes with quick checkout tasks.

## Colors

- **Primary (#B94361):** Deep guava-rose for primary actions, selected navigation, and important status indicators.
- **Primary soft (#F4C7D2):** Pastel Mexican pink for selected states and subtle highlights.
- **Secondary (#FFF5F6):** Blush-tinted surfaces for the application shell.
- **Background (#FFF9F3):** Warm cream canvas.
- **Surface (#FFFFFF):** Cards and tables.
- **Text (#34252A) and muted (#78666C):** High legibility for labels, totals, and supporting content.
- **Lime (#A5B86B) and guava (#E990A8):** Restrained accents for product variety and positive states.

## Typography

Use a friendly, highly legible sans-serif system stack. Headings should be clear and compact; labels and prices must remain easy to scan at a glance.

## Layout

Use the template's persistent left navigation and main content area, adapting it for dashboard, sales, point of sale, inventory, expenses, and users. Keep checkout controls prominent, tables scannable, and layouts responsive on narrow screens.

## Elevation & Depth

Use subtle borders and soft shadows to separate cards from the cream canvas. Avoid heavy shadows and dark surfaces.

## Shapes

Use rounded cards and controls with a consistent moderate radius. Status should not rely on color alone.

## Components

Keep the sidebar navigation, summary cards, period selector, data tables, and checkout cart visually consistent. Use the primary rose only for the main action or selected state; reserve lime and guava for secondary highlights.

## Do's and Don'ts

- Do prioritize price, quantity, and checkout actions for point-of-sale use.
- Do use Spanish (Mexico) labels and MXN currency formatting.
- Do label sample data as demonstration data until real business records are connected.
- Don't leave school-specific wording, sample users, or academic modules in the application.
- Don't present mock data or local-only actions as saved business records.
