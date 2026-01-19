export const PLACEHOLDER_GRADIENTS = [
  ['#FF6B6B', '#FFD93D'],
  ['#6BCB77', '#4D96FF'],
  ['#9D50BB', '#6E48AA'],
  ['#F2994A', '#F2C94C'],
  ['#2193b0', '#6dd5ed'],
  ['#EE0979', '#FF6A00'],
  ['#00B4DB', '#0083B0'],
  ['#7028E4', '#E5E0FF'],
];

export const getPlaceholderGradient = (id: number) => {
  const index = Math.abs(id) % PLACEHOLDER_GRADIENTS.length;
  return PLACEHOLDER_GRADIENTS[index] || PLACEHOLDER_GRADIENTS[0];
};
