import * as THREE from "three/webgpu";
import {
  pass,
  mrt,
  output,
  normalView,
  metalness,
  blendColor,
  depth,
  emissive,
  roughness,
  vec2,
} from "three/tsl";
import { bloom } from "three/addons/tsl/display/BloomNode.js";
import { ssr } from "three/addons/tsl/display/SSRNode.js";
import { smaa } from "three/addons/tsl/display/SMAANode.js";
import { useThree, useFrame } from "@react-three/fiber";
import { useEffect, useRef } from "react";

export function WebGPUPostProcessing(props: {
  strength?: number,
  radius?: number,
  quality?: "default" | "high",
}) {
  const { gl: renderer, scene, camera } = useThree();
  const { strength = 0.25, radius = 0.1, quality = "default" } = props; 
  const myRenderer = renderer as unknown as THREE.WebGPURenderer;
  const postProcessingRef = useRef<THREE.PostProcessing | undefined >(undefined);

  useEffect(() => {
    if (!renderer || !scene || !camera) return;

    // Create post-processing setup with specific filters
    const scenePass = pass(scene, camera, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
    });

    // Setup Multiple Render Targets (MRT)
    scenePass.setMRT(
      mrt({
        output: output,
        normal: normalView,
        metalrough: vec2(metalness, roughness),
        emissive: emissive,
      })
    );

    // Get texture nodes
    const scenePassColor = scenePass.getTextureNode("output");
    const scenePassNormal = scenePass.getTextureNode("normal");
    const scenePassDepth = scenePass.getTextureNode("depth");
    const scenePassMetalRough = scenePass.getTextureNode("metalrough");

    const scenePassEmissive = scenePass.getTextureNode("emissive");

    // Create SSR pass
    const ssrPass = ssr(
      scenePassColor,
      scenePassDepth,
      scenePassNormal,
      scenePassMetalRough.r,
      scenePassMetalRough.g,
      camera
    );
    ssrPass.resolutionScale = 1;
    ssrPass.maxDistance.value = 5;
    ssrPass.opacity.value = 1;
    ssrPass.thickness.value = 0.05;

    // Create bloom pass
    const bloomPass = bloom(scenePassEmissive, strength, radius, 0.6);

    // Blend SSR over beauty with SMAA
    const outputNode = smaa(blendColor(scenePassColor.add(bloomPass), ssrPass));

    // Setup post-processing
    const postProcessing = new THREE.PostProcessing(myRenderer);
    postProcessing.outputNode = outputNode;
    postProcessingRef.current = postProcessing;

    return () => {
      postProcessingRef.current = undefined;
    };
  }, [renderer, scene, camera, strength, radius, quality]);

  useFrame(({ gl, scene, camera }) => {
    if (postProcessingRef.current) {
      gl.clear();
      postProcessingRef.current.render();
    }
  }, 1);

  return null;
}
