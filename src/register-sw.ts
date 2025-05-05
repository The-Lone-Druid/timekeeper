let deferredPrompt: any;

window.addEventListener("beforeinstallprompt", (e) => {
  // Prevent Chrome 67 and earlier from automatically showing the prompt
  e.preventDefault();
  // Stash the event so it can be triggered later
  deferredPrompt = e;
  // Show the install button
  const installButton = document.getElementById("install-button");
  if (installButton) {
    installButton.style.display = "block";
  }
});

export function registerSW() {
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log("SW registered: ", registration);
          // Check if the app is already installed
          if (!window.matchMedia("(display-mode: standalone)").matches) {
            // If not installed, show the install button
            const installButton = document.getElementById("install-button");
            if (installButton) {
              installButton.style.display = "block";
            }
          }
        })
        .catch((registrationError) => {
          console.log("SW registration failed: ", registrationError);
        });
    });
  }
}

export function showInstallPrompt() {
  if (!deferredPrompt) {
    return;
  }

  // Show the install prompt
  deferredPrompt.prompt();

  // Wait for the user to respond to the prompt
  deferredPrompt.userChoice.then((choiceResult: { outcome: string }) => {
    if (choiceResult.outcome === "accepted") {
      console.log("User accepted the install prompt");
      // Hide the install button if it exists
      const installButton = document.getElementById("install-button");
      if (installButton) {
        installButton.style.display = "none";
      }
    } else {
      console.log("User dismissed the install prompt");
    }
    // Clear the saved prompt since it can't be used again
    deferredPrompt = null;
  });
}
