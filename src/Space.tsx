import { Suspense, useRef } from "react";
import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import * as T from "three";
import { WebGLUnavailableError } from "./scene-errors";
import { BodyStudy } from "./BodyStudy";
import { CameraCommands, type CameraCommand } from "./CameraCommands";
import { useEagleModel } from "./EagleDescentStage";
import { FixedStars } from "./FixedStars";
import { RenderSettings } from "./RenderSettings";
import { SurfaceWorld } from "./SurfaceWorld";
import type { Destination, View } from "./navigation";

export type Mode = View;
type SceneProps = {
  mode: Mode;
  body: Destination;
  reset: number;
  sceneKey: string;
  onSceneReady: (key: string) => void;
};

function createRenderer(defaults: Parameters<Extract<NonNullable<React.ComponentProps<typeof Canvas>["gl"]>, Function>>[0]) {
  const { canvas, ...options } = defaults;
  if (!(canvas instanceof HTMLCanvasElement)) {
    throw new Error("The scene canvas is unavailable.");
  }
  const attributes = { alpha: true, antialias: true, depth: true, powerPreference: "default" as const };
  const context = (canvas.getContext("webgl2", attributes)
    ?? canvas.getContext("webgl2", { ...attributes, antialias: false, powerPreference: "low-power" })) as WebGL2RenderingContext | null;
  if (!context) throw new WebGLUnavailableError();
  const renderer = new T.WebGLRenderer({ ...options, canvas, context, logarithmicDepthBuffer: true });
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  return renderer;
}

export function Space({ cameraCommand, ...props }: SceneProps & { cameraCommand: CameraCommand }) {
  return (
    <Canvas shadows gl={createRenderer}
      camera={{ position: [0, 100, 950], fov: 44, near: .1, far: 10000 }} dpr={[1, 2]}>
      {props.mode !== "overview" && <color attach="background" args={["#05070d"]} />}
      <RenderSettings />
      <Suspense fallback={null}>
        <SceneAssetsGate {...props} />
      </Suspense>
      <CameraCommands command={cameraCommand} />
    </Canvas>
  );
}

function SceneAssetsGate({ body, mode, reset, sceneKey, onSceneReady }: SceneProps) {
  useLoader(T.TextureLoader, body === "mars" ? "/mars-nasa-viking.jpg" : "/moon.jpg");
  useLoader(T.TextureLoader, "/moon-height.jpg");
  const scene = (
    <>
      {mode === "overview" ? <BodyStudy body={body} reset={reset} /> : (
        <>
          <SurfaceWorld body={body} mode={mode} reset={reset} />
          <FixedStars marsSurface={body === "mars"} />
        </>
      )}
      <FirstSceneFrame key={sceneKey} sceneKey={sceneKey} onReady={onSceneReady} />
    </>
  );
  return body === "moon" && mode === "surface" ? <EagleAssets>{scene}</EagleAssets> : scene;
}

function EagleAssets({ children }: { children: React.ReactNode }) {
  useEagleModel();
  return children;
}

function FirstSceneFrame({ sceneKey, onReady }: { sceneKey: string; onReady: (key: string) => void }) {
  const frames = useRef(0);
  useFrame(() => {
    if (++frames.current === 2) onReady(sceneKey);
  });
  return null;
}
