import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Set the document title
document.title = "CryptoArb - Cryptocurrency Arbitrage Dashboard";

// Add Inter and Roboto Mono fonts
const fontLinks = document.createElement('link');
fontLinks.rel = 'stylesheet';
fontLinks.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Roboto+Mono:wght@400;500&display=swap';
document.head.appendChild(fontLinks);

// Add Material Icons
const iconLink = document.createElement('link');
iconLink.rel = 'stylesheet';
iconLink.href = 'https://fonts.googleapis.com/icon?family=Material+Icons';
document.head.appendChild(iconLink);

createRoot(document.getElementById("root")!).render(<App />);
