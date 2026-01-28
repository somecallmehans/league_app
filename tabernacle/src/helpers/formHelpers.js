const normalizeSymbols = (sym1, sym2) =>
  [...new Set((sym1 + sym2).split(""))].sort().join("");

export const getCommanderColorId = (colorsObj, c1, c2) => {
  // if we don't have a second commander, we can just return the given commanders color id
  if (!c2) {
    return colorsObj.idObj[c1]?.id;
  }
  // if we do have a second commander but it has the same color as our primary, just return
  // the primary's color
  const sym1 = colorsObj.idObj[c1].symbol;
  const sym2 = colorsObj.idObj[c2].symbol;
  if (sym1.includes(sym2)) {
    return colorsObj.symbolObj[sym1];
  }

  const normalizedKey = normalizeSymbols(sym1, sym2);
  const key = Object.keys(colorsObj.symbolObj).find(
    (sym) => normalizedKey === sym.split("").sort().join("")
  );

  return colorsObj.symbolObj[key];
};

export const getLobbyKey = (roundId) => `roundLobby_participants_${roundId}`;
