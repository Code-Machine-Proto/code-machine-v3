export default function Multiplexer(props: { x: number; y: number; isActivated?: boolean; name: string }) {
  return (
    <svg x={props.x} y={props.y} width="40" height="100" viewBox="0 0 120 360" fill="none">
      <path d="M0 0L120 69.2812V220.718L0 290V0Z" fill="#D9D9D9"/>
      <path d="M60 253L45.5662 278H74.4338L60 253ZM60 328H62.5V275.5H60H57.5V328H60Z" class={props.isActivated ? "fill-main-500" : "fill-white"} />
      <text text-anchor="middle" x={60} y={345} class="fill-white text-xl">{props.name}</text>
    </svg>
  );
}
