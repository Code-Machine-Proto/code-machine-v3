import { For, type JSX } from "solid-js";

interface Props {
  children?: JSX.Element;
  /** A single-line title, or multiple lines (rendered stacked, right-aligned) for longer titles that would otherwise overflow the box. */
  name: string | string[];
  controlName?: string;
  class: string;
  x: number;
  y: number;
  isWritable?: boolean;
  hasControlSignal?: boolean;
}

const TITLE_RIGHT_X = 155;
const TITLE_BASELINE_Y = 42;
const TITLE_LINE_HEIGHT = 16;

export default function ObscureMemory(props: Props) {
  const borderColor = () => props.isWritable ? "#f59e0b" : "var(--color-main-700)";
  const arrowClass = () => props.isWritable ? "fill-amber-400" : "fill-main-600";
  const titleLines = () => Array.isArray(props.name) ? props.name : [props.name];

  return (
    <svg x={props.x} y={props.y} width="95" height="250" viewBox="0 0 170 455" fill="none">
      <rect
        width="170"
        height="380"
        rx="4"
        class={props.class}
        stroke={borderColor()}
        stroke-width="2"
        opacity="0.85"
      />
      <text x={TITLE_RIGHT_X} text-anchor="end" class="font-bold" fill="var(--color-main-300)" font-size="14">
        <For each={titleLines()}>
          {(line, i) => (
            <tspan x={TITLE_RIGHT_X} y={TITLE_BASELINE_Y - (titleLines().length - 1 - i()) * TITLE_LINE_HEIGHT}>
              {line}
            </tspan>
          )}
        </For>
      </text>
      {props.children}
      {/* Read arrow indicator */}
      <path
        d="M0.134717 333.885C0.410914 333.407 1.0227 333.244 1.50093 333.52L31.5048 350.842L31.5908 350.897C31.7285 350.996 31.8329 351.127 31.9033 351.272C31.9044 351.274 31.9061 351.276 31.9072 351.278C32.1658 351.726 32.0381 352.292 31.6269 352.588L31.541 352.643L1.53706 369.966C1.0588 370.242 0.446956 370.078 0.170849 369.6C-0.105147 369.122 0.0588455 368.51 0.53706 368.234L29.082 351.753L0.500928 335.251C0.0227847 334.975 -0.141388 334.363 0.134717 333.885Z"
        class="circuit-label"
      />
      {props.hasControlSignal && <>
        <path d="M85 380L70.5662 405H99.4338L85 380ZM85 455H87.5V402.5H85H82.5V455H85Z" class={arrowClass()} />
        <text x={90} y={450} class="text-base circuit-label">{props.controlName}</text>
      </>}
    </svg>
  );
}
