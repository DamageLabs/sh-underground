function MarkerColorDot({ color = 'red', size = 20, alt }) {
  return (
    <img
      src={`https://maps.google.com/mapfiles/ms/icons/${color}-dot.png`}
      alt={alt || `${color} marker`}
      style={{ width: size, height: size, flexShrink: 0 }}
    />
  );
}

export default MarkerColorDot;
