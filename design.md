# AI Design Tool Prompt for TFM - Chap Chap

Use the following prompt to generate consistent UI/UX designs, assets, or marketing materials for the **Trust Funding Microfinance (TFM) - Chap Chap** application.

---

## **Prompt**

> **Role:** Expert UI/UX Designer specializing in modern Fintech and Microfinance applications.
>
> **Project:** "Chap Chap" by Trust Funding Microfinance (TFM). A fast, secure, and accessible digital loan application platform.
>
> **Visual Identity & Theme:**
> *   **Primary Color (Cyan/Teal):** Fresh, trustworthy, and modern. (OKLCH: 0.7132 0.1255 219.6625)
> *   **Secondary/Accent Color (Gold/Yellow):** Wealth, optimism, and energy. (OKLCH: 0.8632 0.1762 92.3100)
> *   **Backgrounds:** Clean, bright whites and very light grays for a spacious feel. (OKLCH: 0.99 0 0)
> *   **Typography:** Modern Sans-Serif (Geist/Figtree). Clean, legible, and professional.
> *   **Style:** Minimalist, high-contrast, accessible, and "mobile-first".
>
> **Key Design Elements:**
> *   **Shapes:** Soft rounded corners (Border Radius: 0.5rem / 8px).
> *   **Shadows:** Subtle, diffused shadows for depth (Elevation).
> *   **Iconography:** Simple, outlined icons (Lucide style) with primary or accent colors.
> *   **Imagery:** Professional, diverse, and relatable photos of people in business/financial contexts, often using the brand colors in the environment.
>
> **Objective:**
> Create a high-fidelity UI design for a [SPECIFIC SCREEN, e.g., "Loan Dashboard" or "Mobile Landing Page"]. The design should convey **speed ("Chap Chap")**, **security**, and **transparency**. Use plenty of whitespace to keep the interface uncluttered. Important actions (like "Apply Now") should be prominent using the Primary or Accent colors.
>
> **Specific Requirements:**
> 1.  **Header:** Clean navigation with the "Chap Chap" logo (Icon + Text).
> 2.  **Hero Section:** Impactful headline, clear CTA button, and abstract background elements or high-quality photo.
> 3.  **Cards:** Use card-based layouts for displaying loan offers, statistics, or application steps.
> 4.  **Responsiveness:** Show how the design adapts to mobile screens.

---

## **Color Palette Reference (CSS Variables)**

```css
:root {
  /* Brand Colors */
  --primary: oklch(71.32% 0.1255 219.66); /* Cyan/Teal */
  --secondary: oklch(86.32% 0.1762 92.31); /* Gold/Yellow */
  --accent: oklch(86.32% 0.1762 92.31);    /* Gold/Yellow */
  
  /* Neutrals */
  --background: oklch(99% 0 0);
  --foreground: oklch(39.04% 0 0);
  --muted: oklch(97% 0 0);
  --muted-foreground: oklch(44% 0 0);
  
  /* UI Elements */
  --card: oklch(100% 0 0);
  --border: oklch(92% 0 0);
  --radius: 0.5rem;
}
```
