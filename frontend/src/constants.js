export const STATUSES = [
  { key: 'wishlist', label: 'Wishlist' },
  { key: 'applied', label: 'Applied' },
  { key: 'interviewing', label: 'Interviewing' },
  { key: 'offer', label: 'Offer' },
  { key: 'rejected', label: 'Rejected' },
]

export const EMPTY_APPLICATION = {
  company: '',
  role: '',
  status: 'wishlist',
  location: '',
  job_url: '',
  applied_on: '',
  deadline_on: '',
  next_step_on: '',
  notes: '',
}
