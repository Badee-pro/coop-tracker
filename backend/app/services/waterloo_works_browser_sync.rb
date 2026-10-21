require "ferrum"

class WaterlooWorksBrowserSync
  APPLICATIONS_URL = "https://waterlooworks.uwaterloo.ca/myAccount/co-op/full/applications.htm".freeze
  WW_HOST = "waterlooworks.uwaterloo.ca".freeze
  PROFILE_DIR = Rails.root.join("tmp/waterloo_works_browser").to_s
  STATE_FILE = Rails.root.join("tmp/waterloo_works_browser_sync.json")
  SIGN_IN_TIMEOUT = 5.minutes
  QUICK_CHECK_TIMEOUT = 15.seconds
  ACTIVE_STATES = %w[starting waiting_for_sign_in reading].freeze
  LOCK = Mutex.new

  EDGE_PATHS = [
    "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
    "C:/Program Files/Microsoft/Edge/Application/msedge.exe"
  ].freeze

  READ_APPLICATIONS_JS = <<~JS.freeze
    const done = arguments[0];
    (async () => {
      const findListUrl = () => performance.getEntriesByType('resource').map((e) => e.name).reverse()
        .find((u) => u.includes('/applications.htm') && u.includes('action=') && u.includes('columns='));
      let listUrl = findListUrl();
      if (!listUrl) {
        const view = [...document.querySelectorAll('a,button')].find((el) => el.textContent.trim() === 'View');
        if (view) view.click();
        for (let i = 0; i < 30 && !listUrl; i++) {
          await new Promise((r) => setTimeout(r, 300));
          listUrl = findListUrl();
        }
      }
      if (!listUrl) return done({ error: 'list-not-found' });
      const items = [];
      for (let page = 1; page <= 50; page++) {
        const url = new URL(listUrl, location.origin);
        url.searchParams.set('page', page);
        const res = await fetch(url, { credentials: 'include', headers: { Accept: 'application/json' } });
        const body = await res.json();
        const data = body.data || [];
        items.push(...data);
        if (!data.length || items.length >= (body.totalResults || 0)) break;
      }
      done({ items });
    })().catch((error) => done({ error: String(error) }));
  JS

  class SignInNeeded < StandardError; end
  class Cancelled < StandardError; end

  def self.state
    current = File.exist?(STATE_FILE) ? JSON.parse(File.read(STATE_FILE)) : { "state" => "idle" }
    stale = ACTIVE_STATES.include?(current["state"]) && !busy? && Time.parse(current["at"].to_s) < 5.seconds.ago
    stale ? { "state" => "idle" } : current
  rescue JSON::ParserError, ArgumentError
    { "state" => "idle" }
  end

  def self.write_state(state, extra = {})
    File.write(STATE_FILE, JSON.generate({ "state" => state, "at" => Time.current.iso8601 }.merge(extra)))
  end

  def self.busy?
    LOCK.locked?
  end

  def self.cancel
    @cancelled = true
  end

  def self.cancelled?
    @cancelled == true
  end

  def self.start
    return state if busy?

    @cancelled = false
    write_state("starting")
    Thread.new { Rails.application.executor.wrap { new.run } }
    state
  end

  def run
    LOCK.synchronize do
      items = begin
        read_applications(headless: true, login_timeout: QUICK_CHECK_TIMEOUT)
      rescue SignInNeeded
        raise Cancelled if self.class.cancelled?

        self.class.write_state("waiting_for_sign_in")
        read_applications(headless: false, login_timeout: SIGN_IN_TIMEOUT)
      end

      status = WaterlooWorksSync.import_items(items)
      self.class.write_state("done", "fetched" => status["fetched"], "result" => status["result"])
    end
  rescue Cancelled
    self.class.write_state("idle")
  rescue SignInNeeded
    self.class.write_state("failed", "error" => "The sign-in window was closed before you signed in. Click Sync from WaterlooWorks to open it again.")
  rescue StandardError => e
    Rails.logger.error("[WaterlooWorksBrowserSync] #{e.class}: #{e.message}")
    self.class.write_state("failed", "error" => "Sync didn't finish (#{e.class.name.demodulize}). Click Sync from WaterlooWorks to try again.")
  end

  private

  def read_applications(headless:, login_timeout:)
    with_browser(headless: headless) do |browser|
      browser.go_to(APPLICATIONS_URL)
      deadline = login_timeout.from_now
      on_sign_in_since = nil
      loop do
        break if signed_in?(browser)
        raise Cancelled if self.class.cancelled?
        raise SignInNeeded if Time.current > deadline || closed?(browser)

        if headless
          on_sign_in_since = sign_in_page?(browser) ? (on_sign_in_since || Time.current) : nil
          raise SignInNeeded if on_sign_in_since && on_sign_in_since < 3.seconds.ago
        end
        sleep 0.5
      end

      self.class.write_state("reading")
      browser.go_to(APPLICATIONS_URL) unless URI(browser.current_url).path.end_with?("/applications.htm")
      fetch_items(browser)
    end
  end

  def fetch_items(browser)
    3.times do
      result = begin
        browser.evaluate_async(READ_APPLICATIONS_JS, 60)
      rescue Ferrum::JavaScriptError, Ferrum::NodeNotFoundError, Ferrum::TimeoutError
        nil
      end
      return result["items"] if result.is_a?(Hash) && result["items"]

      sleep 2
    end
    raise "Could not read the applications list from WaterlooWorks"
  end

  def with_browser(headless:)
    flags = {
      "no-first-run" => nil,
      "no-default-browser-check" => nil,
      "user-data-dir" => PROFILE_DIR
    }
    flags["headless"] = "new" if headless

    browser = Ferrum::Browser.new(
      browser_path: EDGE_PATHS.find { |p| File.exist?(p) },
      ignore_default_browser_options: true,
      browser_options: flags,
      headless: headless,
      window_size: [1000, 800],
      timeout: 30,
      process_timeout: 30
    )
    yield browser
  ensure
    browser&.quit
  end

  def current_uri(browser)
    URI(browser.current_url.to_s)
  rescue StandardError
    nil
  end

  def signed_in?(browser)
    uri = current_uri(browser)
    uri&.host == WW_HOST && uri.path.start_with?("/myAccount")
  end

  def sign_in_page?(browser)
    uri = current_uri(browser)
    return false unless uri&.host

    uri.host != WW_HOST || uri.path.include?("notLoggedIn")
  end

  def closed?(browser)
    targets = browser.command("Target.getTargets").fetch("targetInfos", [])
    targets.none? { |t| t["type"] == "page" }
  rescue Ferrum::DeadBrowserError, Ferrum::NoSuchTargetError, Ferrum::ProcessTimeoutError,
         Ferrum::TimeoutError, Errno::ECONNREFUSED, Errno::ECONNRESET, Errno::EPIPE, IOError
    true
  rescue StandardError
    false
  end
end
