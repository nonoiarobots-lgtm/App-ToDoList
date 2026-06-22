// Icône Material Symbols Outlined. <Icon name="light_mode" /> rend le ligature.
export function Icon({
  name,
  size,
  className = '',
  style,
}: {
  name: string;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <span className={`msym ${className}`} style={size ? { fontSize: size, ...style } : style} aria-hidden>
      {name}
    </span>
  );
}
