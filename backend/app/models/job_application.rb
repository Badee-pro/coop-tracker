class JobApplication < ApplicationRecord
  STATUSES = %w[wishlist applied interviewing offer rejected].freeze

  validates :company, :role, presence: true
  validates :status, inclusion: { in: STATUSES }

  scope :ordered, -> { order(Arel.sql("COALESCE(next_step_on, deadline_on, applied_on) IS NULL"), :next_step_on, updated_at: :desc) }
end
