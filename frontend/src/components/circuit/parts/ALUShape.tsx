// frontend/src/components/circuit/parts/ALUShape.tsx
interface Props {
  x: number; y: number; width: number; height: number;
  label: string;
  active?: boolean;
}

export default function ALUShape(props: Props) {
  const cx = props.x + props.width / 2;
  const w = props.width / 2;
  const h = props.height;
  // Trapezoid shape
  const d = `M${cx - w} ${props.y} L${cx + w} ${props.y} L${cx + w * 0.6} ${props.y + h} L${cx - w * 0.6} ${props.y + h} Z`;
  return (
    <g>
      <path
        d={d}
        fill={props.active ? "#22c55e11" : "none"}
        stroke={props.active ? "#22c55e" : "#334155"}
        stroke-width={props.active ? "2" : "1.5"}
        class="transition-all duration-200"
      />
      <text
        x={cx} y={props.y + h / 2 + 4}
        text-anchor="middle"
        fill={props.active ? "#4ade80" : "#64748b"}
        font-size="11" font-weight="600"
      >
        {props.label}
      </text>
    </g>
  );
}
