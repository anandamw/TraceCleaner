# 🛡️ TraceCleaner

TraceCleaner is an advanced, military-grade PC Optimizer Suite and Privacy Protector. Built with **Tauri v2** and **Rust**, it offers unparalleled system performance tuning, deep cache cleaning, and forensic-level file destruction with a beautiful, modern **React** frontend.

---

## ✨ Features

- **📊 Comprehensive Dashboard**: Get a real-time overview of your system's health, including active storage usage, CPU telemetry, and installed applications.
- **⚡ System Optimizer**: Safely sweep away gigabytes of orphaned system junk, temporary files, and recycle bin remnants to reclaim disk space.
- **🕵️ Browser Privacy Cleaner**: Hunt down and obliterate tracking data (Cache, Cookies, and History SQLite databases) across Google Chrome, Microsoft Edge, and Mozilla Firefox.
- **🚀 Startup Manager**: Significantly speed up your Windows boot time by detecting and disabling unnecessary background apps lurking in your system registry.
- **🗄️ Space Analyzer**: Deep-scan your drive to instantly uncover the largest, space-hogging files and securely eradicate them.
- **☠️ File Shredder**: Military-grade data destruction. Overwrites files at the physical disk-sector level using Zero-fill, DoD 5220.22-M, or Peter Gutmann algorithms, making forensic recovery impossible.
- **⚙️ Windows Services Manager**: Detect all background services running on your OS. Instantly force-stop resource-heavy or suspicious third-party services.
- **🌐 Network Port Analyzer**: Monitor all active TCP listening ports in real-time. Trace open ports back to their exact processes and force-kill rogue network listeners with a single click.
- **📦 Smart Backup System**: Automatically creates backups before performing critical registry or system modifications, allowing you to restore your system state anytime.

---

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS v4, Framer Motion, Lucide Icons.
- **Backend**: Rust 🦀, Tauri v2 Framework.
- **Database**: SQLite (via `rusqlite` for local backup management).

---

## 🚀 Installation & Build Guide

### Prerequisites

Before building TraceCleaner, ensure your system has the following core tools installed:

1. **[Node.js](https://nodejs.org/)** (v18 or higher)
2. **[Rust](https://www.rust-lang.org/tools/install)** (`rustup`, `cargo`, `rustc`)

### 🪟 Windows Setup

On Windows, you need the MSVC C++ build tools.

1. Download and install the [Build Tools for Visual Studio 2022](https://visualstudio.microsoft.com/visual-cpp-build-tools/).
2. Run the installer, select **"Desktop development with C++"**, and ensure the Windows 10/11 SDK is checked.
3. Clone the repository and install dependencies:
   ```bash
   git clone https://github.com/yourusername/traceCleaner.git
   cd traceCleaner
   npm install
   ```
4. Run the development server:
   ```bash
   npm run tauri dev
   ```
5. Build the final executable (`.exe` / `.msi`):
   ```bash
   npm run tauri build
   ```

### 🍎 macOS Setup

1. Install the Xcode Command Line Tools:
   ```bash
   xcode-select --install
   ```
2. Clone the repository and install dependencies:
   ```bash
   git clone https://github.com/yourusername/traceCleaner.git
   cd traceCleaner
   npm install
   ```
3. Run the development server:
   ```bash
   npm run tauri dev
   ```
4. Build the final application (`.app` / `.dmg`):
   ```bash
   npm run tauri build
   ```

### 🐧 Linux Setup

On Linux, you need various system libraries (WebKit2GTK, ALSA, etc.) required by Tauri.

1. Install dependencies (Ubuntu/Debian example):
   ```bash
   sudo apt update
   sudo apt install libwebkit2gtk-4.1-dev \
       build-essential \
       curl \
       wget \
       file \
       libxdo-dev \
       libssl-dev \
       libayatana-appindicator3-dev \
       librsvg2-dev
   ```
2. Clone the repository and install npm packages:
   ```bash
   git clone https://github.com/yourusername/traceCleaner.git
   cd traceCleaner
   npm install
   ```
3. Run the development server:
   ```bash
   npm run tauri dev
   ```
4. Build the final binary (`.AppImage` / `.deb`):
   ```bash
   npm run tauri build
   ```

---

## ⚠️ Disclaimer

TraceCleaner utilizes aggressive, low-level system commands (such as Registry manipulation, hard process killing, and disk-sector overwriting). **Use at your own risk.** The authors are not responsible for any data loss, system instability, or accidental destruction of important files.

Always ensure you know what a process or service does before terminating it!

---
*Built with ❤️ for speed, security, and absolute privacy.*
