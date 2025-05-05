# TimeKeeper

A modern, lightweight time tracking application built with TypeScript, Lit, and Vite. TimeKeeper helps you track your work hours with a simple, intuitive interface and powerful features.

## Features

- 🕒 **Simple Time Entry**

  - Flexible time format (e.g., "1h 45m", "2d 1h 45m 35s")
  - Required comment field for better tracking
  - Optional ticket reference support
- 📅 **Date Management**

  - View entries by date
  - History view with pagination
  - Future date prevention
  - Dynamic date selection
- 📊 **Data Management**

  - Local storage persistence
  - Edit and delete entries
  - Export to Excel with formatting
  - Total hours calculation
- 🎨 **Modern UI**

  - Clean, responsive design
  - Dark mode support
  - Intuitive navigation
  - Beautiful card-based layout
- 📱 **Progressive Web App (PWA)**

  - Install on your device (desktop or mobile)
  - Works offline
  - Automatic updates
  - Native-like experience
  - Responsive design for all screen sizes

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- pnpm (recommended) or npm

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/timekeeper.git
   cd timekeeper
   ```
2. Install dependencies:

   ```bash
   pnpm install
   ```
3. Start the development server:

   ```bash
   pnpm dev
   ```
4. Open your browser and navigate to `http://localhost:5173`

### PWA Installation

1. Visit the application URL
2. Click the "Install App" button when prompted
3. Follow your browser's installation instructions

#### PWA Requirements
- Modern browser (Chrome, Edge, Firefox, Safari)
- HTTPS connection (required for PWA installation)
- Sufficient storage space on your device

## Usage

1. **Adding Time Entries**

   - Enter time in flexible format (e.g., "1h 45m")
   - Add a required comment
   - Optionally add a ticket reference
   - Click "Add Entry"
2. **Managing Entries**

   - Edit entries with the ✏️ button
   - Delete entries with the 🗑️ button
   - View history with the "Show History" button
3. **Exporting Data**

   - Open the history view
   - Click "Export to Excel"
   - Get a formatted Excel file with all your entries

## Technology Stack

- **Frontend Framework**: Lit
- **Language**: TypeScript
- **Build Tool**: Vite
- **Styling**: CSS with dark mode support
- **Data Storage**: LocalStorage
- **Excel Export**: [xlsx](https://www.npmjs.com/package/xlsx) library
- **PWA Support**: Vite PWA Plugin

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built with [Lit](https://lit.dev/)
- Powered by [Vite](https://vitejs.dev/)
- Excel export using [xlsx](https://www.npmjs.com/package/xlsx)
- PWA support with [vite-plugin-pwa](https://vite-pwa-org.netlify.app/)
