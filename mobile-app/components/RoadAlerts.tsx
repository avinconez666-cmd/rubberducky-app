import { useEffect, useRef } from "react";
import { angleDelta, bearingDegrees, nearestCameras } from "@/lib/cameras";
import { useApp } from "@/contexts/AppContext";

/** Warns once per published camera when it is ahead and inside 800 m. */
export function RoadAlerts() {
  const { userLocation, currentSpeed, pushRoadAlert, hazards, user } = useApp();
  const warned = useRef<Set<string>>(new Set());
  const policeWarned = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!userLocation) return;
    const near = nearestCameras(userLocation.latitude, userLocation.longitude, 8, 800);
    for (const cam of near) {
      if (warned.current.has(cam.id)) continue;
      if (userLocation.heading != null && currentSpeed >= 15) {
        const aim = bearingDegrees(userLocation.latitude, userLocation.longitude, cam.lat, cam.lng);
        if (angleDelta(userLocation.heading, aim) > 70) continue;
      }
      warned.current.add(cam.id);
      const kind = cam.kind === "redlight" ? "Red-light camera" : "Fixed speed camera";
      const school = cam.schoolZone ? " School zone." : "";
      pushRoadAlert(
        kind,
        `${cam.road}, ${cam.suburb}. About ${Math.round(cam.meters)} m ahead.${school} Signposted. Obey the posted limit. Transport for NSW list.`,
        14000,
      );
      break;
    }
  }, [userLocation, currentSpeed, pushRoadAlert]);

  useEffect(() => {
    if (!userLocation) return;
    const now = Date.now();
    for (const hazard of hazards) {
      if (hazard.type !== "police" && hazard.type !== "speed_camera" && hazard.type !== "driver") continue;
      if (hazard.reportedBy === user?.displayName) continue;
      if (policeWarned.current.has(hazard.id)) continue;
      const meters = Math.hypot(
        (hazard.latitude - userLocation.latitude) * 111_320,
        (hazard.longitude - userLocation.longitude) * 111_320 * Math.cos((userLocation.latitude * Math.PI) / 180),
      );
      if (meters > 700) continue;
      policeWarned.current.add(hazard.id);
      if (hazard.type === "police") {
        pushRoadAlert("Reported traffic stop", `${hazard.reportedBy}: ${hazard.description}. Ease off so nobody brakes late.`, 12000);
      } else if (hazard.type === "driver") {
        pushRoadAlert("Driver reported ahead", `${hazard.description}. Give them room. This is a driver report, not a person.`, 12000);
      } else if (!hazard.id.startsWith("nsw-")) {
        pushRoadAlert("Reported camera", `${hazard.description || "A driver marked a camera here."} Check the signs.`, 12000);
      }
    }
  }, [hazards, userLocation, pushRoadAlert, user?.displayName]);

  return null;
}
