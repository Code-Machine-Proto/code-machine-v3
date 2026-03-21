// frontend/src/components/circuit/parts/MuxShape.tsx
interface Props {
  x: number; y: number; width: number; height: number;
  label: string;
  inputs: number;
  active?: boolean;
}

export default function MuxShape(props: Props) {
  const cx = props.x + props.width / 2;
  const d = `M${props.x} ${props.y} L${props.x + props.width} ${props.y + props.height * 0.15} L${props.x + props.width} ${props.y + props.height * 0.85} L${props.x} ${props.y + props.height} Z`;
  return (
    <g>
      <path
        d={d}
        fill={props.active ? "#f59e0b11" : "none"}
        stroke={props.active ? "#f59e0b" : "#334155"}
        stroke-width={props.active ? "2" : "1.5"}
        class="transition-all duration-200"
      />
      <text
        x={cx} y={props.y + props.height / 2 + 4}
        text-anchor="middle"
        fill={props.active ? "#fbbf24" : "#64748b"}
        font-size="9" font-weight="600"
      >
        {props.label}
      </text>
    </g>
  );
}
