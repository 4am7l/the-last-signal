import { useEffect, useRef } from "react";
import { useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import type { OrbitControls as Controls } from "three-stdlib";
import { Quaternion, Vector3 } from "three";
import { lunarSiteDirection, lunarSites, Planet, SitePin } from "./Planet";
import { SUN_DIRECTION } from "./solar";

const globeCenter = new Vector3();
const globeRotation = new Quaternion();

/** One body per scene. Display radius is normalized; this is not a size comparison. */
export function BodyStudy({
  body,
  reset,
}: {
  body: "moon" | "mars";
  reset: number;
}) {
  const { camera, scene, size } = useThree();
  // Keep the whole globe in view when a tall viewport limits the horizontal field of view.
  const framingScale = Math.max(1, (0.9 * size.height) / Math.max(size.width, 1));
  const controls = useRef<Controls>(null);
  useEffect(() => {
    camera.up.set(0, 1, 0);
    if (body === "moon") {
      camera.position.copy(lunarSiteDirection()).multiplyScalar(950);
    } else {
      camera.position.set(0, 100, 950);
    }
    camera.position.multiplyScalar(framingScale);
    camera.near = 0.1;
    camera.far = 10000;
    camera.updateProjectionMatrix();
    controls.current?.target.set(0, 0, 0);
    controls.current?.update();
    scene.fog = null;
  }, [body, reset, camera, scene, framingScale]);
  return (
    <>
      <OrbitControls
        ref={controls}
        makeDefault
        enableDamping
        enablePan={false}
        minDistance={335}
        maxDistance={1800 * framingScale}
        rotateSpeed={0.6}
        zoomSpeed={0.7}
      />
      <ambientLight intensity={0.35} />
      <directionalLight
        position={SUN_DIRECTION.clone().multiplyScalar(2000)}
        intensity={3}
      />
      <Planet key={body} body={body} r={300} pos={[0, 0, 0]} />
      {body === "moon" && lunarSites.map(({ mission }) => (
        <SitePin key={mission.id} m={mission} rotation={globeRotation} center={globeCenter} />
      ))}
    </>
  );
}
