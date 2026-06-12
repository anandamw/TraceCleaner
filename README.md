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

## 🚀 Download & Install

You don't need to build TraceCleaner from source! You can download the latest pre-compiled version directly from our releases page.

### 🪟 Windows (.exe / .msi)
1. Go to the [Releases Page](https://github.com/anandamw/TraceCleaner/releases/latest).
2. Download the `TraceCleaner_x64_setup.exe` or `.msi` file.
3. Double-click the installer to install the application.
4. *Note: To use advanced features like the Windows Services Manager and File Shredder, please run TraceCleaner as Administrator.*

### 🍎 macOS (.dmg)
1. Go to the [Releases Page](https://github.com/anandamw/TraceCleaner/releases/latest).
2. Download the `TraceCleaner.dmg` file.
3. Open the `.dmg` and drag the TraceCleaner icon into your Applications folder.

### 🐧 Linux (.AppImage / .deb)
1. Go to the [Releases Page](https://github.com/anandamw/TraceCleaner/releases/latest).
2. Download the `TraceCleaner.AppImage` file.
3. Make the file executable (`chmod +x TraceCleaner.AppImage`) and double click to run it.

---

## ⚠️ Disclaimer

TraceCleaner utilizes aggressive, low-level system commands (such as Registry manipulation, hard process killing, and disk-sector overwriting). **Use at your own risk.** The authors are not responsible for any data loss, system instability, or accidental destruction of important files.

Always ensure you know what a process or service does before terminating it!

---
*Built with ❤️ for speed, security, and absolute privacy.*
