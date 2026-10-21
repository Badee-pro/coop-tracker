class WaterlooWorksSync
  STATUS_FILE = Rails.root.join("tmp/waterloo_works_sync.json")
  LOCK = Mutex.new

  def self.configured?
    ENV["WW_COOKIE"].present?
  end

  def self.interval_minutes
    ENV.fetch("WW_SYNC_MINUTES", "15").to_i
  end

  def self.run
    return status.merge("running" => true) unless LOCK.try_lock

    begin
      client = WaterlooWorksClient.new(cookie: ENV["WW_COOKIE"], url: ENV["WW_APPLICATIONS_URL"])
      rows = client.fetch_applications
      result = JobApplication.import_rows(rows)
      write_status("ok" => true, "fetched" => rows.size, "result" => result, "keys" => client.seen_keys.to_a)
    rescue WaterlooWorksClient::Error => e
      write_status("ok" => false, "error" => e.message)
    rescue StandardError => e
      Rails.logger.error("[WaterlooWorksSync] #{e.class}: #{e.message}")
      write_status("ok" => false, "error" => "#{e.class}: #{e.message}")
    ensure
      LOCK.unlock
    end
  end

  def self.status
    base = { "configured" => configured?, "interval_minutes" => interval_minutes }
    return base unless File.exist?(STATUS_FILE)

    base.merge(JSON.parse(File.read(STATUS_FILE)))
  rescue JSON::ParserError
    base
  end

  def self.write_status(data)
    payload = data.merge("synced_at" => Time.current.iso8601)
    File.write(STATUS_FILE, JSON.generate(payload))
    status
  end

  def self.start_scheduler
    return unless configured? && interval_minutes.positive?

    Thread.new do
      Rails.application.executor.wrap { run }
      loop do
        sleep interval_minutes * 60
        Rails.application.executor.wrap { run }
      end
    end
  end
end
