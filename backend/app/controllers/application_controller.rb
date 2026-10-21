class ApplicationController < ActionController::API
  LOOPBACK = %w[127.0.0.1 ::1 ::ffff:127.0.0.1 localhost].freeze

  before_action :read_only_for_other_devices

  private

  def read_only_for_other_devices
    return if request.get? || request.head? || from_this_computer?

    render json: { errors: ["Changes and syncing are only available on the computer running Co-op Tracker."] }, status: :forbidden
  end

  def from_this_computer?
    client = request.headers["X-Forwarded-For"].to_s.split(",").last.to_s.strip
    client.empty? || LOOPBACK.include?(client)
  end
end
