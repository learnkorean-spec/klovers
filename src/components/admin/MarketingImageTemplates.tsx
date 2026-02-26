import React, { useRef } from "react";
import { getLevelLabel, type GroupData } from "@/lib/marketingEngine";

interface MarketingImageProps {
  group: GroupData;
  size: "1x1" | "4x5" | "story";
}

const SIZE_MAP = {
  "1x1": { width: 1080, height: 1080 },
  "4x5": { width: 1080, height: 1350 },
  "story": { width: 1080, height: 1920 },
};

const URGENCY_COLORS: Record<string, string> = {
  "Last Seats": "bg-destructive text-destructive-foreground",
  "Starting Soon": "bg-chart-4 text-primary-foreground",
  "Open Registration": "bg-primary text-primary-foreground",
};

export function MarketingImageTemplate({ group, size }: MarketingImageProps) {
  const { width, height } = SIZE_MAP[size];
  const scale = 0.25; // Preview scale
  const level = getLevelLabel(group.level);

  return (
    <div
      style={{ width: width * scale, height: height * scale, overflow: "hidden" }}
      className="relative rounded-lg border shadow-sm"
    >
      <div
        id={`marketing-img-${group.id}-${size}`}
        style={{
          width,
          height,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
        }}
        className="bg-background flex flex-col items-center justify-between p-16"
      >
        {/* Top: Urgency Badge */}
        <div className="w-full flex justify-center">
          <span className={`${URGENCY_COLORS[group.urgency_label]} px-8 py-3 rounded-full text-3xl font-bold`}>
            {group.urgency_label}
          </span>
        </div>

        {/* Center: Course Info */}
        <div className="text-center space-y-6 flex-1 flex flex-col items-center justify-center">
          <h2 className="text-7xl font-bold text-foreground tracking-tight">{level}</h2>
          <p className="text-4xl text-muted-foreground font-medium">
            {group.day_name} • {group.start_time}
          </p>
          <p className="text-3xl text-muted-foreground">
            {group.duration_min} minutes per session
          </p>
          <div className="mt-4 bg-primary/10 rounded-2xl px-10 py-5">
            <p className="text-4xl font-bold text-primary">
              {group.seats_left} seat{group.seats_left !== 1 ? "s" : ""} left
            </p>
          </div>
        </div>

        {/* Bottom */}
        <div className="w-full text-center space-y-3">
          <p className="text-3xl font-semibold text-foreground">Limited Seats Available</p>
          <p className="text-2xl text-muted-foreground">klovers.lovable.app</p>
        </div>
      </div>
    </div>
  );
}

export function MarketingImageFull({ group, size }: MarketingImageProps) {
  const { width, height } = SIZE_MAP[size];
  const level = getLevelLabel(group.level);

  return (
    <div
      id={`marketing-full-${group.id}-${size}`}
      style={{ width, height }}
      className="bg-background flex flex-col items-center justify-between p-16"
    >
      {/* Top: Urgency Badge */}
      <div className="w-full flex justify-center">
        <span className={`${URGENCY_COLORS[group.urgency_label]} px-8 py-3 rounded-full text-3xl font-bold`}>
          {group.urgency_label}
        </span>
      </div>

      {/* Center: Course Info */}
      <div className="text-center space-y-6 flex-1 flex flex-col items-center justify-center">
        <h2 className="text-7xl font-bold text-foreground tracking-tight">{level}</h2>
        <p className="text-4xl text-muted-foreground font-medium">
          {group.day_name} • {group.start_time}
        </p>
        <p className="text-3xl text-muted-foreground">
          {group.duration_min} minutes per session
        </p>
        <div className="mt-4 bg-primary/10 rounded-2xl px-10 py-5">
          <p className="text-4xl font-bold text-primary">
            {group.seats_left} seat{group.seats_left !== 1 ? "s" : ""} left
          </p>
        </div>
      </div>

      {/* Bottom */}
      <div className="w-full text-center space-y-3">
        <p className="text-3xl font-semibold text-foreground">Limited Seats Available</p>
        <p className="text-2xl text-muted-foreground">klovers.lovable.app</p>
      </div>
    </div>
  );
}

export const IMAGE_SIZES = SIZE_MAP;
