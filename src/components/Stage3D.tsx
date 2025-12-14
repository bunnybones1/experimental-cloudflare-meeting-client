import { useState } from "react";
import { Loader } from "@react-three/drei";
import { WebGPUPostProcessing } from "./three/WebGPUPostProcessing";
import { Hall } from "./three/Hall";
import { Overlay } from "./three/Overlay";
import { LightingEnvironment } from "./three/LightingEnvironment";
import { ManciniCanvas } from "./three/ManciniCanvas";
import { AnimatedMonsters } from "./three/AnimatedMonsters";

export default function Stage3D() {
  const [quality, setQuality] = useState<"default" | "high">("default");
  const [isPostProcessingEnabled, setIsPostProcessingEnabled] = useState(true);
  // Disable frameloop by default, waiting for WebGPU to be ready

  return (
    <div className="absolute inset-0 z-0 pointer-events-none">
      <Overlay
        isPostProcessingEnabled={isPostProcessingEnabled}
        setIsPostProcessingEnabled={setIsPostProcessingEnabled}
        setQuality={setQuality}
        quality={quality}
      />

      <Loader />

      <ManciniCanvas quality={quality}>
        <color attach="background" args={["black"]} />

        {isPostProcessingEnabled && (
          <WebGPUPostProcessing
            strength={0.25}
            radius={0.1}
            quality={quality}
          />
        )}

        <LightingEnvironment />

        <group position={[-1, 0, 0]}>
          <Hall position={[16.3, 0, -0.15]} scale={[1, 1, 1.3]} />
        </group>
        <AnimatedMonsters />
      </ManciniCanvas>
    </div>
  );
}
