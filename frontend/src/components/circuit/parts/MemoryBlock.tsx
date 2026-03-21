// frontend/src/components/circuit/parts/MemoryBlock.tsx
interface Props {
  x: number; y: number; width: number; height: number;
  label: string;
  active?: boolean;
}

export default function MemoryBlock(props: Props) {
  return (
    <g>
      <rect
        x={props.x} y={props.y}
        width={props.width} height={props.height}
        rx="4"
        fill={props.active ? "#8b5cf611" : "none"}
        stroke={props.active ? "#8b5cf6" : "#334155"}
        stroke-width={props.active ? "2" : "1.5"}
        class="transition-all duration-200"
      />
      <text
        x={props.x + props.width / 2}
        y={props.y + props.height / 2 + 4}
        text-anchor="middle"
        fill={props.active ? "#a78bfa" : "#64748b"}
        font-size="10" font-weight="600"
      >
        {props.label}
      </text>
    </g>
  );
}
