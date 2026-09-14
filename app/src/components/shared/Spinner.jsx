export default function Spinner({ size = 'w-5 h-5', className = '' }) {
  return (
    <span className={`plundrix-spinner text-tungsten ${size} ${className}`} aria-hidden="true">
      <span />
      <span />
      <span />
    </span>
  );
}
