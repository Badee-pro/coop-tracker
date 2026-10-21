class JobApplication < ApplicationRecord
  STATUSES = %w[wishlist applied interviewing offer rejected].freeze

  SOURCE_STATUS_MAP = [
    [/not selected|not ranked|cancel|unsuccessful|declined|withdrawn/i, "rejected"],
    [/offer|employed|matched|ranked/i, "offer"],
    [/interview|selected/i, "interviewing"],
    [/applied|submitted/i, "applied"]
  ].freeze

  IMPORT_FIELDS = %i[external_id role company term location city division openings job_status source_status applied_on deadline_on].freeze

  validates :company, :role, presence: true
  validates :status, inclusion: { in: STATUSES }
  validates :external_id, uniqueness: true, allow_nil: true

  scope :ordered, -> { order(Arel.sql("COALESCE(next_step_on, deadline_on, applied_on) IS NULL"), :next_step_on, updated_at: :desc) }

  def self.status_for(source_status)
    SOURCE_STATUS_MAP.find { |pattern, _| source_status.to_s.match?(pattern) }&.last || "applied"
  end

  def self.import_rows(rows)
    result = { created: 0, updated: 0, unchanged: 0, errors: [] }

    transaction do
      rows.each do |row|
        attrs = row.to_h.symbolize_keys.slice(*IMPORT_FIELDS).transform_values { |v| v.is_a?(String) ? v.strip.presence : v }
        next result[:errors] << "Missing job ID: #{row.inspect}" if attrs[:external_id].blank?

        record = find_or_initialize_by(external_id: attrs[:external_id].to_s)
        status_changed = record.new_record? || record.source_status != attrs[:source_status]
        record.assign_attributes(attrs)
        record.status = status_for(attrs[:source_status]) if status_changed

        if record.new_record?
          record.save ? result[:created] += 1 : result[:errors] << "#{attrs[:external_id]}: #{record.errors.full_messages.join(', ')}"
        elsif record.changed?
          record.save ? result[:updated] += 1 : result[:errors] << "#{attrs[:external_id]}: #{record.errors.full_messages.join(', ')}"
        else
          result[:unchanged] += 1
        end
      end
    end

    result
  end
end
