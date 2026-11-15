import { useEffect, useMemo, useRef } from "react";
import { useThree } from "@react-three/fiber";
import { OrbitControls, Html, Line } from "@react-three/drei";
import type { OrbitControls as Controls } from "three-stdlib";
import { Planet } from "./Planet";
import { RADII_KM, systemLayout } from "./sceneMath";
import { SUN_DIRECTION } from "./solar";

/** Only the Moon and Mars are available in the celestial body overview. */
export function SystemOverview({
  physical,
  focusPair,
  onWorld,
  reset,
}: {
  physical: boolean;
  focusPair: boolean;
  onWorld: (body: "moon" | "mars") => void;
  reset: number;
}) {
  const { camera, scene } = useThree();
  const controls = useRef<Controls>(null);
  const layout = systemLayout(physical);
  const bodies = useMemo(() => ["moon", "mars"] as const, []);
  useEffect(() => {
    const gap = Math.abs(layout.mars[0] - layout.moon[0]);
    const span = physical ? Math.max(gap * (focusPair ? 0.8 : 1.3), 3000) : 9000;
    const middle = (layout.moon[0] + layout.mars[0]) / 2;
    camera.near = physical ? 10 : .1;
    camera.far = physical ? Math.max(span * 10, 50000) : 50000;
    camera.position.set(middle + span * .35, span * .3, span * .95);
    camera.updateProjectionMatrix();
    controls.current?.target.set(middle, 0, 0);
    controls.current?.update();
    scene.fog = null;
    return () => {
      camera.near = .1;
      camera.far = 30000;
      camera.updateProjectionMatrix();
    };
  }, [physical, focusPair, reset, camera, scene, layout.moon[0], layout.mars[0]]);

  return (
    <>
      <OrbitControls
        ref={controls}
        makeDefault
        enableDamping
        dampingFactor={.085}
        rotateSpeed={.55}
        zoomSpeed={.8}
        panSpeed={.5}
        minDistance={700}
        maxDistance={physical ? 1e8 : 24000}
      />
      <ambientLight intensity={.025} />
      <directionalLight
        position={SUN_DIRECTION.clone().multiplyScalar(20000)}
        intensity={3.1}
        color="#fff6e9"
      />
      {bodies.map(body => (
        <group key={body}>
          <Planet
            body={body}
            pos={layout[body]}
            r={RADII_KM[body] * layout.scale}
            occluders={bodies
              .filter(other => other !== body)
              .map(other => ({
                position: layout[other],
                radius: RADII_KM[other] * layout.scale,
              }))}
            click={() => onWorld(body)}
          />
          <Html
            position={[layout[body][0], RADII_KM[body] * layout.scale + 150, 0]}
            center
          >
            <button className="worldLabel" onClick={() => onWorld(body)}>
              {body === "moon" ? "القمر" : "المريخ"} ↗
            </button>
          </Html>
        </group>
      ))}
      <Line points={[layout.moon, layout.mars]} color="#48637d" lineWidth={1}/>
    </>
  );
}
