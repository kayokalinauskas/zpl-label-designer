# ZPL Label Designer

## Project Overview

**ZPL Label Designer** is a web-based application built with [Next.js](https://nextjs.org/) that allows users to visually design labels and generate the corresponding ZPL (Zebra Programming Language) code. This code can be sent to Zebra thermal printers to print the designed labels.

The application features a drag-and-drop canvas interface where users can add text, shapes, barcodes, and variable fields. It supports configuring label dimensions and print density (dpmm) to ensure accurate print output.

## Tech Stack

*   **Framework:** Next.js 16 (App Router)
*   **Language:** TypeScript
*   **Styling:** Tailwind CSS 4
*   **UI Components:** Radix UI primitives, shadcn/ui patterns, Lucide React icons
*   **State Management:** Zustand
*   **Canvas/Graphics:** Konva, react-konva
*   **Barcode Rendering:** bwip-js (likely for visual preview)

## Key Features

1.  **Visual Editor:** Interactive canvas to position and resize elements.
2.  **Element Types:**
    *   **Text:** Static text fields.
    *   **Variables:** Dynamic fields (e.g., `${productName}`).
    *   **Rectangles:** Shapes for layout or design.
    *   **Barcodes:** EAN-13 barcode support.
3.  **ZPL Generation:** Real-time conversion of the visual layout into valid ZPL code (`^XA`, `^XZ`, etc.).
4.  **Label Settings:** Configurable width, height, and print density (6, 8, 12, 24 dpmm).

## Project Structure

*   `src/app`: Main application routes and layout.
*   `src/components`:
    *   `label-designer/`: Core designer components (Canvas, Sidebar, PropertiesPanel).
    *   `ui/`: Reusable UI components (buttons, inputs, sliders, etc.).
*   `src/lib`:
    *   `zpl-generator.ts`: Logic for converting label elements into ZPL strings.
    *   `utils.ts`: General utility functions.
*   `src/store`:
    *   `useLabelStore.ts`: Zustand store managing the label state (elements, selection, settings).
*   `src/types.ts`: TypeScript definitions for `LabelElement`, `LabelSettings`, etc.

## Getting Started

### Prerequisites

*   Node.js (LTS version recommended)
*   npm, yarn, pnpm, or bun

### Installation

```bash
npm install
```

### Running Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

### Building for Production

```bash
npm run build
npm start
```

## Development Conventions

*   **State Management:** All label state changes should go through `useLabelStore`.
*   **ZPL Logic:** Any new element types added to the designer must also have a corresponding handler in `src/lib/zpl-generator.ts` to ensure they can be printed.
*   **Styling:** Use Tailwind CSS utility classes.
*   **Components:** Prefer small, functional components. UI primitives are located in `src/components/ui`.
