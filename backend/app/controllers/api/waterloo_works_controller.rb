module Api
  class WaterlooWorksController < ApplicationController
    def status
      render json: WaterlooWorksSync.status.merge("browser" => WaterlooWorksBrowserSync.state)
    end

    def browser_sync
      WaterlooWorksBrowserSync.start
      status
    end

    def cancel_sync
      WaterlooWorksBrowserSync.cancel
      status
    end

    def import_items
      items = JSON.parse(request.raw_post).fetch("items")
      return head :unprocessable_content unless items.is_a?(Array)

      render json: WaterlooWorksSync.import_items(items).merge("browser" => WaterlooWorksBrowserSync.state)
    rescue JSON::ParserError, KeyError
      head :bad_request
    end
  end
end
