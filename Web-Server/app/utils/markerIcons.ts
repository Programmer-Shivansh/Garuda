export const getPinColor = (priority: string): string => {
  switch (priority.toLowerCase()) {
    case 'severe':
      return '#ff0000';  // Red
    case 'intermediate':
      return '#ffa500';  // Orange
    case 'normal':
      return '#00ff00';  // Green
    default:
      return '#808080';  // Gray
  }
};

export const getCurrentLocationColor = (): string => {
  return '#2563eb';  // Blue
};
