class WaterlooWorksSync
  STATUS_FILE = Rails.root.join("tmp/waterloo_works_sync.json")
  LOCK = Mutex.new
  SIGNED_OUT_MESSAGE = "You're not signed in to WaterlooWorks.".freeze

  def self.configured?
    WaterlooWorksSession.credentials[:cookie].present?
  end

  def self.interval_minutes
    ENV.fetch("WW_SYNC_MINUTES", "0").to_i
  end

  def self.run
    return status.merge("running" => true) unless LOCK.try_lock

    begin
      return fail_signed_out(nil) unless configured?

      credentials = WaterlooWorksSession.credentials
      client = WaterlooWorksClient.new(cookie: credentials[:cookie], url: credentials[:url])
      rows = client.fetch_applications
      result = JobApplication.import_rows(rows)
      write_status("ok" => true, "fetched" => rows.size, "result" => result, "keys" => client.seen_keys.to_a,
                   "last_success_at" => Time.current.iso8601)
    rescue WaterlooWorksClient::NotLoggedIn => e
      fail_signed_out(e)
    rescue SocketError, Socket::ResolutionError, Errno::ECONNREFUSED, Errno::ENETUNREACH, Net::OpenTimeout, Net::ReadTimeout => e
      fail_with("offline", "Couldn't reach WaterlooWorks. Check your internet connection, then click Sync now.", e)
    rescue StandardError => e
      fail_with("failed", "Sync didn't work. Click Sign in to WaterlooWorks, then try again.", e)
    ensure
      LOCK.unlock
    end
  end

  def self.import_items(items)
    rows = Array(items).map { |item| WaterlooWorksClient.map_item(item) }.select { |r| r[:external_id].present? }
    result = JobApplication.import_rows(rows)
    write_status("ok" => true, "source" => "bookmark", "fetched" => rows.size, "result" => result,
                 "last_success_at" => Time.current.iso8601)
  end

  def self.status
    base = {
      "configured" => configured?,
      "interval_minutes" => interval_minutes,
      "session_received_at" => WaterlooWorksSession.credentials[:updated_at]
    }
    sync = File.exist?(STATUS_FILE) ? JSON.parse(File.read(STATUS_FILE)) : {}
    base.merge(sync).merge("signed_in" => configured? && sync["ok"] == true)
  rescue JSON::ParserError
    base
  end

  def self.fail_signed_out(error)
    fail_with("signed_out", SIGNED_OUT_MESSAGE, error)
  end

  def self.fail_with(reason, message, error)
    Rails.logger.warn("[WaterlooWorksSync] #{reason}: #{error&.class}: #{error&.message}") if error
    write_status("ok" => false, "reason" => reason, "error" => message,
                 "last_success_at" => status["last_success_at"])
  end

  def self.write_status(data)
    payload = data.merge("synced_at" => Time.current.iso8601)
    File.write(STATUS_FILE, JSON.generate(payload))
    status
  end

  def self.start_scheduler
    return unless interval_minutes.positive?

    Thread.new do
      loop do
        Rails.application.executor.wrap { run } if configured?
        sleep interval_minutes * 60
      end
    end
  end
end
