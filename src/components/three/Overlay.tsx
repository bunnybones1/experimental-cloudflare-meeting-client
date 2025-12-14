export function   Overlay(props: {
  isPostProcessingEnabled: boolean;
  setIsPostProcessingEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  quality: "default" | "high";
  setQuality: React.Dispatch<React.SetStateAction<"default" | "high">>
}) {
  return (
    <div className="relative z-20 pointer-events-none">
      <footer className="absolute bottom-4 left-1/2 transform -translate-x-1/2 pointer-events-auto">
        <div className="footer-buttons">
          <button
            onClick={() => props.setIsPostProcessingEnabled(!props.isPostProcessingEnabled)}
          >
            {props.isPostProcessingEnabled ? "Disable" : "Enable"} Post Processing
          </button>
          <button
            onClick={() =>
              props.setQuality(props.quality === "default" ? "high" : "default")
            }
            className="toggle-quality"
          >
            {props.quality === "default" ? "Higher Quality" : "Performance Mode"}
          </button>
        </div>
      </footer>
    </div>
  );
}
