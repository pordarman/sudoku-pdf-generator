# Sudoku PDF Generator & Solver - React & Web Workers

This is an advanced web application that allows users to generate Sudoku puzzles of varying difficulty levels and download them as printable PDF files. It also features an interactive solver where users can input their own puzzles to find solutions.

The core principle of this application is to leverage **Web Workers** to perform computationally expensive tasks (puzzle generation and solving) in the background, ensuring the main user interface (UI) remains responsive and never freezes.

*You can visit the live demo [here](https://pordarman.github.io/sudoku-pdf-generator/)*

[![Image](https://i.hizliresim.com/diy9y61.png)](https://hizliresim.com/diy9y61)

## ✨ Key Features

This project is packed with a range of powerful features built using modern web technologies:

* **🧠 Advanced Sudoku Generator**:
    * **Multiple Difficulty Levels**: Generate puzzles across 6 different difficulties, from "Child" to "Impossible".
    * **Customizable PDF Output**: Specify the number of pages and the number of puzzles per page (1, 2, 4, or 6).
    * **Solution Pages**: Automatically include solution pages for every generated puzzle in the final PDF.

* **🤖 Interactive Sudoku Solver**:
    * An intuitive 9x9 grid for users to input their own puzzles.
    * A powerful solving engine that finds and displays all possible solutions for a given puzzle.

* **⚡ Asynchronous Operations & Performance**:
    * **Web Workers**: CPU-intensive tasks like puzzle generation and solving run entirely in Web Workers, preventing the main thread from blocking. This keeps the UI smooth and responsive at all times.
    * **Progress Tracking**: The UI displays a real-time progress bar and an estimated time of completion while the PDF is being generated.

* **🌐 Multi-Language Support (i18n)**:
    * A fully internationalized interface supporting 11 languages (including Turkish, English, German, Japanese, etc.), built with the `i18next` library.

* **📱 Responsive Design**:
    * A clean and fully responsive layout that provides a seamless user experience on desktops, tablets, and mobile devices.

[![Image](https://i.hizliresim.com/oj6vulh.png)](https://hizliresim.com/oj6vulh)

## 🛠️ Technology Stack

The project was developed with a focus on performance and efficiency using the following technologies:

| Category              | Technology                                                                                             | Description                                                 |
| :-------------------- | :----------------------------------------------------------------------------------------------------- | :---------------------------------------------------------- |
| **Core Framework** | **[React](https://react.dev/)** | The fundamental library for building the user interface.      |
| **PDF Generation** | **[jsPDF](https://github.com/parallax/jsPDF)** | For dynamically creating PDF documents on the client-side.  |
| **Concurrency** | **[Web Workers](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API)** | Used to run heavy computations in the background.           |
| **Internationalization**| **[i18next](https://www.i18next.com/)** | For implementing multi-language support.                    |
| **Styling** | **Standard CSS** | Custom styles for a clean and functional look and feel.     |
| **Build Tool** | **[Create React App](https://create-react-app.dev/)** | Provided the initial project setup and development server.  |

## ⚙️ How It Works

The core architecture is designed to offload complex tasks to Web Workers, ensuring the main UI thread remains unblocked.

1.  **Puzzle Generation**:
    * The user selects the desired difficulty and page settings from the UI.
    * On clicking "Generate," these settings are sent as a message to the `sudoku.worker.js` Web Worker.
    * The worker begins generating Sudoku puzzles and their solutions in the background, independent of the main thread.
    * With each puzzle generated, the worker posts a progress update back to the main thread, which updates the UI's progress bar.
    * Once all puzzles are created, the final array of data is sent back.
    * Finally, utility functions in `pdfUtils.js` use `jsPDF` to construct the PDF from this data and trigger a download for the user.

2.  **Puzzle Solving**:
    * The user inputs a puzzle into the grid on the "Solver" tab.
    * When "Solve" is clicked, the grid data is sent to the `findAllSolutions.worker.js`.
    * The worker searches for all possible solutions and returns the results to the main thread to be displayed.

[![Image](https://i.hizliresim.com/39o9rtr.png)](https://hizliresim.com/39o9rtr)

## 📂 Project Structure
```shell
/
├── public/
│   ├── fonts/          # Custom fonts used for the PDF generation
│   └── translation/    # Language JSON files (tr.json, en.json, etc.)
├── src/
│   ├── components/     # React components (Generator.js, Solver.js, SudokuGrid.js)
│   ├── utils/          # Helper functions (pdfUtils.js, sudokuLogic.js)
│   ├── App.js          # Main application component with tab navigation
│   ├── i18n.js         # i18next configuration
│   ├── index.js        # Application entry point
│   ├── sudoku.worker.js # Worker for puzzle generation
│   └── findAllSolutions.worker.js # Worker for puzzle solving
├── package.json
└── README.md
```
## 🚀 Getting Started

Follow these steps to get a local copy up and running.

### **Prerequisites**

* [Node.js](https://nodejs.org/) (version 16 or higher)
* [npm](https://www.npmjs.com/get-npm)

### **Installation**

1.  **Clone the repository**
    ```shell
    git clone https://github.com/pordarman/sudoku-pdf-generator.git
    ```
2.  **Navigate to the project directory**
    ```shell
    cd sudoku-pdf-generator
    ```
3.  **Install NPM packages**
    ```shell
    npm install
    ```

### **Running the Application**

To start the development server, run the following command:
```shell
npm start
```
The application will be available at `http://localhost:3000`.