require "net/http"
require "json"

class WaterlooWorksClient
  class Error < StandardError; end
  class NotLoggedIn < Error; end

  DEFAULT_URL = "https://waterlooworks.uwaterloo.ca/myAccount/co-op/full/applications.htm?page=1".freeze
  MAX_PAGES = 50

  KEY_MAP = {
    "jobid" => :external_id,
    "postingid" => :external_id,
    "jobtitle" => :role,
    "title" => :role,
    "postingtitle" => :role,
    "term" => :term,
    "organization" => :company,
    "organisation" => :company,
    "orgname" => :company,
    "company" => :company,
    "appstatus" => :source_status,
    "applicationstatus" => :source_status,
    "status" => :source_status,
    "jobstatus" => :job_status,
    "postingstatus" => :job_status,
    "division" => :division,
    "divisionname" => :division,
    "location" => :location,
    "loc" => :location,
    "region" => :location,
    "city" => :city,
    "openings" => :openings,
    "numpos" => :openings,
    "numberofopenings" => :openings,
    "appdeadline" => :deadline_on,
    "applicationdeadline" => :deadline_on,
    "deadline" => :deadline_on,
    "appsubmittedon" => :applied_on,
    "applicationsubmittedon" => :applied_on,
    "submittedon" => :applied_on,
    "datesubmitted" => :applied_on,
    "applieddate" => :applied_on
  }.freeze

  DATE_FIELDS = %i[deadline_on applied_on].freeze

  attr_reader :seen_keys

  def initialize(cookie:, url: nil)
    raise Error, "WW_COOKIE is not set in backend/.env" if cookie.blank?

    @cookie = cookie.strip
    @url = url.presence || DEFAULT_URL
    @seen_keys = Set.new
  end

  def fetch_applications
    rows = []
    total = nil

    (1..MAX_PAGES).each do |page|
      body = get_json(page_url(page))
      items = Array(body["data"])
      total ||= body["totalResults"].to_i
      items.each { |item| @seen_keys.merge(Array(item["data"]).map { |cell| cell["key"].to_s }) }
      rows.concat(items.map { |item| self.class.map_item(item) })
      break if items.empty? || (total.positive? && rows.size >= total)
    end

    rows.select { |r| r[:external_id].present? }
  end

  private

  def page_url(page)
    uri = URI(@url)
    params = URI.decode_www_form(uri.query.to_s).to_h
    params["page"] = page.to_s
    uri.query = URI.encode_www_form(params)
    uri
  end

  def get_json(uri)
    parse(perform(Net::HTTP::Get.new(uri), uri))
  rescue JSON::ParserError, Error => e
    raise if e.is_a?(NotLoggedIn)

    post = Net::HTTP::Post.new(URI("#{uri.scheme}://#{uri.host}#{uri.path}"))
    post.set_form_data(URI.decode_www_form(uri.query.to_s))
    parse(perform(post, uri))
  end

  def perform(request, uri)
    request["Cookie"] = @cookie
    request["Accept"] = "application/json, text/plain, */*"
    request["X-Requested-With"] = "XMLHttpRequest"
    request["User-Agent"] = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) CoopTracker"

    response = Net::HTTP.start(uri.host, uri.port, use_ssl: true, open_timeout: 10, read_timeout: 30) do |http|
      http.request(request)
    end
    save_debug("#{request.method} HTTP #{response.code}\n#{response.body}")

    if response.is_a?(Net::HTTPRedirection) || response["location"].to_s.include?("notLoggedIn") ||
       response.body.to_s.include?("notLoggedIn")
      raise NotLoggedIn, "WaterlooWorks session expired. Copy a fresh cookie into backend/.env."
    end
    raise Error, "WaterlooWorks returned HTTP #{response.code}" unless response.is_a?(Net::HTTPSuccess)

    response
  end

  def parse(response)
    JSON.parse(response.body)
  rescue JSON::ParserError
    raise Error, "WaterlooWorks did not return JSON (saved to tmp/waterloo_works_last_response.txt)."
  end

  def self.map_item(item)
    pairs = Array(item["data"]).each_with_object({}) { |cell, h| h[cell["key"].to_s] = cell["value"] }

    pairs.each_with_object({}) do |(key, value), row|
      field = KEY_MAP[key.downcase.gsub(/[^a-z]/, "")]
      next unless field && row[field].blank?

      row[field] = normalize(field, value)
    end
  end

  def self.normalize(field, value)
    return nil if value.nil?
    return parse_date(value) if DATE_FIELDS.include?(field)
    return value.to_i if field == :openings

    value.is_a?(Hash) ? (value["label"] || value["value"] || value.values.first).to_s.strip : value.to_s.strip
  end

  def self.parse_date(value)
    return Time.at(value / 1000).to_date.iso8601 if value.is_a?(Numeric)

    Date.parse(value.to_s).iso8601
  rescue ArgumentError
    nil
  end

  def save_debug(body)
    File.write(Rails.root.join("tmp/waterloo_works_last_response.txt"), body.to_s)
  rescue StandardError
    nil
  end
end
