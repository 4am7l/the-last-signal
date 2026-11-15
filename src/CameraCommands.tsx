import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import type { OrbitControls } from "three-stdlib";
import { MathUtils } from "three";
import { zoomDistance } from "./sceneMath";
import type { Language } from "./explorer-language";

export type CameraCommand = { id: number; kind: "in" | "out" | "left" | "right" | "up" | "down" | "stop" };

const keyboardActions: Partial<Record<string, CameraCommand["kind"]>> = {
  "+": "in", "=": "in", "-": "out", ArrowLeft: "left", ArrowRight: "right",
  ArrowUp: "up", ArrowDown: "down", Escape: "stop",
};

export function CameraCommands({ command, language }: { command?: CameraCommand; language?: Language }) {
  const { camera, controls: raw, gl } = useThree();
  const controls = raw as OrbitControls | undefined;
  const last = useRef(0);
  const pending = useRef<number | null>(null);

  function run(kind: CameraCommand["kind"]) {
    if (!controls) return;
    const previousZoom = pending.current;
    controls.dispatchEvent({ type: "start", target: controls });
    if (kind === "in" || kind === "out") {
      pending.current = zoomDistance(previousZoom ?? controls.getDistance(), controls.minDistance, controls.maxDistance, kind === "in");
      return;
    }
    const step = .13 * Math.max(.08, controls.rotateSpeed / .65);
    if (kind === "left" || kind === "right") {
      controls.setAzimuthalAngle(controls.getAzimuthalAngle() + (kind === "left" ? step : -step));
    } else if (kind === "up" || kind === "down") {
      controls.setPolarAngle(MathUtils.clamp(controls.getPolarAngle() + (kind === "up" ? -step : step), controls.minPolarAngle, controls.maxPolarAngle));
    }
    controls.update();
  }

  useEffect(() => {
    if (!controls) return;
    const cancel = () => { pending.current = null; };
    controls.addEventListener("start", cancel);
    return () => {
      cancel();
      controls.removeEventListener("start", cancel);
    };
  }, [controls]);

  useEffect(() => {
    if (command && controls && command.id !== last.current) {
      last.current = command.id;
      run(command.kind);
    }
  }, [command, controls]);

  useEffect(() => {
    const canvas = gl.domElement;
    canvas.tabIndex = 0;
    canvas.setAttribute("aria-label", language === "en"
      ? "Space scene. Use arrow keys to orbit, plus and minus to zoom, and Escape to stop camera motion."
      : "مشهد الفضاء. الأسهم للدوران، زائد وناقص للتقريب، وEscape لإيقاف الحركة.");
    const focus = () => canvas.focus({ preventScroll: true });
    const key = (event: KeyboardEvent) => {
      const action = keyboardActions[event.key];
      if (!action || event.ctrlKey || event.metaKey || event.altKey) return;
      event.preventDefault();
      run(action);
    };
    canvas.addEventListener("pointerdown", focus);
    canvas.addEventListener("keydown", key);
    return () => {
      canvas.removeEventListener("pointerdown", focus);
      canvas.removeEventListener("keydown", key);
    };
  }, [gl, controls, language]);

  useFrame((_, dt) => {
    if (!controls || pending.current === null) return;
    const target = pending.current;
    const distance = controls.getDistance();
    const next = window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ? target
      : MathUtils.damp(distance, target, 10, Math.min(dt, .05));
    camera.position.sub(controls.target).setLength(next).add(controls.target);
    controls.update();
    if (Math.abs(next - target) < Math.max(.0000001, target * .001)) pending.current = null;
  });
  return null;
}
