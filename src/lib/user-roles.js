export const roleLabels = {
  member: 'Member',
  curator: 'Curator',
  admin: 'Admin',
}

export function hasCuratorAccess(user) {
  return user?.curator_status === 'approved' && (user.role === 'member' || user.role === 'curator')
}
