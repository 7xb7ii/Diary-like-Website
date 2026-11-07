import "quill/dist/quill.snow.css";
import "./styles.css";
import "./app.js";

if ("serviceWorker" in navigator && /^https?:$/.test(window.location.protocol)) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch((error) => {
      console.warn("service worker registration failed", error);
    });
  });
}
