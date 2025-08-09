export const associateParentsChildren = (achievements) => {
  if (!achievements) return [];
  const lookup = new Map();
  const roots = [];

  for (const temp of achievements) {
    const achievement = { ...temp, children: [] };
    lookup.set(achievement.id, achievement);
  }

  for (const temp of achievements) {
    const achievement = lookup.get(temp.id);
    if (temp.parent_id) {
      const parent = lookup.get(temp.parent_id);
      if (parent) {
        parent.children.push(achievement);
      }
    } else {
      roots.push(achievement);
    }
  }

  return roots;
};
