// frontend/src/components/circuit/parts/RegisterBox.tsx
interface Props {
  x: number; y: number; width: number; height: number;
  label: string;
  value?: string;
  active?: boolean;
}

export default function RegisterBox(props: Props) {
  return (
    <g>
      <rect
        x={props.x} y={props.y}
        width={props.width} height={props.height}
        rx="4"
        fill={props.active ? "#1e40af22" : "none"}
        stroke={props.active ? "#3b82f6" : "#334155"}
        stroke-width={props.active ? "2" : "1.5"}
        class="transition-all duration-200"
      />
      <text
        x={props.x + props.width / 2}
        y={props.y + 16}
        text-anchor="middle"
        fill={props.active ? "#60a5fa" : "#64748b"}
        font-size="11"
        font-weight="600"
        class="transition-colors duration-200"
      >
        {props.label}
      </text>
      {props.value && (
        <text
          x={props.x + props.width / 2}
          y={props.y + props.height - 10}
          text-anchor="middle"
          fill="#e2e8f0"
          font-size="12"
          font-family="monospace"
        >
          {props.value}
        </text>
      )}
    </g>
  );
}
