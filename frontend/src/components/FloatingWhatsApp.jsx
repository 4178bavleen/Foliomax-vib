import { useEffect } from "react";

export default function FloatingChat() {
  useEffect(() => {
    // Create script element
    const s1 = document.createElement("script");
    const s0 = document.getElementsByTagName("script")[0];

    s1.async = true;
    s1.src = "https://embed.tawk.to/692808b80d02891959543952/1jb2644ng";
    s1.charset = "UTF-8";
    s1.setAttribute("crossorigin", "*");

    // Load script
    s0.parentNode.insertBefore(s1, s0);

    return () => {
      // Cleanup if component ever unmounts
      if (s1.parentNode) {
        s1.parentNode.removeChild(s1);
      }
    };
  }, []);

  return null; // No UI needed, the widget floats automatically
}
