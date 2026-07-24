# ⏱️ SUT Presentation Timer (Ultimate Event Timer)

A professional, web-based presentation timer designed for **Suranaree University of Technology (SUT)**. This tool is built specifically for stage managers, event organizers, and MCs to manage time accurately during university events, conferences, and seminars.

## ✨ Key Features

This timer includes "Pro" and "Ultimate" features typically found in high-end broadcast software (like vMix or Stagetimer.io), but packaged in an easy-to-use web interface:

- **🟡🔴 Smart Color Thresholds:** The timer automatically changes color from SUT Gold (Normal) -> SUT Orange (Warning) -> Red (Danger) based on remaining time.
- **💬 Prompter Message:** A silent communication tool. Stage managers can type a message (e.g., "Wrap up", "Q&A now") that flashes at the top of the presenter's fullscreen view.
- **🎯 Target Time Mode:** Instead of calculating duration manually, just input the time you want the session to end (e.g., `15:30`) and the system calculates the remaining countdown automatically.
- **⏱️ Count-up (Stopwatch) Mode:** Toggle to a count-up mode for open-ended sessions, keeping the timer in SUT Gold color regardless of elapsed time.
- **📋 Agenda Management:** Save and queue up speaker names and their allotted times. Loading an agenda item will automatically display the speaker's name on the timer.
- **🕰️ Real-time Clock Overlay:** A clock sits at the top corner in fullscreen mode so presenters don't lose track of the actual time.
- **⚙️ Custom Thresholds:** Click the gear icon to customize exactly when the Warning (Orange) and Danger (Red) colors should trigger (e.g., 5 mins and 1 min).
- **📱 Fullscreen & Wake Lock:** Enter immersive fullscreen mode. The app uses the Screen Wake Lock API to ensure the monitor never goes to sleep while the timer is running.

## 🛠️ Tech Stack

- **Framework:** [Next.js](https://nextjs.org/) (React)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Language:** TypeScript
- **Design System:** SUT Branding Colors (`#A67436` Gold, `#F26522` Orange)

## 🚀 Getting Started

First, make sure you have Node.js installed. Then, clone the repository and install dependencies:

```bash
# Install dependencies
npm install

# Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## 💻 Usage Tips for Stage Managers

1. **Dual Monitor Setup:** Move the browser window to the monitor facing the speaker, press **Fullscreen**, and use your mouse to interact with the hidden control panel at the bottom of the screen.
2. **Prompter Messages:** In fullscreen mode, hover at the bottom of the screen to reveal the controls. Type your message in the Prompter box and click Send to flash a red alert to the speaker.
3. **Mute/Unmute:** Use the speaker icon to toggle the end-of-time alert sound.

## 📝 License

Developed by Information System Development and Promotion Department (สพส.), Suranaree University of Technology.
