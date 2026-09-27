import React from "react";
import { Sequence } from "remotion";
import { Scene1Intro } from "./Scene1Intro";
import { Scene2RegistryVideoWall } from "./Scene2RegistryVideoWall";
import { Scene3VehicleTracer } from "./Scene3VehicleTracer";
import { Scene4WatchlistAlert } from "./Scene4WatchlistAlert";
import { Scene5Scalability } from "./Scene5Scalability";
import { Scene6Conclusion } from "./Scene6Conclusion";

export const HackathonVideo: React.FC = () => {
  // Frame durations at 30 fps
  const SCENE1_DUR = 180; // 6s - Intro & Overview
  const SCENE2_DUR = 210; // 7s - Models 1 & 2 Video Wall & Ingestion
  const SCENE3_DUR = 240; // 8s - Jury Test: Designated Vehicle Tracing
  const SCENE4_DUR = 210; // 7s - Model 3: Watchlist Alert & Intercept
  const SCENE5_DUR = 180; // 6s - Gap Analysis & Scalability
  const SCENE6_DUR = 180; // 6s - Conclusion & Team

  const scene2Start = SCENE1_DUR;
  const scene3Start = scene2Start + SCENE2_DUR;
  const scene4Start = scene3Start + SCENE3_DUR;
  const scene5Start = scene4Start + SCENE4_DUR;
  const scene6Start = scene5Start + SCENE5_DUR;

  return (
    <div className="w-full h-full bg-[#050B14] relative">
      <Sequence from={0} durationInFrames={SCENE1_DUR}>
        <Scene1Intro />
      </Sequence>

      <Sequence from={scene2Start} durationInFrames={SCENE2_DUR}>
        <Scene2RegistryVideoWall />
      </Sequence>

      <Sequence from={scene3Start} durationInFrames={SCENE3_DUR}>
        <Scene3VehicleTracer />
      </Sequence>

      <Sequence from={scene4Start} durationInFrames={SCENE4_DUR}>
        <Scene4WatchlistAlert />
      </Sequence>

      <Sequence from={scene5Start} durationInFrames={SCENE5_DUR}>
        <Scene5Scalability />
      </Sequence>

      <Sequence from={scene6Start} durationInFrames={SCENE6_DUR}>
        <Scene6Conclusion />
      </Sequence>
    </div>
  );
};
