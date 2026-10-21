class WaterlooWorksSession
  FILE = Rails.root.join("tmp/waterloo_works_session.json")
  HOST = "waterlooworks.uwaterloo.ca".freeze

  def self.credentials
    stored = File.exist?(FILE) ? JSON.parse(File.read(FILE)) : {}
    {
      cookie: stored["cookie"].presence || ENV["WW_COOKIE"],
      url: stored["url"].presence || ENV["WW_APPLICATIONS_URL"],
      updated_at: stored["updated_at"]
    }
  rescue JSON::ParserError
    { cookie: ENV["WW_COOKIE"], url: ENV["WW_APPLICATIONS_URL"], updated_at: nil }
  end

  def self.valid?(cookie, url)
    uri = URI(url.to_s)
    cookie.to_s.include?("JSESSIONID=") && uri.scheme == "https" && uri.host == HOST
  rescue URI::InvalidURIError
    false
  end

  def self.save(cookie:, url:)
    File.write(FILE, JSON.generate("cookie" => cookie, "url" => url, "updated_at" => Time.current.iso8601))
  end
end
