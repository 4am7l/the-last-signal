import { Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import { Vector3 } from "three";
import { eagle } from "./eagle";
import { useExplorerText } from "./explorer-language";

export function ApolloSiteMarker({ position, center }: { position: Vector3; center: Vector3 }) {
  const marker = useRef<HTMLAnchorElement>(null);
  const t = useExplorerText();
  const normal = position.clone().sub(center).normalize();
  const view = useRef(new Vector3());

  useFrame(({ camera }) => {
    if (marker.current) {
      // Hide the link behind the lunar horizon, including when panning or zooming in.
      marker.current.hidden = view.current.copy(camera.position).sub(position).dot(normal) <= 0;
    }
  });

  return (
    <Html position={position} center>
      <a ref={marker} className="apollo-site-marker" href={eagle.simulationHref}
        aria-label={t("اهبط في موقع أبولو 11", "Land at the Apollo 11 site")}>
        <span className="material-symbols-rounded" aria-hidden="true">location_on</span>
        <span>
          <strong>{t("أبولو 11", "Apollo 11")}</strong>
          <small>{t("بحر السكون · اهبط هنا", "Tranquility Base · Land here")}</small>
        </span>
      </a>
    </Html>
  );
}
