export const services = [
  { ids: [8, 1796], name: 'Netflix', key: 'netflix' },
  { ids: [9, 119, 2100], name: 'Prime Video', key: 'primeVideo' },
  { ids: [2336], name: 'JioHotstar', key: 'jioHotstar', region: 'IN' },
  { ids: [337], name: 'Disney+', key: 'disneyPlus' },
  { ids: [350], name: 'Apple TV+', key: 'appleTv' },
]

export function getSubscriptionService(value) {
  return services.find(({ key, name }) =>
    key === value || name === value || (key === 'primeVideo' && value === 'Amazon Prime')
  )
}
