// frontend/src/components/circuit/parts/Connection.tsx
interface Props {
  points: { x: number; y: number }[];
  active?: boolean;
  label?: string;
}

export default function Connection(props: Props) {
  const pathD = () => {
    if (props.points.length < 2) return "";
    const [first, ...rest] = props.points;
    return `M${first.x} ${first.y} ${rest.map((p) => `L${p.x} ${p.y}`).join(" ")}`;
  };

  const midpoint = () => {
    const pts = props.points;
    if (pts.length < 2) return { x: 0, y: 0 };
    const mid = Math.floor(pts.length / 2);
    return pts[mid];
  };

  return (
    <g>
      <path
        d={pathD()}
        fill="none"
        stroke={props.active ? "#3b82f6" : "#1e293b"}
        stroke-width={props.active ? "2.5" : "1.5"}
        class="transition-all duration-200"
      />
      {props.active && (
        <path
          d={pathD()}
          fill="none"
          stroke="#3b82f6"
          stroke-width="4"
          opacity="0.2"
          filter="blur(3px)"
        />
      )}
      {props.label && (
        <text
          x={midpoint().x}
          y={midpoint().y - 6}
          text-anchor="middle"
          fill="#475569"
          font-size="8"
        >
          {props.label}
        </text>
      )}
    </g>
  );
}
