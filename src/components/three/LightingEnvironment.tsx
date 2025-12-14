import { Environment } from "@react-three/drei";
import { OrbitControls } from "@react-three/drei";

export function LightingEnvironment() {
  return (
    <>
      <directionalLight
        position={[-0.7, 1.8, 0.1]}
        intensity={6}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-near={2}
        shadow-camera-far={100}
        shadow-camera-top={4}
        shadow-camera-right={4}
        shadow-camera-bottom={-4}
        shadow-camera-left={-4}
        shadow-bias={-0.002}
      />
      <OrbitControls
        target={[2, -0.6, 0]}
        // zoomSpeed={0.8}
        screenSpacePanning={true}
        dampingFactor={0.08}
        maxPolarAngle={Math.PI / 1.75}
        minPolarAngle={Math.PI / 2.7}
        maxDistance={2.4}
        minDistance={1}
        minZoom={0.5}
        maxZoom={1}
      />
      <Environment
        preset="warehouse"
        environmentIntensity={0.5}
        environmentRotation={[0.4, 0, 1.4]}
      />
    </>
  );
}
