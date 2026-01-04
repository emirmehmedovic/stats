"use client";

import { useRef, useMemo } from "react";
import { motion } from "framer-motion";
import DottedMap from "dotted-map";
import Image from "next/image";
import { useTheme } from "next-themes";

const MAP_CONFIG = {
  lat: { min: 35, max: 65 },
  lng: { min: -10, max: 40 },
};

interface MapProps {
  dots?: Array<{
    start: { lat: number; lng: number; label?: string };
    end: { lat: number; lng: number; label?: string };
  }>;
  lineColor?: string;
}

// Ažurirani gradovi sa Maastrichtom, Cologneom i Antalyom
const CITIES = {
  Tuzla: { lat: 44.5384, lng: 18.6671 },
  Berlin: { lat: 52.52, lng: 13.405 },
  Hamburg: { lat: 53.5511, lng: 9.9937 },
  Malmo: { lat: 55.6049, lng: 13.0038 },
  Gothenburg: { lat: 57.7089, lng: 11.9746 },
  Paris: { lat: 48.8566, lng: 2.3522 },
  Larnaca: { lat: 34.9168, lng: 33.629 },
  Istanbul: { lat: 41.0082, lng: 28.9784 },
  Bratislava: { lat: 48.1486, lng: 17.1077 },
  Memmingen: { lat: 47.9838, lng: 10.1802 },
  Frankfurt: { lat: 50.1109, lng: 8.6821 },
  Dortmund: { lat: 51.5136, lng: 7.4653 },
  Basel: { lat: 47.5596, lng: 7.5886 },
  Zurich: { lat: 47.3769, lng: 8.5417 },
  // Novi gradovi:
  Maastricht: { lat: 50.8514, lng: 5.6910 },
  Cologne: { lat: 50.9375, lng: 6.9603 },
  Antalya: { lat: 36.8969, lng: 30.7133 },
};

const tuzlaRoutes = [
  CITIES.Berlin,
  CITIES.Hamburg,
  CITIES.Malmo,
  CITIES.Gothenburg,
  CITIES.Paris,
  CITIES.Larnaca,
  CITIES.Istanbul,
  CITIES.Bratislava,
  CITIES.Memmingen,
  CITIES.Frankfurt,
  CITIES.Dortmund,
  CITIES.Basel,
  CITIES.Zurich,
  // Dodani u rute:
  CITIES.Maastricht,
  CITIES.Cologne,
  CITIES.Antalya,
].map((city) => ({
  start: CITIES.Tuzla,
  end: city,
}));

export function WorldMap({
  dots = tuzlaRoutes,
  lineColor = "#0ea5e9",
}: MapProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const { theme } = useTheme();

  // --- ANIMACIJA - OPTIMIZOVANO ---
  // Smanjena brzina animacije za bolju performansu
  const ONE_LINE_DURATION = 1.5;
  const TOTAL_LINES = dots.length;
  const TOTAL_CYCLE_TIME = TOTAL_LINES * ONE_LINE_DURATION;

  // Memoizacija mape za bolju performansu
  const map = useMemo(() => new DottedMap({
    height: 100,
    grid: "diagonal",
    region: {
      lat: { min: MAP_CONFIG.lat.min, max: MAP_CONFIG.lat.max },
      lng: { min: MAP_CONFIG.lng.min, max: MAP_CONFIG.lng.max },
    },
  }), []);

  const mapWidth = (map as any).image.width;
  const mapHeight = (map as any).image.height;

  // Memoizacija SVG mape
  const svgMap = useMemo(() => map.getSVG({
    radius: 0.22,
    color: theme === "dark" ? "#FFFFFF40" : "#00000040",
    shape: "circle",
    backgroundColor: theme === "dark" ? "black" : "white",
  }), [map, theme]);

  const projectPoint = (lat: number, lng: number) => {
    return map.getPin({ lat, lng });
  };

  const createCurvedPath = (
    start: { x: number; y: number },
    end: { x: number; y: number }
  ) => {
    const midX = (start.x + end.x) / 2;
    const midY = Math.min(start.y, end.y) - 10;
    return `M ${start.x} ${start.y} Q ${midX} ${midY} ${end.x} ${end.y}`;
  };

  const tuzlaPoint = projectPoint(CITIES.Tuzla.lat, CITIES.Tuzla.lng);

  return (
    <div className="w-full h-full dark:bg-black bg-white rounded-lg relative font-sans overflow-hidden flex items-center justify-center" style={{ willChange: 'transform', transform: 'translateZ(0)' }}>
      <Image
        src={`data:image/svg+xml;utf8,${encodeURIComponent(svgMap)}`}
        className="w-full h-full object-contain [mask-image:linear-gradient(to_bottom,transparent,white_10%,white_90%,transparent)] pointer-events-none select-none"
        alt="europe map"
        height={mapHeight}
        width={mapWidth}
        draggable={false}
        style={{ transform: 'translateZ(0)' }}
      />

      <svg
        ref={svgRef}
        viewBox={`0 0 ${mapWidth} ${mapHeight}`}
        className="w-full h-full absolute inset-0 pointer-events-none select-none"
        preserveAspectRatio="xMidYMid meet"
        style={{ willChange: 'transform', transform: 'translateZ(0)' }}
      >
        <defs>
          <linearGradient id="path-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="white" stopOpacity="0" />
            <stop offset="5%" stopColor={lineColor} stopOpacity="1" />
            <stop offset="95%" stopColor={lineColor} stopOpacity="1" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </linearGradient>
        </defs>

        {dots.map((dot, i) => {
          const startPoint = projectPoint(dot.start.lat, dot.start.lng);
          const endPoint = projectPoint(dot.end.lat, dot.end.lng);
          
          const repeatDelay = TOTAL_CYCLE_TIME - ONE_LINE_DURATION;

          return (
            <g key={`path-group-${i}`}>
              <motion.path
                d={createCurvedPath(startPoint, endPoint)}
                fill="none"
                stroke="url(#path-gradient)"
                strokeWidth="0.2"
                initial={{
                  pathLength: 0,
                }}
                animate={{
                  pathLength: 1,
                }}
                transition={{
                  duration: ONE_LINE_DURATION,
                  delay: i * ONE_LINE_DURATION,
                  repeat: Infinity,
                  repeatDelay: repeatDelay,
                  ease: "linear",
                }}
                key={`path-${i}`}
              ></motion.path>
            </g>
          );
        })}

        {dots.map((dot, i) => {
          const startPoint = projectPoint(dot.start.lat, dot.start.lng);
          const endPoint = projectPoint(dot.end.lat, dot.end.lng);
          return (
            <g key={`points-group-${i}`}>
              <g key={`start-${i}`}>
                <circle cx={startPoint.x} cy={startPoint.y} r="0.5" fill={lineColor} />
              </g>

              <g key={`end-${i}`}>
                <circle cx={endPoint.x} cy={endPoint.y} r="0.3" fill={lineColor} />
                {/* Optimizovana animacija - sporija i jednostavnija */}
                <circle
                  cx={endPoint.x}
                  cy={endPoint.y}
                  r="0.3"
                  fill={lineColor}
                  opacity="0.5"
                >
                  <animate
                    attributeName="r"
                    from="0.3"
                    to="1.0"
                    dur="3s"
                    begin={`${i * 0.3}s`}
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="opacity"
                    from="0.5"
                    to="0"
                    dur="3s"
                    begin={`${i * 0.3}s`}
                    repeatCount="indefinite"
                  />
                </circle>
              </g>
            </g>
          );
        })}

        {/* COMPACT BADGE - TUZLA */}
        <g className="pointer-events-none">
            {/* Pravougaonik (Dugme) */}
            <rect
                x={tuzlaPoint.x - 4.5} 
                y={tuzlaPoint.y + 1.3} 
                width="9"            
                height="3.3"         
                rx="1"
                fill="#0f172a"
                opacity="0.9"
            />
            
            {/* Tekst */}
            <text
                x={tuzlaPoint.x}
                y={tuzlaPoint.y + 3.7} 
                fill="white"
                fontSize="2"         
                fontWeight="bold"      
                textAnchor="middle"    
            >
                TUZLA
            </text>
        </g>
      </svg>
    </div>
  );
}