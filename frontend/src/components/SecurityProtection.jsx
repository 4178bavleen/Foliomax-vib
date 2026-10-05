import { useEffect } from "react";

const SecurityProtection = () => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      const key = e.key.toLowerCase();

      const blocked =
        // PrintScreen
        e.key === "PrintScreen" ||

        // Ctrl + P
        (e.ctrlKey && key === "p") ||

        // Ctrl + S
        (e.ctrlKey && key === "s") ||

        // Ctrl + U
        (e.ctrlKey && key === "u") ||

        // F12
        e.key === "F12" ||

        // Ctrl + Shift + I
        (e.ctrlKey && e.shiftKey && key === "i") ||

        // Ctrl + Shift + J
        (e.ctrlKey && e.shiftKey && key === "j") ||

        // Ctrl + Shift + C
        (e.ctrlKey && e.shiftKey && key === "c");

      if (blocked) {
        e.preventDefault();
        e.stopPropagation();

        // Optional deterrence
        document.body.classList.add("security-blocked");

        setTimeout(() => {
          document.body.classList.remove("security-blocked");
        }, 1000);

        return false;
      }
    };

    const handleContextMenu = (e) => {
      e.preventDefault();
    };

    const handleDragStart = (e) => {
      e.preventDefault();
    };

    document.addEventListener("keydown", handleKeyDown, true);
    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("dragstart", handleDragStart);

    return () => {
      document.removeEventListener("keydown", handleKeyDown, true);
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("dragstart", handleDragStart);
    };
  }, []);

  return null;
};

export default SecurityProtection;