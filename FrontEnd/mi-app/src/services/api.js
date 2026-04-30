export const getSaludo = async () => {
  const res = await fetch('/api/saludo');
  return res.json();
};