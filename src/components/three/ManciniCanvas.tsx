import { Canvas, extend } from "@react-three/fiber";
import { useRef, useState } from "react";
import { ResizeHandler } from "./ResizeHandler";
import * as THREE from "three/webgpu";

extend(THREE);

export function ManciniCanvas(props: { quality: "default" | "high"; children: React.ReactNode; }) {
  const rendererRef = useRef<THREE.WebGPURenderer | undefined>(undefined);
  const [frameloop, setFrameloop] = useState<"always"|"never">("never");
  return (
    <Canvas
      onCreated={(state) => {
        state.setSize(window.innerWidth, window.innerHeight);
      }}
      frameloop={frameloop}
      dpr={props.quality === "default" ? 1 : [1, 1.5]}
      camera={{
        position: [18.6, -0.6, 0],
        near: 0.1,
        far: 50,
        fov: 65,
        // zoom: 1,
      }}
      shadows={"variance"}
      gl={(props) => {
        console.log("[ManciniCanvas] initializing WebGPU renderer");
        const renderer = new THREE.WebGPURenderer({
          canvas: props.canvas,
          powerPreference: "high-performance",
          antialias: false,
          alpha: false,
          stencil: false,
        });

        // Initialize WebGPU and store renderer reference
        renderer.init().then(() => setFrameloop("always"));
        rendererRef.current = renderer;
        return renderer;
      }}
    >
      {props.children}
      <ResizeHandler quality={props.quality} rendererRef={rendererRef} />
    </Canvas>
  );
}
