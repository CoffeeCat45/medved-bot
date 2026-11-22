import React from "react";

import thermometerIcon from "../assets/icons/thermometer.svg";
import lungsIcon from "../assets/icons/lungs.svg";
import plateIcon from "../assets/icons/plate.svg";
import skinIcon from "../assets/icons/skin.svg";
import brainIcon from "../assets/icons/brain.svg";
import boneIcon from "../assets/icons/bone.svg";
import microphoneIcon from "../assets/icons/microphone.svg";
import moonIcon from "../assets/icons/moon.svg";
import sunIcon from "../assets/icons/sun.svg";
import doctorIcon from "../assets/icons/doctor.svg";
import hospitalIcon from "../assets/icons/hospitale.svg";
import calendarIcon from "../assets/icons/calendar.svg";
import clockIcon from "../assets/icons/clock.svg";
import attentionIcon from "../assets/icons/Atention.svg";

/**
 * Одноцветные иконки из набора. Рисуются как маска, залитая currentColor,
 * поэтому сами подстраиваются под тему: тёмные в светлой теме и светлые в тёмной
 * (цвет задаётся в App.css у класса .icon-mask через --text).
 *
 * Чтобы добавить новую одноцветную иконку: положите SVG в src/assets/icons,
 * импортируйте выше и добавьте её в этот список (и в тип MaskIconName).
 */
type MaskIconName =
  | "thermometer"
  | "lungs"
  | "stomach"
  | "band"
  | "brain"
  | "bone"
  | "microphone"
  | "moon"
  | "sun"
  | "user"
  | "hospital"
  | "calendar"
  | "clock";

const MASK_ICONS: Record<MaskIconName, string> = {
  thermometer: thermometerIcon,
  lungs: lungsIcon,
  stomach: plateIcon,
  band: skinIcon,
  brain: brainIcon,
  bone: boneIcon,
  microphone: microphoneIcon,
  moon: moonIcon,
  sun: sunIcon,
  user: doctorIcon,
  hospital: hospitalIcon,
  calendar: calendarIcon,
  clock: clockIcon,
};

type IconName =
  | MaskIconName
  | "warning"
  | "close"
  | "arrow-left"
  | "stethoscope";

interface IconProps {
  name: IconName;
  size?: number;
  className?: string;
}

const isMaskIcon = (name: IconName): name is MaskIconName =>
  Object.hasOwn(MASK_ICONS, name);

/**
 * Единый набор иконок приложения.
 * - Одноцветные (MASK_ICONS) меняют цвет вместе с темой.
 * - Цветная иконка «Внимание» (warning) одинакова в обеих темах.
 * - close / arrow-left / stethoscope — встроенные SVG на currentColor.
 */
export const Icon: React.FC<IconProps> = ({ name, size = 24, className }) => {
  if (isMaskIcon(name)) {
    const mask = `url("${MASK_ICONS[name]}")`;
    return (
      <span
        className={className ? `icon-mask ${className}` : "icon-mask"}
        style={{
          width: size,
          height: size,
          WebkitMaskImage: mask,
          maskImage: mask,
        }}
        aria-hidden="true"
      />
    );
  }

  const common = {
    width: size,
    height: size,
    viewBox: "0 0 48 48",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    className,
    "aria-hidden": true as const,
    focusable: false as const,
  };

  const outline = {
    stroke: "currentColor",
    strokeWidth: 2.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  switch (name) {
    case "warning":
      // Цветная иконка: не перекрашивается, выглядит одинаково в обеих темах.
      return (
        <img
          src={attentionIcon}
          width={size}
          height={size}
          alt=""
          className={className ? `icon-img ${className}` : "icon-img"}
        />
      );
    case "close":
      return (
        <svg {...common}>
          <path d="m13 13 22 22m0-22L13 35" {...outline} />
        </svg>
      );
    case "arrow-left":
      return (
        <svg {...common}>
          <path d="M38 24H10m0 0 11-11M10 24l11 11" {...outline} />
        </svg>
      );
    case "stethoscope":
      return (
        <svg {...common}>
          <path
            d="M12 7v11a12 12 0 0 0 24 0V7m-24 0h-4m4 0v5m24-5h4m-4 0v5M24 30v4a7 7 0 0 0 14 0v-3"
            {...outline}
          />
          <circle
            cx="38"
            cy="27"
            r="4"
            fill="#3988f5"
            stroke="currentColor"
            strokeWidth="2"
          />
        </svg>
      );
  }
};
