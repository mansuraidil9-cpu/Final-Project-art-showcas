export const roleLabels = {
  member: 'Member',
  curator: 'Curator',
  admin: 'Admin',
}

export function hasCuratorAccess(user) {
  return user?.role === 'curator' && user.curator_status === 'approved'
}
